
import { PageHeader } from "@/components/page-header";
import { BarChart3 } from "lucide-react";
import { type ReactNode } from "react";

interface ReportsLayoutProps {
  children: ReactNode;
}

// This layout is for individual report pages like /reports/call-logs, not for the main /reports list.
// The main /reports page has its own PageHeader.
export default function ReportDetailLayout({ children }: ReportsLayoutProps) {
  return (
    <>
      {/* Individual report pages will define their own PageHeader or reuse one */}
      {children}
    </>
  );
}

    