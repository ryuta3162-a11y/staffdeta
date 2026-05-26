import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect("/home");
  }

  return <AuthForm mode="register" />;
}
