
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MOCK_PROPOSALS } from '@/lib/constants';
import type { Proposal } from '@/types';
import { FileText, PlusCircle, Download, Eye, Edit3, IndianRupee, ArrowLeft, User, Briefcase, Building, Home } from 'lucide-react';
import { ProposalForm } from '../proposal-form';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';


const ClientTypeIcon = ({ type }: { type: Proposal['clientType'] }) => {
  switch (type) {
    case 'Individual/Bungalow': return <Home className="h-4 w-4 text-muted-foreground" />;
    case 'Housing Society': return <Building className="h-4 w-4 text-muted-foreground" />;
    case 'Commercial': return <Briefcase className="h-4 w-4 text-muted-foreground" />;
    case 'Industrial': return <Briefcase className="h-4 w-4 text-primary" />; 
    default: return <User className="h-4 w-4 text-muted-foreground" />;
  }
};


export default function ClientProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [allProposals, setAllProposals] = useState<Proposal[]>(MOCK_PROPOSALS); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const clientProposals = useMemo(() => {
    return allProposals.filter(p => p.clientId === clientId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allProposals, clientId]);

  const currentClient = useMemo(() => {
    // Find the first proposal for this client to get their details
    // This assumes client details (name, type, contactPerson, location) are consistent across their proposals
    // Or, in a real app, you'd fetch client details separately based on clientId
    return clientProposals.length > 0 ? clientProposals[0] : MOCK_PROPOSALS.find(p => p.clientId === clientId);
  }, [clientProposals, clientId]);


  useEffect(() => {
    if (!clientId) {
        router.push('/proposals');
    }
  }, [clientId, router]);

  const handleCreateNewProposalForClient = () => {
    setSelectedProposalForEdit(null); 
    setIsFormOpen(true);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposalForEdit(proposal);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (submittedProposal: Proposal) => {
    const existingProposalIndex = allProposals.findIndex(p => p.id === submittedProposal.id);

    if (existingProposalIndex > -1) { 
      const updatedProposals = allProposals.map(p => p.id === submittedProposal.id ? submittedProposal : p);
      setAllProposals(updatedProposals);
      toast({ title: "Proposal Updated", description: `Proposal ${submittedProposal.proposalNumber} has been updated.` });
    } else { 
      const newProposalWithClientId = { ...submittedProposal, clientId: clientId };
      setAllProposals(prev => [newProposalWithClientId, ...prev]);
      toast({ title: "Proposal Created", description: `Proposal ${newProposalWithClientId.proposalNumber} for ${currentClient?.name || 'this client'} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedProposalForEdit(null);
  };
  

  if (!currentClient) {
    return (
      <PageHeader title="Loading Client..." description="Fetching client details or client not found." />
    );
  }
  
  return (
    <>
      <PageHeader
        title={`Proposals for ${currentClient.name}`}
        description={`${currentClient.clientType} | Contact: ${currentClient.contactPerson} | Location: ${currentClient.location}`}
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
            <p>No proposals found for {currentClient.name} yet.</p>
            <p className="text-sm">You can create the first proposal for them using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientProposals.map((proposal) => (
            <Card key={proposal.id} className="shadow-sm bg-card flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-md font-semibold">{proposal.proposalNumber}</CardTitle>
                  {/* Status Badge Removed */}
                </div>
                <CardDescription className="text-xs">
                  Capacity: {proposal.capacity} kW | Modules: {proposal.moduleType} ({proposal.dcrStatus})
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 flex-grow">
                <p className="text-lg font-bold text-primary flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />{proposal.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs text-muted-foreground ml-1">(Pre-Subsidy)</span>
                </p>
                 <p className="text-xs text-muted-foreground">
                  Base: ₹{proposal.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + Taxes: ₹{(proposal.cgstAmount + proposal.sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {proposal.subsidyAmount > 0 && 
                    <p className="text-xs text-green-600 dark:text-green-500">
                        Subsidy Applied: ₹{proposal.subsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                }
                <p className="text-xs text-muted-foreground mt-1">
                  Proposal Date: {format(parseISO(proposal.proposalDate), 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(parseISO(proposal.createdAt), 'dd/MM/yyyy')}
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
        <img src="https://placehold.co/1200x300.png" data-ai-hint="client specific proposals" alt={`Proposals for ${currentClient.name}`} className="w-full rounded-lg object-cover"/>
      </div>
      <ProposalForm
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setSelectedProposalForEdit(null);}}
        onSubmit={handleFormSubmit}
        proposal={selectedProposalForEdit} 
        initialData={!selectedProposalForEdit ? { clientId: clientId, name: currentClient.name, clientType: currentClient.clientType } : undefined}
      />
    </>
  );
}
