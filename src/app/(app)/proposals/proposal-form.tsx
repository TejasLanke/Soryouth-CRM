
'use client';

import type { Proposal } from '@/types';
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
import { PROPOSAL_STATUSES } from '@/lib/constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const proposalSchema = z.object({
  leadName: z.string().min(2, { message: 'Lead name must be at least 2 characters.' }),
  proposalNumber: z.string().min(3, { message: 'Proposal number must be at least 3 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  status: z.enum(PROPOSAL_STATUSES),
  validUntil: z.date({ required_error: "Valid until date is required." }),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalFormValues | Omit<Proposal, 'id' | 'createdAt' | 'leadId'> | Proposal) => void;
  proposal?: Proposal | null; // For editing
  initialData?: { // For pre-filling new proposals, especially leadName and leadId
    leadId?: string;
    leadName?: string;
  };
}

export function ProposalForm({ isOpen, onClose, onSubmit, proposal, initialData }: ProposalFormProps) {
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    // Default values logic:
    // 1. If 'proposal' (for editing) is provided, use its values.
    // 2. If 'initialData' (for new, pre-filled) is provided, use its leadName.
    // 3. Otherwise, use generic defaults for a completely new proposal.
    defaultValues: proposal 
      ? { ...proposal, validUntil: new Date(proposal.validUntil) } 
      : {
          leadName: initialData?.leadName || '',
          proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
          amount: 0,
          status: 'Draft',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
        },
  });

  useEffect(() => {
    if (isOpen) {
      if (proposal) { // Editing existing proposal
        form.reset({
          ...proposal,
          validUntil: new Date(proposal.validUntil),
        });
      } else { // Creating new proposal
        form.reset({
          leadName: initialData?.leadName || '',
          proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
          amount: 0,
          status: 'Draft',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }, [proposal, initialData, form, isOpen]);


  const handleSubmit = (values: ProposalFormValues) => {
    // values contains: leadName, proposalNumber, amount, status, validUntil (as Date)
    const submissionData = {
      ...values,
      validUntil: values.validUntil.toISOString(), // Convert Date to string for submission
    };

    if (proposal) { // Editing existing proposal
      // The parent's onSubmit expects a full Proposal object for editing
      onSubmit({ ...proposal, ...submissionData });
    } else { // Creating a new proposal
      // The parent's onSubmit expects Omit<Proposal, 'id' | 'createdAt' | 'leadId'>
      // The `initialData.leadId` (if present) will be handled by the parent page's submit handler.
      // This component just passes up the form data.
      const { leadName, proposalNumber, amount, status, validUntil } = submissionData;
      onSubmit({ leadName, proposalNumber, amount, status, validUntil });
    }
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{proposal ? 'Edit Proposal' : 'Create New Proposal'}</DialogTitle>
          <DialogDescription>
            {proposal ? "Update the proposal's information." : 'Enter the details for the new proposal.'}
            {initialData?.leadName && !proposal && <span className="block mt-1 text-sm">For: {initialData.leadName}</span>}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 pb-4">
            <FormField
              control={form.control}
              name="leadName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter lead name" {...field} disabled={!!initialData?.leadName && !proposal} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proposalNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., P-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
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
                        <SelectValue placeholder="Select proposal status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPOSAL_STATUSES.map(statusValue => (
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
              name="validUntil"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Valid Until</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {proposal ? 'Save Changes' : 'Create Proposal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
