import test from "node:test";
import assert from "node:assert/strict";
import { createProject, initialFounderIntelligence, updateCompanyProfile, type EvidenceRecord } from "@founderos/core";
import { createPool, PostgresFounderRepository } from "./index.js";

const connection=process.env.TEST_DATABASE_URL;
test("Postgres commits interview evidence with approved founder revision atomically", {skip:!connection}, async ()=>{
 const pool=createPool(connection);
 const repository=new PostgresFounderRepository(pool);
 const project=createProject("Verify founder memory transaction");
 const at=new Date().toISOString();
 const quote="Buyers will not proceed without documented SOC2 controls.";
 const first:EvidenceRecord={id:crypto.randomUUID(),projectId:project.id,sourceType:"interview",sourceUrl:null,title:"Customer objection",claim:quote,excerpt:quote,confidence:.6,contentHash:"fixture-1",collectedAt:at,metadata:{kind:"objection"}};
 const orphanAttempt:EvidenceRecord={...first,id:crypto.randomUUID(),contentHash:"fixture-2"};
 try{
  await repository.upsertProject(project);
  const firstState=updateCompanyProfile(initialFounderIntelligence(),{buyer:"VP Engineering"});
  const committed=await repository.saveFounderIntelligence(project.id,project.organizationId,0,firstState,first);
  assert.equal(committed?.founderIntelligence?.revision,1);
  const stale=await repository.saveFounderIntelligence(project.id,project.organizationId,0,firstState,orphanAttempt);
  assert.equal(stale,null);
  const crossTenant=await repository.saveFounderIntelligence(project.id,"00000000-0000-4000-8000-000000000999",1,firstState);
  assert.equal(crossTenant,null);
  const saved=await repository.getProject(project.id,project.organizationId);
  assert.equal(saved?.founderIntelligence?.profile.buyer,"VP Engineering");
  const rows=await repository.listEvidence(project.id,project.organizationId,10);
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,first.id);
 }finally{
  await pool.query("delete from projects where id=$1",[project.id]);
  await pool.end();
 }
});
