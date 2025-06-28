
'use client';
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table';
import { DROP_REASON_OPTIONS } from '@/lib/constants';
import { Settings2, UserX, ChevronDown, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DroppedLead, DropReasonType, DropReasonFilterItem, DroppedLeadSortConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getDroppedLeads, bulkReactivateLeads } from './actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function DroppedLeadsListPage() {
  const [droppedLeads, setDroppedLeads] = useState<DroppedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DropReasonType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<DroppedLeadSortConfig | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const refreshDroppedLeads = async () => {
    const leads = await getDroppedLeads();
    setDroppedLeads(leads);
  };
  
  useEffect(() => {
    async function fetchDroppedLeads() {
        setIsLoading(true);
        await refreshDroppedLeads();
        setIsLoading(false);
    }
    fetchDroppedLeads();
  }, []);

  const handleBulkReactivate = () => {
    startTransition(async () => {
        const result = await bulkReactivateLeads(selectedLeadIds);
        if (result.success) {
            toast({ title: "Leads Reactivated", description: `${result.count} leads have been moved back to the active leads list.` });
            await refreshDroppedLeads();
            setSelectedLeadIds([]);
        } else {
            toast({ title: "Error", description: result.message || "Failed to reactivate leads.", variant: "destructive" });
        }
    });
  };

  const dropReasonFilters = useMemo((): DropReasonFilterItem[] => {
    const counts: Record<string, number> = {};
    DROP_REASON_OPTIONS.forEach(reason => counts[reason] = 0);
    
    droppedLeads.forEach(lead => {
      if (counts[lead.dropReason] !== undefined) {
        counts[lead.dropReason]++;
      }
    });

    const filters: DropReasonFilterItem[] = [{ label: 'Show all', count: droppedLeads.length, value: 'all' }];
    DROP_REASON_OPTIONS.forEach(reason => {
      if (counts[reason] > 0 || droppedLeads.some(l => l.dropReason === reason)) {
        filters.push({ label: reason, count: counts[reason] || 0, value: reason });
      }
    });
    return filters;
  }, [droppedLeads]);

  const sortedAndFilteredLeads = useMemo(() => {
    let leadsToDisplay = activeFilter === 'all' 
      ? droppedLeads
      : droppedLeads.filter(lead => lead.dropReason === activeFilter);

    if (sortConfig !== null) {
      leadsToDisplay = [...leadsToDisplay].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'droppedAt') {
          const dateA = aValue ? new Date(aValue as string).getTime() : 0;
          const dateB = bValue ? new Date(bValue as string).getTime() : 0;
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
  }, [droppedLeads, activeFilter, sortConfig]);

  const requestSort = (key: keyof DroppedLead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  if (isLoading) {
    return <PageHeader title="Dropped Leads" description="Loading dropped leads..." icon={UserX} />;
  }

  return (
    <>
      <PageHeader
        title="Dropped Leads"
        description="View leads that have been marked as lost."
        icon={UserX}
        actions={
          <div className="flex items-center gap-2">
            {selectedLeadIds.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Repeat className="mr-2 h-4 w-4" /> Activate Leads ({selectedLeadIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reactivate {selectedLeadIds.length} lead(s) and move them back to the active leads list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkReactivate} disabled={isPending}>
                        {isPending ? "Reactivating..." : "Yes, Reactivate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Coming soon!"})}>
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
        selectedIds={selectedLeadIds}
        setSelectedIds={setSelectedLeadIds}
      />
    </>
  );
}
