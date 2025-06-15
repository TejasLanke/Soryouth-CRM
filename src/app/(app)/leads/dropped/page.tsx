
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table';
import { MOCK_LEADS } from '@/lib/constants';
import { UserX } from 'lucide-react';
import type { Lead } from '@/types';

export default async function DroppedLeadsPage() {
  // In a real app, fetch leads from an API
  const allLeads: Lead[] = MOCK_LEADS;
  const droppedLeads = allLeads.filter(lead => lead.status === 'Lost');

  return (
    <>
      <PageHeader
        title="Dropped Leads"
        description="View leads that have been marked as 'Lost'."
        icon={UserX}
      />
      <LeadsTable initialLeads={droppedLeads} />
       <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="dropped leads list" alt="Dropped Leads" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}

    