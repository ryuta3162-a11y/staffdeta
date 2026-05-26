import { ReportForm } from "@/components/ReportForm";
import { requireSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await requireSession();

  return (
    <ReportForm storeName={session.storeName} staffName={session.staffName} />
  );
}
