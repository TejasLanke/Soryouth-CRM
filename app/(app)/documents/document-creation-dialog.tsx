
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentType, Template } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getTemplateById } from '@/app/(app)/manage-templates/actions';

interface DocumentCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  templateId: string;
  onSuccess: (urls: { pdfUrl: string; docxUrl: string }) => void;
}

// Helper to clean placeholder keys for form and label
function formatPlaceholder(placeholder: string) {
    const key = placeholder.replace(/{{|}}/g, '').trim();
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { key, label };
}

export function DocumentCreationDialog({ isOpen, onClose, documentType, templateId, onSuccess }: DocumentCreationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically build Zod schema from placeholders
  const formSchema = useMemo(() => {
    if (!template || !template.placeholdersJson) {
      return z.object({ clientName: z.string().min(1, 'Client name is required') });
    }
    const placeholders = JSON.parse(template.placeholdersJson) as string[];
    const shape: { [key: string]: z.ZodString } = {};
    placeholders.forEach(p => {
        const { key } = formatPlaceholder(p);
        shape[key] = z.string().min(1, { message: `${formatPlaceholder(p).label} is required.` });
    });
    return z.object(shape);
  }, [template]);

  type FormValues = z.infer<typeof formSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      if (isOpen && templateId) {
        setIsLoading(true);
        const fetchedTemplate = await getTemplateById(templateId);
        setTemplate(fetchedTemplate);
        if (fetchedTemplate?.placeholdersJson) {
            const placeholders = JSON.parse(fetchedTemplate.placeholdersJson) as string[];
            const defaultVals: any = {};
            placeholders.forEach(p => {
                defaultVals[formatPlaceholder(p).key] = '';
            });
            form.reset(defaultVals);
        }
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [isOpen, templateId, form]);

  const onSubmit = async (values: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            formData: values,
            documentType,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate document.');
        }

        toast({
          title: 'Document Generation Successful',
          description: `${documentType} for "${(values as any).client_name || 'document'}" has been generated.`,
        });
        onSuccess({ pdfUrl: result.pdfUrl, docxUrl: result.docxUrl });
        onClose();

      } catch (error) {
        console.error('Failed to submit document creation:', error);
        toast({
          title: 'Error',
          description: (error as Error).message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const placeholders = useMemo(() => {
    if (!template?.placeholdersJson) return [];
    return JSON.parse(template.placeholdersJson) as string[];
  }, [template]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New {documentType}</DialogTitle>
          <DialogDescription>
            Fill in the details below based on your selected template: "{template?.name || '...'}".
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : placeholders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
                <p>This template has no placeholders.</p>
                <p className="text-sm">You can still generate it, but no data will be replaced.</p>
            </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4 max-h-[70vh] overflow-y-auto pr-2">
              {placeholders.map((p) => {
                 const { key, label } = formatPlaceholder(p);
                 return (
                     <FormField
                        key={key}
                        control={form.control}
                        name={key as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{label}</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Enter ${label}...`} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 )
              })}
              <DialogFooter className="pt-4 sticky bottom-0 bg-background">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Document'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
