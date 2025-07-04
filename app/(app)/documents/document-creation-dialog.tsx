
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, IndianRupee } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  templateId: string;
  onSuccess: (urls: { pdfUrl: string, docxUrl: string }) => void;
}

// Define schemas for different document types
const purchaseOrderSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientAddress: z.string().min(1, 'Client address is required'),
  poDate: z.string().min(1, 'PO Date is required'),
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
  inverterRating: z.string().min(1, "Inverter rating is required").optional().or(z.literal(undefined)),
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

const netMeteringAgreementSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  consumerNumber: z.string().min(1, "Consumer number is required"),
  agreementDate: z.string().min(1, "Agreement date is required"),
  capacity: z.coerce.number().positive("Capacity (kW) must be a positive number"),
  discomSection: z.string().min(1, "DISCOM Section is required"),
  discomSubdivision: z.string().min(1, "DISCOM Subdivision is required"),
});

const annexureISchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  capacity: z.coerce.number().positive("Capacity (kW) must be a positive number"),
  sanctionedCapacity: z.string().min(1, "Sanctioned capacity is required"),
  capacityType: z.enum(['Single Phase', 'Three Phase'], { required_error: "Capacity type is required" }),
  dateOfInstallation: z.string().min(1, "Date of installation is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  consumerNumber: z.string().min(1, "Consumer number is required"),
  email: z.string().email("Invalid email address"),
  inverterDetails: z.string().min(1, "Inverter details are required"),
  inverterRating: z.string().min(1, "Inverter rating is required"),
  moduleWattage: z.enum(["540", "545", "550", "585", "590"], { required_error: "Module wattage is required" }),
  numberOfModules: z.coerce.number().int().positive("Number of modules must be a positive integer"),
  projectModel: z.enum(['CAPEX', 'OPEX'], { required_error: "Project model is required" }),
  district: z.string().min(1, "District is required"),
});

const genericSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().min(5, "Details must be at least 5 characters"),
});

const maharashtraDistricts = [
  "Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur",
  "Kolhapur", "Satara", "Sangli", "Ahmednagar", "Amravati", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon",
  "Jalna", "Latur", "Nanded", "Nandurbar", "Osmanabad", "Palghar", "Parbhani",
  "Raigad", "Ratnagiri", "Sindhudurg", "Wardha", "Washim", "Yavatmal"
];

const moduleMakeOptions = ["Premier Energies", "Rayzon Solar", "ReNew Energies"];
const moduleWattageOptions = ["540", "545", "550", "585", "590"];
const inverterMakeOptions = ["Growatt", "Sungrow"];
const inverterRatingOptions = [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100].map(r => ({ label: `${r} kW`, value: `${r}kW` }));
const projectModelOptions = ["CAPEX", "OPEX"];

