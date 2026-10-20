import test from "node:test";
import assert from "node:assert/strict";
import {initialFounderIntelligence,redactSensitive,updateCompanyProfile,addCustomerSignal,setPivotRule,evaluatePivot,replanFounderDay,setMoveComplete,specialistArtifact} from "./founder-intelligence.js";
test("redacts common credentials and customer emails before persistence",()=>{
 const text=redactSensitive("sk-proj-abcdefghijklmnopqrstuvwxyz customer@example.com Bearer abcdefghijklmnopqrst");
 assert.equal(text.includes("abcdefghijklmnopqrstuvwxyz"),false);
 assert.equal(text.includes("customer@example.com"),false);
 assert.match(text,/REDACTED_SECRET/);
});
test("profile changes are deliberate, bounded and redacted",()=>{
 const state=updateCompanyProfile(initialFounderIntelligence(),{buyer:"VP Engineering",pricing:"contact hi@example.com"});
 assert.equal(state.profile.buyer,"VP Engineering");
 assert.equal(state.profile.pricing.includes("@"),false);
 assert.equal(state.revision,1);
});
test("signals retain evidence IDs and quote provenance",()=>{
 const state=addCustomerSignal(initialFounderIntelligence(),{evidenceId:"ev-1",kind:"objection",quote:"We need SOC2 certification before we can buy it.",persona:"CTO"},"sig-1",new Date("2026-10-20T12:00:00Z"));
 assert.equal(state.signals[0].evidenceId,"ev-1");
 const plan=replanFounderDay(state,new Date("2026-10-20T12:00:00Z"));
 assert.deepEqual(plan.moves[0].evidenceIds,["ev-1"]);
 assert.match(specialistArtifact("gtm",plan),/Evidence ev-1/);
 assert.equal(setMoveComplete(plan,plan.moves[0].id,true).moves[0].complete,true);
});
test("pivot does not trigger prematurely and never auto-executes",()=>{
 const rule={metric:"paid pilots",threshold:4,current:2,deadline:"2026-10-30",fallback:"Interview a different segment"};
 assert.equal(evaluatePivot(rule,new Date("2026-10-20T12:00:00Z")).status,"tracking");
 assert.equal(evaluatePivot(rule,new Date("2026-10-31T12:00:00Z")).status,"review");
 assert.equal(evaluatePivot({...rule,current:4},new Date("2026-11-02T00:00:00Z")).status,"achieved");
 assert.equal(setPivotRule(initialFounderIntelligence(),rule).rule?.metric,"paid pilots");
});
test("invalid quote and threshold are refused",()=>{
 assert.throws(()=>addCustomerSignal(initialFounderIntelligence(),{evidenceId:"a",kind:"pain",quote:"short",persona:"CTO"},"x"),/12/);
 assert.throws(()=>setPivotRule(initialFounderIntelligence(),{metric:"trials",threshold:0,current:0,deadline:"2026-10-30",fallback:"revisit"}),/Invalid pivot/);
});
