
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
  poDate: z.string().min(1, 'PO Date is required'),
  capacity: z.coerce.number().positive('Capacity (kW) must be a positive number'),
  ratePerWatt: z.coerce.number().positive('Rate per Watt (₹) must be a positive number'),
  // total: z.coerce.number().positive('Total amount (₹) must be a positive number'), // This will be calculated
});

const contractSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  contractTerms: z.string().min(10, "Contract terms must be at least 10 characters"),
});

const warrantyCertificateSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  capacity: z.coerce.number().positive("Capacity (kW) must be a positive number"),
  moduleMake: z.enum(["Premier Energies", "Rayzon Solar", "ReNew Energies"], { required_error: "Module make is required" }),
  moduleWattage: z.enum(["540", "545", "550", "585", "590"], { required_error: "Module wattage is required" }),
  inverterMake: z.enum(["Growatt", "Sungrow"], { required_error: "Inverter make is required" }),
  inverterRating: z.string().min(1, "Inverter rating is required"), // Will be selected from predefined values e.g., "3kW", "5kW"
  dateOfCommissioning: z.string().min(1, "Date of commissioning is required"),
});


const genericSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().min(5, "Details must be at least 5 characters"),
});


type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
type ContractFormValues = z.infer<typeof contractSchema>;
type WarrantyCertificateFormValues = z.infer<typeof warrantyCertificateSchema>;
type GenericFormValues = z.infer<typeof genericSchema>;


export function DocumentCreationDialog({ isOpen, onClose, documentType }: DocumentCreationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const currentSchema = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return purchaseOrderSchema;
      case 'Contract': return contractSchema;
      case 'Warranty Certificate': return warrantyCertificateSchema;
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
      case 'Contract': return { clientName: '', effectiveDate: '', contractTerms: '' };
      case 'Warranty Certificate': return {
        clientName: '',
        clientAddress: '',
        capacity: 0,
        moduleMake: undefined, // For select placeholder
        moduleWattage: undefined, // For select placeholder
        inverterMake: undefined, // For select placeholder
        inverterRating: undefined, // For select placeholder
        dateOfCommissioning: '',
      };
      default: return { title: '', details: ''};
    }
  }, [documentType]);

  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: defaultValues as any, // Use 'as any' due to dynamic schema/defaults
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
    return cap * rate * 1000; // Capacity (kW) * Rate/Watt * 1000
  }, [capacityValue, ratePerWattValue, documentType]);
  
  const gstRate = 0.138; // 13.8%

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
  }, [isOpen, form, defaultValues]);

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

