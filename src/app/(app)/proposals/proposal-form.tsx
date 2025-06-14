
'use client';

import type { Proposal, ClientType, ModuleType, DCRStatus } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { PROPOSAL_STATUSES, CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES } from '@/lib/constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const proposalSchema = z.object({
  proposalNumber: z.string().min(3, { message: 'Proposal number must be at least 3 characters.' }),
  name: z.string().min(2, { message: 'Client/Company name must be at least 2 characters.' }),
  clientType: z.enum(CLIENT_TYPES as [ClientType, ...ClientType[]], { required_error: "Client type is required."}),
  contactPerson: z.string().min(2, { message: 'Contact person must be at least 2 characters.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  capacity: z.coerce.number().positive({ message: 'Capacity (kW) must be a positive number.' }),
  moduleType: z.enum(MODULE_TYPES as [ModuleType, ...ModuleType[]], { required_error: "Module type is required."}),
  dcrStatus: z.enum(DCR_STATUSES as [DCRStatus, ...DCRStatus[]], { required_error: "DCR/Non-DCR status is required."}),
  inverterRating: z.coerce.number().positive({ message: 'Inverter rating (kW) must be a positive number.' }),
  inverterQty: z.coerce.number().int().positive({ message: 'Inverter quantity must be a positive integer.' }),
  ratePerWatt: z.coerce.number().positive({ message: 'Rate per Watt (₹) must be a positive number.' }),
  subsidyAmount: z.coerce.number().min(0, { message: 'Subsidy amount cannot be negative.' }),
  status: z.enum(PROPOSAL_STATUSES as [Proposal['status'], ...Proposal['status'][]]),
  validUntil: z.date({ required_error: "Valid until date is required." }),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Proposal) => void;
  proposal?: Proposal | null;
  initialData?: {
    clientId?: string;
    name?: string;
    clientType?: ClientType;
  };
}

// Truly static defaults for useForm initialization
const initialFormStateForUseForm: ProposalFormValues = {
  proposalNumber: "", // Will be set dynamically in useEffect for new proposals
  name: "",
  clientType: CLIENT_TYPES[0],
  contactPerson: "",
  location: "",
  capacity: 0,
  moduleType: MODULE_TYPES[0],
  dcrStatus: DCR_STATUSES[0],
  inverterRating: 0,
  inverterQty: 1,
  ratePerWatt: 0,
  subsidyAmount: 0,
  status: 'Draft',
  validUntil: new Date(), // Placeholder, will be set dynamically in useEffect for new proposals
};

