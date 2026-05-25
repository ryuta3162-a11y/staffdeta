import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect("/report");
  }

  return <AuthForm mode="login" />;
}
