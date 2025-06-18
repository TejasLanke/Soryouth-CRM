
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MOCK_LEADS, LEAD_STATUS_OPTIONS, USER_OPTIONS, LEAD_SOURCE_OPTIONS } from '@/lib/constants';
import type { Lead, LeadStatusType, SortConfig } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { Filter, Search, UploadCloud, PlusCircle, Settings2, ArrowUpDown, ChevronDown, SquareCheckBig } from 'lucide-react'; // Changed Funnel to Filter
import { LeadForm } from '../leads/lead-form'; // Assuming LeadForm is in leads directory
import { useToast } from "@/hooks/use-toast";

// Helper function for date formatting
const ClientFormattedDateTime: React.FC<{ dateString?: string }> = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateString && isValid(parseISO(dateString))) {
      setFormattedDate(format(parseISO(dateString), 'dd-MM-yyyy HH:mm a'));
    } else {
      setFormattedDate('-');
    }
  }, [dateString]);

  if (formattedDate === null) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }
  return <span className="text-xs whitespace-nowrap">{formattedDate}</span>;
};

const getSourceBadgeVariant = (source?: string) => {
  if (!source) return 'outline';
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes('facebook')) return 'default';
  if (lowerSource.includes('google')) return 'secondary'; // Assuming Google is distinct from website
  if (lowerSource.includes('website') || lowerSource.includes('online')) return 'secondary';
  if (lowerSource.includes('referral')) return 'default';
  if (lowerSource.includes('mahindra')) return 'destructive'; // Example for a specific source
  return 'outline';
};


