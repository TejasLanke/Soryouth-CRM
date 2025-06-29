'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Proposal, Client, Lead, ClientType } from '@/types';
import { FileText, PlusCircle, User, Building, Home, Briefcase, Rows, IndianRupee, Loader2, Search } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { getActiveClients } from '@/app/(app)/clients-list/actions';
import { getLeads } from '@/app/(app)/leads-list/actions';
import { getAllProposals, createOrUpdateProposal } from './actions';
import { TemplateSelectionDialog } from './template-selection-dialog';
import { Badge } from '@/components/ui/badge';
import { ProposalPreviewDialog } from './proposal-preview-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CLIENT_TYPES } from '@/lib/constants';
import { Input } from '@/components/ui/input';


const ClientTypeIcon = ({ type }: { type: Proposal['clientType'] }) => {
  switch (type) {
    case 'Individual/Bungalow': return <Home className="h-5 w-5 text-muted-foreground" />;
    case 'Housing Society': return <Building className="h-5 w-5 text-muted-foreground" />;
    case 'Commercial': return <Briefcase className="h-5 w-5 text-muted-foreground" />;
    case 'Industrial': return <Briefcase className="h-5 w-5 text-primary" />;
    default: return <User className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function ProposalsListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState<Proposal | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProposalForPreview, setSelectedProposalForPreview] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchAllData = async () => {
    setIsLoading(true);
    const [fetchedClients, fetchedLeads, fetchedProposals] = await Promise.all([
        getActiveClients(),
        getLeads(),
        getAllProposals(),
    ]);
    setClients(fetchedClients);
    setLeads(fetchedLeads);
    setProposals(fetchedProposals);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredProposals = useMemo(() => {
    if (!searchTerm) {
      return proposals;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return proposals.filter(p => 
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.proposalNumber.toLowerCase().includes(lowercasedTerm) ||
      String(p.capacity).includes(lowercasedTerm)
    );
  }, [proposals, searchTerm]);

  const categorizedProposals = useMemo(() => {
    const grouped: Record<ClientType, Proposal[]> = {
      'Individual/Bungalow': [],
      'Housing Society': [],
      'Commercial': [],
      'Industrial': [],
      'Other': []
    };
    filteredProposals.forEach(p => {
        if (grouped[p.clientType]) {
            grouped[p.clientType].push(p);
        } else {
            grouped['Other'].push(p);
        }
    });
    return grouped;
  }, [filteredProposals]);

  const handleCreateNewProposal = () => {
    setSelectedProposalForEdit(null);
    setIsTemplateDialogOpen(true);
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsTemplateDialogOpen(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (submittedProposal: Partial<Proposal>) => {
    const result = await createOrUpdateProposal(submittedProposal);
    if (result) {
      toast({ title: "Proposal Saved", description: `Proposal ${result.proposalNumber} has been successfully saved.` });
      await fetchAllData();
      if(result.pdfUrl) {
          setSelectedProposalForPreview(result);
          setIsPreviewOpen(true);
      }
    } else {
      toast({ title: "Error", description: "Failed to save the proposal.", variant: "destructive" });
    }
    
    setIsFormOpen(false);
    setSelectedProposalForEdit(null);
    setSelectedTemplateId(null);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposalForEdit(proposal);
    setSelectedTemplateId(proposal.templateId || null);
    setIsFormOpen(true);
  };
  
  const renderProposalList = (list: Proposal[], category: ClientType) => {
    if (list.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <p>
            {searchTerm 
              ? `No proposals found for "${searchTerm}" in this category.` 
              : `No proposals for this category yet.`
            }
          </p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-6">
        {list.map(proposal => {
          const customerLink = proposal.clientId
            ? `/clients/${proposal.clientId}`
            : proposal.leadId
            ? `/leads/${proposal.leadId}`
            : '#';

          return (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <ClientTypeIcon type={proposal.clientType} />
                        <Link href={customerLink} className={customerLink !== '#' ? "hover:underline" : "cursor-default"}>
                            <CardTitle className="font-headline text-lg">{proposal.name}</CardTitle>
                        </Link>
                    </div>
                    <Badge variant="outline">{proposal.proposalNumber}</Badge>
                </div>
                <CardDescription className="text-xs pt-1">
                  Capacity: {proposal.capacity} kW | Contact: {proposal.contactPerson}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-lg font-bold text-primary flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />{proposal.finalAmount.toLocaleString('en-IN')}
                  <span className="text-xs text-muted-foreground ml-1">(Pre-Subsidy)</span>
                </p>
                 <p className="text-xs text-muted-foreground mt-1">
                  Created: {format(parseISO(proposal.createdAt), 'dd MMM, yyyy')}
                </p>
              </CardContent>
               <div className="px-6 pb-4">
                 <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditProposal(proposal)}>
                    Edit &amp; Regenerate Proposal
                </Button>
               </div>
            </Card>
          )
        })}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="All Proposals"
        description="View all proposals or create new ones for existing or new clients."
        icon={FileText}
        actions={
          <div className="flex gap-2 items-center">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search proposals..."
                className="pl-8 sm:w-[250px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateNewProposal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
            </Button>
            <Button asChild variant="outline">
              <Link href="/proposals/batch">
                <Rows className="mr-2 h-4 w-4" /> Batch Generation
              </Link>
            </Button>
          </div>
        }
      />
      {isLoading ? (
         <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found yet.</p>
            <p className="text-sm">Start by creating a new proposal.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={CLIENT_TYPES[0]} className="w-full">
            <TabsList>
                {CLIENT_TYPES.filter(type => type !== 'Other').map(type => (
                    <TabsTrigger key={type} value={type}>
                        {type} ({categorizedProposals[type].length})
                    </TabsTrigger>
                ))}
            </TabsList>
            {CLIENT_TYPES.filter(type => type !== 'Other').map(type => (
                 <TabsContent key={type} value={type}>
                    {renderProposalList(categorizedProposals[type], type)}
                 </TabsContent>
            ))}
        </Tabs>
      )}

      <TemplateSelectionDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelect={handleTemplateSelected}
      />

      <ProposalForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedProposalForEdit(null); setSelectedTemplateId(null); }}
        onSubmit={handleFormSubmit}
        proposal={selectedProposalForEdit}
        templateId={selectedTemplateId}
        clients={clients}
        leads={leads}
      />
      {isPreviewOpen && selectedProposalForPreview && (
        <ProposalPreviewDialog
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            pdfUrl={selectedProposalForPreview.pdfUrl || null}
            docxUrl={selectedProposalForPreview.docxUrl || null}
        />
      )}
    </>
  );
}
