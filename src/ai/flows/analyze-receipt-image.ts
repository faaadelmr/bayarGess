
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
  tax: z.number().optional().describe('The total tax amount or percentage. If it is a percentage (e.g., 11%), return the number 11. If it is a fixed amount, calculate the percentage based on the subtotal of all items and return that percentage value.'),
  additionalCharges: z.number().optional().describe('bertuliskan biaya pemesanan, biaya kemasan, jika ada 2 atau lebih maka jumlah kan saja.'),
  shippingCost: z.number().optional().describe('bertuliskan "ongkos kirim", "biaya pengiriman", "biaya kirim".'),
  discountValue: z.number().optional().describe('bertuliskan "diskon", "diskon tambahan", "diskon 15%" atau "diskon 20%". biasanya bertuliskan angka -Rp2000 atau yang lainnya. jika ada lebih jumlahkan'),
});
export type AnalyzeReceiptImageOutput = z.infer<typeof AnalyzeReceiptImageOutputSchema>;

export async function analyzeReceiptImage(input: AnalyzeReceiptImageInput): Promise<AnalyzeReceiptImageOutput> {
  return analyzeReceiptImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReceiptImagePrompt',
  input: {schema: AnalyzeReceiptImageInputSchema},
  output: {schema: AnalyzeReceiptImageOutputSchema},
  prompt: `You are an expert receipt analyzer, Your role is to extract structured data from a receipt image and return a valid JSON object. Follow these below detail rules.

  rules:
  
  Prices in the receipt use dots as thousand separators (e.g., "36.000" means 36000). Remove all dots and commas before converting to a number. value set to number if "37.000" -> "37000"
  Remove all non-digit characters from the price before converting to a number.
  if there "diskon" so its discountType: ada jenis-jenis diskon yang diterapkan:Diskon tetap sebesar 2.000.Diskon persentase (15%) yang menghasilkan potongan 6.765. Total diskon yang harus dijumlahkan adalah 2.000 + 6.765 = 8.765.
  
  **Shipping Cost**:
    - Only extract shipping cost if explicitly mentioned as "ongkos kirim", "biaya pengiriman", or "biaya kirim".
    - **Crucial Rule**: If the receipt anywhere mentions "Termasuk Pajak", "Sudah termasuk pajak", or similar phrases, you MUST NOT extract a separate shippingCost value. The 'shippingCost' field must be omitted.

  **Tax**:
    - **Crucial Rule**: If the receipt anywhere mentions "Termasuk Pajak", "Sudah termasuk pajak", or similar phrases, you MUST NOT extract a separate tax value or shippingCost value. The 'tax' field must be omitted, even if there is a line showing "PPN" or "PB1".
    - Only extract tax if explicitly mentioned as "Pajak", "PPN", or "PB1" AND the receipt does not state that tax is already included.
    - If tax is a fixed amount (like PB1), calculate its percentage based on the item subtotal.
    - If service charge (e.g., "service 5%") is present, calculate its percentage based on the item subtotal and add it to the calculated tax percentage. The final 'tax' value should be the sum of all tax and service charge percentages.

Now, analyze the provided receipt image.
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
