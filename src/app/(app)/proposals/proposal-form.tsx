
'use client';

import type { Proposal, ClientType, ModuleType, DCRStatus, ModuleWattage } from '@/types';
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
import { CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS } from '@/lib/constants';
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
  moduleWattage: z.enum(MODULE_WATTAGE_OPTIONS as [ModuleWattage, ...ModuleWattage[]], { required_error: "Module wattage is required." }),
  dcrStatus: z.enum(DCR_STATUSES as [DCRStatus, ...DCRStatus[]], { required_error: "DCR/Non-DCR status is required."}),
  inverterRating: z.coerce.number().positive({ message: 'Inverter rating (kW) must be a positive number.' }),
  inverterQty: z.coerce.number().int().positive({ message: 'Inverter quantity must be a positive integer.' }),
  ratePerWatt: z.coerce.number().positive({ message: 'Rate per Watt (₹) must be a positive number.' }),
  subsidyAmount: z.coerce.number().min(0, { message: 'Subsidy amount cannot be negative.' }).optional(), // Made optional to handle auto-calc vs manual
  proposalDate: z.date({ required_error: "Proposal date is required." }),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Proposal) => void;
  proposal?: Proposal | null;
  initialData?: { // Used when creating a proposal from a specific client's page
    clientId?: string;
    name?: string; // Client's name
    clientType?: ClientType;
  };
}

// Static initial state for useForm to prevent hydration issues
const initialFormStateForUseForm: ProposalFormValues = {
  proposalNumber: "", // Will be generated client-side
  name: "",
  clientType: CLIENT_TYPES[0],
  contactPerson: "",
  location: "",
  capacity: 0,
  moduleType: MODULE_TYPES[0],
  moduleWattage: MODULE_WATTAGE_OPTIONS[0],
  dcrStatus: DCR_STATUSES[0],
  inverterRating: 0,
  inverterQty: 1,
  ratePerWatt: 0,
  subsidyAmount: 0,
  proposalDate: new Date(), // Will be set to current date client-side for new proposals
};

