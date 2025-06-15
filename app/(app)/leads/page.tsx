
'use client';
import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from './leads-table';
import { MOCK_LEADS, LEAD_STATUS_OPTIONS } from '@/lib/constants';
import { UsersRound, Filter, Search, Upload, PlusCircle, Settings2, ListFilter, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadForm } from './lead-form';
import { useToast } from "@/hooks/use-toast";
import type { Lead, LeadStatusType, StatusFilterItem } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<LeadStatusType | 'all'>('all');

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
        email: leadData.email || '', // Ensure email has a default
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
    const counts: Record<LeadStatusType, number> = {} as any;
    LEAD_STATUS_OPTIONS.forEach(status => counts[status] = 0);
    
    leads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });

    const filters: StatusFilterItem[] = [{ label: 'Show all', count: leads.length, value: 'all' }];
    LEAD_STATUS_OPTIONS.forEach(status => {
      // Only include statuses present in MOCK_LEADS or if count > 0
      if (counts[status] > 0 || MOCK_LEADS.some(l => l.status === status)) {
        filters.push({ label: status, count: counts[status] || 0, value: status });
      }
    });
    return filters;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (activeFilter === 'all') {
      return leads;
    }
    return leads.filter(lead => lead.status === activeFilter);
  }, [leads, activeFilter]);

  return (
    <>
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2 sm:mb-0">
            Leads ({leads.length})
          </h1>
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon">
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
              className={`py-1 px-3 h-auto text-xs rounded-full ${activeFilter === filter.value ? 'border-b-2 border-green-500 font-semibold' : 'text-muted-foreground'}`}
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
        initialLeads={filteredLeads} 
        onEditLead={(lead) => { setSelectedLeadForEdit(lead); setIsFormOpen(true); }}
        onDeleteLead={(leadId) => { 
          setLeads(prev => prev.filter(l => l.id !== leadId)); 
          toast({ title: "Lead Deleted" });
        }}
      />

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
