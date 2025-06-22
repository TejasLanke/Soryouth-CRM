
'use client';

import type { Lead, SortConfig, DropReasonType } from '@/types';
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link'; // Added Link
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, MoreVertical, ArrowUpDown, UsersRound, UserCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface LeadsTableProps {
  leads: Lead[];
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  sortConfig?: SortConfig | null;
  requestSort?: (key: keyof Lead) => void;
  viewType?: 'active' | 'dropped';
  columnVisibility?: Record<string, boolean>;
}

// Helper function for date formatting
const formatDateInternal = (dateString?: string, includeTime: boolean = false) => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return includeTime ? format(date, 'dd-MM-yyyy HH:mm') : format(date, 'dd-MM-yyyy');
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

const ClientFormattedDateTime: React.FC<{ dateString?: string }> = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateString) {
      setFormattedDate(formatDateInternal(dateString, true));
    } else {
      setFormattedDate('-');
    }
  }, [dateString]);

  if (formattedDate === null) {
    return <span className="text-muted-foreground">Loading time...</span>;
  }
  return <>{formattedDate}</>;
};


export function LeadsTable({ leads, onEditLead, onDeleteLead, sortConfig, requestSort, viewType = 'active', columnVisibility }: LeadsTableProps) {

  const getSourceBadgeVariant = (source?: string) => {
    if (!source) return 'outline';
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('facebook')) return 'default';
    if (lowerSource.includes('website') || lowerSource.includes('online')) return 'secondary';
    if (lowerSource.includes('referral')) return 'default';
    return 'outline';
  };

  const getSortIndicator = (key: keyof Lead) => {
    if (!requestSort || !sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ?
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-0 text-primary" /> :
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 text-primary" />;
  };

  const formatDate = (dateString?: string) => {
    return formatDateInternal(dateString, false);
  };


  const renderHeaderCell = (label: string, sortKey: keyof Lead) => (
    <TableHead className="text-muted-foreground whitespace-nowrap">
      {requestSort ? (
        <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs" onClick={() => requestSort(sortKey)}>
          {label} {getSortIndicator(sortKey)}
        </Button>
      ) : (
        label
      )}
    </TableHead>
  );

  const renderActiveViewRow = (lead: Lead, index: number) => (
     <TableRow key={lead.id} className="hover:bg-muted/20">
      <TableCell>
        <Checkbox id={`select-lead-${lead.id}`} aria-label={`Select lead ${lead.name}`} />
      </TableCell>
      <TableCell className="font-medium py-3">
        <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
          {lead.name}
        </Link>
      </TableCell>
      {(!columnVisibility || columnVisibility.email) && <TableCell className="py-3 text-xs">{lead.email || '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.phone) && <TableCell className="py-3">{lead.phone || '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.status) && <TableCell className="py-3"><Badge variant="secondary" className="capitalize">{lead.status}</Badge></TableCell>}
      {(!columnVisibility || columnVisibility.lastCommentText) && <TableCell className="py-3 text-xs"><div>{lead.lastCommentText || '-'}</div>{lead.lastCommentDate && <div className="text-muted-foreground">{lead.lastCommentDate}</div>}</TableCell>}
      {(!columnVisibility || columnVisibility.nextFollowUpDate) && <TableCell className="py-3 text-xs">{lead.nextFollowUpDate ? `${formatDate(lead.nextFollowUpDate)} ${lead.nextFollowUpTime || ''}`.trim() : '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.followupCount) && <TableCell className="py-3 text-center">{lead.followUpCount || 0}</TableCell>}
      {(!columnVisibility || columnVisibility.calls) && <TableCell className="py-3 text-center">{0}</TableCell>}
      {(!columnVisibility || columnVisibility.kilowatt) && <TableCell className="py-3">{lead.kilowatt !== undefined ? `${lead.kilowatt} kW` : '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.source) && <TableCell className="py-3">{lead.source ? <Badge variant={getSourceBadgeVariant(lead.source)}>{lead.source}</Badge> : '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.priority) && <TableCell className="py-3">{lead.priority ? <Badge variant={lead.priority === 'High' ? 'destructive' : lead.priority === 'Medium' ? 'secondary' : 'outline'} className="capitalize">{lead.priority}</Badge> : '-'}</TableCell>}
      {(!columnVisibility || columnVisibility.assignedTo) && <TableCell className="py-3">{lead.assignedTo || '-'}</TableCell>}
      
      {onEditLead && onDeleteLead && (
        <TableCell className="text-right py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditLead(lead)}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the lead "{lead.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteLead(lead.id)} className={buttonVariants({ variant: "destructive" })}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );

  const renderDroppedViewRow = (lead: Lead, index: number) => (
    <TableRow key={lead.id} className="hover:bg-muted/20">
      <TableCell>
        <Checkbox id={`select-lead-${lead.id}`} aria-label={`Select lead ${lead.name}`} />
      </TableCell>
      <TableCell className="py-3 text-center">{index + 1}</TableCell>
      <TableCell className="py-3 text-xs whitespace-nowrap">
        <ClientFormattedDateTime dateString={lead.createdAt} />
      </TableCell>
      <TableCell className="font-medium py-3">
         <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
          {lead.name}
        </Link>
      </TableCell>
      <TableCell className="py-3">{lead.phone || '-'}</TableCell>
      <TableCell className="py-3">{lead.dropReason || '-'}</TableCell>
      <TableCell className="py-3 text-xs whitespace-nowrap">{formatDate(lead.updatedAt)}</TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${lead.assignedTo?.charAt(0) || 'U'}`} data-ai-hint="user avatar" alt={lead.assignedTo || 'User'} />
            <AvatarFallback>{lead.assignedTo ? lead.assignedTo.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-xs">{lead.assignedTo || '-'}</span>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[50px] text-muted-foreground">
                  <Checkbox id="selectAllLeads" aria-label="Select all leads" />
                </TableHead>
                {viewType === 'dropped' && (
                  <>
                    {renderHeaderCell('#', 'id')}
                    {renderHeaderCell('Created on', 'createdAt')}
                    {renderHeaderCell('Info', 'name')}
                    {renderHeaderCell('Mobile no.', 'phone')}
                    {renderHeaderCell('Drop reason', 'dropReason')}
                    {renderHeaderCell('Drop date', 'updatedAt')}
                    {renderHeaderCell('User', 'assignedTo')}
                  </>
                )}
                {viewType === 'active' && (
                  <>
                    {renderHeaderCell('Name', 'name')}
                    {(!columnVisibility || columnVisibility.email) && renderHeaderCell('Email', 'email')}
                    {(!columnVisibility || columnVisibility.phone) && renderHeaderCell('Mobile no.', 'phone')}
                    {(!columnVisibility || columnVisibility.status) && renderHeaderCell('Stage', 'status')}
                    {(!columnVisibility || columnVisibility.lastCommentText) && renderHeaderCell('Last comment', 'lastCommentText')}
                    {(!columnVisibility || columnVisibility.nextFollowUpDate) && renderHeaderCell('Next follow-up', 'nextFollowUpDate')}
                    {(!columnVisibility || columnVisibility.followupCount) && renderHeaderCell('Followups', 'followUpCount')}
                    {(!columnVisibility || columnVisibility.calls) && <TableHead className="text-muted-foreground whitespace-nowrap">Calls</TableHead>}
                    {(!columnVisibility || columnVisibility.kilowatt) && renderHeaderCell('Kilowatt', 'kilowatt')}
                    {(!columnVisibility || columnVisibility.source) && renderHeaderCell('Source', 'source')}
                    {(!columnVisibility || columnVisibility.priority) && renderHeaderCell('Priority', 'priority')}
                    {(!columnVisibility || columnVisibility.assignedTo) && renderHeaderCell('Assigned To', 'assignedTo')}
                    {onEditLead && onDeleteLead && <TableHead className="text-right text-muted-foreground">Actions</TableHead>}
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, index) => viewType === 'dropped' ? renderDroppedViewRow(lead, index) : renderActiveViewRow(lead, index))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {leads.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
            <UsersRound className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No leads found.</h3>
            <p className="text-sm">Try adjusting your filters or add a new lead.</p>
        </div>
      )}
    </div>
  );
}
