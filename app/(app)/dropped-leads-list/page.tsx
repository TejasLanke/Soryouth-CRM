
'use client';
import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table';
import { MOCK_LEADS, DROP_REASON_OPTIONS } from '@/lib/constants';
import { Search, Settings2, ListFilter, UserX } from 'lucide-react'; // Filter icon imported as ListFilter
import { Button } from '@/components/ui/button';
import type { Lead, DropReasonType, DropReasonFilterItem, LeadSortConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function DroppedLeadsListPage() {
  const allLeads: Lead[] = MOCK_LEADS;
  const initialDroppedLeads = allLeads.filter(lead => lead.status === 'Lost');
  
  // Note: We don't typically edit or add "dropped" leads directly from this list.
  // This page is primarily for viewing. Actions like "restore lead" could be added.
  // const [droppedLeads, setDroppedLeads] = useState<Lead[]>(initialDroppedLeads); 
  const [activeFilter, setActiveFilter] = useState<DropReasonType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<LeadSortConfig | null>(null);

  const dropReasonFilters = useMemo((): DropReasonFilterItem[] => {
    const counts: Record<string, number> = {};
    DROP_REASON_OPTIONS.forEach(reason => counts[reason] = 0);
    
    initialDroppedLeads.forEach(lead => {
      if (lead.dropReason && counts[lead.dropReason] !== undefined) {
        counts[lead.dropReason]++;
      }
    });

    const filters: DropReasonFilterItem[] = [{ label: 'Show all', count: initialDroppedLeads.length, value: 'all' }];
    DROP_REASON_OPTIONS.forEach(reason => {
      if (counts[reason] > 0 || initialDroppedLeads.some(l => l.dropReason === reason)) {
        filters.push({ label: reason, count: counts[reason] || 0, value: reason });
      }
    });
    return filters;
  }, [initialDroppedLeads]);

  const sortedAndFilteredLeads = useMemo(() => {
    let leadsToDisplay = activeFilter === 'all' 
      ? initialDroppedLeads
      : initialDroppedLeads.filter(lead => lead.dropReason === activeFilter);

    if (sortConfig !== null) {
      leadsToDisplay = [...leadsToDisplay].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          const dateA = aValue ? parseISO(aValue as string).getTime() : 0;
          const dateB = bValue ? parseISO(bValue as string).getTime() : 0;
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
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
  }, [initialDroppedLeads, activeFilter, sortConfig]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <PageHeader
        title="Dropped Leads"
        description="View leads that have been marked as lost."
        icon={UserX}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3">
              <Search className="mr-1.5 h-3.5 w-3.5" /> Search
            </Button>
             <Button variant="outline" size="sm" className="h-8 px-3">
                <CheckboxIcon className="mr-1.5 h-3.5 w-3.5" /> 
                <ListFilter className="ml-1 h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {dropReasonFilters.map(filter => (
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
        items={sortedAndFilteredLeads} 
        viewType="dropped"
        sortConfig={sortConfig}
        requestSort={requestSort}
      />
       <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="dropped leads list" alt="Dropped Leads" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}

const CheckboxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <polyline points="9 12 12 15 15 9"></polyline>
  </svg>
);
