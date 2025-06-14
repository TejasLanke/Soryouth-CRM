
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PROPOSALS } from '@/lib/constants';
import type { Proposal } from '@/types';
import { FileText, PlusCircle, User, ArrowRight } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { useToast } from '@/hooks/use-toast';

interface LeadWithProposals {
  leadId: string;
  leadName: string;
  proposalCount: number;
  mostRecentProposalDate?: string;
}

export default function ProposalsListPage() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // For the main page, selectedProposal is for editing any proposal, or creating a completely new one.
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const handleCreateNewProposal = () => {
    setSelectedProposal(null);
    setIsFormOpen(true);
  };

  // This edit function is less likely to be used from the main list page now,
  // but kept for completeness if needed, or for a future "edit any proposal" feature.
  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (proposalData: Omit<Proposal, 'id' | 'createdAt'> | Proposal) => {
    if ('id' in proposalData && proposalData.id) {
      setProposals(proposals.map(p => p.id === proposalData.id ? { ...p, ...proposalData } : p));
      toast({ title: "Proposal Updated", description: `Proposal ${proposalData.proposalNumber} has been updated.` });
    } else {
      // This handles creating a proposal for a potentially new lead.
      // leadId will be a mock one if not provided implicitly.
      const newProposal: Proposal = {
        ...(proposalData as Omit<Proposal, 'id' | 'createdAt'>), // Type assertion
        id: `p${proposals.length + 1 + Date.now()}`,
        createdAt: new Date().toISOString(),
        leadId: ('leadId' in proposalData && proposalData.leadId) ? proposalData.leadId : `mockLead${Date.now()}`,
      };
      setProposals([newProposal, ...proposals]);
      toast({ title: "Proposal Created", description: `Proposal ${newProposal.proposalNumber} has been added.` });
    }
    setIsFormOpen(false);
  };

  const leadsWithProposals = useMemo(() => {
    const leadsMap = new Map<string, LeadWithProposals>();
    proposals.forEach(proposal => {
      if (!leadsMap.has(proposal.leadId)) {
        leadsMap.set(proposal.leadId, {
          leadId: proposal.leadId,
          leadName: proposal.leadName,
          proposalCount: 0,
          mostRecentProposalDate: proposal.createdAt,
        });
      }
      const leadEntry = leadsMap.get(proposal.leadId)!;
      leadEntry.proposalCount++;
      if (new Date(proposal.createdAt) > new Date(leadEntry.mostRecentProposalDate!)) {
        leadEntry.mostRecentProposalDate = proposal.createdAt;
      }
    });
    return Array.from(leadsMap.values()).sort((a,b) => b.leadName.localeCompare(a.leadName)); // Sort for consistent order
  }, [proposals]);

  return (
    <>
      <PageHeader
        title="Client Proposals"
        description="View proposals grouped by client or create a new one."
        icon={FileText}
        actions={
          <Button onClick={handleCreateNewProposal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
          </Button>
        }
      />

      {leadsWithProposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for any clients yet.</p>
            <p className="text-sm">Start by creating a new proposal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leadsWithProposals.map(lead => (
            <Card key={lead.leadId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <CardTitle className="font-headline text-xl">{lead.leadName}</CardTitle>
                </div>
                <CardDescription>
                  {lead.proposalCount} proposal(s)
                  {lead.mostRecentProposalDate && (
                    <span className="block text-xs">
                      Last activity: {new Date(lead.mostRecentProposalDate).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/proposals/${lead.leadId}`}>
                    View Proposals <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
       <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="client list proposals" alt="Client List for Proposals" className="w-full rounded-lg object-cover"/>
      </div>

      <ProposalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        proposal={selectedProposal}
        // No initialData here as this form is for general creation or editing any existing.
      />
    </>
  );
}
