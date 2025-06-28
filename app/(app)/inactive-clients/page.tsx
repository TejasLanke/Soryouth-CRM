
'use client';
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table'; // Reusing this for consistent display
import { Filter, Search, Settings2, ListFilter, Rows, Archive, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import type { Client, ClientSortConfig, UserOptionType, ClientStatusType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getInactiveClients, bulkUpdateClients } from '@/app/(app)/clients-list/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { USER_OPTIONS, ACTIVE_CLIENT_STATUS_OPTIONS } from '@/lib/constants';

const allColumns: Record<string, string> = {
    email: 'Email',
    phone: 'Mobile No.',
    status: 'Stage',
    lastCommentText: 'Last Comment',
    nextFollowUpDate: 'Next Follow-up',
    followupCount: 'Followups',
    kilowatt: 'Kilowatt',
    priority: 'Priority',
    assignedTo: 'Assigned To',
};

export default function InactiveClientsListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<ClientSortConfig | null>(null);
  const [isPending, startTransition] = useTransition();

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignToUser, setAssignToUser] = useState<UserOptionType | ''>('');
  const [updateStatusTo, setUpdateStatusTo] = useState<ClientStatusType | ''>('');

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    email: true, phone: true, status: true, lastCommentText: true,
    nextFollowUpDate: true,
    followupCount: true, kilowatt: true, priority: true, assignedTo: true,
  });

  const refreshClients = async () => {
      const inactiveClients = await getInactiveClients();
      setClients(inactiveClients);
  };

  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true);
      await refreshClients();
      setIsLoading(false);
    }
    fetchClients();
  }, []);
  
  const handleBulkUpdate = (action: 'assign' | 'status') => {
    startTransition(async () => {
        let data: Partial<Pick<Client, 'assignedTo' | 'status'>> = {};
        let successMessage = '';

        if (action === 'assign' && assignToUser) {
            data = { assignedTo: assignToUser };
            successMessage = `Assigned to ${assignToUser}.`;
        } else if (action === 'status' && updateStatusTo) {
            data = { status: updateStatusTo };
            successMessage = `Status updated to ${updateStatusTo}. Clients are now active.`;
        } else {
            toast({ title: "No Selection", description: "Please select a value.", variant: "destructive" });
            return;
        }

        const result = await bulkUpdateClients(selectedClientIds, data);
        if (result.success) {
            toast({ title: "Bulk Update Successful", description: `${result.count} clients updated. ${successMessage}` });
            await refreshClients();
            setSelectedClientIds([]);
            setAssignDialogOpen(false);
            setStatusDialogOpen(false);
        } else {
            toast({ title: "Error", description: result.message || "Failed to update clients.", variant: "destructive" });
        }
    });
  };

  const allFilteredClients = useMemo(() => {
    let clientsToDisplay = [...clients];
    
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      clientsToDisplay = clientsToDisplay.filter(client => 
        client.name.toLowerCase().includes(lowercasedTerm) ||
        (client.email && client.email.toLowerCase().includes(lowercasedTerm)) ||
        (client.phone && client.phone.includes(lowercasedTerm))
      );
    }

    if (sortConfig !== null) {
      clientsToDisplay.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return clientsToDisplay;
  }, [clients, sortConfig, searchTerm]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return allFilteredClients.slice(start, end);
  }, [allFilteredClients, currentPage, pageSize]);

  const totalPages = Math.ceil(allFilteredClients.length / pageSize);

  const requestSort = (key: keyof Client) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return <PageHeader title="Inactive Clients" description="Manage your inactive clients." icon={Archive} />;
  }

  return (
    <>
      <PageHeader
        title="Inactive Clients"
        description="Manage your inactive clients. These clients can be reactivated at any time."
        icon={Archive}
        actions={
          <div className="flex items-center gap-2">
            {selectedClientIds.length > 0 ? (
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{selectedClientIds.length} selected</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setAssignDialogOpen(true)}>Assign Clients</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusDialogOpen(true)}>Update Client Status</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Send SMS</DropdownMenuItem>
                        <DropdownMenuItem disabled>Send Whatsapp</DropdownMenuItem>
                        <DropdownMenuItem disabled>Send Email</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon!", description: "Filters for inactive clients will be added in a future update." })}>
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)}>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                </>
            )}
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
                                            setColumnVisibility((prev) => ({ ...prev, [key]: !!value }))
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
                                <DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1); }}>
                                    {[10, 20, 50, 100].map(size => (
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
      
      <LeadsTable
        items={paginatedClients}
        viewType="client" // Uses the client view, links to /clients/[id] which handles both active/inactive
        sortConfig={sortConfig}
        requestSort={requestSort}
        columnVisibility={columnVisibility}
        selectedIds={selectedClientIds}
        setSelectedIds={setSelectedClientIds}
      />

       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedClients.length} of {allFilteredClients.length} inactive clients.
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages}>
            Next
          </Button>
        </div>
      </div>
      
       {isSearchOpen && (
        <AlertDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Search Inactive Clients</AlertDialogTitle>
              <AlertDialogDescription>
                Search by name, email, or phone number.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="search-input" className="sr-only">Search</Label>
              <Input 
                id="search-input"
                placeholder="e.g. Old Project Inc, old@example.com, 987..."
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

      {/* Bulk Action Dialogs */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Assign Selected Clients</DialogTitle>
                  <DialogDescription>Assign the {selectedClientIds.length} selected clients to a user.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="assign-user">Assign to</Label>
                  <Select value={assignToUser} onValueChange={(v) => setAssignToUser(v as UserOptionType)}>
                      <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                      <SelectContent>
                          {USER_OPTIONS.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => handleBulkUpdate('assign')} disabled={isPending || !assignToUser}>Update</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Update Status for Selected Clients</DialogTitle>
                  <DialogDescription>Change the stage for the {selectedClientIds.length} selected clients to reactivate them.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="update-status">New Stage</Label>
                  <Select value={updateStatusTo} onValueChange={(v) => setUpdateStatusTo(v as ClientStatusType)}>
                      <SelectTrigger><SelectValue placeholder="Select a stage to activate" /></SelectTrigger>
                      <SelectContent>
                          {ACTIVE_CLIENT_STATUS_OPTIONS.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => handleBulkUpdate('status')} disabled={isPending || !updateStatusTo}>Update</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
