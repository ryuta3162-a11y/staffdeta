import { redirect } from "next/navigation";
import { getSession } from "@/lib/guest-eye/auth";
import { guestEyePaths } from "@/lib/guest-eye/paths";

export default async function GuestEyeHomePage() {
  const session = await getSession();
  redirect(session.isLoggedIn ? guestEyePaths.home : guestEyePaths.login);
}
