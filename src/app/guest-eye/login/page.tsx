import { redirect } from "next/navigation";
import { GuestEyeAuthForm } from "@/components/guest-eye/AuthForm";
import { getSession } from "@/lib/guest-eye/auth";
import { guestEyePaths } from "@/lib/guest-eye/paths";

export default async function GuestEyeLoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect(guestEyePaths.home);
  }

  return <GuestEyeAuthForm mode="login" />;
}
