import { DashboardShell } from "@/components/dashboard/shell";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pab-theme">
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}
