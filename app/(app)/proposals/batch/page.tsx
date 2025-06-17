
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
import { PlusCircle, Trash2, Rows, CalendarIcon } from 'lucide-react';
import { CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS } from '@/lib/constants';
import type { Proposal, ClientType, ModuleType, DCRStatus, ModuleWattage } from '@/types';
import { proposalSchema } from '../proposal-form'; // Import the schema
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'; // Import Form components for error display

// Schema for the entire batch form using the imported proposalSchema
const batchProposalsSchema = z.object({
  proposals: z.array(proposalSchema),
});

type BatchProposalsFormValues = z.infer<typeof batchProposalsSchema>;

// Default values for a single new proposal row
// Financials (baseAmount, etc.) and subsidyAmount are calculated on submission
const getDefaultProposalRow = (): Omit<Proposal, 'id' | 'clientId' | 'createdAt' | 'updatedAt' | 'baseAmount' | 'cgstAmount' | 'sgstAmount' | 'subtotalAmount' | 'finalAmount' | 'subsidyAmount'> => ({
  proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
  proposalDate: format(new Date(), 'yyyy-MM-dd'),
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
  // subsidyAmount is intentionally omitted here as it will be calculated on submission
});


export default function BatchProposalsPage() {
  const { toast } = useToast();
  const form = useForm<BatchProposalsFormValues>({
    resolver: zodResolver(batchProposalsSchema),
    defaultValues: {
      proposals: [getDefaultProposalRow() as any], // Type assertion for defaultValues
    },
  });

  const { fields, append, remove, control } = useFieldArray({
    control: form.control,
    name: 'proposals',
  });

  const watchFieldArray = form.watch('proposals');

  useEffect(() => {
    watchFieldArray.forEach((proposal, index) => {
      const currentClientType = form.watch(`proposals.${index}.clientType`);
      const currentName = form.watch(`proposals.${index}.name`);
      const currentCapacity = Number(form.watch(`proposals.${index}.capacity`)) || 0;
      
      // Auto-fill contact person for Individual/Bungalow
      if (currentClientType === 'Individual/Bungalow' && currentName && form.getValues(`proposals.${index}.contactPerson`) !== currentName) {
        form.setValue(`proposals.${index}.contactPerson`, currentName, { shouldValidate: true, shouldDirty: true });
      }

      // Auto-fill inverter rating based on capacity
      if (currentCapacity > 0 && Number(form.getValues(`proposals.${index}.inverterRating`)) !== currentCapacity) {
        form.setValue(`proposals.${index}.inverterRating`, currentCapacity, { shouldValidate: true, shouldDirty: true });
      }

      // Auto-set DCR status for Commercial/Industrial
      const currentDcrStatus = form.watch(`proposals.${index}.dcrStatus`);
      if ((currentClientType === 'Commercial' || currentClientType === 'Industrial')) {
        if (currentDcrStatus !== 'Non-DCR') {
            form.setValue(`proposals.${index}.dcrStatus`, 'Non-DCR', { shouldValidate: true, shouldDirty: true });
        }
      } else {
        // Optionally, if changing *away* from Comm/Ind, reset DCR if it was auto-set.
        // This part can be refined based on desired UX. For now, if not Comm/Ind, it allows manual selection.
        // If it was 'Non-DCR' due to auto-set, and now type changes, user can change it.
      }
    });
  }, [watchFieldArray, form]);


  const processSubmittedProposals = (data: BatchProposalsFormValues) => {
    const newProposals: Proposal[] = [];
    data.proposals.forEach((proposalData, index) => {
      const capacity = Number(proposalData.capacity);
      const ratePerWatt = Number(proposalData.ratePerWatt);
      const clientType = proposalData.clientType;

      const baseAmount = ratePerWatt * capacity * 1000;
      const cgstAmount = baseAmount * 0.069;
      const sgstAmount = baseAmount * 0.069;
      const subtotalAmount = baseAmount + cgstAmount + sgstAmount;
      const finalAmountPreSubsidy = subtotalAmount;

      let calculatedSubsidyAmount = 0;
      if (clientType === 'Housing Society') {
        calculatedSubsidyAmount = 18000 * capacity;
      } else if (clientType === 'Individual/Bungalow') {
        if (capacity === 1) calculatedSubsidyAmount = 30000;
        else if (capacity === 2) calculatedSubsidyAmount = 60000;
        else if (capacity >= 3) calculatedSubsidyAmount = 78000;
      }
      // For Commercial/Industrial, subsidy remains 0

      const processedProposal: Proposal = {
        id: `batch-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        clientId: `client-batch-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`, // Placeholder client ID
        ...proposalData,
        capacity,
        ratePerWatt,
        inverterRating: Number(proposalData.inverterRating),
        inverterQty: Number(proposalData.inverterQty),
        baseAmount,
        cgstAmount,
        sgstAmount,
        subtotalAmount,
        finalAmount: finalAmountPreSubsidy,
        subsidyAmount: calculatedSubsidyAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newProposals.push(processedProposal);
      console.log('Processed Batch Proposal:', processedProposal);
      // MOCK_PROPOSALS.unshift(processedProposal); // For local testing, usually update state or send to API
      toast({
        title: `Proposal Generated: ${processedProposal.proposalNumber}`,
        description: `For ${processedProposal.name}. Capacity: ${processedProposal.capacity}kW, Final: ₹${processedProposal.finalAmount.toFixed(2)}, Subsidy: ₹${processedProposal.subsidyAmount.toFixed(2)}`,
      });
    });
    // form.reset({ proposals: [getDefaultProposalRow() as any] }); // Optionally reset form after submission
  };

  return (
    <>
      <PageHeader
        title="Batch Proposal Generation"
        description="Create multiple proposals efficiently. Financials and subsidies are auto-calculated on generation."
        icon={Rows}
      />
      <Form {...form}> {/* Wrap with Form provider for context */}
        <form onSubmit={form.handleSubmit(processSubmittedProposals)}>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Proposal No.</TableHead>
                  <TableHead className="w-[180px]">Proposal Date</TableHead>
                  <TableHead className="w-[200px]">Client Name</TableHead>
                  <TableHead className="w-[180px]">Client Type</TableHead>
                  <TableHead className="w-[200px]">Contact Person</TableHead>
                  <TableHead className="w-[250px]">Location</TableHead>
                  <TableHead className="w-[100px]">Capacity (kW)</TableHead>
                  <TableHead className="w-[150px]">Module Type</TableHead>
                  <TableHead className="w-[150px]">Module Wattage</TableHead>
                  <TableHead className="w-[150px]">DCR Status</TableHead>
                  <TableHead className="w-[130px]">Inv. Rating (kW)</TableHead>
                  <TableHead className="w-[100px]">Inv. Qty</TableHead>
                  <TableHead className="w-[120px]">Rate/Watt (₹)</TableHead>
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
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="P-YYYY-NNNNN" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.proposalDate`}
                          render={({ field }) => (
                            <FormItem>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                  </FormControl>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="Client/Company Name" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.clientType`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {CLIENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.contactPerson`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="Contact Name" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="Site Address" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.capacity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="kW" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                         <FormField
                          control={form.control}
                          name={`proposals.${index}.moduleType`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {MODULE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                       <TableCell>
                         <FormField
                          control={form.control}
                          name={`proposals.${index}.moduleWattage`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Wattage" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {MODULE_WATTAGE_OPTIONS.map(watt => <SelectItem key={watt} value={watt}>{watt} W</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                         <FormField
                          control={form.control}
                          name={`proposals.${index}.dcrStatus`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isDcrDisabled}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {DCR_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.inverterRating`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="kW" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                       <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.inverterQty`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} placeholder="Qty" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`proposals.${index}.ratePerWatt`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} placeholder="Rate" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
      </Form>
    </>
  );
}
