
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
}

// Define schemas for different document types
const purchaseOrderSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientAddress: z.string().min(1, 'Client address is required'),
  poDate: z.string().min(1, 'PO Date is required'), // Assuming date as string for simple input type="date"
  capacity: z.coerce.number().positive('Capacity (kW) must be a positive number'),
  ratePerWatt: z.coerce.number().positive('Rate per Watt (₹) must be a positive number'),
});

const warrantyCertificateSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  capacity: z.coerce.number().positive("Capacity (kW) must be a positive number"),
  moduleMake: z.enum(["Premier Energies", "Rayzon Solar", "ReNew Energies"], { required_error: "Module make is required" }),
  moduleWattage: z.enum(["540", "545", "550", "585", "590"], { required_error: "Module wattage is required" }),
  inverterMake: z.enum(["Growatt", "Sungrow"], { required_error: "Inverter make is required" }),
  inverterRating: z.string().min(1, "Inverter rating is required"),
  dateOfCommissioning: z.string().min(1, "Date of commissioning is required"),
});

const workCompletionReportSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  consumerNumber: z.string().min(1, "Consumer number is required"),
  sanctionNumber: z.string().min(1, "Sanction number is required"),
  sanctionDate: z.string().min(1, "Sanction date is required"),
  workCompletionDate: z.string().min(1, "Work completion date is required"),
});

const genericSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().min(5, "Details must be at least 5 characters"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
type WarrantyCertificateFormValues = z.infer<typeof warrantyCertificateSchema>;
type WorkCompletionReportFormValues = z.infer<typeof workCompletionReportSchema>;
type GenericFormValues = z.infer<typeof genericSchema>;

export function DocumentCreationDialog({ isOpen, onClose, documentType }: DocumentCreationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const currentSchema = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return purchaseOrderSchema;
      case 'Warranty Certificate': return warrantyCertificateSchema;
      case 'Work Completion Report': return workCompletionReportSchema;
      case 'Annexure I': return genericSchema; // Using generic for now
      case 'Net Metering Agreement': return genericSchema; // Using generic for now
      default: return genericSchema;
    }
  }, [documentType]);

  const defaultValues = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return {
        clientName: '',
        clientAddress: '',
        poDate: '',
        capacity: 0,
        ratePerWatt: 0,
      };
      case 'Warranty Certificate': return {
        clientName: '',
        clientAddress: '',
        capacity: 0,
        moduleMake: undefined,
        moduleWattage: undefined,
        inverterMake: undefined,
        inverterRating: undefined,
        dateOfCommissioning: '',
      };
      case 'Work Completion Report': return {
        clientName: '',
        clientAddress: '',
        consumerNumber: '',
        sanctionNumber: '',
        sanctionDate: '',
        workCompletionDate: '',
      };
      case 'Annexure I': return { title: `Annexure I for `, details: '' };
      case 'Net Metering Agreement': return { title: `Net Metering Agreement for `, details: '' };
      default: return { title: '', details: ''};
    }
  }, [documentType]);

  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: defaultValues as any,
  });
  
  const capacityValue = form.watch('capacity');
  const ratePerWattValue = form.watch('ratePerWatt');

  const calculatedTotal = useMemo(() => {
    if (documentType !== 'Purchase Order') return 0;
    const cap = parseFloat(capacityValue as any);
    const rate = parseFloat(ratePerWattValue as any);
    if (isNaN(cap) || isNaN(rate) || cap <= 0 || rate <= 0) {
        return 0;
    }
    return cap * rate * 1000;
  }, [capacityValue, ratePerWattValue, documentType]);
  
  const gstRate = 0.138;

  const calculatedGST = useMemo(() => {
    if (documentType !== 'Purchase Order') return 0;
    return calculatedTotal * gstRate;
  }, [calculatedTotal, documentType]);

  const calculatedGrandTotal = useMemo(() => {
    if (documentType !== 'Purchase Order') return 0;
    return calculatedTotal + calculatedGST;
  }, [calculatedTotal, calculatedGST, documentType]);

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues as any);
    }
  }, [isOpen, form, defaultValues, documentType]); // Added documentType as a dependency

  const onSubmit = async (values: any) => {
    startTransition(async () => {
      try {
        let dataToSubmit = values;
        if (documentType === 'Purchase Order') {
            dataToSubmit = { ...values, totalAmount: calculatedTotal, gstAmount: calculatedGST, grandTotalAmount: calculatedGrandTotal };
        }
        const result = await createDocumentInDrive(documentType, dataToSubmit);

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

  const moduleMakeOptions = ["Premier Energies", "Rayzon Solar", "ReNew Energies"];
  const moduleWattageOptions = ["540", "545", "550", "585", "590"];
  const inverterMakeOptions = ["Growatt", "Sungrow"];
  const inverterRatingOptions = [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100].map(r => ({ label: `${r} kW`, value: `${r}kW` }));

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
                        <Input type="number" placeholder="10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
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
                    <FormLabel>Rate/Watt (₹)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="40" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="space-y-1">
                <FormLabel>Total Amount (Calculated)</FormLabel>
                <Input readOnly value={`₹${calculatedTotal.toFixed(2)}`} className="bg-muted font-medium" />
            </div>
            
            <Separator className="my-4" />

            <div className="space-y-2">
                <div className="flex justify-between">
                    <FormLabel>GST (13.8%)</FormLabel>
                    <span className="font-medium">₹{calculatedGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <FormLabel>Grand Total</FormLabel>
                    <span className="font-semibold text-lg">₹{calculatedGrandTotal.toFixed(2)}</span>
                </div>
            </div>
            
            <Separator className="my-4" />
          </>
        );
      case 'Warranty Certificate':
        return (
          <>
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client Full Name" {...field} />
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
                    <Textarea placeholder="Full Address for Warranty" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (kW)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="moduleMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Make</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Module Make" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moduleMakeOptions.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moduleWattage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Wattage (W)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Wattage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moduleWattageOptions.map(wattage => (
                          <SelectItem key={wattage} value={wattage}>{wattage} W</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inverterMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter Make</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Inverter Make" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inverterMakeOptions.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inverterRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter Rating</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inverterRatingOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateOfCommissioning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Commissioning</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'Work Completion Report':
        return (
          <>
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
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
                    <Textarea placeholder="Complete Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consumerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CON12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sanctionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sanction Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SAN67890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sanctionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sanction Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workCompletionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Completion Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'Annexure I': // Fallthrough to generic for now
      case 'Net Metering Agreement': // Fallthrough to generic for now
      case 'Proposal Document': // Fallthrough to generic for now
      default:
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
