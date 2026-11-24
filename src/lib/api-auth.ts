import { getSession } from "@/lib/session";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
