
'use client';

// This page mirrors /proposals/[leadId]/page.tsx for consistency.
// Consider removing this route if /proposals is the sole intended path.

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
import { ProposalForm } from '../../proposals/proposal-form'; // Use the central ProposalForm
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ProposalStatus = Proposal['status'];

export default function ClientQuotationsRedirectPage() { // Renamed component for clarity
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [allProposals, setAllProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
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
    if (!leadId) {
      router.push('/quotations'); // Or /proposals, maintaining consistency with current route path
    }
  }, [leadId, router]);

  const handleCreateNewProposalForClient = () => {
    setSelectedProposalForEdit(null);
    setIsFormOpen(true);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposalForEdit(proposal);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (proposalData: Omit<Proposal, 'id' | 'createdAt'> | Proposal) => {
    if ('id' in proposalData && proposalData.id) {
      setAllProposals(prev => prev.map(p => p.id === proposalData.id ? { ...p, ...proposalData } : p));
      toast({ title: "Proposal Updated", description: `Proposal ${proposalData.proposalNumber} has been updated.` });
    } else {
      const newProposalForClient: Proposal = {
        ...(proposalData as Omit<Proposal, 'id' | 'createdAt' | 'leadId'>),
        id: `p${allProposals.length + 1 + Date.now()}`,
        createdAt: new Date().toISOString(),
        leadId: leadId,
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
    return <PageHeader title="Loading..." />;
  }
  
  return (
    <>
      <PageHeader
        title={`Proposals for ${currentLeadName} (via /quotations)`} // Title for clarity
        description={`Manage all proposals associated with ${currentLeadName}.`}
        icon={User}
        actions={
          <Button onClick={handleCreateNewProposalForClient}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
          </Button>
        }
      />
      <Button variant="outline" onClick={() => router.push('/quotations')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Clients
      </Button>

      {clientProposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for {currentLeadName} yet.</p>
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
                <Button variant="ghost" size="sm" className="h-7 px-2" disabled>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" disabled>
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
        proposal={selectedProposalForEdit}
        initialData={!selectedProposalForEdit ? { leadId: leadId, leadName: currentLeadName } : undefined}
      />
    </>
  );
}
