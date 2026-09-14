import assert from "node:assert/strict";
import test from "node:test";
import { assertVercelPreviewUrl, isPrivateIp } from "./policy";

test("accepts only HTTPS vercel.app preview URLs",()=>{
  assert.equal(assertVercelPreviewUrl("https://demo-abc.vercel.app/path").hostname,"demo-abc.vercel.app");
  assert.throws(()=>assertVercelPreviewUrl("http://demo-abc.vercel.app"));
  assert.throws(()=>assertVercelPreviewUrl("https://example.com"));
  assert.throws(()=>assertVercelPreviewUrl("https://user:pass@demo-abc.vercel.app"));
});

test("recognizes common private IP ranges",()=>{
  for(const ip of ["127.0.0.1","10.1.2.3","169.254.1.1","172.16.0.1","172.31.255.1","192.168.1.1","::1","fd00::1"]) assert.equal(isPrivateIp(ip),true,ip);
  assert.equal(isPrivateIp("8.8.8.8"),false);
});
