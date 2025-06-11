'use server';

/**
 * @fileOverview A document template customization AI agent.
 *
 * - customizeDocumentTemplate - A function that handles the document template customization process.
 * - CustomizeDocumentTemplateInput - The input type for the customizeDocumentTemplate function.
 * - CustomizeDocumentTemplateOutput - The return type for the customizeDocumentTemplate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeDocumentTemplateInputSchema = z.object({
  template: z
    .string()
    .describe('The original document template as a string.'),
  instructions: z
    .string()
    .describe('Instructions on how to modify the document template.'),
});
export type CustomizeDocumentTemplateInput = z.infer<typeof CustomizeDocumentTemplateInputSchema>;

const CustomizeDocumentTemplateOutputSchema = z.object({
  modifiedTemplate: z
    .string()
    .describe('The modified document template as a string.'),
});
export type CustomizeDocumentTemplateOutput = z.infer<typeof CustomizeDocumentTemplateOutputSchema>;

export async function customizeDocumentTemplate(
  input: CustomizeDocumentTemplateInput
): Promise<CustomizeDocumentTemplateOutput> {
  return customizeDocumentTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeDocumentTemplatePrompt',
  input: {schema: CustomizeDocumentTemplateInputSchema},
  output: {schema: CustomizeDocumentTemplateOutputSchema},
  prompt: `You are an AI expert in modifying document templates.

You will receive a document template and instructions on how to modify it.
Apply the instructions to the template and return the modified template.

Original Template:
{{{template}}}

Instructions:
{{{instructions}}}

Modified Template:`, // Ensure the output is the modified template.
});

const customizeDocumentTemplateFlow = ai.defineFlow(
  {
    name: 'customizeDocumentTemplateFlow',
    inputSchema: CustomizeDocumentTemplateInputSchema,
    outputSchema: CustomizeDocumentTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
