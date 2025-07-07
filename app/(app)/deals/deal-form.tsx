
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useMemo } from 'react';
import { DEAL_PIPELINES, type DealPipelineType, type DealStage } from '@/lib/constants';
import type { User } from '@/types';
import { IndianRupee, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const dealSchema = z.object({
  clientName: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  contactPerson: z.string().min(2, { message: "Contact person must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal('')),
  pipeline: z.enum(Object.keys(DEAL_PIPELINES) as [DealPipelineType, ...DealPipelineType[]]),
  stage: z.string().min(1, { message: "Stage is required." }),
  dealValue: z.coerce.number().min(0, { message: "Deal value cannot be negative." }),
  assignedTo: z.string().optional(),
  poWoDate: z.date({ required_error: "A PO/WO date is required." }),
});

export type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DealFormValues) => void;
  users: User[];
  pipeline: DealPipelineType;
  initialStage?: DealStage;
}

export function DealForm({ isOpen, onClose, onSubmit, users, pipeline, initialStage }: DealFormProps) {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      clientName: '',
      contactPerson: '',
      email: '',
      phone: '',
      pipeline: pipeline,
      stage: initialStage || DEAL_PIPELINES[pipeline][0],
      dealValue: 0,
      assignedTo: undefined,
      poWoDate: new Date(),
    },
  });
  
  const watchedClientName = form.watch('clientName');

  useEffect(() => {
    if (watchedClientName) {
      form.setValue('contactPerson', watchedClientName);
    }
  }, [watchedClientName, form]);

  // Set initial values when the dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        clientName: '',
        contactPerson: '',
        email: '',
        phone: '',
        pipeline: pipeline,
        stage: initialStage || DEAL_PIPELINES[pipeline][0],
        dealValue: 0,
        assignedTo: undefined,
        poWoDate: new Date(),
      });
    }
  }, [isOpen, pipeline, initialStage, form]);

  const stagesForSelectedPipeline = useMemo(() => {
    return DEAL_PIPELINES[pipeline] || [];
  }, [pipeline]);

  const handleSubmit = (values: DealFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>Enter the details for the new deal.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 pb-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField control={form.control} name="clientName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl><Input placeholder="ABC Corporation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person *</FormLabel>
                  <FormControl><Input placeholder="Mr. John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No.</FormLabel>
                  <FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="pipeline" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pipeline *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{Object.keys(DEAL_PIPELINES).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="stage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{stagesForSelectedPipeline.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="dealValue" render={({ field }) => (
                <FormItem>
                    <FormLabel>Deal Value (₹)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="assignedTo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select user"/></SelectTrigger></FormControl>
                            <SelectContent>{users.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="poWoDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>PO/WO Date *</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                 )} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Deal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
