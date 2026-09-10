import assert from "node:assert/strict";
import test from "node:test";
import { DEV_ORGANIZATION_ID, createProject, deriveName, normalizeConfidence, readinessForStage } from "./index";
test("creates an evidence-first project",()=>{const project=createProject("An AI workspace for founders who lose context between research and coding");assert.equal(project.stage,"idea");assert.equal(project.readiness,18);assert.equal(project.organizationId,DEV_ORGANIZATION_ID);assert.ok(project.assumptions.length>=3);});
test("derives a compact project name",()=>{assert.equal(deriveName("Build a product intelligence workspace for founders"),"Build a product intelligence workspace");});
test("readiness advances with lifecycle maturity",()=>{assert.ok(readinessForStage("learn")>readinessForStage("evidence"));});
test("confidence is clamped",()=>{assert.equal(normalizeConfidence(1.5),1);assert.equal(normalizeConfidence(-1),0);});
