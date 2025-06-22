'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { useState } from 'react';
import { Link } from 'lucide-react';

const tickets = [
  {
    id: 'TICKET001',
    subject: 'Issue with solar panel installation',
    client: 'Jitendra Kadam',
    priority: 'High',
    status: 'Open',
    dueDate: '2023-12-31',
    assignedTo: 'tejas ( 0 )',
  },
  {
    id: 'TICKET002',
    subject: 'Question about billing',
    client: 'Jane Doe',
    priority: 'Medium',
    status: 'Closed',
    dueDate: '2023-11-15',
    assignedTo: 'Unassigned',
  },
  {
    id: 'TICKET003',
    subject: 'Maintenance request',
    client: 'John Smith',
    priority: 'Low',
    status: 'Hold',
    dueDate: '2024-01-20',
    assignedTo: 'tejas ( 0 )',
  },
];

const TicketsPage = () => {
  const [filters, setFilters] = useState({
    dueDate: '',
    status: '',
    overdue: false,
    priority: '',
    assignedTo: '',
  });

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredTickets = tickets.filter((ticket) => {
    let isMatch = true;
    if (filters.dueDate && ticket.dueDate !== filters.dueDate) {
      isMatch = false;
    }
    if (filters.status && filters.status !== 'Show all' && ticket.status !== filters.status) {
      isMatch = false;
    }
    if (filters.overdue && new Date(ticket.dueDate) > new Date()) {
      isMatch = false;
    }
    if (filters.priority && ticket.priority !== filters.priority) {
      isMatch = false;
    }
    if (filters.assignedTo && ticket.assignedTo !== filters.assignedTo) {
      isMatch = false;
    }
    return isMatch;
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader title="Tickets" description="View and manage your support tickets." />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={filters.dueDate}
                onChange={(e) => handleFilterChange('dueDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Show all">Show all</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue"
                checked={filters.overdue}
                onCheckedChange={(checked) => handleFilterChange('overdue', checked)}
              />
              <Label htmlFor="overdue">Show Overdue</Label>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={filters.assignedTo}
                onValueChange={(value) => handleFilterChange('assignedTo', value)}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {/* Replace with actual user data */}
                  <SelectItem value="tejas ( 0 )">tejas ( 0 )</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets</CardTitle>
          <Button>Create Ticket</Button>
        </CardHeader>
        <CardContent>
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
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.id}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.client}</TableCell>
                  <TableCell>{ticket.priority}</TableCell>
                  <TableCell>{ticket.status}</TableCell>
                  <TableCell>{ticket.dueDate}</TableCell>
                  <TableCell>{ticket.assignedTo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsPage;