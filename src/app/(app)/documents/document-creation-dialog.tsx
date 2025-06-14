
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';

interface DocumentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
}

// Define schemas for different document types
const purchaseOrderSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientAddress: z.string().min(1, 'Client address is required'),
  poDate: z.string().min(1, 'PO Date is required'), // Using string for date input, can be refined with a date picker
  capacity: z.coerce.number().positive('Capacity must be a positive number'),
  ratePerWatt: z.coerce.number().positive('Rate per Watt must be a positive number'),
  total: z.coerce.number().positive('Total amount must be a positive number'),
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

  const memoizedSchema = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return purchaseOrderSchema;
      case 'Contract': return contractSchema;
      // Add cases for other document types
      default: return genericSchema; // Fallback for other types
    }
  }, [documentType]);

  const memoizedDefaultValues = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return { 
        clientName: '', 
        clientAddress: '',
        poDate: '',
        capacity: 0,
        ratePerWatt: 0,
        total: 0, 
        relatedLeadId: '' 
      };
      case 'Contract': return { clientName: '', effectiveDate: '', contractTerms: '', relatedLeadId: '' };
      default: return { title: '', details: '', relatedLeadId: ''};
    }
  }, [documentType]);

  const form = useForm({
    resolver: zodResolver(memoizedSchema),
    defaultValues: memoizedDefaultValues,
  });
  
  const poTotal = form.watch('total');
  const gstRate = 0.138; // 13.8%

  const calculatedGST = useMemo(() => {
    const totalVal = parseFloat(poTotal as any);
    return isNaN(totalVal) || totalVal <= 0 ? 0 : totalVal * gstRate;
  }, [poTotal]);

  const calculatedGrandTotal = useMemo(() => {
    const totalVal = parseFloat(poTotal as any);
    return isNaN(totalVal) || totalVal <= 0 ? 0 : totalVal + calculatedGST;
  }, [poTotal, calculatedGST]);


  // Reset form when dialog opens with a new document type or new instance
  useEffect(() => {
    if (isOpen) {
      form.reset(memoizedDefaultValues);
    }
  }, [isOpen, form, memoizedDefaultValues]);

  const onSubmit = async (values: any) => { // Using 'any' here as values type depends on schema
    startTransition(async () => {
      try {
        // For Purchase Order, ensure the payload includes the necessary fields
        // The actual 'values' object will already conform to the schema
        const result = await createDocumentInDrive(documentType, values);

        if (result.success) {
          toast({
            title: 'Document Generation Started',
            description: `${documentType} for ${values.clientName || values.title} is being generated.`,
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
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Business Rd, Suite 400, City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Capacity (kW)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="ratePerWatt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rate/Watt ($)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0.50" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000.00" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />

            <div className="space-y-2">
                <div className="flex justify-between">
                    <FormLabel>GST (13.8%)</FormLabel>
                    <span className="font-medium">${calculatedGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <FormLabel>Grand Total</FormLabel>
                    <span className="font-semibold text-lg">${calculatedGrandTotal.toFixed(2)}</span>
                </div>
            </div>
            
            <Separator className="my-4" />

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

