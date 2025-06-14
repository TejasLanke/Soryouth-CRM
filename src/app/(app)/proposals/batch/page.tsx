
'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Trash2, Rows, CalendarIcon, IndianRupee } from 'lucide-react';
import { CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS, MOCK_PROPOSALS } from '@/lib/constants';
import type { Proposal, ClientType, ModuleType, DCRStatus, ModuleWattage } from '@/types';
import { proposalSchema } from '../proposal-form'; // Assuming proposalSchema is exported
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

// Schema for the entire batch form
const batchProposalsSchema = z.object({
  proposals: z.array(proposalSchema),
});

type BatchProposalsFormValues = z.infer<typeof batchProposalsSchema>;

// Default values for a single new proposal row
const getDefaultProposalRow = (): Omit<Proposal, 'id' | 'clientId' | 'createdAt' | 'updatedAt' | 'baseAmount' | 'cgstAmount' | 'sgstAmount' | 'subtotalAmount' | 'finalAmount' | 'subsidyAmount'> => ({
  proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
  name: '',
  clientType: CLIENT_TYPES[0],
  contactPerson: '',
  location: '',
  capacity: 0,
  moduleType: MODULE_TYPES[0],
  moduleWattage: MODULE_WATTAGE_OPTIONS[0],
  dcrStatus: DCR_STATUSES[0],
  inverterRating: 0,
  inverterQty: 1,
  ratePerWatt: 0,
  proposalDate: new Date().toISOString(),
});


