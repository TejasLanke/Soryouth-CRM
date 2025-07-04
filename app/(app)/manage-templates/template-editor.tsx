
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { saveTemplate } from './actions';
import type { Template, DocumentType, ProposalOrDocumentType } from '@/types';
import { PLACEHOLDER_DEFINITIONS_PROPOSAL, PLACEHOLDER_DEFINITIONS_DOCUMENTS, DOCUMENT_TYPES_CONFIG } from '@/lib/constants';
import { Copy, Loader2, UploadCloud, File, Download } from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters long.'),
  type: z.string().min(1, 'Please select a template type.'),
  originalDocxPath: z.string().min(1, 'A document must be uploaded.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  template: Template | null;
}

export function TemplateEditor({ template }: TemplateEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(template?.originalDocxPath || null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      type: template?.type || undefined,
      originalDocxPath: template?.originalDocxPath || '',
    },
  });
  
  const watchedTemplateType = form.watch('type');

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        type: template.type,
        originalDocxPath: template.originalDocxPath,
      });
      setUploadedFileName(template.originalDocxPath);
    }
  }, [template, form]);

  const handleCopyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    toast({
      title: 'Copied!',
      description: `${placeholder} copied to clipboard.`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.(docx|dotx)$/i.test(file.name)) {
        toast({ title: "Invalid File Type", description: "Please upload a .docx or .dotx file.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/templates/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file.');
        }

        const result = await response.json();
        form.setValue('originalDocxPath', result.filePath, { shouldValidate: true, shouldDirty: true });
        setUploadedFileName(file.name);
        
        if (!form.getValues('name')) {
            form.setValue('name', file.name.replace(/\.(docx|dotx)$/i, ''));
        }
        toast({ title: "Upload Successful", description: `File '${file.name}' has been uploaded.` });

    } catch (error) {
        toast({
            title: "Upload Failed",
            description: (error as Error).message,
            variant: "destructive",
        });
    } finally {
        setIsUploading(false);
    }
  };

  const onSubmit = (values: TemplateFormValues) => {
    startTransition(async () => {
      const dataToSave = {
        id: template?.id,
        ...values,
      };

      const result = await saveTemplate(dataToSave as any);
      if (result) {
        toast({
          title: 'Template Saved',
          description: `Template "${result.name}" has been saved successfully.`,
        });
        router.push('/manage-templates');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save the template.',
          variant: 'destructive',
        });
      }
    });
  };

  const renderPlaceholders = () => {
    let placeholders: any = {};
    if (watchedTemplateType === 'Proposal') {
      placeholders = PLACEHOLDER_DEFINITIONS_PROPOSAL;
    } else if (watchedTemplateType && PLACEHOLDER_DEFINITIONS_DOCUMENTS[watchedTemplateType as DocumentType]) {
      placeholders = PLACEHOLDER_DEFINITIONS_DOCUMENTS[watchedTemplateType as DocumentType];
    } else {
      return <p className="text-sm text-muted-foreground">Select a template type to see available placeholders.</p>;
    }

    return (
      <Accordion type="multiple" className="w-full">
        {Object.entries(placeholders).map(([groupName, groupPlaceholders]) => (
          <AccordionItem value={groupName} key={groupName}>
            <AccordionTrigger>{groupName}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {(groupPlaceholders as any[]).map(p => (
                  <div key={p.placeholder} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div>
                      <p className="font-mono text-xs font-semibold">{p.placeholder}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyPlaceholder(p.placeholder)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                 <CardDescription>
                  Upload a DOCX or DOTX file to be used as a template. The structure, styling, and images will be preserved. Edit placeholders in MS Word before uploading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Standard Commercial Proposal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!template}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Proposal">Proposal</SelectItem>
                            {DOCUMENT_TYPES_CONFIG.map(docType => (
                                <SelectItem key={docType.type} value={docType.type}>{docType.type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="originalDocxPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template File</FormLabel>
                      <FormControl>
                        <div>
                          <Input id="docx-upload" type="file" accept=".docx,.dotx" onChange={handleFileUpload} className="hidden" disabled={isUploading}/>
                          <label htmlFor="docx-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                            <span>{isUploading ? 'Uploading...' : 'Upload .docx / .dotx'}</span>
                          </label>
                        </div>
                      </FormControl>
                      {uploadedFileName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                          <File className="h-4 w-4" />
                          <span className="flex-grow">{uploadedFileName.split('/').pop()}</span>
                           <a href={uploadedFileName} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <Download className="h-4 w-4"/>
                          </a>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPending || isUploading} className="mt-6">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Template
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
            <CardDescription>Click to copy and then paste them (including the `{` `}` brackets) into your Word document template.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderPlaceholders()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
