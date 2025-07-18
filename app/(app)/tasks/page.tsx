
'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardCheck, Loader2, PlusCircle, AlertTriangle, Trash2, MoreVertical } from 'lucide-react';
import type { GeneralTask, GeneralTaskStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getGroupedGeneralTasks, deleteTasksByStatusForUser } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type GroupedTasks = Record<string, { user: { id: string; name: string }; tasks: GeneralTask[] }>;

export default function TasksPage() {
  const router = useRouter();
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const { toast } = useToast();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ userId: string, status: 'Completed' | 'Failed' } | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    const tasks = await getGroupedGeneralTasks();
    setGroupedTasks(tasks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDeleteRequest = (userId: string, status: 'Completed' | 'Failed') => {
    setDeleteCandidate({ userId, status });
    setIsAlertOpen(true);
  };

  const confirmDeletion = () => {
    if (!deleteCandidate) return;

    startTransition(async () => {
        const { userId, status } = deleteCandidate;
        const result = await deleteTasksByStatusForUser(userId, status);
        if(result.success) {
            toast({
                title: 'Tasks Deleted',
                description: `${result.count} ${status.toLowerCase()} task(s) have been deleted.`
            });
            fetchTasks();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to delete tasks.',
                variant: 'destructive'
            });
        }
        setIsAlertOpen(false);
        setDeleteCandidate(null);
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
            {Object.values(groupedTasks).map(({ user, tasks }) => {
                const completedCount = tasks.filter(t => t.status === 'Completed').length;
                const failedCount = tasks.filter(t => t.status === 'Failed').length;
                return (
              <AccordionItem value={user.id} key={user.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-3 flex-grow">
                    <Avatar><AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="user avatar" /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="font-semibold text-lg">{user.name}</span>
                    <Badge variant="outline">{tasks.length} task(s)</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="flex justify-end mb-4">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isProcessing}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Tasks
                          <MoreVertical className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteRequest(user.id, 'Completed')} disabled={completedCount === 0}>
                           Delete {completedCount} Completed Task(s)
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleDeleteRequest(user.id, 'Failed')} disabled={failedCount === 0} className="text-destructive focus:text-destructive">
                           Delete {failedCount} Failed Task(s)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-3">
                    {tasks.map(task => {
                      const isTaskPastDue = isPast(task.taskDate) && !['Completed', 'Failed'].includes(task.status);
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
                           <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                                Created by {task.createdBy?.name || 'System'}. Last updated: {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
                            </p>
                            {task.status === 'Failed' && task.reason && (
                                <p className="text-xs text-destructive mt-1"><span className="font-semibold">Reason:</span> {task.reason}</p>
                            )}
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        )}
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all "{deleteCandidate?.status}" tasks for this user.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeletion} disabled={isProcessing}>
                        {isProcessing ? "Deleting..." : "Yes, Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
