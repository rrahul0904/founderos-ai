import { createHash } from "node:crypto";
import pg from "pg";
import { chromium } from "playwright";
import { assertPublicRequestUrl, assertVercelPreviewUrl } from "./policy";

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("DATABASE_URL is required for preview verification");
if(process.env.PREVIEW_VERIFY_ENABLED!=="true") throw new Error("PREVIEW_VERIFY_ENABLED=true is required to start the preview worker");
const pool=new pg.Pool({connectionString:databaseUrl,max:3});
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const timeoutMs=Math.max(10000,Math.min(120000,Number(process.env.PREVIEW_BROWSER_TIMEOUT_MS??45000)));

type Job={id:string;project_id:string;organization_id:string;plan_id:string;deployment_id:string;deployment_url:string;expected_commit_sha:string;attempts:number};

async function claim():Promise<Job|null>{
  await pool.query("update preview_verifications set status='failed',last_error='browser verification lease expired too many times',leased_until=null,completed_at=now() where status='running' and leased_until<now() and attempts>=3");
  const client=await pool.connect();
  try{await client.query("begin");const result=await client.query(`select id,project_id,organization_id,plan_id,deployment_id,deployment_url,expected_commit_sha,attempts from preview_verifications where ((status='queued' and available_at<=now()) or (status='running' and leased_until<now())) and attempts<3 order by created_at asc for update skip locked limit 1`);const row=result.rows[0] as Job|undefined;if(!row){await client.query("commit");return null;}await client.query("update preview_verifications set status='running',leased_until=now()+interval '3 minutes',attempts=attempts+1,last_error=null where id=$1",[row.id]);await client.query("commit");return{...row,attempts:Number(row.attempts)+1};}catch(error){await client.query("rollback");throw error;}finally{client.release();}
}

async function verify(job:Job){
  const initial=assertVercelPreviewUrl(job.deployment_url);
  const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
  const consoleErrors:string[]=[];const pageErrors:string[]=[];const hostCache=new Map<string,boolean>();
  try{
    const context=await browser.newContext({ignoreHTTPSErrors:false,javaScriptEnabled:true});
    const page=await context.newPage();
    await page.route("**/*",async(route)=>{try{await assertPublicRequestUrl(route.request().url(),hostCache);await route.continue();}catch{await route.abort("blockedbyclient");}});
    page.on("console",message=>{if(message.type()==="error"&&consoleErrors.length<50)consoleErrors.push(message.text().slice(0,1000));});
    page.on("pageerror",error=>{if(pageErrors.length<20)pageErrors.push(error.message.slice(0,1000));});
    const response=await page.goto(initial.toString(),{waitUntil:"domcontentloaded",timeout:timeoutMs});
    await page.waitForLoadState("networkidle",{timeout:Math.min(10000,timeoutMs)}).catch(()=>undefined);
    const statusCode=response?.status()??0;const finalUrl=page.url();const final=new URL(finalUrl);
    if(final.protocol!=="https:"||!final.hostname.toLowerCase().endsWith(".vercel.app")) throw new Error(`Preview redirected outside vercel.app: ${finalUrl}`);
    const title=(await page.title()).slice(0,500);
    const bodyText=await page.locator("body").innerText({timeout:5000}).catch(()=>"");
    const screenshot=await page.screenshot({fullPage:false,type:"png"});
    const report={statusCode,finalUrl,title,bodyTextLength:bodyText.trim().length,consoleErrors,pageErrors,screenshotSha256:createHash("sha256").update(screenshot).digest("hex"),checkedAt:new Date().toISOString()};
    if(statusCode<200||statusCode>=400) throw new Error(`Preview returned HTTP ${statusCode}`);
    if(report.bodyTextLength<20) throw new Error("Preview rendered insufficient visible content");
    if(pageErrors.length) throw new Error(`Preview raised ${pageErrors.length} uncaught browser error(s): ${pageErrors[0]}`);
    await pool.query("update preview_verifications set status='passed',report=$2,last_error=null,leased_until=null,completed_at=now() where id=$1",[job.id,report]);
    await pool.query("insert into audit_events (organization_id,project_id,event_name,properties) values ($1,$2,'preview.browser_passed',$3)",[job.organization_id,job.project_id,{verification_id:job.id,plan_id:job.plan_id,deployment_id:job.deployment_id,url:job.deployment_url,screenshot_sha256:report.screenshotSha256}]);
    console.log(JSON.stringify({event:"preview_browser_passed",verification_id:job.id,deployment_id:job.deployment_id}));
  }finally{await browser.close();}
}

async function fail(job:Job,error:unknown){const message=error instanceof Error?error.message:String(error);await pool.query("update preview_verifications set status='failed',last_error=$2,leased_until=null,completed_at=now() where id=$1",[job.id,message.slice(0,4000)]);await pool.query("insert into audit_events (organization_id,project_id,event_name,properties) values ($1,$2,'preview.browser_failed',$3)",[job.organization_id,job.project_id,{verification_id:job.id,plan_id:job.plan_id,deployment_id:job.deployment_id,error:message.slice(0,1000)}]).catch(()=>undefined);console.error(JSON.stringify({event:"preview_browser_failed",verification_id:job.id,error:message}));}

console.log(JSON.stringify({event:"preview_worker_started",timeout_ms:timeoutMs}));
while(true){const job=await claim();if(!job){await sleep(1500);continue;}try{await verify(job);}catch(error){await fail(job,error);}}
