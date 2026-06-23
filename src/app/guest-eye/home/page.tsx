import { GuestEyeReportForm } from "@/components/guest-eye/ReportForm";
import { getSession, requireSession } from "@/lib/guest-eye/auth";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

export default async function GuestEyeReportPage() {
  const session = await requireSession();

  let storeNames =
    session.storeNames?.length > 0
      ? session.storeNames
      : session.storeName
        ? [session.storeName]
        : [];

  try {
    const lookup = await callGuestEyeGas({
      action: "lookupStaff",
      staffName: session.staffName,
    });
    if (Array.isArray(lookup.stores) && lookup.stores.length > 0) {
      storeNames = lookup.stores as string[];
      session.storeNames = storeNames;
      if (!storeNames.includes(session.storeName)) {
        session.storeName = storeNames[0];
      }
      await session.save();
    }
  } catch {
    // lookup 失敗時はセッションの店舗一覧をそのまま使う
  }

  return (
    <GuestEyeReportForm
      storeName={session.storeName}
      storeNames={storeNames}
      staffName={session.staffName}
    />
  );
}
