
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { CustomSetting, SettingType } from '@/types';
import { getSettingsByType, addSetting, deleteSetting, getDeletionImpactForDocumentType, deleteDocumentTypeAndContents, getDeletionImpactForFinancialDocumentType, deleteFinancialDocumentTypeAndContents } from './actions';
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

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string, name: string, type: SettingType } | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<{ templateCount: number, documentCount: number } | null>(null);

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
      fetchAllSettings();
    }
  };

  const handleDeleteRequest = async (id: string, name: string, type: SettingType) => {
    setDeleteCandidate({ id, name, type });
    if (type === 'DOCUMENT_TYPE') {
        const impact = await getDeletionImpactForDocumentType(name);
        setDeleteImpact(impact);
    }
    if (type === 'FINANCIAL_DOCUMENT_TYPE') {
        const impact = await getDeletionImpactForFinancialDocumentType(name);
        setDeleteImpact(impact);
    }
    setIsAlertOpen(true);
  };
  
  const confirmDeletion = async () => {
    if (!deleteCandidate) return;

    let result;
    if (deleteCandidate.type === 'DOCUMENT_TYPE') {
        result = await deleteDocumentTypeAndContents(deleteCandidate.id);
    } else if (deleteCandidate.type === 'FINANCIAL_DOCUMENT_TYPE') {
        result = await deleteFinancialDocumentTypeAndContents(deleteCandidate.id);
    } else {
        result = await deleteSetting(deleteCandidate.id);
    }

    if (result.success) {
      toast({ title: 'Success', description: `"${deleteCandidate.name}" removed.` });
      fetchAllSettings();
    } else {
      toast({ title: `Error removing item`, description: result.error, variant: "destructive" });
    }
    resetDeleteState();
  };

  const resetDeleteState = () => {
    setIsAlertOpen(false);
    setDeleteCandidate(null);
    setDeleteImpact(null);
  };

  return (
    <>
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
                onDeleteItem={(id, name) => handleDeleteRequest(id, name, type)}
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
    
    <AlertDialog open={isAlertOpen} onOpenChange={resetDeleteState}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. You are about to delete "{deleteCandidate?.name}".
                </AlertDialogDescription>
                {deleteImpact && (deleteImpact.templateCount > 0 || deleteImpact.documentCount > 0) && (
                    <div className="text-sm font-semibold text-destructive pt-2">
                       This will also permanently delete:
                       <ul className="list-disc pl-5 mt-1 font-normal">
                           {deleteImpact.templateCount > 0 && <li>{deleteImpact.templateCount} template(s)</li>}
                           {deleteImpact.documentCount > 0 && <li>{deleteImpact.documentCount} generated document(s)</li>}
                       </ul>
                    </div>
                )}
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={resetDeleteState}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletion}>
                    Yes, Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
