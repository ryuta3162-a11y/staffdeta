import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { defaultSession, sessionOptions, type SessionData } from "./session";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/login");
  }
  return session;
}

export async function clearSession() {
  const session = await getSession();
  session.storeName = defaultSession.storeName;
  session.staffName = defaultSession.staffName;
  session.isLoggedIn = defaultSession.isLoggedIn;
  await session.save();
}