export function ProposalForm({ isOpen, onClose, onSubmit, proposal, initialData }: ProposalFormProps) {
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: initialFormStateForUseForm, // Use static defaults here
  });

  // Effect to initialize or reset the form with dynamic/prop-based values
  useEffect(() => {
    if (isOpen) {
      if (proposal) { // Editing existing proposal
        form.reset({
          ...proposal,
          validUntil: parseISO(proposal.validUntil), // Ensure validUntil is a Date object
        });
      } else { // Creating a new proposal
        const clientSideProposalNumber = `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const clientSideValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        let initialContactPerson = '';
        if (initialData?.clientType === 'Individual/Bungalow' && initialData.name) {
            initialContactPerson = initialData.name;
        }

        form.reset({
          ...initialFormStateForUseForm, // Spread static defaults first
          proposalNumber: clientSideProposalNumber,
          name: initialData?.name || '',
          clientType: initialData?.clientType || CLIENT_TYPES[0],
          contactPerson: initialContactPerson,
          // location, capacity, etc., will take from initialFormStateForUseForm by default
          // Specific initial values for new form if needed:
          location: '',
          capacity: 0,
          moduleType: MODULE_TYPES[0],
          dcrStatus: DCR_STATUSES[0],
          inverterRating: 0,
          inverterQty: 1,
          ratePerWatt: 0,
          subsidyAmount: 0, // Will be updated by calculation effect
          status: 'Draft',
          validUntil: clientSideValidUntil,
        });
      }
    }
  }, [isOpen, proposal, initialData, form]); // form is a stable dependency


  const watchedCapacity = form.watch('capacity');
  const watchedRatePerWatt = form.watch('ratePerWatt');
  const watchedClientType = form.watch('clientType');
  const watchedName = form.watch('name');

  // Auto-fill contact person if client type is Individual/Bungalow and name changes
  useEffect(() => {
    if (isOpen && !proposal) { // Only for new proposals being created
        if (watchedClientType === 'Individual/Bungalow' && watchedName) {
            const currentContact = form.getValues('contactPerson');
            if (!currentContact || currentContact === '' || currentContact !== watchedName) {
                 form.setValue('contactPerson', watchedName, { shouldValidate: true, shouldDirty: true });
            }
        }
    }
  }, [watchedName, watchedClientType, form, isOpen, proposal]);

  // Auto-fill inverter rating based on capacity
  useEffect(() => {
     if (isOpen && !proposal) { // Only for new proposals or if capacity changes significantly
        const currentInverterRating = form.getValues('inverterRating');
        if(watchedCapacity > 0 && (currentInverterRating === 0 || currentInverterRating !== watchedCapacity)){
             form.setValue('inverterRating', watchedCapacity, { shouldValidate: true, shouldDirty: true });
        }
     }
  }, [watchedCapacity, form, isOpen, proposal]);

  const calculatedValues = useMemo(() => {
    const capacity = parseFloat(form.getValues('capacity') as any) || 0;
    const ratePerWatt = parseFloat(form.getValues('ratePerWatt') as any) || 0;
    const clientType = form.getValues('clientType');
    const manualSubsidyInput = parseFloat(form.getValues('subsidyAmount') as any) || 0;

    const baseAmount = ratePerWatt * capacity * 1000;
    const cgstAmount = baseAmount * 0.069;
    const sgstAmount = baseAmount * 0.069;
    const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
    
    let currentSubsidyAmount = 0;
    if (clientType === 'Housing Society') {
      currentSubsidyAmount = 18000 * capacity;
    } else if (clientType === 'Individual/Bungalow') {
      currentSubsidyAmount = manualSubsidyInput; 
    }
    // For Commercial / Industrial, subsidy is 0

    // Update subsidy field in form if it's auto-calculated and different
    if (clientType !== 'Individual/Bungalow' && form.getValues('subsidyAmount') !== currentSubsidyAmount) {
        // Defer setValue to avoid issues during render, though useMemo should be safe
        // queueMicrotask(() => form.setValue('subsidyAmount', currentSubsidyAmount, { shouldValidate: false, shouldDirty: true }));
        // For useMemo, it's better not to cause side effects. The subsidy field will be set by its own effect if needed.
    }
    
    const finalAmount = subtotalAmount - currentSubsidyAmount;

    return { baseAmount, cgstAmount, sgstAmount, subtotalAmount, subsidyCalculated: currentSubsidyAmount, finalAmount };
  }, [form]); // form.getValues makes this dependent on the whole form state. Specific watches are better.
  // Re-evaluate calculatedValues dependencies for better performance
  // Using form.watch() for specific fields is more efficient for useMemo deps

  const isSubsidyEditable = watchedClientType === 'Individual/Bungalow';

  // Effect for subsidy calculation
  useEffect(() => {
    const capacity = parseFloat(form.getValues('capacity') as any) || 0;
    const clientType = form.getValues('clientType');
    let newSubsidyAmount = 0;

    if (clientType === 'Housing Society') {
      newSubsidyAmount = 18000 * capacity;
      if (form.getValues('subsidyAmount') !== newSubsidyAmount) {
        form.setValue('subsidyAmount', newSubsidyAmount, { shouldValidate: true, shouldDirty: true });
      }
    } else if (clientType === 'Commercial' || clientType === 'Industrial') {
      if (form.getValues('subsidyAmount') !== 0) {
        form.setValue('subsidyAmount', 0, { shouldValidate: true, shouldDirty: true });
      }
    }
    // For 'Individual/Bungalow', subsidyAmount is user-editable, so no setValue here.
  }, [watchedClientType, watchedCapacity, form]);


  const handleFormSubmit = (values: ProposalFormValues) => {
    // Re-calculate final financial values just before submission to ensure accuracy
    const capacity = parseFloat(values.capacity as any) || 0;
    const ratePerWatt = parseFloat(values.ratePerWatt as any) || 0;
    const clientType = values.clientType;
    const userSubsidy = parseFloat(values.subsidyAmount as any) || 0;

    const baseAmount = ratePerWatt * capacity * 1000;
    const cgstAmount = baseAmount * 0.069;
    const sgstAmount = baseAmount * 0.069;
    const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
    
    let finalSubsidyAmount = 0;
    if (clientType === 'Housing Society') {
      finalSubsidyAmount = 18000 * capacity;
    } else if (clientType === 'Individual/Bungalow') {
      finalSubsidyAmount = userSubsidy;
    } else { // Commercial or Industrial
      finalSubsidyAmount = 0;
    }
    const finalAmount = subtotalAmount - finalSubsidyAmount;

    const submissionData: Proposal = {
      id: proposal?.id || `prop${Date.now()}`,
      clientId: proposal?.clientId || initialData?.clientId || `client${Date.now()}`,
      ...values, // Contains all form input values
      baseAmount,
      cgstAmount,
      sgstAmount,
      subtotalAmount,
      subsidyAmount: finalSubsidyAmount, // Ensure the correct calculated subsidy is stored
      finalAmount,
      validUntil: values.validUntil.toISOString(),
      createdAt: proposal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSubmit(submissionData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proposal ? 'Edit Proposal' : 'Create New Proposal'}</DialogTitle>
          <DialogDescription>
            {proposal ? "Update the proposal's information." : 'Enter the details for the new proposal.'}
            {initialData?.name && !proposal && <span className="block mt-1 text-sm">For: {initialData.name}</span>}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 pb-4 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client/Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} disabled={!!initialData?.name && !!proposal} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData?.clientType && !!proposal}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select client type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLIENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Site Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full site address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">System Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="moduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select module type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dcrStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DCR/Non-DCR</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select DCR status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DCR_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inverterRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter Rating (kW)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inverterQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inverter Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">Financials</h3>

            <FormField
              control={form.control}
              name="ratePerWatt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Watt (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 40" {...field} step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                <div className="flex justify-between items-center">
                    <FormLabel>Base Amount</FormLabel>
                    <span className="font-semibold flex items-center"><IndianRupee className="h-4 w-4 mr-0.5"/>{calculatedValues.baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <FormLabel>CGST (6.9%)</FormLabel>
                    <span className="text-sm flex items-center"><IndianRupee className="h-3 w-3 mr-0.5"/>{calculatedValues.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <FormLabel>SGST (6.9%)</FormLabel>
                    <span className="text-sm flex items-center"><IndianRupee className="h-3 w-3 mr-0.5"/>{calculatedValues.sgstAmount.toFixed(2)}</span>
                </div>
                 <Separator/>
                <div className="flex justify-between items-center">
                    <FormLabel className="font-medium">Subtotal</FormLabel>
                    <span className="font-bold text-md flex items-center"><IndianRupee className="h-4 w-4 mr-0.5"/>{calculatedValues.subtotalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <FormField
              control={form.control}
              name="subsidyAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subsidy Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="Enter subsidy if applicable" 
                        {...field} 
                        readOnly={!isSubsidyEditable} 
                        className={!isSubsidyEditable ? 'bg-muted' : ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {!isSubsidyEditable && <p className="text-xs text-muted-foreground">Auto-calculated for Housing Society. Zero for Commercial/Industrial.</p>}
                  {isSubsidyEditable && <p className="text-xs text-muted-foreground">Manual input for Individual/Bungalow client type.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1 p-3 border rounded-md bg-primary/10">
                <div className="flex justify-between items-center">
                    <FormLabel className="text-lg font-semibold text-primary">Final Proposal Amount</FormLabel>
                    <span className="font-bold text-xl text-primary flex items-center"><IndianRupee className="h-5 w-5 mr-0.5"/>{calculatedValues.finalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <Separator className="my-6" />
             <h3 className="text-lg font-medium text-foreground">Proposal Status & Validity</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <Controller
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
                            date < new Date(new Date().setHours(0,0,0,0)) 
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-6">
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

