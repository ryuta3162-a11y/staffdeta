import { GuestEyeReportForm } from "@/components/guest-eye/ReportForm";
import { requireSession } from "@/lib/guest-eye/auth";

export default async function GuestEyeReportPage() {
  const session = await requireSession();

  return (
    <GuestEyeReportForm
      storeName={session.storeName}
      staffName={session.staffName}
    />
  );
}
