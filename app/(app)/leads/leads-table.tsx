
'use client';

import type { Lead, LeadStatusType } from '@/types';
import React from 'react';
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
import { Edit2, Trash2, MoreVertical, ArrowUpDown } from 'lucide-react'; // MoreVertical for potential future actions
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

interface LeadsTableProps {
  initialLeads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export function LeadsTable({ initialLeads, onEditLead, onDeleteLead }: LeadsTableProps) {
  
  const getSourceBadgeVariant = (source?: string) => {
    if (source?.toLowerCase() === 'facebook') return 'default'; // Example: 'default' could be blue for Facebook
    if (source?.toLowerCase() === 'website') return 'secondary';
    return 'outline';
  };

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
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Name <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Mobile no. <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Stage <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Last comment <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Next follow-up <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Kilowatt <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="px-1 py-0 h-auto text-xs">Source <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/20">
                  <TableCell>
                    <Checkbox id={`select-lead-${lead.id}`} aria-label={`Select lead ${lead.name}`} />
                  </TableCell>
                  <TableCell className="font-medium py-3">{lead.name}</TableCell>
                  <TableCell className="py-3">{lead.phone || '-'}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="capitalize">{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <div>{lead.lastCommentText || '-'}</div>
                    {lead.lastCommentDate && <div className="text-muted-foreground">{lead.lastCommentDate}</div>}
                  </TableCell>
                  <TableCell className="py-3 text-xs">{lead.nextFollowUpDate || '-'}</TableCell>
                  <TableCell className="py-3">{lead.kilowatt !== undefined ? lead.kilowatt : '-'}</TableCell>
                  <TableCell className="py-3">
                    {lead.source ? <Badge variant={getSourceBadgeVariant(lead.source)}>{lead.source}</Badge> : '-'}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {initialLeads.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
            <UsersRound className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No leads found.</h3>
            <p className="text-sm">Try adjusting your filters or add a new lead.</p>
        </div>
      )}
    </div>
  );
}
