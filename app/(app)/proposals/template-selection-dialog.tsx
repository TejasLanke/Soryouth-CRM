
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTemplates } from '@/app/(app)/manage-templates/actions';
import type { Template } from '@/types';
import { Loader2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TemplateSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export function TemplateSelectionDialog({ isOpen, onClose, onSelect }: TemplateSelectionDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getTemplates()
        .then(allTemplates => {
          setTemplates(allTemplates.filter(t => t.type === 'Proposal'));
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Proposal Template</DialogTitle>
          <DialogDescription>
            Choose a template to start creating your new proposal. These are managed in the "Manage Templates" section.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md hover:border-primary transition-all flex flex-col justify-between"
                  onClick={() => onSelect(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary"/>
                        <CardTitle>{template.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Last updated: {format(parseISO(template.updatedAt), 'dd MMM, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>No proposal templates found.</p>
              <p className="text-sm">Please create a template in the "Manage Templates" section first.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
