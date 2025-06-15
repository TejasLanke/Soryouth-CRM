import { PageHeader } from '@/components/page-header';
import { LeadsTable } from './leads-table';
import { MOCK_LEADS } from '@/lib/constants';
import { UsersRound } from 'lucide-react';

export default async function LeadsPage() {
  // In a real app, fetch leads from an API
  const leads = MOCK_LEADS;

  return (
    <>
      <PageHeader
        title="Lead Management"
        description="Track and manage your customer leads through the sales pipeline."
        icon={UsersRound}
      />
      <LeadsTable initialLeads={leads} />
    </>
  );
}
