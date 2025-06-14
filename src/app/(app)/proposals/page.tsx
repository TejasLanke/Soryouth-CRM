
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MOCK_PROPOSALS, PROPOSAL_STATUSES } from '@/lib/constants';
import type { Proposal } from '@/types';
import { FileText, PlusCircle, Download, Eye, Edit3, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProposalForm } from './proposal-form'; // To be created
import { useToast } from '@/hooks/use-toast';

type ProposalStatus = Proposal['status'];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const handleCreateNewProposal = () => {
    setSelectedProposal(null);
    setIsFormOpen(true);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (proposalData: Omit<Proposal, 'id' | 'createdAt'> | Proposal) => {
    if ('id' in proposalData && proposalData.id) { // Editing existing proposal
      setProposals(proposals.map(p => p.id === proposalData.id ? { ...p, ...proposalData } : p));
      toast({ title: "Proposal Updated", description: `Proposal ${proposalData.proposalNumber} has been updated.` });
    } else { // Adding new proposal
      const newProposal: Proposal = {
        ...proposalData,
        id: `p${proposals.length + 1 + Date.now()}`, // simple ID generation
        createdAt: new Date().toISOString(),
        // Ensure leadId is handled if it's expected in the Proposal type but not in Omit
        // For this mock setup, leadId is part of Proposal, so we might need to add a placeholder or make it optional in the form if not directly collected
        ...( ('leadId' in proposalData && proposalData.leadId) ? { leadId: proposalData.leadId } : { leadId: `mockLead${Date.now()}` } )
      };
      setProposals([newProposal, ...proposals]);
      toast({ title: "Proposal Created", description: `Proposal ${newProposal.proposalNumber} has been added.` });
    }
    setIsFormOpen(false);
  };


  const proposalsByStatus = PROPOSAL_STATUSES.reduce((acc, status) => {
    acc[status] = proposals.filter(p => p.status === status);
    return acc;
  }, {} as Record<ProposalStatus, Proposal[]>);

  const getStatusBadgeVariant = (status: ProposalStatus) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Sent': return 'default'; 
      case 'Accepted': return 'default'; 
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <>
      <PageHeader
        title="Proposals"
        description="Manage and generate proposals for your clients using a Kanban view."
        icon={FileText}
        actions={
          <Button onClick={handleCreateNewProposal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
          </Button>
        }
      />
      
      <div className="flex flex-col lg:flex-row gap-6 w-full overflow-x-auto pb-4">
        {PROPOSAL_STATUSES.map((status) => (
          <div key={status} className="flex-shrink-0 w-full lg:w-1/4 min-w-[300px]">
            <Card className="bg-muted/50 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="font-headline text-lg flex items-center justify-between">
                  {status}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({proposalsByStatus[status].length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto p-4 pt-0">
                {proposalsByStatus[status].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No proposals in this stage.</p>
                ) : (
                  proposalsByStatus[status].map((proposal) => (
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
                          Created: {new Date(proposal.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid Until: {new Date(proposal.validUntil).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-1.5 border-t pt-3 pb-3 px-4">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleEditProposal(proposal)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2"> {/* Placeholder */}
                          <Eye className="h-3.5 w-3.5" /> 
                        </Button>
                         <Button variant="ghost" size="sm" className="h-7 px-2"> {/* Placeholder */}
                          <Download className="h-3.5 w-3.5" />
                         </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

       <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="proposals kanban board" alt="Proposals Kanban Board" className="w-full rounded-lg object-cover"/>
      </div>

      <ProposalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        proposal={selectedProposal}
      />
    </>
  );
}
