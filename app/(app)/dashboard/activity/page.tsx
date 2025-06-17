
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function ActivityPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Activity Log
        </CardTitle>
        <CardDescription>
          This page will display a log of recent activities across the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md">
          <History className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Activity log placeholder.</p>
          <p className="text-sm text-muted-foreground">Future implementation will show detailed activity streams.</p>
        </div>
        <img src="https://placehold.co/1200x400.png" data-ai-hint="activity log stream" alt="Activity log" className="w-full mt-6 rounded-lg object-cover"/>
      </CardContent>
    </Card>
  );
}