export default function ClientsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const { toast } = useToast();

  const clientStatusFilters: Array<{ label: string; value: LeadStatusType | 'all'; count?: number }> = [
    { label: 'Show all', value: 'all' },
    { label: 'fresher', value: 'fresher' },
    { label: 'installer', value: 'installer' as LeadStatusType }, // Cast if 'installer' is a custom status
    { label: 'ON HOLD', value: 'ON HOLD' },
  ];
  
  const [activeFilter, setActiveFilter] = useState<LeadStatusType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const handleAddClient = () => {
    setSelectedLeadForEdit(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => {
    if ('id' in leadData && leadData.id) {
      setLeads(prevLeads => prevLeads.map(l => l.id === leadData.id ? { ...l, ...leadData, status: leadData.status as LeadStatusType, updatedAt: new Date().toISOString() } : l));
      toast({ title: "Client Updated", description: `${leadData.name}'s information has been updated.` });
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: leadData.email || '', 
        ...leadData,
        status: leadData.status as LeadStatusType,
      };
      setLeads(prevLeads => [newLead, ...prevLeads]);
      toast({ title: "Client Added", description: `${newLead.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedLeadForEdit(null);
  };

  const calculatedStatusFilters = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    LEAD_STATUS_OPTIONS.forEach(status => counts[status] = 0);

    leads.forEach(lead => {
      counts.all++;
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });
    return clientStatusFilters.map(f => ({...f, count: counts[f.value] || 0 }));
  }, [leads]);

  const filteredAndSortedLeads = useMemo(() => {
    let currentLeads = [...leads];
    if (activeFilter !== 'all') {
      currentLeads = currentLeads.filter(lead => lead.status === activeFilter);
    }

    if (sortConfig !== null) {
      currentLeads.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt' || sortConfig.key === 'nextFollowUpDate') {
          const dateA = aValue ? parseISO(aValue as string).getTime() : 0;
          const dateB = bValue ? parseISO(bValue as string).getTime() : 0;
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
        
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return currentLeads;
  }, [leads, activeFilter, sortConfig]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Lead) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 group-hover:opacity-70" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-0 text-primary" /> : 
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 text-primary" />;
  };

  const handleSelectAllRows = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      filteredAndSortedLeads.forEach(lead => newSelectedRows[lead.id] = true);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectRow = (leadId: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [leadId]: checked }));
  };
  
  const isAllSelected = filteredAndSortedLeads.length > 0 && filteredAndSortedLeads.every(lead => selectedRows[lead.id]);
  const isIndeterminate = Object.values(selectedRows).some(Boolean) && !isAllSelected;


  return (
    <>
      <PageHeader
        title={`Clients (${filteredAndSortedLeads.length})`}
        icon={undefined} // No main icon needed if following image closely
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={handleAddClient}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add client
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white">
                        <SquareCheckBig className="h-4 w-4 text-white" />
                        <ChevronDown className="ml-1 h-4 w-4 text-white opacity-70" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Options</DropdownMenuItem>
                    <DropdownMenuItem>Bulk Actions</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

          </div>
        }
      />

      <div className="mb-4 flex items-center gap-x-2 border-b border-border pb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mr-1">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
        </Button>
        {calculatedStatusFilters.map(filter => (
          <Button
            key={filter.value}
            variant={'ghost'}
            size="sm"
            onClick={() => setActiveFilter(filter.value as LeadStatusType | 'all')}
            className={`py-1 px-3 h-auto text-sm font-medium rounded-full relative
                        ${activeFilter === filter.value 
                            ? 'text-primary after:content-[""] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-13px] after:w-full after:h-0.5 after:bg-primary' 
                            : 'text-muted-foreground hover:text-foreground'}`}
          >
            {filter.label}
            <Badge variant={activeFilter === filter.value ? 'default' : 'secondary'} className="ml-1.5 rounded-md px-1.5 py-0 text-[10px] h-5 leading-tight">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>
      
      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent hover:bg-transparent border-b-2 border-border">
                <TableHead className="w-[40px] px-2">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAllRows(Boolean(checked))}
                    aria-label="Select all rows"
                    className="border-muted-foreground data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </TableHead>
                <TableHead className="w-[50px] px-1 group" onClick={() => requestSort('id')}>
                  <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                   # {getSortIndicator('id')}
                  </div>
                </TableHead>
                <TableHead className="w-[150px] px-2 group" onClick={() => requestSort('createdAt')}>
                 <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                    Created on {getSortIndicator('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="px-2 group" onClick={() => requestSort('name')}>
                  <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                    Info {getSortIndicator('name')}
                  </div>
                </TableHead>
                <TableHead className="w-[130px] px-2 group" onClick={() => requestSort('phone')}>
                  <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                    Mobile no. {getSortIndicator('phone')}
                  </div>
                </TableHead>
                <TableHead className="w-[120px] px-2 group" onClick={() => requestSort('source')}>
                  <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                    Source {getSortIndicator('source')}
                  </div>
                </TableHead>
                <TableHead className="w-[180px] px-2 group" onClick={() => requestSort('assignedTo')}>
                 <div className="flex items-center cursor-pointer text-muted-foreground text-xs font-semibold">
                    User {getSortIndicator('assignedTo')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLeads.length > 0 ? filteredAndSortedLeads.map((lead, index) => (
                <TableRow key={lead.id} className="border-b-gray-100 hover:bg-muted/30 data-[state=selected]:bg-primary/10">
                  <TableCell className="px-2">
                    <Checkbox 
                        checked={!!selectedRows[lead.id]}
                        onCheckedChange={(checked) => handleSelectRow(lead.id, Boolean(checked))}
                        aria-label={`Select row ${index + 1}`}
                        className="border-muted-foreground data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                  </TableCell>
                  <TableCell className="px-1 text-xs text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="px-2">
                    <ClientFormattedDateTime dateString={lead.createdAt} />
                  </TableCell>
                  <TableCell className="px-2 font-medium text-sm">
                    <Link href={`/leads/${lead.id}`} className="hover:text-primary hover:underline">
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-2 text-xs">{lead.phone || '-'}</TableCell>
                  <TableCell className="px-2">
                    {lead.source ? <Badge variant={getSourceBadgeVariant(lead.source)} className="text-xs px-2 py-0.5 h-5">{lead.source}</Badge> : '-'}
                  </TableCell>
                  <TableCell className="px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={`https://placehold.co/32x32.png?text=${lead.assignedTo?.charAt(0) || 'S'}`} data-ai-hint="user avatar" alt={lead.assignedTo}/>
                        <AvatarFallback className="text-xs">{(lead.assignedTo || 'S').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{lead.assignedTo || 'System'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No clients match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <LeadForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          lead={selectedLeadForEdit}
        />
      )}
    </>
  );
}

    

    