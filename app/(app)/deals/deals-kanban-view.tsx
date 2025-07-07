
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { DealStage } from '@/lib/constants';

interface DealsKanbanViewProps {
  stages: readonly DealStage[];
  onAddDeal: (stage: DealStage) => void;
}

export function DealsKanbanView({ stages, onAddDeal }: DealsKanbanViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div key={stage} className="w-72 flex-shrink-0">
          <Card className="bg-muted/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3">
              <CardTitle className="text-base font-medium">{stage}</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddDeal(stage)}>
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-2 min-h-[60vh]">
              {/* 
                This is a placeholder for a future deal card.
                The actual data will be populated in a later step.
              
              <Card className="shadow-sm">
                <CardContent className="p-3">
                  <p className="font-bold truncate">SUNIL</p>
                  <p className="text-sm text-muted-foreground">9822684552</p>
                  <p className="text-sm">3kw Ongrid - 221,910</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">Closure:</p>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="user avatar" />
                      <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>
              */}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
