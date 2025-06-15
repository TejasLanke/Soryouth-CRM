
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from '@/app/(app)/leads/leads-table'; // Adjusted import path
import { MOCK_LEADS } from '@/lib/constants';
import { UserX } from 'lucide-react'; // Icon for dropped leads
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
    </>
  );
}
