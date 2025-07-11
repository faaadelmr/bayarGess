'use server';

/**
 * @fileOverview This flow analyzes a receipt image and extracts items and prices.
 *
 * - analyzeReceiptImage - A function that handles the receipt image analysis process.
 * - AnalyzeReceiptImageInput - The input type for the analyzeReceiptImage function.
 * - AnalyzeReceiptImageOutput - The return type for the analyzeReceiptImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeReceiptImageInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A receipt image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type AnalyzeReceiptImageInput = z.infer<typeof AnalyzeReceiptImageInputSchema>;

const AnalyzeReceiptImageOutputSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().describe('The name of the item.'),
        price: z.number().describe('The price of the item.'),
      })
    )
    .describe('The list of items and prices extracted from the receipt.'),
});
export type AnalyzeReceiptImageOutput = z.infer<typeof AnalyzeReceiptImageOutputSchema>;

export async function analyzeReceiptImage(input: AnalyzeReceiptImageInput): Promise<AnalyzeReceiptImageOutput> {
  return analyzeReceiptImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReceiptImagePrompt',
  input: {schema: AnalyzeReceiptImageInputSchema},
  output: {schema: AnalyzeReceiptImageOutputSchema},
  prompt: `You are an expert receipt analyzer. You will extract the items and their prices from the receipt image.
  
  For each item on the receipt, identify the item name and its price. The prices on the receipt may use dots (.) as thousand separators (e.g., '65.910' means 65910). Please remove any dots or commas before converting the price to a numeric value. Ensure the price is a numeric value.

  Return a JSON object with a single key "items". The value of "items" should be an array of objects, where each object represents an item from the receipt and has two keys: "name" (a string) and "price" (a number).

  Receipt Image: {{media url=receiptDataUri}}
  `,
});

const analyzeReceiptImageFlow = ai.defineFlow(
  {
    name: 'analyzeReceiptImageFlow',
    inputSchema: AnalyzeReceiptImageInputSchema,
    outputSchema: AnalyzeReceiptImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
