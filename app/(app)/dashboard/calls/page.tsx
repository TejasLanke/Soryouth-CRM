
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export default function CallsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-6 w-6 text-primary" />
          Call Reports
        </CardTitle>
        <CardDescription>
          This page will display reports and logs related to calls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md">
          <Phone className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Call reports placeholder.</p>
          <p className="text-sm text-muted-foreground">Future implementation will show detailed call logs and analytics.</p>
        </div>
         <img src="https://placehold.co/1200x400.png" data-ai-hint="call log report" alt="Call reports" className="w-full mt-6 rounded-lg object-cover"/>
      </CardContent>
    </Card>
  );
}