export function DocumentCreationDialog({ isOpen, onClose, documentType, templateId, onSuccess }: DocumentCreationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const currentSchema = useMemo(() => {
    switch (documentType) {
      case 'Purchase Order': return purchaseOrderSchema;
      case 'Warranty Certificate': return warrantyCertificateSchema;
      case 'Work Completion Report': return workCompletionReportSchema;
      case 'Annexure I': return annexureISchema;
      case 'Net Metering Agreement': return netMeteringAgreementSchema;
      case 'DCR Declaration': return genericSchema;
      default: return genericSchema;
    }
  }, [documentType]);

  const defaultValues = useMemo(() => {
    const commonFields = {
        clientName: '',
        clientAddress: '',
        capacity: 0,
    };
    switch (documentType) {
      case 'Purchase Order': return {
        ...commonFields,
        poDate: '',
        ratePerWatt: 0,
      };
      case 'Warranty Certificate': return {
        ...commonFields,
        moduleMake: undefined,
        moduleWattage: undefined,
        inverterMake: undefined,
        inverterRating: undefined,
        dateOfCommissioning: '',
      };
      case 'Work Completion Report': return {
        ...commonFields,
        consumerNumber: '',
        sanctionNumber: '',
        sanctionDate: '',
        workCompletionDate: '',
      };
      case 'Net Metering Agreement': return {
        ...commonFields,
        consumerNumber: '',
        agreementDate: '',
        discomSection: '',
        discomSubdivision: '',
      };
      case 'Annexure I': return {
        ...commonFields,
        sanctionedCapacity: '',
        dateOfInstallation: '',
        capacityType: undefined,
        phoneNumber: '',
        consumerNumber: '',
        email: '',
        inverterDetails: '',
        inverterRating: '',
        moduleWattage: undefined,
        numberOfModules: 0,
        projectModel: undefined,
        district: undefined,
      };
      case 'DCR Declaration':
      default: return { title: `New ${documentType}`, details: ''};
    }
  }, [documentType]);

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema as any), // Use `as any` to bypass strict union type check at compile time
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
  }, [isOpen, form, defaultValues, documentType]);

  const onSubmit = async (values: any) => {
    startTransition(async () => {
      try {
        let dataToSubmit = values;
        if (documentType === 'Purchase Order') {
            dataToSubmit = { ...values, totalAmount: calculatedTotal, gstAmount: calculatedGST, grandTotalAmount: calculatedGrandTotal };
        }
        
        const response = await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId, formData: dataToSubmit, documentType }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate document.');
        }

        toast({
            title: 'Document Generation Successful',
            description: `${documentType} for ${values.clientName || values.title} has been generated.`,
        });
        onSuccess({ pdfUrl: result.pdfUrl, docxUrl: result.docxUrl });
        onClose();
        
      } catch (error) {
        console.error('Failed to submit document creation:', error);
        toast({
          title: 'Error',
          description: (error as Error).message || 'An unexpected error occurred.',
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
                <div className="flex items-center rounded-md border border-input bg-muted px-3 py-2">
                    <IndianRupee className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">{calculatedTotal.toFixed(2)}</span>
                </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
                <div className="flex justify-between">
                    <FormLabel>GST (13.8%)</FormLabel>
                    <span className="font-medium flex items-center"><IndianRupee className="h-4 w-4 mr-0.5 text-muted-foreground"/>{calculatedGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <FormLabel>Grand Total</FormLabel>
                    <span className="font-semibold text-lg flex items-center"><IndianRupee className="h-5 w-5 mr-0.5"/>{calculatedGrandTotal.toFixed(2)}</span>
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
      case 'Net Metering Agreement':
        return (
          <>
            <FormField control={form.control} name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl><Input placeholder="Client Full Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Address</FormLabel>
                  <FormControl><Textarea placeholder="Full Client Address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="consumerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 1234567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="agreementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (kW)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 5" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="discomSection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DISCOM Section</FormLabel>
                  <FormControl><Input placeholder="e.g., ABC Section" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="discomSubdivision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DISCOM Subdivision</FormLabel>
                  <FormControl><Input placeholder="e.g., XYZ Subdivision" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'Annexure I':
        return (
          <>
            <FormField control={form.control} name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl><Input placeholder="Client Full Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Address</FormLabel>
                  <FormControl><Textarea placeholder="Full Client Address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="capacity" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Capacity (kW)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="sanctionedCapacity" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sanctioned Capacity</FormLabel>
                        <FormControl><Input placeholder="e.g., 10kW" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="capacityType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Capacity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Single Phase">Single Phase</SelectItem>
                                <SelectItem value="Three Phase">Three Phase</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="e.g., 9876543210" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="dateOfInstallation" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date of Installation</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="consumerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 1234567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="inverterDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inverter Details (Make/Model)</FormLabel>
                  <FormControl><Input placeholder="e.g., Growatt 5kW" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="inverterRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inverter Rating</FormLabel>
                  <FormControl><Input placeholder="e.g., 5kW / 10kVA" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
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
              <FormField control={form.control} name="numberOfModules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Modules</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 20" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="projectModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select Project Model" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectModelOptions.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District (Maharashtra)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maharashtraDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'DCR Declaration':
      case 'Other':
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New {documentType}</DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a new {documentType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4 max-h-[70vh] overflow-y-auto pr-2">
            {renderFormFields()}
            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
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
