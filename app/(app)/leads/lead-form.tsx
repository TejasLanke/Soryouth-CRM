
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect } from 'react';
import { LEAD_STATUS_OPTIONS } from '@/lib/constants';

// Use the imported LEAD_STATUS_OPTIONS for the enum
const leadSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  status: z.enum(LEAD_STATUS_OPTIONS), // Validate against the customizable list
  source: z.string().optional(),
  assignedTo: z.string().optional(),
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
    defaultValues: lead || {
      name: '',
      email: '',
      phone: '',
      status: LEAD_STATUS_OPTIONS[0], // Default to the first status in the customizable list
      source: '',
      assignedTo: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (lead) {
        form.reset(lead);
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          status: LEAD_STATUS_OPTIONS[0], // Default to the first status
          source: '',
          assignedTo: '',
        });
      }
    }
  }, [lead, form, isOpen]);


  const handleSubmit = (values: LeadFormValues) => {
    if (lead) {
      // Ensure status type matches LeadStatusType for the onSubmit prop if it expects strict typing
      onSubmit({ ...lead, ...values, status: values.status as LeadStatusType });
    } else {
      onSubmit({ ...values, status: values.status as LeadStatusType });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? "Update the lead's information." : 'Enter the details for the new lead.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 pb-4">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="555-123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEAD_STATUS_OPTIONS.map(statusValue => (
                        <SelectItem key={statusValue} value={statusValue}>{statusValue}</SelectItem>
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
                    <Input placeholder="Website, Referral, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter>
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
