
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTasksForCurrentUser } from '@/app/(app)/leads-list/actions';
import { format, parseISO } from 'date-fns';
import type { TaskNotification } from '@/types';

export function TaskNotifications() {
  const [tasks, setTasks] = useState<TaskNotification[]>([]);
  const [openTasksCount, setOpenTasksCount] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      const fetchedTasks = await getTasksForCurrentUser();
      setTasks(fetchedTasks);
      setOpenTasksCount(fetchedTasks.filter(t => t.status === 'Open').length);
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const openTasks = tasks.filter(t => t.status === 'Open');
  const closedTasks = tasks.filter(t => t.status === 'Closed');

  return (
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
      <PopoverContent className="w-80" align="end">
        <div className="p-4">
          <h3 className="text-lg font-medium">Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Open - {openTasks.length} | Closed - {closedTasks.length}
          </p>
        </div>
        <ScrollArea className="h-96">
          <div className="p-4 pt-0 space-y-4">
            {tasks.length === 0 ? (
                 <p className="text-sm text-center text-muted-foreground py-8">No tasks found.</p>
            ) : (
                [...openTasks, ...closedTasks].map((task) => (
                    <Link key={task.id} href={`${task.link}?from_task=${task.id}`} className="block p-3 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                             <UserCircle className="h-8 w-8 text-muted-foreground flex-shrink-0"/>
                             <div className="flex-grow">
                                <p className="text-sm font-medium truncate">{task.comment} @ {task.time}</p>
                                <p className="text-xs text-muted-foreground truncate">{task.customerName} - {task.customerPhone}</p>
                             </div>
                             <Badge variant={task.status === 'Open' ? 'destructive' : 'secondary'} className="self-start mt-1">
                                {task.status}
                             </Badge>
                        </div>
                    </Link>
                ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
