
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
  tax: z.number().optional().describe('The total tax amount or percentage. If it is a percentage (e.g., 11%), return the number 11. If it is a fixed amount, return the amount.'),
  additionalCharges: z.number().optional().describe('Any other additional charges or service fees found on the receipt.'),
  shippingCost: z.number().optional().describe('The shipping or delivery cost.'),
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
  
  IMPORTANT: The prices on the receipt use dots (.) as thousand separators, not as decimal points. For example, a price written as '65.910' must be interpreted as 65910.

  For each item on the receipt, identify the item name and its price. Before converting the price to a numeric value, you MUST remove all dots (.). For example, '65.910' becomes 65910. Do not use commas.

  In addition to the items, you MUST also look for the following and extract their values:
  1.  **Tax (Pajak)**: Look for terms like "Pajak", "PPN", "PB1". If the value is a percentage (e.g., 11%), extract the number only (11). If it's a fixed amount, extract the numeric value.
  2.  **Additional Charges (Biaya Tambahan)**: Look for terms like "Service Charge", "Biaya Layanan", or other fees that are not tax or shipping. Extract the numeric value.
  3.  **Shipping Cost (Ongkos Kirim)**: Look for terms like "Ongkir", "Delivery Fee", "Biaya Pengiriman". Extract the numeric value.

  If any of these (tax, additionalCharges, shippingCost) are not found, omit them from the output.

  Return a JSON object with the extracted information.

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
