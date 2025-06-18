
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react'; // Using a generic chart icon for now

export default function LeadsSummaryReportPage() {
  return (
    <>
      {/* PageHeader is handled by the layout /app/(app)/leads/layout.tsx */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Summary Report</CardTitle>
          <CardDescription>
            This page will display summary reports and charts related to leads activity.
            Content to be implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-md">
            <BarChart className="h-24 w-24 text-muted-foreground mb-6" />
            <p className="text-xl font-semibold text-muted-foreground">Lead Summary & Analytics</p>
            <p className="text-sm text-muted-foreground">
              Detailed charts and key performance indicators for leads will be shown here.
            </p>
          </div>
          <img src="https://placehold.co/1200x400.png" data-ai-hint="lead analytics dashboard" alt="Lead Summary Report Placeholder" className="w-full mt-8 rounded-lg object-cover"/>
        </CardContent>
      </Card>
    </>
  );
}
