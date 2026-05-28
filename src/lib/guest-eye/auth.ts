import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "./session";
import { guestEyePaths } from "./paths";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect(guestEyePaths.login);
  }
  return session;
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
