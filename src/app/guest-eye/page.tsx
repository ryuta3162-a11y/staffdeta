import { redirect } from "next/navigation";
import { getSession } from "@/lib/guest-eye/auth";

export default async function GuestEyeHomePage() {
  const session = await getSession();
  redirect(session.isLoggedIn ? "/guest-eye/home" : "/guest-eye/login");
}
