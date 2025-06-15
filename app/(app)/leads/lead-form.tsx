
'use client';

import type { Lead, LeadStatusType } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect } from 'react';
import { LEAD_STATUS_OPTIONS } from '@/lib/constants';

const leadSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')), // Optional for form
  phone: z.string().optional(),
  status: z.enum(LEAD_STATUS_OPTIONS), 
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  lastCommentText: z.string().optional(),
  // lastCommentDate is usually auto-set or handled internally
  nextFollowUpDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }),
  kilowatt: z.coerce.number().min(0).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormValues | Lead) => void;
  lead?: Lead | null;
}

export function LeadForm({ isOpen, onClose, onSubmit, lead }: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: LEAD_STATUS_OPTIONS[0], // Default to the first status
      source: '',
      assignedTo: '',
      lastCommentText: '',
      nextFollowUpDate: '',
      kilowatt: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (lead) {
        form.reset({
          ...lead,
          kilowatt: lead.kilowatt ?? 0,
          nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : '', // Format for date input
        });
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          status: LEAD_STATUS_OPTIONS[0],
          source: '',
          assignedTo: '',
          lastCommentText: '',
          nextFollowUpDate: '',
          kilowatt: 0,
        });
      }
    }
  }, [lead, form, isOpen]);


  const handleSubmit = (values: LeadFormValues) => {
    const submissionData = {
      ...values,
      kilowatt: values.kilowatt ?? undefined, // Ensure it's number or undefined
      lastCommentDate: values.lastCommentText ? new Date().toISOString().split('T')[0] : undefined, // Set current date if comment exists
    };
    if (lead) {
      onSubmit({ ...lead, ...submissionData, status: values.status as LeadStatusType });
    } else {
      onSubmit({ ...submissionData, status: values.status as LeadStatusType });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? "Update the lead's information." : 'Enter the details for the new lead.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 pb-4 pr-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile No. (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="6263537508" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status" // This is 'Stage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_STATUS_OPTIONS.map(statusValue => (
                          <SelectItem key={statusValue} value={statusValue} className="capitalize">{statusValue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Facebook, Website, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lastCommentText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter last comment..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="nextFollowUpDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Next Follow-up Date (Optional)</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="kilowatt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kilowatt (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales Rep Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {lead ? 'Save Changes' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
