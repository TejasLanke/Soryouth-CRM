
'use client';
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table';
import { LEAD_STATUS_OPTIONS, LEAD_SOURCE_OPTIONS } from '@/lib/constants';
import { Filter, Search, Upload, PlusCircle, Settings2, ListChecks, ListFilter, Rows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/app/(app)/leads/lead-form';
import { LeadSettingsDialog } from '@/app/(app)/leads/lead-settings-dialog';
import { useToast } from "@/hooks/use-toast";
import type { Lead, LeadStatusType, StatusFilterItem, SortConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { getLeads, createLead, updateLead, deleteLead } from './actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const allColumns: Record<string, string> = {
    email: 'Email',
    phone: 'Mobile No.',
    status: 'Stage',
    lastCommentText: 'Last Comment',
    nextFollowUpDate: 'Next Follow-up',
    followUpCount: 'Followups',
    calls: 'Calls',
    kilowatt: 'Kilowatt',
    source: 'Source',
    priority: 'Priority',
    assignedTo: 'Assigned To',
};


export default function LeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<LeadStatusType | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<string>('Show all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isPending, startTransition] = useTransition();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    email: true,
    phone: true,
    status: true,
    lastCommentText: true,
    nextFollowUpDate: true,
    followUpCount: true,
    calls: false,
    kilowatt: true,
    source: false,
    priority: true,
    assignedTo: true,
  });

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      const fetchedLeads = await getLeads();
      setLeads(fetchedLeads.filter(lead => lead.status !== 'Lost'));
      setIsLoading(false);
    }
    fetchLeads();
  }, []);

  const handleAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpCount'> | Lead) => {
    startTransition(async () => {
      let result;
      if ('id' in leadData && leadData.id) { // Existing lead
        result = await updateLead(leadData.id, leadData as Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>);
        if (result) {
          setLeads(prevLeads => prevLeads.map(l => l.id === result!.id ? result! : l));
          toast({ title: "Lead Updated", description: `${result.name}'s information has been updated.` });
        } else {
          toast({ title: "Error", description: "Failed to update lead.", variant: "destructive" });
        }
      } else { // New lead
        result = await createLead(leadData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpCount'>);
        if (result) {
          setLeads(prevLeads => [result!, ...prevLeads].filter(l => l.status !== 'Lost'));
          toast({ title: "Lead Added", description: `${result.name} has been added to leads.` });
        } else {
          toast({ title: "Error", description: "Failed to create lead.", variant: "destructive" });
        }
      }
      if (result) {
        setIsFormOpen(false);
        setSelectedLeadForEdit(null);
      }
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    startTransition(async () => {
      const { success } = await deleteLead(leadId);
      if (success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        toast({ title: "Lead Deleted" });
      } else {
        toast({ title: "Error", description: "Failed to delete lead.", variant: "destructive" });
      }
    });
  };
  
  const statusFilters = useMemo((): StatusFilterItem[] => {
    const activeLeads = leads.filter(lead => lead.status !== 'Lost');
    const counts: Record<string, number> = {};
    LEAD_STATUS_OPTIONS.filter(s => s !== 'Lost').forEach(status => counts[status] = 0);
    
    activeLeads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });

    const filters: StatusFilterItem[] = [{ label: 'Show all', count: activeLeads.length, value: 'all' }];
    LEAD_STATUS_OPTIONS.filter(s => s !== 'Lost').forEach(status => {
       if (counts[status] > 0 || LEAD_STATUS_OPTIONS.includes(status as LeadStatusType)) {
        filters.push({ label: status, count: counts[status] || 0, value: status });
      }
    });
    return filters;
  }, [leads]);

  const allFilteredLeads = useMemo(() => {
    let leadsToDisplay = leads.filter(lead => lead.status !== 'Lost');
    
    if (activeFilter !== 'all') {
      leadsToDisplay = leadsToDisplay.filter(lead => lead.status === activeFilter);
    }
    
    const today = startOfDay(new Date());
    switch(quickFilter) {
      case 'Assigned today':
        leadsToDisplay = leadsToDisplay.filter(lead => isSameDay(parseISO(lead.createdAt), today));
        break;
      case 'Followed today':
        leadsToDisplay = leadsToDisplay.filter(lead => {
            if (!lead.lastCommentDate) return false;
            const [day, month, year] = lead.lastCommentDate.split('-').map(Number);
            return isSameDay(new Date(year, month - 1, day), today);
        });
        break;
      case 'Not followed today':
        leadsToDisplay = leadsToDisplay.filter(lead => {
            if (!lead.lastCommentDate) return true;
            const [day, month, year] = lead.lastCommentDate.split('-').map(Number);
            return !isSameDay(new Date(year, month - 1, day), today);
        });
        break;
      case 'Unattended':
        leadsToDisplay = leadsToDisplay.filter(lead => !lead.assignedTo);
        break;
      case 'No stage':
        leadsToDisplay = leadsToDisplay.filter(lead => lead.status === 'fresher' || lead.status === 'New');
        break;
      case 'Show all':
      default:
        break;
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      leadsToDisplay = leadsToDisplay.filter(lead => 
        lead.name.toLowerCase().includes(lowercasedTerm) ||
        (lead.email && lead.email.toLowerCase().includes(lowercasedTerm)) ||
        (lead.phone && lead.phone.includes(lowercasedTerm))
      );
    }

    if (sortConfig !== null) {
      leadsToDisplay.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (sortConfig.key === 'nextFollowUpDate') {
          const dateA = aValue ? parseISO(aValue as string).getTime() : 0;
          const dateB = bValue ? parseISO(bValue as string).getTime() : 0;
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
        
        if (sortConfig.key === 'kilowatt') {
           if (Number(aValue) < Number(bValue)) return sortConfig.direction === 'ascending' ? -1 : 1;
           if (Number(aValue) > Number(bValue)) return sortConfig.direction === 'ascending' ? 1 : -1;
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
    return leadsToDisplay;
  }, [leads, activeFilter, sortConfig, quickFilter, searchTerm]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return allFilteredLeads.slice(start, end);
  }, [allFilteredLeads, currentPage, pageSize]);

  const totalPages = Math.ceil(allFilteredLeads.length / pageSize);


  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return (
      <PageHeader
        title="Active Leads"
        description="Manage all active leads in the pipeline."
        icon={ListChecks}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Active Leads"
        description="Manage all active leads in the pipeline."
        icon={ListChecks}
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['Assigned today', 'Followed today', 'Not followed today', 'Unattended', 'No stage', 'Duplicate', 'Show all'].map(item => (
                  <DropdownMenuItem key={item} onSelect={() => setQuickFilter(item)} disabled={item === 'Duplicate'}>
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAddLead} disabled={isPending}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>View Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <ListFilter className="mr-2 h-4 w-4" />
                            <span>Columns</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(allColumns).map(([key, label]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        className="capitalize"
                                        checked={columnVisibility[key]}
                                        onCheckedChange={(value) =>
                                            setColumnVisibility((prev) => ({
                                                ...prev,
                                                [key]: !!value,
                                            }))
                                        }
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Rows className="mr-2 h-4 w-4" />
                            <span>Rows per page</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup 
                                  value={String(pageSize)} 
                                  onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setCurrentPage(1);
                                }}>
                                    {[10, 20, 50, 100, 500].map(size => (
                                        <DropdownMenuRadioItem key={size} value={String(size)}>{size}</DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {statusFilters.map(filter => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={`py-1 px-3 h-auto text-xs rounded-full ${activeFilter === filter.value ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
            >
              {filter.label}
              <Badge variant={activeFilter === filter.value ? 'default' : 'secondary'} className="ml-2 rounded-sm px-1.5 py-0.5 text-[10px] h-4 leading-none">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
      
      <LeadsTable 
        leads={paginatedLeads} 
        onEditLead={(lead) => { setSelectedLeadForEdit(lead); setIsFormOpen(true); }}
        onDeleteLead={handleDeleteLead}
        sortConfig={sortConfig}
        requestSort={requestSort}
        viewType="active"
        columnVisibility={columnVisibility}
      />

       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedLeads.length} of {allFilteredLeads.length} leads.
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <LeadForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          lead={selectedLeadForEdit}
        />
      )}
      {isSettingsDialogOpen && (
        <LeadSettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
          initialStatuses={[...LEAD_STATUS_OPTIONS]}
          initialSources={[...LEAD_SOURCE_OPTIONS]}
        />
      )}
       {isSearchOpen && (
        <AlertDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Search Leads</AlertDialogTitle>
              <AlertDialogDescription>
                Search by name, email, or phone number.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="search-input" className="sr-only">Search</Label>
              <Input 
                id="search-input"
                placeholder="e.g. John Doe, john@example.com, 987..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setSearchTerm(''); setIsSearchOpen(false);}}>Clear & Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setIsSearchOpen(false)}>Apply</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
