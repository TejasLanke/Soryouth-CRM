
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Handshake } from 'lucide-react';
import { DEAL_PIPELINES, type DealPipelineType, type DealStage } from '@/lib/constants';
import { DealsKanbanView } from './deals-kanban-view';
import { DealForm, DealFormValues } from './deal-form';
import type { User } from '@/types';
import { getUsers } from '@/app/(app)/users/actions';
import { useToast } from '@/hooks/use-toast';

export default function DealsPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<DealPipelineType>('Solar PV Plant');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialStage, setInitialStage] = useState<DealStage | undefined>();
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    }
    fetchUsers();
  }, []);

  const stages = DEAL_PIPELINES[selectedPipeline];
  const totalDeals = 0; // Mock data for now
  const totalValue = 0; // Mock data for now

  const handleOpenForm = (stage: DealStage) => {
    setInitialStage(stage);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: DealFormValues) => {
    console.log("New Deal Data:", data);
    toast({
      title: "Deal Submitted",
      description: "Deal data logged to the console. Backend integration is next!",
    });
    setIsFormOpen(false);
  };


  return (
    <>
      <PageHeader
        title={`Deals (${totalDeals} - ${totalValue.toLocaleString()})`}
        icon={Handshake}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select value={selectedPipeline} onValueChange={(value) => setSelectedPipeline(value as DealPipelineType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DEAL_PIPELINES).map(pipeline => (
                    <SelectItem key={pipeline} value={pipeline}>{pipeline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />
      <DealsKanbanView
        stages={stages}
        onAddDeal={handleOpenForm}
      />
       <DealForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        users={users}
        pipeline={selectedPipeline}
        initialStage={initialStage}
      />
    </>
  );
}