export function ProposalForm({ isOpen, onClose, onSubmit, proposal, initialData }: ProposalFormProps) {
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: initialFormStateForUseForm,
  });

  // Client-side effects for dynamic defaults and updates
  useEffect(() => {
    if (isOpen) {
      if (proposal) { // Editing existing proposal
        form.reset({
          ...proposal,
          proposalDate: parseISO(proposal.proposalDate),
          subsidyAmount: proposal.subsidyAmount, // ensure subsidyAmount is from proposal
        });
      } else { // Creating new proposal
        const clientSideProposalNumber = `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        let initialContactPerson = '';
        if (initialData?.clientType === 'Individual/Bungalow' && initialData.name) {
            initialContactPerson = initialData.name;
        }

        form.reset({
          ...initialFormStateForUseForm, // Start with static defaults
          proposalNumber: clientSideProposalNumber,
          proposalDate: new Date(),
          name: initialData?.name || '',
          clientType: initialData?.clientType || CLIENT_TYPES[0],
          contactPerson: initialContactPerson,
          // subsidyAmount will be calculated by the effect below based on clientType and capacity
        });
      }
    }
  }, [isOpen, proposal, initialData, form]);


  const watchedCapacity = form.watch('capacity');
  const watchedRatePerWatt = form.watch('ratePerWatt');
  const watchedClientType = form.watch('clientType');
  const watchedName = form.watch('name');

  // Effect for contact person default
  useEffect(() => {
    if (isOpen && !proposal) { // Only for new proposals being created
        if (watchedClientType === 'Individual/Bungalow' && watchedName) {
            const currentContact = form.getValues('contactPerson');
            // Only set if contact person is empty or doesn't match name (if name was filled first)
            if (!currentContact || currentContact === '' || currentContact !== watchedName) {
                 form.setValue('contactPerson', watchedName, { shouldValidate: true, shouldDirty: true });
            }
        }
    }
  }, [watchedName, watchedClientType, form, isOpen, proposal]);

  // Effect for inverter rating default
  useEffect(() => {
     if (isOpen && !proposal) { // Only for new proposals
        const currentInverterRating = form.getValues('inverterRating');
        // Set inverter rating if capacity is positive and rating isn't already set or doesn't match
        if(watchedCapacity > 0 && (currentInverterRating === 0 || currentInverterRating !== watchedCapacity)){
             form.setValue('inverterRating', watchedCapacity, { shouldValidate: true, shouldDirty: true });
        }
     } else if (isOpen && proposal && watchedCapacity > 0 && form.getValues('inverterRating') !== watchedCapacity) {
        // For existing proposals, if capacity changes, update inverter rating
        form.setValue('inverterRating', watchedCapacity, { shouldValidate: true, shouldDirty: true });
     }
  }, [watchedCapacity, form, isOpen, proposal]);

  // Effect for DCR status default and subsidy calculation
  useEffect(() => {
    const capacity = parseFloat(watchedCapacity as any) || 0;
    let newSubsidyAmount = 0;

    if (watchedClientType === 'Commercial' || watchedClientType === 'Industrial') {
      if (form.getValues('dcrStatus') !== 'Non-DCR') { // Default DCR to Non-DCR
        form.setValue('dcrStatus', 'Non-DCR', { shouldValidate: true, shouldDirty: true });
      }
      newSubsidyAmount = 0; // Subsidy is 0
    } else if (watchedClientType === 'Housing Society') {
      newSubsidyAmount = 18000 * capacity;
    } else if (watchedClientType === 'Individual/Bungalow') {
      // For Individual/Bungalow, subsidy is manually entered.
      // We don't auto-calculate here, but rely on the FormField value.
      // If we wanted a default here, we could set it, e.g., form.getValues('subsidyAmount') || 0
      // But since it's user-editable, we let the field control it.
      // We can ensure subsidyAmount is not undefined if schema expects a number
      if (form.getValues('subsidyAmount') === undefined) {
        form.setValue('subsidyAmount', 0, { shouldValidate: true, shouldDirty: true });
      }
      // No return here, allow it to fall through to set subsidyAmount.
    }
    
    // Only update subsidy if it has actually changed from what's in the form,
    // unless it's Individual/Bungalow where it's manual.
    if (watchedClientType !== 'Individual/Bungalow') {
        if (form.getValues('subsidyAmount') !== newSubsidyAmount) {
            form.setValue('subsidyAmount', newSubsidyAmount, { shouldValidate: true, shouldDirty: true });
        }
    }

  }, [watchedClientType, watchedCapacity, form]);


  const calculatedValues = useMemo(() => {
    const capacity = parseFloat(watchedCapacity as any) || 0;
    const ratePerWatt = parseFloat(watchedRatePerWatt as any) || 0;

    const baseAmount = ratePerWatt * capacity * 1000;
    const cgstAmount = baseAmount * 0.069;
    const sgstAmount = baseAmount * 0.069;
    const subtotalAmount = baseAmount + cgstAmount + sgstAmount; // This is the final amount before subsidy
    const finalAmount = subtotalAmount; // finalAmount in the Proposal object stores this pre-subsidy value.

    return { baseAmount, cgstAmount, sgstAmount, subtotalAmount, finalAmount };
  }, [watchedCapacity, watchedRatePerWatt]);


  const isSubsidyEditable = watchedClientType === 'Individual/Bungalow';
  const isDcrDisabled = watchedClientType === 'Commercial' || watchedClientType === 'Industrial';


  const handleFormSubmit = (values: ProposalFormValues) => {
    // Recalculate financials on submit to ensure fresh values
    const capacity = parseFloat(values.capacity as any) || 0;
    const ratePerWatt = parseFloat(values.ratePerWatt as any) || 0;
    const clientType = values.clientType;

    const baseAmount = ratePerWatt * capacity * 1000;
    const cgstAmount = baseAmount * 0.069;
    const sgstAmount = baseAmount * 0.069;
    const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
    const finalAmount = subtotalAmount; // Final amount is pre-subsidy

    let currentSubsidyAmount = parseFloat(values.subsidyAmount as any);
    if (isNaN(currentSubsidyAmount)) { // Ensure subsidyAmount is a number
        currentSubsidyAmount = 0;
    }

    if (clientType === 'Housing Society') {
        currentSubsidyAmount = 18000 * capacity;
    } else if (clientType === 'Commercial' || clientType === 'Industrial') {
        currentSubsidyAmount = 0;
    }
    // For 'Individual/Bungalow', currentSubsidyAmount is taken from the form directly.

    const submissionData: Proposal = {
      id: proposal?.id || `prop${Date.now()}`, // Generate new ID if not editing
      clientId: proposal?.clientId || initialData?.clientId || `client${Date.now()}`, // Use existing or generate new client ID
      ...values, // Spread validated form values
      baseAmount,
      cgstAmount,
      sgstAmount,
      subtotalAmount,
      finalAmount, // This is pre-subsidy
      subsidyAmount: currentSubsidyAmount, // Use the determined subsidy amount
      proposalDate: values.proposalDate.toISOString(), // Convert date to ISO string
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
              <Controller
                control={form.control}
                name="proposalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Proposal Date</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">Client Details</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client/Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} disabled={!!initialData?.name && !!proposal && !!proposal.clientId /* Allow edit if not new & tied to specific client */} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData?.clientType && !!proposal && !!proposal.clientId}>
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
                name="moduleWattage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Wattage (W)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Wattage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULE_WATTAGE_OPTIONS.map(wattage => (
                          <SelectItem key={wattage} value={wattage}>{wattage} W</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="dcrStatus"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>DCR/Non-DCR</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isDcrDisabled}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select DCR status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {DCR_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        {isDcrDisabled && <p className="text-xs text-muted-foreground">Auto-set to Non-DCR for Commercial/Industrial.</p>}
                        <FormMessage />
                    </FormItem>
                    )}
                />
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

            <div className="space-y-1 p-3 border rounded-md bg-primary/10 mt-4">
                <div className="flex justify-between items-center">
                    <FormLabel className="text-lg font-semibold text-primary">Final Proposal Amount (Pre-Subsidy)</FormLabel>
                    <span className="font-bold text-xl text-primary flex items-center"><IndianRupee className="h-5 w-5 mr-0.5"/>{calculatedValues.finalAmount.toFixed(2)}</span>
                </div>
            </div>

            <FormField
              control={form.control}
              name="subsidyAmount"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Subsidy Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                        type="number"
                        placeholder="Enter subsidy if applicable"
                        {...field}
                        value={field.value ?? 0} // Ensure value is not undefined
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        readOnly={!isSubsidyEditable}
                        className={cn(!isSubsidyEditable ? 'bg-muted cursor-not-allowed' : '', field.value === 0 && !isSubsidyEditable ? 'text-muted-foreground' : '')}
                    />
                  </FormControl>
                  {!isSubsidyEditable && <p className="text-xs text-muted-foreground">Auto-calculated for Housing Society. Zero for Commercial/Industrial.</p>}
                  {isSubsidyEditable && <p className="text-xs text-muted-foreground">Manual input for Individual/Bungalow client type.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

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
