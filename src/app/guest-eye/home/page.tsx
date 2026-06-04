import { GuestEyeReportForm } from "@/components/guest-eye/ReportForm";
import { requireSession } from "@/lib/guest-eye/auth";

export default async function GuestEyeReportPage() {
  const session = await requireSession();

  const storeNames =
    session.storeNames?.length > 0
      ? session.storeNames
      : session.storeName
        ? [session.storeName]
        : [];

  return (
    <GuestEyeReportForm
      storeName={session.storeName}
      storeNames={storeNames}
      staffName={session.staffName}
    />
  );
}
