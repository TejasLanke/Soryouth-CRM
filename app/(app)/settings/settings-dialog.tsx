
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CustomSetting, SettingType } from '@/types';
import { getSettingsByType, addSetting, deleteSetting } from './actions';
import { CustomizationSection } from './customization-section';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settingTypes: { title: string; type: SettingType }[];
}

export function SettingsDialog({ isOpen, onClose, settingTypes }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Record<SettingType, CustomSetting[]>>({} as Record<SettingType, CustomSetting[]>);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllSettings = useCallback(async () => {
    setIsLoading(true);
    const allSettings: Record<string, CustomSetting[]> = {};
    for (const { type } of settingTypes) {
      allSettings[type] = await getSettingsByType(type);
    }
    setSettings(allSettings as Record<SettingType, CustomSetting[]>);
    setIsLoading(false);
  }, [settingTypes]);

  useEffect(() => {
    if (isOpen) {
      fetchAllSettings();
    }
  }, [isOpen, fetchAllSettings]);

  const handleAddItem = async (type: SettingType, name: string) => {
    const result = await addSetting(type, name);
    if ('error' in result) {
      toast({ title: `Error adding item`, description: result.error, variant: "destructive" });
    } else {
      toast({ title: 'Success', description: `${result.name} added.` });
      // Update state locally instead of refetching everything
      setSettings(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), result]
      }));
    }
  };

  const handleDeleteItem = async (type: SettingType, id: string, name: string) => {
    const result = await deleteSetting(id);
    if (result.success) {
      toast({ title: 'Success', description: `${name} removed.` });
      // Update state locally
      setSettings(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== id)
      }));
    } else {
      toast({ title: `Error removing item`, description: result.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Settings</DialogTitle>
          <DialogDescription>
            Manage the options available for different fields across the application.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {settingTypes.map(({ title, type }) => (
              <CustomizationSection
                key={type}
                title={title}
                items={settings[type] || []}
                onAddItem={(name) => handleAddItem(type, name)}
                onDeleteItem={(id, name) => handleDeleteItem(type, id, name)}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
