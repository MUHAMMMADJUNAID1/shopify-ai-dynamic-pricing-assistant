import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function Home() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}
