
'use client';

import type { Lead, LeadStatusType } from '@/types';
import React, { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { LeadForm } from './lead-form';
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import { LEAD_STATUS_OPTIONS } from '@/lib/constants'; // Import for default new lead status if needed

interface LeadsTableProps {
  initialLeads: Lead[];
}

export function LeadsTable({ initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddLead = () => {
    setSelectedLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
    toast({ title: "Lead Deleted", description: "The lead has been successfully deleted." });
  };

  const handleFormSubmit = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status: LeadStatusType } | Lead) => {
    if ('id' in leadData && leadData.id) { // Editing existing lead
      setLeads(leads.map(l => l.id === leadData.id ? { ...l, ...leadData, status: leadData.status as LeadStatusType, updatedAt: new Date().toISOString() } : l));
      toast({ title: "Lead Updated", description: `${leadData.name}'s information has been updated.` });
    } else { // Adding new lead
      const newLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: leadData.status as LeadStatusType, // Ensure status is correctly typed
      };
      setLeads([newLead, ...leads]);
      toast({ title: "Lead Added", description: `${newLead.name} has been added to leads.` });
    }
    setIsFormOpen(false);
  };
  
  const getBadgeVariant = (status: LeadStatusType): VariantProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'New': return 'default';
      case 'Contacted': return 'secondary';
      case 'Qualified': return 'outline'; 
      case 'Proposal Sent': return 'default'; // Consider a specific color, e.g., blue
      case 'Negotiation': return 'default'; // Consider a specific color, e.g., purple
      case 'Won': return 'default'; // Consider a specific color, e.g., green
      case 'Lost': return 'destructive';
      case 'On Hold': return 'secondary'; // Consider a specific color, e.g., yellow/orange
      default: return 'outline'; // Default for any other custom status
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddLead}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>{lead.email}</TableCell>
              <TableCell>{lead.phone || '-'}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(lead.status)}>{lead.status}</Badge>
              </TableCell>
              <TableCell>{lead.source || '-'}</TableCell>
              <TableCell>{lead.assignedTo || '-'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
                          <AlertDialogAction onClick={() => handleDeleteLead(lead.id)} className={buttonVariants({ variant: "destructive" })}>
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
      {leads.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No leads found.</div>
      )}
      <LeadForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        lead={selectedLead}
      />
    </div>
  );
}
