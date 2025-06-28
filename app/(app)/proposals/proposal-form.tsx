
'use client';

import type { Proposal, Client, Lead, ClientType, ModuleType, DCRStatus, ModuleWattage, LeadStatusType, Template } from '@/types';
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
import React, { useEffect, useMemo, useState } from 'react';
import { CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS, LEAD_STATUS_OPTIONS } from '@/lib/constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee, ChevronsUpDown, Check, X, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { ProposalPreviewDialog } from './proposal-preview-dialog'; // Import the new preview dialog

export const proposalSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  templateId: z.string().optional(),
  proposalNumber: z.string().min(3, { message: 'Proposal number must be at least 3 characters.' }),
  proposalDate: z.string({ required_error: "Proposal date is required." }).refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  name: z.string().min(2, { message: 'Client/Company name must be at least 2 characters.' }),
  clientType: z.enum(CLIENT_TYPES, { required_error: "Client type is required."}),
  contactPerson: z.string().min(2, { message: 'Contact person must be at least 2 characters.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  capacity: z.coerce.number().positive({ message: 'Capacity (kW) must be a positive number.' }),
  moduleType: z.enum(MODULE_TYPES, { required_error: "Module type is required."}),
  moduleWattage: z.enum(MODULE_WATTAGE_OPTIONS, { required_error: "Module wattage is required." }),
  dcrStatus: z.enum(DCR_STATUSES, { required_error: "DCR/Non-DCR status is required."}),
  inverterRating: z.coerce.number().positive({ message: 'Inverter rating (kW) must be a positive number.' }),
  inverterQty: z.coerce.number().int().positive({ message: 'Inverter quantity must be a positive integer.' }),
  ratePerWatt: z.coerce.number().positive({ message: 'Rate per Watt (₹) must be a positive number.' }),
  subsidyAmount: z.coerce.number().min(0, { message: 'Subsidy amount cannot be negative.' }).optional(),
  
  // New schema fields
  unitRate: z.coerce.number().optional(),
  requiredSpace: z.coerce.number().optional(),
  generationPerDay: z.coerce.number().optional(),
  generationPerYear: z.coerce.number().optional(),
  savingsPerYear: z.coerce.number().optional(),
  laKitQty: z.coerce.number().optional(),
  acdbDcdbQty: z.coerce.number().optional(),
  earthingKitQty: z.coerce.number().optional(),
  
}).refine(data => !(data.clientId && data.leadId), {
    message: "A proposal can be linked to either a Client or a Lead, but not both.",
    path: ["leadId"],
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Proposal) => void;
  proposal?: Proposal | null;
  templateId?: string | null;
  clients: Client[];
  leads: Lead[];
}

const initialFormStateForUseForm: ProposalFormValues = {
  proposalNumber: "",
  proposalDate: format(new Date(), 'yyyy-MM-dd'),
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
  unitRate: 10,
  requiredSpace: 0,
  generationPerDay: 0,
  generationPerYear: 0,
  savingsPerYear: 0,
  laKitQty: 1,
  acdbDcdbQty: 1,
  earthingKitQty: 3,
};

