
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserX } from 'lucide-react'; // Icon for dropped leads

export default function DroppedLeadsReportPage() {
  return (
    <>
      {/* PageHeader is handled by the layout /app/(app)/leads/layout.tsx */}
      <Card>
        <CardHeader>
          <CardTitle>Dropped Leads Report</CardTitle>
          <CardDescription>
            This page will display summary reports and analysis for dropped leads.
            Content to be implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-md">
            <UserX className="h-24 w-24 text-muted-foreground mb-6" />
            <p className="text-xl font-semibold text-muted-foreground">Dropped Lead Analysis</p>
            <p className="text-sm text-muted-foreground">
              Insights into why leads are dropped, trends, and recovery opportunities will be shown here.
            </p>
          </div>
           <img src="https://placehold.co/1200x400.png" data-ai-hint="dropped lead analysis chart" alt="Dropped Leads Report Placeholder" className="w-full mt-8 rounded-lg object-cover"/>
        </CardContent>
      </Card>
    </>
  );
}
