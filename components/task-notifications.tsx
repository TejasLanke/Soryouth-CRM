
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { CalendarDays, UserCircle, CheckCircle2, Play, ThumbsDown, Loader2, LinkIcon, Phone } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getOpenGeneralTasksForCurrentUser, updateGeneralTaskStatus } from '@/app/(app)/tasks/actions';
import { getTasksForCurrentUser } from '@/app/(app)/leads-list/actions';
import { format, formatDistanceToNow, parse } from 'date-fns';
import type { GeneralTask, GeneralTaskStatus, TaskNotification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type UnifiedTask = {
  id: string;
  type: 'general' | 'follow-up';
  comment: string;
  time: string;
  dueDate: Date;
  customerName?: string;
  priority?: string;
  link?: string;
  status: 'Open' | 'Closed' | GeneralTaskStatus;
};

function FailureReasonDialog({
    isOpen,
    onClose,
    onSubmit,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    const [isSubmitting, startSubmitTransition] = useTransition();

    const handleSubmit = () => {
        startSubmitTransition(() => {
            onSubmit(reason);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reason for Failure</DialogTitle>
                    <DialogDescription>
                        Please provide a brief reason why this task could not be completed.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="failure-reason" className="sr-only">Failure Reason</Label>
                    <Textarea
                        id="failure-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Client was not available, required information was missing..."
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                        Submit Reason
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function TaskNotifications() {
  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, startUpdateTransition] = useTransition();
  const { toast } = useToast();
  
  const [isFailureDialogOpen, setIsFailureDialogOpen] = useState(false);
  const [taskToFail, setTaskToFail] = useState<string | null>(null);


  const fetchTasks = async () => {
    setIsLoading(true);
    const [generalTasks, followupTasks] = await Promise.all([
      getOpenGeneralTasksForCurrentUser(),
      getTasksForCurrentUser(),
    ]);

    const unifiedGeneralTasks: UnifiedTask[] = generalTasks.map(task => ({
      id: task.id,
      type: 'general',
      comment: task.comment,
      time: format(task.taskDate, 'HH:mm'),
      dueDate: task.taskDate,
      priority: task.priority,
      status: task.status,
    }));

    const unifiedFollowupTasks: UnifiedTask[] = followupTasks
      .filter(task => task.status === 'Open')
      .map(task => ({
        id: task.id,
        type: 'follow-up',
        comment: task.comment,
        time: task.time,
        dueDate: parse(task.time, 'HH:mm', new Date()),
        customerName: task.customerName,
        link: task.link,
        status: task.status,
      }));
    
    const allTasks = [...unifiedGeneralTasks, ...unifiedFollowupTasks].sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );

    setTasks(allTasks);
    setOpenTasksCount(allTasks.length);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);
  
  const handleUpdateStatus = (taskId: string, status: GeneralTaskStatus, reason?: string) => {
    startUpdateTransition(async () => {
      const result = await updateGeneralTaskStatus(taskId, status, reason);
      if (result.success) {
        toast({ title: 'Status Updated', description: `Task has been marked as ${status}.` });
        fetchTasks();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update status.', variant: 'destructive' });
      }
    });
  };

  const openFailureDialog = (taskId: string) => {
    setTaskToFail(taskId);
    setIsFailureDialogOpen(true);
  };
  
  const handleFailureSubmit = (reason: string) => {
      if(taskToFail) {
          handleUpdateStatus(taskToFail, 'Failed', reason);
      }
      setIsFailureDialogOpen(false);
      setTaskToFail(null);
  }

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CalendarDays className="h-5 w-5" />
          {openTasksCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {openTasksCount}
            </Badge>
          )}
          <span className="sr-only">Open task notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="p-4">
          <h3 className="text-lg font-medium">Your Tasks for Today</h3>
          <p className="text-sm text-muted-foreground">
            {openTasksCount > 0 ? `${openTasksCount} task(s) require your attention.` : 'You have no open tasks for today.'}
          </p>
        </div>
        <ScrollArea className="h-96">
          <div className="p-4 pt-0 space-y-2">
            {isLoading ? (
                <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : tasks.length === 0 ? (
                 <p className="text-sm text-center text-muted-foreground py-8">All caught up! 🎉</p>
            ) : (
                tasks.map((task) => (
                    <div key={task.id} className="block p-3 rounded-md border bg-card">
                        <div className="flex items-start gap-3">
                             <UserCircle className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1"/>
                             <div className="flex-grow">
                                <p className="text-sm font-medium leading-tight">{task.comment}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Due: {formatDistanceToNow(task.dueDate, { addSuffix: true })} at {task.time}
                                </p>
                                {task.type === 'follow-up' && (
                                     <p className="text-xs text-primary font-medium mt-1">
                                        Follow-up with: {task.customerName}
                                    </p>
                                )}
                             </div>
                        </div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between items-center">
                            <Badge variant={task.type === 'general' && task.priority === 'High' ? 'destructive' : task.type === 'follow-up' ? 'default' : 'secondary'}>
                                {task.type === 'general' ? `General: ${task.priority}` : 'Follow-up'}
                            </Badge>
                            {task.type === 'general' ? (
                                <div className="flex gap-1">
                                    <Button onClick={() => handleUpdateStatus(task.id, 'Completed')} variant="ghost" size="icon" title="Mark as Completed" disabled={isUpdating}><CheckCircle2 className="h-5 w-5 text-green-600"/></Button>
                                    <Button onClick={() => handleUpdateStatus(task.id, 'In Progress')} variant="ghost" size="icon" title="Mark as In Progress" disabled={isUpdating}><Play className="h-5 w-5 text-blue-600"/></Button>
                                    <Button onClick={() => openFailureDialog(task.id)} variant="ghost" size="icon" title="Mark as Failed" disabled={isUpdating}><ThumbsDown className="h-5 w-5 text-red-600"/></Button>
                                </div>
                            ) : (
                                <Link href={task.link || '#'} className={cn(buttonVariants({variant: 'outline', size: 'sm'}), 'text-xs')}>
                                    <LinkIcon className="h-3 w-3 mr-1.5"/>
                                    View Lead
                                </Link>
                            )}
                        </div>
                    </div>
                ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
    
    <FailureReasonDialog 
        isOpen={isFailureDialogOpen}
        onClose={() => setIsFailureDialogOpen(false)}
        onSubmit={handleFailureSubmit}
    />
    </>
  );
}