export function ProposalForm({ isOpen, onClose, onSubmit, proposal, templateId, clients = [], leads = [] }: ProposalFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedDocxUrl, setGeneratedDocxUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: initialFormStateForUseForm,
  });

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isNewClientMode, setIsNewClientMode] = useState(false);

  const resetAndDisableFields = (isNew: boolean) => {
    setIsNewClientMode(isNew);
    if (isNew) {
      setSelectedClientId(null);
      setSelectedLeadId(null);
      form.setValue("clientId", undefined);
      form.setValue("leadId", undefined);
      form.setValue("name", "");
      form.setValue("clientType", "Individual/Bungalow");
      form.setValue("contactPerson", "");
      form.setValue("location", "");
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClientId(client.id);
    setSelectedLeadId(null);
    setIsNewClientMode(false);
    form.setValue("clientId", client.id);
    form.setValue("leadId", undefined);
    form.setValue("name", client.name);
    form.setValue("clientType", client.clientType || 'Other');
    form.setValue("contactPerson", client.name);
    form.setValue("location", client.address || "");
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setSelectedClientId(null);
    setIsNewClientMode(false);
    form.setValue("leadId", lead.id);
    form.setValue("clientId", undefined);
    form.setValue("name", lead.name);
    form.setValue("clientType", lead.clientType || 'Other');
    form.setValue("contactPerson", lead.name);
    form.setValue("location", lead.address || "");
  };

  useEffect(() => {
    if (isOpen) {
      if (proposal) { // Editing
        form.reset({
          ...proposal,
          proposalDate: proposal.proposalDate ? format(parseISO(proposal.proposalDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        });
        setSelectedClientId(proposal.clientId || null);
        setSelectedLeadId(proposal.leadId || null);
        setIsNewClientMode(false);
      } else { // Creating from scratch
        form.reset({
          ...initialFormStateForUseForm,
          proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        });
        setSelectedClientId(null);
        setSelectedLeadId(null);
        setIsNewClientMode(true);
      }
    }
  }, [isOpen, proposal, form]);

  const watchedCapacity = form.watch('capacity');
  const watchedRatePerWatt = form.watch('ratePerWatt');
  const watchedClientType = form.watch('clientType');
  const watchedUnitRate = form.watch('unitRate');
  const watchedInverterQty = form.watch('inverterQty');
  const watchedDcrStatus = form.watch('dcrStatus');

  useEffect(() => {
     const currentCapacity = parseFloat(watchedCapacity as any) || 0;
     const currentInverterRating = parseFloat(form.getValues('inverterRating') as any) || 0;
     if (currentCapacity > 0 && currentInverterRating !== currentCapacity) {
        form.setValue('inverterRating', currentCapacity, { shouldValidate: true, shouldDirty: true });
     }
  }, [watchedCapacity, form, isOpen]);

  useEffect(() => {
    const currentDcrStatus = form.getValues('dcrStatus');
    if ((watchedClientType === 'Commercial' || watchedClientType === 'Industrial')) {
      if (currentDcrStatus !== 'Non-DCR') {
        form.setValue('dcrStatus', 'Non-DCR', { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [watchedClientType, form]);

  useEffect(() => {
    if (watchedClientType === 'Commercial' || watchedClientType === 'Industrial') {
      form.setValue('unitRate', 10);
    } else { // Residential, Bungalow, Housing Society
      form.setValue('unitRate', 19);
    }
  }, [watchedClientType, form]);

  const calculatedValues = useMemo(() => {
    const capacity = parseFloat(String(watchedCapacity)) || 0;
    const ratePerWatt = parseFloat(String(watchedRatePerWatt)) || 0;
    const baseAmount = ratePerWatt * capacity * 1000;
    const cgstAmount = baseAmount * 0.069;
    const sgstAmount = baseAmount * 0.069;
    const finalAmount = baseAmount + cgstAmount + sgstAmount;
    return { baseAmount, cgstAmount, sgstAmount, finalAmount };
  }, [watchedCapacity, watchedRatePerWatt]);

  useEffect(() => {
    const capacity = parseFloat(String(watchedCapacity)) || 0;
    let newSubsidyAmount = 0;
    
    if (watchedDcrStatus === 'Non-DCR') {
      newSubsidyAmount = 0;
    } else {
      if (watchedClientType === 'Housing Society') {
        newSubsidyAmount = 18000 * capacity;
      } else if (watchedClientType === 'Individual/Bungalow') {
        if (capacity === 1) newSubsidyAmount = 30000;
        else if (capacity === 2) newSubsidyAmount = 60000;
        else if (capacity >= 3) newSubsidyAmount = 78000;
      }
    }
    
    const currentFormSubsidy = parseFloat(String(form.getValues('subsidyAmount')));
    if (currentFormSubsidy !== newSubsidyAmount || isNaN(currentFormSubsidy)) {
        form.setValue('subsidyAmount', newSubsidyAmount, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedClientType, watchedCapacity, watchedDcrStatus, form]);

  const calculatedAdditionalValues = useMemo(() => {
    const capacity = parseFloat(String(watchedCapacity)) || 0;
    const unitRate = parseFloat(String(watchedUnitRate)) || 0;
    const inverterQty = parseInt(String(watchedInverterQty), 10) || 1;

    const requiredSpace = capacity * 80;
    const generationPerDay = capacity * 4;
    const generationPerYear = generationPerDay * 365;
    const savingsPerYear = generationPerYear * unitRate;

    const laKitQty = inverterQty * 1;
    const acdbDcdbQty = inverterQty * 1;
    const earthingKitQty = inverterQty * 3;

    return {
      requiredSpace,
      generationPerDay,
      generationPerYear,
      savingsPerYear,
      laKitQty,
      acdbDcdbQty,
      earthingKitQty
    };
  }, [watchedCapacity, watchedUnitRate, watchedInverterQty]);

  const isDcrDisabled = watchedClientType === 'Commercial' || watchedClientType === 'Industrial';

  const handleFormSubmit = async (values: ProposalFormValues) => {
    setIsGenerating(true);
    let finalClientId = values.clientId;
    if (isNewClientMode) {
      finalClientId = `client-new-${Date.now()}`;
    }

    const currentTemplateId = proposal?.templateId || templateId;
    if (!currentTemplateId) {
      toast({ title: "Error", description: "No template selected.", variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    const submissionData: Proposal = {
      id: proposal?.id || `prop${Date.now()}`,
      ...values,
      clientId: finalClientId,
      leadId: values.leadId,
      templateId: currentTemplateId,
      capacity: parseFloat(values.capacity as any) || 0,
      ratePerWatt: parseFloat(values.ratePerWatt as any) || 0,
      inverterRating: Number(values.inverterRating) || 0,
      inverterQty: Number(values.inverterQty) || 1,
      baseAmount: calculatedValues.baseAmount,
      cgstAmount: calculatedValues.cgstAmount,
      sgstAmount: calculatedValues.sgstAmount,
      subtotalAmount: calculatedValues.baseAmount + calculatedValues.cgstAmount + calculatedValues.sgstAmount,
      finalAmount: calculatedValues.finalAmount,
      subsidyAmount: parseFloat(values.subsidyAmount as any) || 0,
      unitRate: values.unitRate,
      requiredSpace: calculatedAdditionalValues.requiredSpace,
      generationPerDay: calculatedAdditionalValues.generationPerDay,
      generationPerYear: calculatedAdditionalValues.generationPerYear,
      savingsPerYear: calculatedAdditionalValues.savingsPerYear,
      laKitQty: calculatedAdditionalValues.laKitQty,
      acdbDcdbQty: calculatedAdditionalValues.acdbDcdbQty,
      earthingKitQty: calculatedAdditionalValues.earthingKitQty,
      createdAt: proposal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: currentTemplateId, data: submissionData }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to generate proposal.');
      }

      setGeneratedPdfUrl(result.pdfUrl);
      setGeneratedDocxUrl(result.docxUrl);
      setIsPreviewOpen(true);
      
      const finalSubmissionData = {
          ...submissionData,
          pdfUrl: result.pdfUrl,
          docxUrl: result.docxUrl
      };
      onSubmit(finalSubmissionData);

    } catch (error) {
      console.error("Failed to generate proposal:", error);
      toast({ title: "Error Generating Proposal", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proposal ? 'Edit Proposal' : 'Create New Proposal'}</DialogTitle>
          <DialogDescription>
            {proposal ? "Update the proposal's information." : 'Select a client/lead or enter new client details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 pb-4 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="proposalNumber" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Proposal Number</FormLabel><FormControl><Input placeholder="e.g., P-2024-001" {...field} /></FormControl><FormMessage /></FormItem> )}/>
              <Controller name="proposalDate" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Proposal Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(parseISO(field.value), "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )}/>
            </div>
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">Customer Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomerCombobox
                    label="Select Client"
                    customers={clients}
                    selectedId={selectedClientId}
                    onSelect={(customer) => handleClientSelect(customer as Client)}
                    onClear={() => setSelectedClientId(null)}
                    disabled={!!selectedLeadId || (!!proposal && !!proposal.leadId)}
                />
                <CustomerCombobox
                    label="Select Lead"
                    customers={leads}
                    selectedId={selectedLeadId}
                    onSelect={(customer) => handleLeadSelect(customer as Lead)}
                    onClear={() => setSelectedLeadId(null)}
                    disabled={!!selectedClientId || (!!proposal && !!proposal.clientId)}
                />
            </div>
            <Button type="button" variant="link" onClick={() => resetAndDisableFields(true)} disabled={isNewClientMode}>Or, create a new client for this proposal</Button>

            <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Client/Company Name</FormLabel><FormControl><Input placeholder="Enter name" {...field} disabled={!isNewClientMode} /></FormControl><FormMessage /></FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField name="clientType" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Client Type</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!isNewClientMode}><FormControl><SelectTrigger><SelectValue placeholder="Select client type" /></SelectTrigger></FormControl><SelectContent>{CLIENT_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )}/>
               <FormField name="contactPerson" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="Enter contact person" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <FormField name="location" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Location / Site Address</FormLabel><FormControl><Textarea placeholder="Enter full site address" {...field} /></FormControl><FormMessage /></FormItem> )}/>

            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">System Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField name="capacity" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Capacity (kW)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )}/>
               <FormField name="moduleType" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Module Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select module type" /></SelectTrigger></FormControl><SelectContent>{MODULE_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )}/>
               <FormField name="moduleWattage" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Module Wattage (W)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Wattage" /></SelectTrigger></FormControl><SelectContent>{MODULE_WATTAGE_OPTIONS.map(wattage => (<SelectItem key={wattage} value={wattage}>{wattage} W</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="dcrStatus" control={form.control} render={({ field }) => ( <FormItem><FormLabel>DCR/Non-DCR</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isDcrDisabled}><FormControl><SelectTrigger><SelectValue placeholder="Select DCR status" /></SelectTrigger></FormControl><SelectContent>{DCR_STATUSES.map(status => ( <SelectItem key={status} value={status}>{status}</SelectItem> ))}</SelectContent></Select>{isDcrDisabled && <p className="text-xs text-muted-foreground">Auto-set to Non-DCR for Commercial/Industrial.</p>}<FormMessage /></FormItem> )}/>
                <FormField name="inverterRating" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Inverter Rating (kW)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField name="inverterQty" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Inverter Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">Financials</h3>
            <FormField name="ratePerWatt" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Rate per Watt (₹)</FormLabel><FormControl><Input type="number" placeholder="e.g., 40" {...field} step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )}/>
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                <div className="flex justify-between items-center"><FormLabel>Base Amount</FormLabel><span className="font-semibold flex items-center"><IndianRupee className="h-4 w-4 mr-0.5"/>{calculatedValues.baseAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><FormLabel>CGST (6.9%)</FormLabel><span className="text-sm flex items-center"><IndianRupee className="h-3 w-3 mr-0.5"/>{calculatedValues.cgstAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><FormLabel>SGST (6.9%)</FormLabel><span className="text-sm flex items-center"><IndianRupee className="h-3 w-3 mr-0.5"/>{calculatedValues.sgstAmount.toFixed(2)}</span></div>
                <Separator/><div className="flex justify-between items-center text-primary"><FormLabel className="font-medium text-lg">Final Proposal Amount (Pre-Subsidy)</FormLabel><span className="font-bold text-xl flex items-center"><IndianRupee className="h-5 w-5 mr-0.5"/>{calculatedValues.finalAmount.toFixed(2)}</span></div>
            </div>
            <FormField name="subsidyAmount" control={form.control} render={({ field }) => ( <FormItem className="mt-4"><FormLabel>Subsidy Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="Auto-calculated" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} readOnly className={'bg-muted cursor-not-allowed text-muted-foreground'} /></FormControl><p className="text-xs text-muted-foreground">Auto-calculated based on client type and capacity. Set to 0 for Non-DCR.</p><FormMessage /></FormItem> )}/>

            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-foreground">Additional Details</h3>

            <div className="p-3 border rounded-md bg-muted/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormItem>
                    <FormLabel>Required Space (Sq. Ft.)</FormLabel>
                    <FormControl><Input readOnly value={`${calculatedAdditionalValues.requiredSpace.toFixed(0)} sq. ft.`} /></FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Generation/Day (Units)</FormLabel>
                    <FormControl><Input readOnly value={`${calculatedAdditionalValues.generationPerDay.toFixed(2)} units`} /></FormControl>
                  </FormItem>
                   <FormItem>
                    <FormLabel>Generation/Year (Units)</FormLabel>
                    <FormControl><Input readOnly value={`${calculatedAdditionalValues.generationPerYear.toFixed(2)} units`} /></FormControl>
                  </FormItem>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="unitRate" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Unit Rate (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem> )}/>
                <FormItem>
                    <FormLabel>Savings/Year (₹)</FormLabel>
                    <FormControl><Input readOnly value={`₹ ${calculatedAdditionalValues.savingsPerYear.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} /></FormControl>
                </FormItem>
            </div>
            
            <div className="p-3 border rounded-md bg-muted/50 space-y-3">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>LA Kit Quantity</FormLabel>
                      <FormControl><Input readOnly value={calculatedAdditionalValues.laKitQty} /></FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>ACDB/DCDB Quantity</FormLabel>
                      <FormControl><Input readOnly value={calculatedAdditionalValues.acdbDcdbQty} /></FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Earthing Kit Quantity</FormLabel>
                      <FormControl><Input readOnly value={calculatedAdditionalValues.earthingKitQty} /></FormControl>
                    </FormItem>
                </div>
            </div>
            
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {proposal ? 'Save & Regenerate' : 'Generate Proposal PDF'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <ProposalPreviewDialog 
      isOpen={isPreviewOpen} 
      onClose={() => setIsPreviewOpen(false)} 
      pdfUrl={generatedPdfUrl}
      docxUrl={generatedDocxUrl}
    />
    </>
  );
}

interface CustomerComboboxProps {
    label: string;
    customers: (Client | Lead)[];
    selectedId: string | null;
    onSelect: (customer: Client | Lead) => void;
    onClear: () => void;
    disabled?: boolean;
}

function CustomerCombobox({ label, customers, selectedId, onSelect, onClear, disabled }: CustomerComboboxProps) {
    const [open, setOpen] = useState(false);
    const selectedCustomer = customers.find(c => c.id === selectedId);

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
                <div className="relative">
                    <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled}>
                                <span className="truncate">{selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone || 'No phone'})` : `Select a ${label.split(' ')[1].toLowerCase()}...`}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                    </PopoverTrigger>
                    {selectedId && !disabled && (
                        <Button variant="ghost" size="icon" className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6" onClick={onClear}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder={`Search ${label.split(' ')[1].toLowerCase()}...`} />
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.phone || ''} ${customer.id}`}
                                    onSelect={() => {
                                        onSelect(customer);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedId === customer.id ? "opacity-100" : "opacity-0")} />
                                    <div>
                                        <p>{customer.name}</p>
                                        <p className="text-xs text-muted-foreground">{customer.phone || "No phone number"}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </FormItem>
    );
}
