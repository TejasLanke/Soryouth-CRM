'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { customizeDocumentTemplate, CustomizeDocumentTemplateInput } from '@/ai/flows/customize-document-template';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const customizerSchema = z.object({
  template: z.string().min(10, { message: 'Template must be at least 10 characters long.' }),
  instructions: z.string().min(5, { message: 'Instructions must be at least 5 characters long.' }),
});

type CustomizerFormValues = z.infer<typeof customizerSchema>;

export function DocumentCustomizerForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modifiedTemplate, setModifiedTemplate] = useState<string | null>(null);

  const form = useForm<CustomizerFormValues>({
    resolver: zodResolver(customizerSchema),
    defaultValues: {
      template: '',
      instructions: '',
    },
  });

  const onSubmit = (values: CustomizerFormValues) => {
    setError(null);
    setModifiedTemplate(null);
    startTransition(async () => {
      try {
        const input: CustomizeDocumentTemplateInput = {
          template: values.template,
          instructions: values.instructions,
        };
        const result = await customizeDocumentTemplate(input);
        if (result && result.modifiedTemplate) {
          setModifiedTemplate(result.modifiedTemplate);
        } else {
          setError('Failed to get a modified template from the AI.');
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="template"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Template</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste your document template here..."
                    className="min-h-[200px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customization Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Change the company name to 'Solaris Inc.', update the address to '123 Sun Street', and add a section for 'Warranty Details'."
                    className="min-h-[200px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Customizing...
            </>
          ) : (
            'Customize Template'
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {modifiedTemplate && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-xl font-semibold mb-3 font-headline">Modified Template</h3>
          <Textarea
            readOnly
            value={modifiedTemplate}
            className="min-h-[300px] resize-y bg-muted"
            aria-label="Modified Template Output"
          />
          <Button variant="outline" className="mt-4" onClick={() => navigator.clipboard.writeText(modifiedTemplate)}>
            Copy to Clipboard
          </Button>
        </div>
      )}
    </Form>
  );
}
