
'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Trash2, Rows, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { CLIENT_TYPES, MODULE_TYPES, DCR_STATUSES, MODULE_WATTAGE_OPTIONS } from '@/lib/constants';
import type { Proposal, Client, Lead, ClientType, ModuleType, DCRStatus, ModuleWattage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getActiveClients } from '@/app/(app)/clients-list/actions';
import { getLeads } from '@/app/(app)/leads-list/actions';

// Schema for a single row in the batch form
const batchRowSchema = z.object({
  id: z.string(), // Hook form field array ID
  customerId: z.string().optional(),
  customerType: z.enum(['client', 'lead']).optional(),
  name: z.string().min(1, 'Name is required.'),
  clientType: z.enum(CLIENT_TYPES),
  contactPerson: z.string().min(1, 'Contact is required.'),
  location: z.string().min(1, 'Location is required.'),
  capacity: z.coerce.number().positive(),
  moduleType: z.enum(MODULE_TYPES),
  moduleWattage: z.enum(MODULE_WATTAGE_OPTIONS),
  dcrStatus: z.enum(DCR_STATUSES),
  inverterRating: z.coerce.number().positive(),
  inverterQty: z.coerce.number().int().positive(),
  ratePerWatt: z.coerce.number().positive(),
  unitRate: z.coerce.number().positive(),
});

// Schema for the entire batch form
const batchProposalsSchema = z.object({
  proposals: z.array(batchRowSchema),
});

type BatchProposalsFormValues = z.infer<typeof batchProposalsSchema>;
type BatchRow = z.infer<typeof batchRowSchema>;


const getDefaultProposalRow = (): Omit<BatchRow, 'id'> => ({
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
  unitRate: 19,
});

