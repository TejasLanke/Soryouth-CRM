
import { PageHeader } from '@/components/page-header';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="View your tasks and upcoming follow-ups."
        icon={CalendarDays}
      />
      <Card>
        <CardHeader>
          <CardTitle>Tasks Overview</CardTitle>
          <CardDescription>
            This is a placeholder for the calendar view. Future implementation will show tasks and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-md">
            <p className="text-muted-foreground">Calendar View Placeholder</p>
          </div>
           <img src="https://placehold.co/1200x400.png" data-ai-hint="calendar tasks" alt="Calendar with tasks" className="w-full mt-6 rounded-lg object-cover"/>
        </CardContent>
      </Card>
    </>
  );
}
