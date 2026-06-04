import { redirect } from "next/navigation";
import { guestEyePaths } from "@/lib/guest-eye/paths";

export default function GuestEyeRegisterPage() {
  redirect(guestEyePaths.login);
}
