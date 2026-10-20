"use client";
import { useState } from "react";
import type { CompanyProfile, FounderIntelligenceState, SignalKind, SpecialistKind } from "@founderos/core";

const kinds:SignalKind[]=["objection","pain","positive"];
const specialties:SpecialistKind[]=["gtm","competitor","financial","research","fundraising","brainstorm"];
const labels:Record<keyof CompanyProfile,string>={buyer:"Economic buyer",endUser:"End user",offer:"Offer",pricing:"Pricing hypothesis",competitors:"Alternatives and competitors",constraints:"Constraints and gaps"};

export function FounderIntelligence({projectId,initial}:{projectId:string;initial:FounderIntelligenceState}){
 const [state,setState]=useState(initial);
 const [profile,setProfile]=useState({...initial.profile});
 const [kind,setKind]=useState<SignalKind>("objection");
 const [quote,setQuote]=useState("");
 const [persona,setPersona]=useState("");
 const [source,setSource]=useState("");
 const [rule,setRule]=useState({metric:initial.rule?.metric??"paid pilots",threshold:initial.rule?.threshold??4,current:initial.rule?.current??0,deadline:initial.rule?.deadline??"",fallback:initial.rule?.fallback??""});
 const [artifact,setArtifact]=useState("");
 const [working,setWorking]=useState(false);
 const [message,setMessage]=useState("");
 const [pivot,setPivot]=useState("");
 async function act(action:string,extra:Record<string,unknown>={}){
   setWorking(true);setMessage("");
   try{
     const res=await fetch(`/api/projects/${projectId}/intelligence`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,revision:state.revision,...extra})});
     const data=await res.json();
     if(!res.ok)throw new Error(data.error||"Request failed");
     if(data.state){setState(data.state);setProfile(data.state.profile);}
     if(data.pivot)setPivot(`${data.pivot.status.toUpperCase()}: ${data.pivot.detail}`);
     if(typeof data.artifact==="string")setArtifact(data.artifact);
     setMessage(action==="artifact"?"Review-only specialist draft generated.":"Saved.");
     if(action==="signal"){setQuote("");setPersona("");setSource("");}
   }catch(error){setMessage(error instanceof Error?error.message:"Unable to complete action");}
   finally{setWorking(false);}
 }
 const button=(title:string,onClick:()=>void)=><button type="button" className="agent-btn" disabled={working} onClick={onClick}>{working?"Working…":title}</button>;
 const inputStyle={width:"100%",marginBottom:8};
 return <div className="panel-body" style={{maxWidth:1100,margin:"0 auto"}}>
 <h1>Founder Intelligence</h1><p className="muted">Your approved company file, customer evidence, pivot thresholds, and daily execution plan. Nothing is sent to prospects.</p>
 <div className="grid2">
  <section className="card"><h2>Canonical company file</h2><p className="small muted">Only the founder can apply changes.</p>
    {(Object.keys(labels) as Array<keyof CompanyProfile>).map(key=><label key={key} style={{display:"block",marginBottom:8}}><span className="small">{labels[key]}</span><textarea style={{...inputStyle,minHeight:55}} maxLength={1000} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})}/></label>)}
    {button("Approve and save profile",()=>act("profile",{profile}))}
  </section>
  <section className="card"><h2>Customer signals</h2><p className="small muted">Store actual customer words with explicit provenance. Secrets and emails are redacted before persistence; avoid uploading raw call transcripts.</p>
   <label>Signal type<select style={inputStyle} value={kind} onChange={e=>setKind(e.target.value as SignalKind)}>{kinds.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
   <input style={inputStyle} maxLength={160} placeholder="Persona / role (avoid customer names)" value={persona} onChange={e=>setPersona(e.target.value)}/>
   <input style={inputStyle} maxLength={160} placeholder="Source (e.g. interview 2026-10-20)" value={source} onChange={e=>setSource(e.target.value)}/>
   <textarea style={{...inputStyle,minHeight:120}} maxLength={4000} placeholder="Verbatim customer quote (12+ characters)" value={quote} onChange={e=>setQuote(e.target.value)}/>
   {button("Save customer signal",()=>act("signal",{kind,quote,persona,source}))}
   <div style={{marginTop:16}}>{state.signals.slice(0,15).map(s=><div className="event" key={s.id}><b>{s.kind} · {s.persona||"Unspecified persona"}</b><p>“{s.quote}”</p><p className="small muted">Evidence ID: {s.evidenceId} · {s.source||s.recordedAt.slice(0,10)}</p></div>)}{!state.signals.length&&<p className="muted">No customer quotes recorded yet.</p>}</div>
  </section>
 </div>
 <div style={{height:16}}/>
 <div className="grid2">
   <section className="card"><h2>Decision threshold</h2>
    <input style={inputStyle} maxLength={120} placeholder="Metric (e.g. paid pilots)" value={rule.metric} onChange={e=>setRule({...rule,metric:e.target.value})}/>
    <div className="grid2"><label className="small">Goal<input style={inputStyle} type="number" min="0.001" step="any" value={rule.threshold} onChange={e=>setRule({...rule,threshold:Number(e.target.value)})}/></label><label className="small">Observed value<input style={inputStyle} type="number" min="0" step="any" value={rule.current} onChange={e=>setRule({...rule,current:Number(e.target.value)})}/></label></div>
    <label className="small">Deadline (UTC day)<input style={inputStyle} type="date" value={rule.deadline} onChange={e=>setRule({...rule,deadline:e.target.value})}/></label>
    <textarea style={{...inputStyle,minHeight:65}} maxLength={500} placeholder="Alternative to review if threshold is missed" value={rule.fallback} onChange={e=>setRule({...rule,fallback:e.target.value})}/>
    {button("Approve threshold",()=>act("rule",{rule}))}
    <p style={{marginTop:10}}>{pivot||(state.rule?`${state.rule.current}/${state.rule.threshold} ${state.rule.metric}, deadline ${state.rule.deadline}`:"No rule saved.")}</p>
    <p className="small muted">A missed deadline prompts founder review. It never changes strategy automatically.</p>
   </section>
   <section className="card"><h2>Today’s execution plan</h2>
    {button("Re-plan using real signals",()=>act("replan"))}
    {state.moves.map(m=><label className="event" style={{display:"block",marginTop:10}} key={m.id}><input type="checkbox" checked={m.complete} disabled={working} onChange={e=>act("complete",{id:m.id,complete:e.target.checked})}/><b style={{marginLeft:8}}>{m.title}</b><p>{m.reason}</p><p className="small muted">{m.evidenceIds.length?`Evidence: ${m.evidenceIds.join(", ")}`:"Hypothesis only — no citation yet"}</p></label>)}
    {!state.moves.length&&<p className="muted">Generate a plan after recording signals.</p>}
   </section>
 </div>
 <div style={{height:16}}/>
 <section className="card"><h2>Specialist drafts — export only</h2><p className="small muted">Drafts use saved company context and quoted evidence, without external research or autonomous execution.</p>
 <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{specialties.map(s=><span key={s}>{button("/"+s,()=>act("artifact",{kind:s}))}</span>)}</div>
 {artifact&&<><textarea style={{width:"100%",minHeight:300,marginTop:16}} readOnly value={artifact}/>{button("Copy draft",()=>navigator.clipboard.writeText(artifact))}</>}
 </section>
 {message&&<p role="status" style={{marginTop:14}}>{message}</p>}
 </div>;
}
