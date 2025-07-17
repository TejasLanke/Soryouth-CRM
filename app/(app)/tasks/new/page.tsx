
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASK_PRIORITIES } from '@/lib/constants';
import type { User, GeneralTaskPriority } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ClipboardCheck, Loader2, ArrowLeft } from 'lucide-react';
import { getUsers } from '@/app/(app)/users/actions';
import { createGeneralTask } from '../actions';
import { useRouter } from 'next/navigation';

const taskSchema = z.object({
  assignedToId: z.string().min(1, { message: 'A user must be selected.' }),
  taskDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "A valid date is required." }),
  taskTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:mm)." }),
  priority: z.enum(TASK_PRIORITIES, { required_error: 'Priority is required.' }),
  comment: z.string().min(10, { message: 'Task description must be at least 10 characters long.' }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function NewTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setIsLoading(false);
    }
    fetchUsers();
  }, []);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      assignedToId: '',
      taskDate: format(new Date(), 'yyyy-MM-dd'),
      taskTime: format(new Date(), 'HH:mm'),
      priority: 'Medium',
      comment: '',
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    startSubmitTransition(async () => {
      try {
        const fullTaskDate = new Date(`${values.taskDate}T${values.taskTime}:00`);
        const result = await createGeneralTask({
            assignedToId: values.assignedToId,
            taskDate: fullTaskDate,
            priority: values.priority,
            comment: values.comment,
        });

        if ('error' in result) {
          throw new Error(result.error);
        }

        toast({
          title: 'Task Created',
          description: 'The new task has been assigned successfully.',
        });
        router.push('/tasks');
      } catch (error) {
        toast({
          title: 'Error Creating Task',
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    });
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Create New Task"
        description="Assign a general task to a team member."
        icon={ClipboardCheck}
        actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>}
      />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user to assign the task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="taskDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taskTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Time *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description *</FormLabel>
                    <FormControl><Textarea placeholder="Provide a detailed description of the task..." rows={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Assigning Task...</> : 'Assign Task'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