export default function BatchProposalsPage() {
  const { toast } = useToast();
  const form = useForm<BatchProposalsFormValues>({
    resolver: zodResolver(batchProposalsSchema),
    defaultValues: {
      proposals: [getDefaultProposalRow() as any], // Cast as any to satisfy initial type before full object is formed
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'proposals',
  });

  const watchFieldArray = form.watch('proposals');

  // Effect to update dynamic defaults within rows
  useEffect(() => {
    watchFieldArray.forEach((proposal, index) => {
      const currentClientType = proposal.clientType;
      const currentName = proposal.name;
      const currentCapacity = proposal.capacity;

      // Default contactPerson
      if (currentClientType === 'Individual/Bungalow' && currentName && form.getValues(`proposals.${index}.contactPerson`) !== currentName) {
        form.setValue(`proposals.${index}.contactPerson`, currentName, { shouldValidate: false, shouldDirty: true });
      }

      // Default inverterRating
      if (currentCapacity > 0 && form.getValues(`proposals.${index}.inverterRating`) !== currentCapacity) {
        form.setValue(`proposals.${index}.inverterRating`, currentCapacity, { shouldValidate: false, shouldDirty: true });
      }
      
      // Default DCR status
      if ((currentClientType === 'Commercial' || currentClientType === 'Industrial') && form.getValues(`proposals.${index}.dcrStatus`) !== 'Non-DCR') {
        form.setValue(`proposals.${index}.dcrStatus`, 'Non-DCR', { shouldValidate: false, shouldDirty: true });
      }
    });
  }, [watchFieldArray, form]);


  const processSubmittedProposals = (data: BatchProposalsFormValues) => {
    data.proposals.forEach((proposalData, index) => {
      // Recalculate financials and subsidy
      const capacity = Number(proposalData.capacity) || 0;
      const ratePerWatt = Number(proposalData.ratePerWatt) || 0;
      const clientType = proposalData.clientType;

      const baseAmount = ratePerWatt * capacity * 1000;
      const cgstAmount = baseAmount * 0.069;
      const sgstAmount = baseAmount * 0.069;
      const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
      const finalAmount = subtotalAmount; // Final amount is pre-subsidy

      let subsidyAmount = 0;
      if (clientType === 'Housing Society') {
        subsidyAmount = 18000 * capacity;
      } else if (clientType === 'Individual/Bungalow') {
        // In batch, subsidy for individual is not directly input. We'll assume 0 or a fixed logic if needed.
        // For now, keeping it 0 for Individual in batch context unless a different rule is defined.
        subsidyAmount = Number(proposalData.subsidyAmount) || 0; // If subsidyAmount were a field in the batch row
      }

      const processedProposal: Proposal = {
        id: `batch-${Date.now()}-${index}`,
        clientId: `client-batch-${Date.now()}-${index}`,
        ...proposalData,
        capacity, // ensure number
        ratePerWatt, // ensure number
        inverterRating: Number(proposalData.inverterRating) || 0,
        inverterQty: Number(proposalData.inverterQty) || 1,
        proposalDate: proposalData.proposalDate, // Already string
        baseAmount,
        cgstAmount,
        sgstAmount,
        subtotalAmount,
        finalAmount,
        subsidyAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('Processed Proposal:', processedProposal);
      // MOCK_PROPOSALS.unshift(processedProposal); // Simulate adding to global store
      toast({
        title: `Proposal Generated: ${processedProposal.proposalNumber}`,
        description: `For client: ${processedProposal.name}`,
      });
    });
    // form.reset({ proposals: [getDefaultProposalRow() as any] }); // Optionally reset form
  };

  return (
    <>
      <PageHeader
        title="Batch Proposal Generation"
        description="Create multiple proposals efficiently using this table interface."
        icon={Rows}
      />
      <form onSubmit={form.handleSubmit(processSubmittedProposals)}>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Proposal No.</TableHead>
                <TableHead className="w-[200px]">Client Name</TableHead>
                <TableHead className="w-[180px]">Client Type</TableHead>
                <TableHead className="w-[200px]">Contact Person</TableHead>
                <TableHead className="w-[250px]">Location</TableHead>
                <TableHead className="w-[100px]">Capacity (kW)</TableHead>
                <TableHead className="w-[150px]">Module Type</TableHead>
                <TableHead className="w-[150px]">Module Wattage</TableHead>
                <TableHead className="w-[150px]">DCR Status</TableHead>
                <TableHead className="w-[130px]">Inverter Rating (kW)</TableHead>
                <TableHead className="w-[100px]">Inverter Qty</TableHead>
                <TableHead className="w-[120px]">Rate/Watt (₹)</TableHead>
                <TableHead className="w-[180px]">Proposal Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => {
                const clientType = form.watch(`proposals.${index}.clientType`);
                const isDcrDisabled = clientType === 'Commercial' || clientType === 'Industrial';
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.proposalNumber`}
                        render={({ field }) => <Input {...field} placeholder="P-YYYY-NNNNN" />}
                      />
                       {form.formState.errors.proposals?.[index]?.proposalNumber && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.proposalNumber?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.name`}
                        render={({ field }) => <Input {...field} placeholder="Client/Company Name" />}
                      />
                       {form.formState.errors.proposals?.[index]?.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.name?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={form.control}
                        name={`proposals.${index}.clientType`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                            <SelectContent>
                              {CLIENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                       {form.formState.errors.proposals?.[index]?.clientType && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.clientType?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.contactPerson`}
                        render={({ field }) => <Input {...field} placeholder="Contact Name" />}
                      />
                      {form.formState.errors.proposals?.[index]?.contactPerson && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.contactPerson?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.location`}
                        render={({ field }) => <Input {...field} placeholder="Site Address" />}
                      />
                      {form.formState.errors.proposals?.[index]?.location && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.location?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.capacity`}
                        render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="kW" />}
                      />
                      {form.formState.errors.proposals?.[index]?.capacity && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.capacity?.message}</p>}
                    </TableCell>
                    <TableCell>
                       <Controller
                        control={form.control}
                        name={`proposals.${index}.moduleType`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                            <SelectContent>
                              {MODULE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.proposals?.[index]?.moduleType && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.moduleType?.message}</p>}
                    </TableCell>
                     <TableCell>
                       <Controller
                        control={form.control}
                        name={`proposals.${index}.moduleWattage`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select Wattage" /></SelectTrigger>
                            <SelectContent>
                              {MODULE_WATTAGE_OPTIONS.map(watt => <SelectItem key={watt} value={watt}>{watt} W</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.proposals?.[index]?.moduleWattage && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.moduleWattage?.message}</p>}
                    </TableCell>
                    <TableCell>
                       <Controller
                        control={form.control}
                        name={`proposals.${index}.dcrStatus`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isDcrDisabled}>
                            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>
                              {DCR_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.proposals?.[index]?.dcrStatus && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.dcrStatus?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.inverterRating`}
                        render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="kW" />}
                      />
                      {form.formState.errors.proposals?.[index]?.inverterRating && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.inverterRating?.message}</p>}
                    </TableCell>
                     <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.inverterQty`}
                        render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} placeholder="Qty" />}
                      />
                       {form.formState.errors.proposals?.[index]?.inverterQty && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.inverterQty?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`proposals.${index}.ratePerWatt`}
                        render={({ field }) => <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="Rate" />}
                      />
                      {form.formState.errors.proposals?.[index]?.ratePerWatt && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.ratePerWatt?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={form.control}
                        name={`proposals.${index}.proposalDate`}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value ? parseISO(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {form.formState.errors.proposals?.[index]?.proposalDate && <p className="text-xs text-destructive mt-1">{form.formState.errors.proposals[index]?.proposalDate?.message}</p>}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <Button type="button" variant="outline" onClick={() => append(getDefaultProposalRow() as any)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Proposal Row
          </Button>
          <Button type="submit">
            Generate All Proposals
          </Button>
        </div>
      </form>
    </>
  );
}
