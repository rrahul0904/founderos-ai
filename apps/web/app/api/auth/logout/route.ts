import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.delete("founderos_session");
  return Response.json({ ok: true });
}
