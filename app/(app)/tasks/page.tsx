
'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardCheck, Loader2, PlusCircle, AlertTriangle, Play, ThumbsDown, CheckCircle2, UserCircle } from 'lucide-react';
import type { GeneralTask, GeneralTaskStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getGroupedGeneralTasks, updateGeneralTaskStatus } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

type GroupedTasks = Record<string, { user: { id: string; name: string }; tasks: GeneralTask[] }>;

export default function TasksPage() {
  const router = useRouter();
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    setIsLoading(true);
    const tasks = await getGroupedGeneralTasks();
    setGroupedTasks(tasks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = (taskId: string, status: GeneralTaskStatus) => {
    startUpdateTransition(async () => {
      const result = await updateGeneralTaskStatus(taskId, status);
      if (result.success) {
        toast({ title: 'Status Updated', description: `Task has been marked as ${status}.` });
        fetchTasks();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update status.', variant: 'destructive' });
      }
    });
  };

  const getStatusBadgeVariant = (status: GeneralTaskStatus) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Pending': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Manage Tasks" description="Assign and track tasks for your team." icon={ClipboardCheck} />
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="General Tasks"
        description="Assign and track non-follow-up tasks for your team."
        icon={ClipboardCheck}
        actions={<Button onClick={() => router.push('/tasks/new')}><PlusCircle className="mr-2 h-4 w-4"/>Create Task</Button>}
      />
      <div className="space-y-4">
        {Object.keys(groupedTasks).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <ClipboardCheck className="mx-auto h-12 w-12 mb-2" />
              <p>No tasks found.</p>
              <p className="text-sm">Click "Create Task" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4" defaultValue={Object.keys(groupedTasks)}>
            {Object.values(groupedTasks).map(({ user, tasks }) => (
              <AccordionItem value={user.id} key={user.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="user avatar" /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="font-semibold text-lg">{user.name}</span>
                    <Badge variant="outline">{tasks.length} task(s)</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {tasks.map(task => {
                      const isTaskPastDue = isPast(task.taskDate) && task.status !== 'Completed';
                      return (
                        <div key={task.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <p className="font-medium">{task.comment}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Due: {format(task.taskDate, 'dd MMM, yyyy p')}</span>
                                    <span>Priority: {task.priority}</span>
                                    {isTaskPastDue && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue by {formatDistanceToNow(task.taskDate)}</Badge>}
                                </div>
                             </div>
                             <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
                          </div>
                           <div className="flex justify-between items-center mt-3 pt-3 border-t">
                             <p className="text-xs text-muted-foreground">Created by {task.createdBy?.name || 'System'} {formatDistanceToNow(task.createdAt, { addSuffix: true })}</p>
                             <div className="flex gap-1">
                                <Button onClick={() => handleUpdateStatus(task.id, 'Completed')} variant="ghost" size="icon" title="Mark as Completed" disabled={isUpdating}><CheckCircle2 className="h-5 w-5 text-green-600"/></Button>
                                <Button onClick={() => handleUpdateStatus(task.id, 'In Progress')} variant="ghost" size="icon" title="Mark as In Progress" disabled={isUpdating}><Play className="h-5 w-5 text-blue-600"/></Button>
                                <Button onClick={() => handleUpdateStatus(task.id, 'Failed')} variant="ghost" size="icon" title="Mark as Failed" disabled={isUpdating}><ThumbsDown className="h-5 w-5 text-red-600"/></Button>
                             </div>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </>
  );
}
