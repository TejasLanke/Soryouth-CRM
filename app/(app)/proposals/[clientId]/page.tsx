'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Proposal, Client } from '@/types';
import { FileText, IndianRupee, Loader2, Home, Building, Briefcase, User, ArrowLeft } from 'lucide-react';
import { getProposalsForClient } from '../actions';
import { getClientById } from '@/app/(app)/clients-list/actions';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const ClientTypeIcon = ({ type }: { type: Proposal['clientType'] }) => {
  switch (type) {
    case 'Individual/Bungalow': return <Home className="h-5 w-5 text-muted-foreground" />;
    case 'Housing Society': return <Building className="h-5 w-5 text-muted-foreground" />;
    case 'Commercial': return <Briefcase className="h-5 w-5 text-muted-foreground" />;
    case 'Industrial': return <Briefcase className="h-5 w-5 text-primary" />;
    default: return <User className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function ClientProposalsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      const fetchData = async () => {
        setIsLoading(true);
        const [fetchedClient, fetchedProposals] = await Promise.all([
          getClientById(clientId),
          getProposalsForClient(clientId),
        ]);
        setClient(fetchedClient);
        setProposals(fetchedProposals);
        setIsLoading(false);
      };
      fetchData();
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Proposals...</p>
      </div>
    );
  }

  if (!client) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-4">Could not find proposals for the specified client.</p>
            <Button onClick={() => router.push('/proposals')}>Back to All Proposals</Button>
        </div>
    )
  }

  return (
    <>
      <PageHeader
        title={`Proposals for ${client.name}`}
        description={`Viewing all ${proposals.length} proposals created for this client.`}
        icon={FileText}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2" />
            <p>No proposals found for this client.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map(proposal => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <ClientTypeIcon type={proposal.clientType} />
                        <CardTitle className="font-headline text-lg">{proposal.name}</CardTitle>
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
                 <Button variant="outline" size="sm" className="w-full" disabled>
                    Edit Proposal (Action Disabled)
                </Button>
               </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
