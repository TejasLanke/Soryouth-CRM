
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default function TasksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          Task Management
        </CardTitle>
        <CardDescription>
          This page will display user tasks and to-do items.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md">
          <ClipboardCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Tasks placeholder.</p>
          <p className="text-sm text-muted-foreground">Future implementation will show a list of tasks, their statuses, and due dates.</p>
        </div>
        <img src="https://placehold.co/1200x400.png" data-ai-hint="task list board" alt="Task management" className="w-full mt-6 rounded-lg object-cover"/>
      </CardContent>
    </Card>
  );
}
