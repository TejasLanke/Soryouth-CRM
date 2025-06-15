
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PROPOSALS, CLIENT_TYPES } from '@/lib/constants'; // Assuming CLIENT_TYPES is useful here, or remove
import type { Proposal, ClientType } from '@/types';
import { FileText, PlusCircle, User, ArrowRight, Building, Home, Briefcase, Rows } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { useToast } from '@/hooks/use-toast';
import { parseISO, format } from 'date-fns';

interface ClientSummary {
  clientId: string;
  clientName: string;
  clientType: Proposal['clientType'];
  proposalCount: number;
  latestProposalCapacity?: number;
  mostRecentProposalTimestamp: string;
}

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
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const handleCreateNewProposal = () => {
    setSelectedProposalForEdit(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (submittedProposal: Proposal) => {
    const existingProposalIndex = proposals.findIndex(p => p.id === submittedProposal.id);

    if (existingProposalIndex > -1) {
      const updatedProposals = [...proposals];
      updatedProposals[existingProposalIndex] = submittedProposal;
      setProposals(updatedProposals);
      toast({ title: "Proposal Updated", description: `Proposal ${submittedProposal.proposalNumber} has been updated.` });
    } else {
      setProposals(prev => [submittedProposal, ...prev]);
      toast({ title: "Proposal Created", description: `Proposal ${submittedProposal.proposalNumber} for ${submittedProposal.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedProposalForEdit(null);
  };

  const clientsSummary = useMemo(() => {
    const clientsMap = new Map<string, ClientSummary>();

    proposals.forEach(proposal => {
      if (!clientsMap.has(proposal.clientId)) {
        clientsMap.set(proposal.clientId, {
          clientId: proposal.clientId,
          clientName: proposal.name,
          clientType: proposal.clientType,
          proposalCount: 0,
          latestProposalCapacity: undefined,
          mostRecentProposalTimestamp: '1970-01-01T00:00:00.000Z',
        });
      }

      const clientEntry = clientsMap.get(proposal.clientId)!;
      clientEntry.proposalCount++;

      const proposalTimestamp = proposal.proposalDate || proposal.createdAt;
      if (parseISO(proposalTimestamp) > parseISO(clientEntry.mostRecentProposalTimestamp)) {
        clientEntry.mostRecentProposalTimestamp = proposalTimestamp;
        clientEntry.latestProposalCapacity = proposal.capacity;
        clientEntry.clientType = proposal.clientType;
      }
    });

    return Array.from(clientsMap.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [proposals]);

  return (
    <>
      <PageHeader
        title="Client Proposals"
        description="View proposals grouped by client or create new ones."
        icon={FileText}
        actions={
          <div className="flex gap-2">
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

      {clientsSummary.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for any clients yet.</p>
            <p className="text-sm">Start by creating a new proposal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientsSummary.map(client => (
            <Card key={client.clientId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <ClientTypeIcon type={client.clientType} />
                  <CardTitle className="font-headline text-xl">{client.clientName}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {client.clientType}
                </CardDescription>
                <CardDescription>
                  {client.proposalCount} proposal(s)
                  {client.latestProposalCapacity !== undefined && (
                    <span className="block text-sm mt-1">
                      Latest Proposal Capacity: {client.latestProposalCapacity} kW
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/proposals/${client.clientId}`}>
                    View Client Proposals <ArrowRight className="ml-2 h-4 w-4" />
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
        onClose={() => { setIsFormOpen(false); setSelectedProposalForEdit(null); }}
        onSubmit={handleFormSubmit}
        proposal={selectedProposalForEdit}
      />
    </>
  );
}
