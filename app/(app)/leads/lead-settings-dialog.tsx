
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatuses: string[];
  initialSources: string[];
}

export function LeadSettingsDialog({
  isOpen,
  onClose,
  initialStatuses,
  initialSources,
}: LeadSettingsDialogProps) {
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [newSource, setNewSource] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStatuses([...initialStatuses]);
      setSources([...initialSources]);
    }
  }, [isOpen, initialStatuses, initialSources]);

  const handleAddStatus = () => {
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      setStatuses([...statuses, newStatus.trim()]);
      setNewStatus('');
    }
  };

  const handleRemoveStatus = (statusToRemove: string) => {
    setStatuses(statuses.filter((status) => status !== statusToRemove));
  };

  const handleAddSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()]);
      setNewSource('');
    }
  };

  const handleRemoveSource = (sourceToRemove: string) => {
    setSources(sources.filter((source) => source !== sourceToRemove));
  };

  const handleSaveChanges = () => {
    console.log('Saving Lead Settings...');
    console.log('Updated Statuses:', statuses);
    console.log('Updated Sources:', sources);
    toast({
      title: 'Settings Logged',
      description: 'Customized statuses and sources logged to console. Ask the AI to apply these changes to lib/constants.ts to make them permanent.',
      duration: 7000,
    });
    onClose(); // Close dialog after "saving" (logging)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Lead Settings</DialogTitle>
          <DialogDescription>
            Manage lead stages (statuses) and sources. Click "Save Settings" to see the proposed changes in the console.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Statuses Management */}
          <div>
            <Label className="text-lg font-medium mb-2 block">Lead Stages (Statuses)</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="New stage name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddStatus()}
              />
              <Button onClick={handleAddStatus} size="icon" variant="outline">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="h-40 rounded-md border p-2">
              {statuses.length === 0 && <p className="text-sm text-muted-foreground p-2">No stages defined.</p>}
              {statuses.map((status) => (
                <div key={status} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-sm">
                  <span className="text-sm">{status}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveStatus(status)}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Sources Management */}
          <div>
            <Label className="text-lg font-medium mb-2 block">Lead Sources</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="New source name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
              />
              <Button onClick={handleAddSource} size="icon" variant="outline">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="h-40 rounded-md border p-2">
               {sources.length === 0 && <p className="text-sm text-muted-foreground p-2">No sources defined.</p>}
              {sources.map((source) => (
                <div key={source} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-sm">
                  <span className="text-sm">{source}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveSource(source)}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveChanges}>
            Save Settings (Log to Console)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
