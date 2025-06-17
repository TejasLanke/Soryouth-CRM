
'use client';
import React, { useState, useMemo } from 'react';
// Removed PageHeader import as it's handled by the layout
import { LeadsTable } from '../leads-table'; // Adjusted path for leads-table
import { MOCK_LEADS, LEAD_STATUS_OPTIONS, LEAD_SOURCE_OPTIONS } from '@/lib/constants';
import { Filter, Search, Upload, PlusCircle, Settings2, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadForm } from '../lead-form'; // Adjusted path for lead-form
import { LeadSettingsDialog } from '../lead-settings-dialog'; // Adjusted path
import { useToast } from "@/hooks/use-toast";
import type { Lead, LeadStatusType, StatusFilterItem, SortConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function CurrentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS.filter(lead => lead.status !== 'Lost')); // Filter out 'Lost' leads
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<LeadStatusType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const handleAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => {
    if ('id' in leadData && leadData.id) {
      setLeads(prevLeads => prevLeads.map(l => l.id === leadData.id ? { ...l, ...leadData, status: leadData.status as LeadStatusType, updatedAt: new Date().toISOString() } : l));
      toast({ title: "Lead Updated", description: `${leadData.name}'s information has been updated.` });
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
      toast({ title: "Lead Added", description: `${newLead.name} has been added to leads.` });
    }
    setIsFormOpen(false);
    setSelectedLeadForEdit(null);
  };
  
  const statusFilters = useMemo((): StatusFilterItem[] => {
    const activeLeads = leads.filter(lead => lead.status !== 'Lost');
    const counts: Record<string, number> = {};
    // Initialize counts for all non-Lost statuses
    LEAD_STATUS_OPTIONS.filter(s => s !== 'Lost').forEach(status => counts[status] = 0);
    
    activeLeads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });

    const filters: StatusFilterItem[] = [{ label: 'Show all', count: activeLeads.length, value: 'all' }];
    LEAD_STATUS_OPTIONS.filter(s => s !== 'Lost').forEach(status => {
       if (counts[status] > 0 || MOCK_LEADS.some(l => l.status === status && status !== 'Lost')) {
        filters.push({ label: status, count: counts[status] || 0, value: status });
      }
    });
    return filters;
  }, [leads]);

  const sortedAndFilteredLeads = useMemo(() => {
    let leadsToDisplay = leads.filter(lead => lead.status !== 'Lost');
    if (activeFilter !== 'all') {
      leadsToDisplay = leadsToDisplay.filter(lead => lead.status === activeFilter);
    }
    

    if (sortConfig !== null) {
      leadsToDisplay.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
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
  }, [leads, activeFilter, sortConfig]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      {/* PageHeader is now in layout.tsx */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          {/* Title now comes from layout */}
          <div className="flex items-center gap-2 ml-auto"> {/* Moved buttons to the right */}
            <Button variant="outline" size="sm">
              <ListFilter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAddLead}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {statusFilters.map(filter => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={`py-1 px-3 h-auto text-xs rounded-full ${activeFilter === filter.value ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`} // Changed border color to primary
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
        leads={sortedAndFilteredLeads} 
        onEditLead={(lead) => { setSelectedLeadForEdit(lead); setIsFormOpen(true); }}
        onDeleteLead={(leadId) => { 
          setLeads(prev => prev.filter(l => l.id !== leadId)); 
          toast({ title: "Lead Deleted" });
        }}
        sortConfig={sortConfig}
        requestSort={requestSort}
        viewType="active"
      />

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
    </>
  );
}
