
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MOCK_PROPOSALS, PROPOSAL_STATUSES } from '@/lib/constants';
import type { Proposal } from '@/types';
import { FileText, PlusCircle, Download, Eye, Edit3, IndianRupee, ArrowLeft, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProposalForm } from '../proposal-form'; // Adjusted path
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ProposalStatus = Proposal['status'];

export default function ClientProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [allProposals, setAllProposals] = useState<Proposal[]>(MOCK_PROPOSALS); // Simulates global store
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const clientProposals = useMemo(() => {
    return allProposals.filter(p => p.leadId === leadId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allProposals, leadId]);

  const currentLeadName = useMemo(() => {
    return clientProposals.length > 0 ? clientProposals[0].leadName : MOCK_PROPOSALS.find(p => p.leadId === leadId)?.leadName || "Client";
  }, [clientProposals, leadId]);


  useEffect(() => {
    // In a real app, you might fetch proposals for this leadId here if not already loaded
    if (!leadId) {
        // Handle case where leadId is not available, maybe redirect
        router.push('/proposals');
    }
  }, [leadId, router]);

  const handleCreateNewProposalForClient = () => {
    setSelectedProposalForEdit(null); // Ensure it's for creation
    setIsFormOpen(true);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposalForEdit(proposal);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (proposalData: Omit<Proposal, 'id' | 'createdAt'> | Proposal) => {
    if ('id' in proposalData && proposalData.id) { // Editing existing proposal
      setAllProposals(prev => prev.map(p => p.id === proposalData.id ? { ...p, ...proposalData } : p));
      toast({ title: "Proposal Updated", description: `Proposal ${proposalData.proposalNumber} has been updated.` });
    } else { // Adding new proposal for this specific client
      const newProposalForClient: Proposal = {
        ...(proposalData as Omit<Proposal, 'id' | 'createdAt' | 'leadId'>), // leadName, proposalNumber, amount etc. from form
        id: `p${allProposals.length + 1 + Date.now()}`,
        createdAt: new Date().toISOString(),
        leadId: leadId, // Set leadId from the current page context
        // leadName is already part of proposalData from the form
      };
      setAllProposals(prev => [newProposalForClient, ...prev]);
      toast({ title: "Proposal Created", description: `Proposal ${newProposalForClient.proposalNumber} for ${currentLeadName} has been added.` });
    }
    setIsFormOpen(false);
  };
  
  const getStatusBadgeVariant = (status: ProposalStatus) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Accepted': return 'default'; 
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (!leadId) {
    return (
      <PageHeader title="Loading..." description="Fetching client details." />
    );
  }
  
  return (
    <>
      <PageHeader
        title={`Proposals for ${currentLeadName}`}
        description={`Manage all proposals associated with ${currentLeadName}.`}
        icon={User}
        actions={
          <Button onClick={handleCreateNewProposalForClient}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
          </Button>
        }
      />
       <Button variant="outline" onClick={() => router.push('/proposals')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Clients
      </Button>

      {clientProposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for {currentLeadName} yet.</p>
            <p className="text-sm">You can create the first proposal for them using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientProposals.map((proposal) => (
            <Card key={proposal.id} className="shadow-sm bg-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-md font-semibold">{proposal.proposalNumber}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(proposal.status)} className="capitalize text-xs">
                    {proposal.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">For: {proposal.leadName}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-lg font-bold text-primary flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />{proposal.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {format(new Date(proposal.createdAt), 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valid Until: {format(new Date(proposal.validUntil), 'dd/MM/yyyy')}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-1.5 border-t pt-3 pb-3 px-4">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleEditProposal(proposal)}>
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" disabled> {/* Placeholder */}
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" disabled> {/* Placeholder */}
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="client specific proposals" alt={`Proposals for ${currentLeadName}`} className="w-full rounded-lg object-cover"/>
      </div>
      <ProposalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        proposal={selectedProposalForEdit} // For editing
        initialData={!selectedProposalForEdit ? { leadId: leadId, leadName: currentLeadName } : undefined} // For creating new, prefill current client
      />
    </>
  );
}
