
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateTaskStatus } from '@/app/(app)/leads-list/actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TaskCompletionToast({ taskId }: { taskId: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // Show for 5 seconds

    return () => clearTimeout(timer);
  }, [taskId]);

  const handleMarkAsDone = () => {
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, 'Closed');
      if (result.success) {
        toast({ title: 'Task Completed', description: 'The task has been marked as done.' });
        // Remove the query param from URL without reloading page
        router.replace(window.location.pathname, { scroll: false });
        setIsVisible(false);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card p-3 rounded-lg shadow-2xl border flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-5">
      <p className="text-sm font-medium">Navigated from task. Mark as complete?</p>
      <Button size="sm" onClick={handleMarkAsDone} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as Done'}
      </Button>
    </div>
  );
}
