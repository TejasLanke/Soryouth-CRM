
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useState, useEffect, useMemo } from 'react';
import { Ticket, PlusCircle, CalendarIcon, UserCircle, Users, ChevronDown, Loader2 } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getTickets } from './actions';
import { getUsers } from '../users/actions';
import type { Tickets as TicketsType, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CreateTicketForm } from '@/components/create-ticket-form';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TicketFilters = {
  dueDate: Date | undefined;
  status: string;
  priority: string;
  assignedToId: string;
  isOverdue: boolean;
};

const TICKET_STATUSES = ['Open', 'On Hold', 'Closed'];
const TICKET_PRIORITIES = ['High', 'Medium', 'Low'];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketsType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState<TicketFilters>({
    dueDate: undefined,
    status: 'all',
    priority: 'all',
    assignedToId: 'all',
    isOverdue: false,
  });
  
  const refreshTickets = async () => {
    setIsLoading(true);
    const [fetchedTickets, fetchedUsers] = await Promise.all([getTickets(), getUsers()]);
    setTickets(fetchedTickets);
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshTickets();
  }, []);

  const handleFilterChange = <K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const statusCounts = useMemo(() => {
    const counts = { Open: 0, 'On Hold': 0, Closed: 0 };
    tickets.forEach(ticket => {
      if (ticket.status in counts) {
        counts[ticket.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (filters.status !== 'all' && ticket.status !== filters.status) return false;
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
      if (filters.assignedToId !== 'all' && ticket.assignedToId !== filters.assignedToId) return false;
      if (filters.isOverdue && (new Date(ticket.dueDate) >= startOfDay(new Date()) || ticket.status === 'Closed')) return false;
      if (filters.dueDate && format(new Date(ticket.dueDate), 'yyyy-MM-dd') !== format(filters.dueDate, 'yyyy-MM-dd')) return false;
      return true;
    });
  }, [tickets, filters]);
  
  const getPriorityBadgeVariant = (priority: string) => {
    switch(priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <>
      <PageHeader title="Tickets" description="View and manage your support tickets." icon={Ticket} />
      <div className="flex gap-6 h-full">
        <main className="flex-1 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Tickets</CardTitle>
              <Button size="sm" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Ticket
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center h-24">No tickets found.</TableCell></TableRow>
                    ) : (
                        filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">#{ticket.id.slice(-6)}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>
                                <Link href={`/clients/${ticket.clientId}`} className="hover:underline text-primary">{ticket.client.name}</Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                            </TableCell>
                            <TableCell>{ticket.status}</TableCell>
                            <TableCell>{format(new Date(ticket.dueDate), 'dd MMM, yyyy')}</TableCell>
                            <TableCell>{ticket.assignedTo?.name || 'Unassigned'}</TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="w-64 flex-shrink-0">
          <Card>
            <CardHeader><CardTitle className="text-base">Filter tickets by</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Due date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dueDate ? format(filters.dueDate, 'PPP') : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.dueDate} onSelect={(d) => handleFilterChange('dueDate', d || undefined)} initialFocus/></PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => handleFilterChange('status', 'Open')}><p>Open</p><Badge variant="outline">{statusCounts.Open}</Badge></div>
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => handleFilterChange('status', 'On Hold')}><p>Hold</p><Badge variant="outline">{statusCounts['On Hold']}</Badge></div>
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => handleFilterChange('status', 'Closed')}><p>Closed</p><Badge variant="outline">{statusCounts.Closed}</Badge></div>
                    <div className="cursor-pointer" onClick={() => handleFilterChange('status', 'all')}>Show all</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="overdue" checked={filters.isOverdue} onCheckedChange={(checked) => handleFilterChange('isOverdue', !!checked)} />
                <Label htmlFor="overdue">Show Overdue</Label>
              </div>

              <div className="space-y-2">
                 <Label>Priority</Label>
                 <Select value={filters.priority} onValueChange={(v) => handleFilterChange('priority', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                    <SelectItem value="all">Show all</SelectItem>
                    {TICKET_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                 </SelectContent></Select>
              </div>

               <div className="space-y-2">
                 <Label>Users</Label>
                 <Select value={filters.assignedToId} onValueChange={(v) => handleFilterChange('assignedToId', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5"/>
                            <div><p>All users</p><p className="text-xs text-muted-foreground">Tickets for all users</p></div>
                        </div>
                    </SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                 </SelectContent></Select>
              </div>

            </CardContent>
          </Card>
        </aside>
      </div>
      <CreateTicketForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onTicketCreated={refreshTickets} />
    </>
  );
}
