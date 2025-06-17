
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PROPOSALS } from '@/lib/constants';
import type { Proposal } from '@/types';
import { Briefcase, ArrowRight, User, Building, Home } from 'lucide-react';

interface ClientSummary {
  clientId: string;
  clientName: string;
  clientType: Proposal['clientType'];
  proposalCount: number;
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

export default function ClientsListPage() {
  const clientsSummary = useMemo(() => {
    const clientsMap = new Map<string, ClientSummary>();

    MOCK_PROPOSALS.forEach(proposal => {
      if (!clientsMap.has(proposal.clientId)) {
        clientsMap.set(proposal.clientId, {
          clientId: proposal.clientId,
          clientName: proposal.name, // Assuming client name is on the proposal
          clientType: proposal.clientType,
          proposalCount: 0,
        });
      }
      clientsMap.get(proposal.clientId)!.proposalCount++;
    });

    return Array.from(clientsMap.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, []);

  return (
    <>
      <PageHeader
        title="Clients"
        description="A list of all clients who have proposals."
        icon={Briefcase}
      />

      {clientsSummary.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Briefcase className="mx-auto h-12 w-12 mb-2" />
            <p>No clients found.</p>
            <p className="text-sm">Clients will appear here once they have proposals.</p>
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
        <img src="https://placehold.co/1200x300.png" data-ai-hint="client list overview" alt="Client List Overview" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}
