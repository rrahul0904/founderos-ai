import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function isPrivateIp(address: string) {
  if (isIP(address) === 4) {
    const [a,b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
  }
  return true;
}

export function assertVercelPreviewUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.port || url.username || url.password || !url.hostname.toLowerCase().endsWith(".vercel.app")) {
    throw new Error("Preview verification requires a public HTTPS *.vercel.app URL");
  }
  return url;
}

export async function assertPublicRequestUrl(raw: string, cache = new Map<string, boolean>()) {
  const url = new URL(raw);
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Browser request protocol is blocked");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) throw new Error("Local browser destination is blocked");
  const cached = cache.get(host);
  if (cached === false) throw new Error("Private browser destination is blocked");
  if (cached === true) return url;
  if (isIP(host)) {
    const allowed = !isPrivateIp(host); cache.set(host, allowed); if (!allowed) throw new Error("Private browser destination is blocked"); return url;
  }
  const addresses = await lookup(host,{all:true,verbatim:true});
  const allowed = addresses.length > 0 && addresses.every((item) => !isPrivateIp(item.address));
  cache.set(host,allowed);
  if (!allowed) throw new Error("Private or unresolved browser destination is blocked");
  return url;
}
