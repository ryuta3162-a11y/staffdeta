import { redirect } from "next/navigation";
import { GuestEyeAuthForm } from "@/components/guest-eye/AuthForm";
import { getSession } from "@/lib/guest-eye/auth";

export default async function GuestEyeRegisterPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect("/guest-eye/home");
  }

  return <GuestEyeAuthForm mode="register" />;
}
