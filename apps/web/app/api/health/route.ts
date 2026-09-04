export async function GET() {
  return Response.json({ ok: true, service: "founderos-web", timestamp: new Date().toISOString() });
}
