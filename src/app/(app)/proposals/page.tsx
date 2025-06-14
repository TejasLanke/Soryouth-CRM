
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PROPOSALS } from '@/lib/constants';
import type { Proposal } from '@/types';
import { FileText, PlusCircle, User, ArrowRight, IndianRupee } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface ClientWithProposals {
  clientId: string;
  clientName: string;
  proposalCount: number;
  mostRecentProposalDate?: string;
  totalProposedValue: number;
}

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

  const clientsWithProposals = useMemo(() => {
    const clientsMap = new Map<string, ClientWithProposals>();
    proposals.forEach(proposal => {
      if (!clientsMap.has(proposal.clientId)) {
        clientsMap.set(proposal.clientId, {
          clientId: proposal.clientId,
          clientName: proposal.name, 
          proposalCount: 0,
          mostRecentProposalDate: proposal.createdAt, 
          totalProposedValue: 0,
        });
      }
      const clientEntry = clientsMap.get(proposal.clientId)!;
      clientEntry.proposalCount++;
      clientEntry.totalProposedValue += proposal.finalAmount; // finalAmount is now pre-subsidy
      if (new Date(proposal.createdAt) > new Date(clientEntry.mostRecentProposalDate!)) {
        clientEntry.mostRecentProposalDate = proposal.createdAt;
      }
    });
    return Array.from(clientsMap.values()).sort((a,b) => new Date(b.mostRecentProposalDate!).getTime() - new Date(a.mostRecentProposalDate!).getTime());
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

      {clientsWithProposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for any clients yet.</p>
            <p className="text-sm">Start by creating a new proposal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientsWithProposals.map(client => (
            <Card key={client.clientId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <CardTitle className="font-headline text-xl">{client.clientName}</CardTitle>
                </div>
                <CardDescription>
                  {client.proposalCount} proposal(s)
                  {client.mostRecentProposalDate && (
                    <span className="block text-xs">
                      Last activity: {format(parseISO(client.mostRecentProposalDate), 'dd/MM/yyyy')}
                    </span>
                  )}
                   <span className="block text-xs mt-1">
                      Total Proposed (Pre-Subsidy): <IndianRupee className="inline h-3 w-3 -mt-0.5"/>{client.totalProposedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/proposals/${client.clientId}`}>
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
        proposal={selectedProposalForEdit}
      />
    </>
  );
}