const CustomerCombobox = ({ control, index, customers, onSelect }: { control: any, index: number, customers: (Client | Lead)[], onSelect: (customer: Client | Lead, index: number) => void }) => {
    const [open, setOpen] = useState(false);
    const customerId = useWatch({ control, name: `proposals.${index}.customerId` });
    const selectedCustomer = customers.find(c => c.id === customerId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button variant="outline" role="combobox" className="w-[200px] justify-between h-8 text-xs">
                        {selectedCustomer ? (
                            <span className="truncate">{selectedCustomer.name}</span>
                        ) : (
                            "Select Customer..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                        {customers.map((customer) => (
                            <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.id}`}
                                onSelect={() => {
                                    onSelect(customer, index);
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", customerId === customer.id ? "opacity-100" : "opacity-0")} />
                                <div>
                                    <p>{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">{'source' in customer ? `Lead: ${customer.status}` : `Client: ${customer.status}`}</p>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export default function BatchProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isGenerating, startGenerationTransition] = useTransition();

  const allCustomers = useMemo(() => [...clients, ...leads], [clients, leads]);

  const form = useForm<BatchProposalsFormValues>({
    resolver: zodResolver(batchProposalsSchema),
    defaultValues: {
      proposals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'proposals',
  });

  useEffect(() => {
    if (!templateId) {
      toast({ title: 'No Template Selected', description: 'Please select a template before generating proposals in batch.', variant: 'destructive' });
      router.push('/proposals');
    }
  }, [templateId, router, toast]);

  useEffect(() => {
    async function fetchData() {
        setIsDataLoading(true);
        const [fetchedClients, fetchedLeads] = await Promise.all([getActiveClients(), getLeads()]);
        setClients(fetchedClients);
        setLeads(fetchedLeads);
        if (fields.length === 0) {
            append(getDefaultProposalRow() as any);
        }
        setIsDataLoading(false);
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomerSelect = (customer: Client | Lead, index: number) => {
    const isClient = 'status' in customer && !('source' in customer);
    form.setValue(`proposals.${index}.customerId`, customer.id);
    form.setValue(`proposals.${index}.customerType`, isClient ? 'client' : 'lead');
    form.setValue(`proposals.${index}.name`, customer.name);
    form.setValue(`proposals.${index}.contactPerson`, customer.name);
    form.setValue(`proposals.${index}.location`, customer.address || '');
    form.setValue(`proposals.${index}.clientType`, customer.clientType || 'Other');
    form.setValue(`proposals.${index}.capacity`, customer.kilowatt || 0);
  };
  
  const processAllProposals = (data: BatchProposalsFormValues) => {
    startGenerationTransition(async () => {
        toast({ title: "Batch Generation Started", description: `Processing ${data.proposals.length} proposals...` });
        
        const generationPromises = data.proposals.map(async (row, index) => {
            try {
                const originalCustomer = allCustomers.find(c => c.id === row.customerId);

                const capacity = Number(row.capacity);
                const ratePerWatt = Number(row.ratePerWatt);
                const clientType = row.clientType;
                const unitRate = Number(row.unitRate);
                const inverterQty = Number(row.inverterQty);
                const dcrStatus = row.dcrStatus;
                
                // Financials
                const baseAmount = ratePerWatt * capacity * 1000;
                const cgstAmount = baseAmount * 0.069;
                const sgstAmount = baseAmount * 0.069;
                const finalAmount = baseAmount + cgstAmount + sgstAmount;

                // Subsidy
                let subsidyAmount = 0;
                if (dcrStatus !== 'Non-DCR') {
                    if (clientType === 'Housing Society') subsidyAmount = 18000 * capacity;
                    else if (clientType === 'Individual/Bungalow') {
                        if (capacity === 1) subsidyAmount = 30000;
                        else if (capacity === 2) subsidyAmount = 60000;
                        else if (capacity >= 3) subsidyAmount = 78000;
                    }
                }
                
                // Additional Details
                const requiredSpace = capacity * 80;
                const generationPerDay = capacity * 4;
                const generationPerYear = generationPerDay * 365;
                const savingsPerYear = generationPerYear * unitRate;
                const laKitQty = inverterQty * 1;
                const acdbDcdbQty = inverterQty * 1;
                const earthingKitQty = inverterQty * 3;

                const submissionData: Partial<Proposal> = {
                    ...row,
                    proposalDate: format(new Date(), 'yyyy-MM-dd'),
                    proposalNumber: `P-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`,
                    clientId: row.customerType === 'client' ? row.customerId : undefined,
                    leadId: row.customerType === 'lead' ? row.customerId : undefined,
                    phone: originalCustomer?.phone,
                    email: originalCustomer?.email,
                    baseAmount, cgstAmount, sgstAmount, subtotalAmount: finalAmount, finalAmount, subsidyAmount,
                    requiredSpace, generationPerDay, generationPerYear, unitRate, savingsPerYear, laKitQty, acdbDcdbQty, earthingKitQty,
                };
                
                const response = await fetch('/api/proposals/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ templateId, data: submissionData }),
                });

                if (!response.ok) throw new Error(await response.text());
                
                toast({ title: `Success: ${row.name}`, description: `Proposal generated successfully.`, variant: 'default' });
                return { success: true, name: row.name };
            } catch (error) {
                console.error(`Failed to generate proposal for ${row.name}:`, error);
                toast({ title: `Failed: ${row.name}`, description: (error as Error).message, variant: 'destructive' });
                return { success: false, name: row.name };
            }
        });

        await Promise.all(generationPromises);
        toast({ title: "Batch Generation Complete", description: "All proposals have been processed." });
    });
  };

  if (isDataLoading || !templateId) {
     return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Loading data...</p>
        </div>
     );
  }

  return (
    <>
      <PageHeader
        title="Batch Proposal Generation"
        description="Create multiple proposals efficiently. Financials and subsidies are auto-calculated on generation."
        icon={Rows}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(processAllProposals)}>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-full text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="p-2 w-[220px]">Customer</TableHead>
                  <TableHead className="p-2 w-[200px]">Client Name</TableHead>
                  <TableHead className="p-2 w-[180px]">Client Type</TableHead>
                  <TableHead className="p-2 w-[200px]">Contact Person</TableHead>
                  <TableHead className="p-2 w-[250px]">Location</TableHead>
                  <TableHead className="p-2 w-[100px]">Capacity (kW)</TableHead>
                  <TableHead className="p-2 w-[150px]">Module Type</TableHead>
                  <TableHead className="p-2 w-[150px]">Module Wattage</TableHead>
                  <TableHead className="p-2 w-[150px]">DCR Status</TableHead>
                  <TableHead className="p-2 w-[130px]">Inv. Rating (kW)</TableHead>
                  <TableHead className="p-2 w-[140px]">Inv. Qty</TableHead>
                  <TableHead className="p-2 w-[120px]">Rate/Watt (₹)</TableHead>
                  <TableHead className="p-2 w-[140px]">Unit Rate (₹)</TableHead>
                  <TableHead className="p-2 w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-1"><CustomerCombobox control={form.control} index={index} customers={allCustomers} onSelect={handleCustomerSelect} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.name`} render={({ field }) => <Input {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.clientType`} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{CLIENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.contactPerson`} render={({ field }) => <Input {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.location`} render={({ field }) => <Input {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.capacity`} render={({ field }) => <Input type="number" {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.moduleType`} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{MODULE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.moduleWattage`} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{MODULE_WATTAGE_OPTIONS.map(watt => <SelectItem key={watt} value={watt}>{watt}W</SelectItem>)}</SelectContent></Select>} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.dcrStatus`} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{DCR_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.inverterRating`} render={({ field }) => <Input type="number" {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.inverterQty`} render={({ field }) => <Input type="number" {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.ratePerWatt`} render={({ field }) => <Input type="number" {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1"><FormField control={form.control} name={`proposals.${index}.unitRate`} render={({ field }) => <Input type="number" {...field} className="h-8 text-xs" />} /></TableCell>
                      <TableCell className="p-1 text-center">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)} disabled={fields.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Button type="button" variant="outline" onClick={() => append(getDefaultProposalRow() as any)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate All Proposals
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
