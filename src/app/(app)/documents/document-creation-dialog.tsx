
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import type { DocumentType } from '@/types';
import { createDocumentInDrive } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DocumentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
}

// Define schemas for different document types
const purchaseOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'), // Or 'Supplier Name' if more appropriate contextually
  amount: z.coerce.number().positive('Amount must be a positive number'),
  itemDescription: z.string().min(1, 'Item description is required'),
  relatedLeadId: z.string().optional(),
});

const contractSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  effectiveDate: z.string().min(1, "Effective date is required"), // Consider using a date picker
  contractTerms: z.string().min(10, "Contract terms must be at least 10 characters"),
  relatedLeadId: z.string().optional(),
});

// Add other schemas as needed, e.g., workCompletionReportSchema

// A generic schema for now, refine later if needed
const genericSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().min(5, "Details must be at least 5 characters"),
  relatedLeadId: z.string().optional(),
});


type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
type ContractFormValues = z.infer<typeof contractSchema>;
type GenericFormValues = z.infer<typeof genericSchema>;


export function DocumentCreationDialog({ isOpen, onClose, documentType }: DocumentCreationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Determine the schema and default values based on documentType
  const currentSchema = (() => {
    switch (documentType) {
      case 'Purchase Order': return purchaseOrderSchema;
      case 'Contract': return contractSchema;
      // Add cases for other document types
      default: return genericSchema; // Fallback for other types
    }
  })();

  const defaultValues = (() => {
    switch (documentType) {
      case 'Purchase Order': return { customerName: '', amount: 0, itemDescription: '', relatedLeadId: '' };
      case 'Contract': return { clientName: '', effectiveDate: '', contractTerms: '', relatedLeadId: '' };
      default: return { title: '', details: '', relatedLeadId: ''};
    }
  })();

  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues,
  });

  // Reset form when dialog opens with a new document type or new instance
  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, documentType, form, defaultValues]);

  const onSubmit = async (values: any) => { // Using 'any' here as values type depends on schema
    startTransition(async () => {
      try {
        const result = await createDocumentInDrive(documentType, values);
        if (result.success) {
          toast({
            title: 'Document Generation Started',
            description: `${documentType} for ${values.customerName || values.clientName || values.title} is being generated.`,
          });
          onClose();
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to start document generation.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to submit document creation:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const renderFormFields = () => {
    switch (documentType) {
      case 'Purchase Order':
        return (
          <>
            <FormField
              control={form.control}
              name="customerName" // Keeping as customerName for consistency with existing structure, can be re-labeled
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer/Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe Project" {...field} />
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item/Service Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="E.g., Supply of 10 Solar Panels (Model X)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relatedLeadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Lead ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead ID (e.g., L123)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'Contract':
        return (
          <>
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith Corp." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contractTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Terms</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the key terms of the contract..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relatedLeadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Lead ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead ID (e.g., L456)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      // Add cases for other document types here
      default: // Fallback for 'Work Completion Report', 'Proposal Document', 'Site Survey Report', 'Warranty Certificate', 'Other'
        return (
           <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter title for ${documentType}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder={`Enter relevant details for the ${documentType.toLowerCase()}...`} className="min-h-[150px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relatedLeadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Lead ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New {documentType}</DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a new {documentType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4 max-h-[70vh] overflow-y-auto pr-2">
            {renderFormFields()}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Generation...
                  </>
                ) : (
                  'Start Generation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
