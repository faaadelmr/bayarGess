
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
  additionalCharges: z.number().optional().describe('Total additional charges. Look for terms like "Biaya lainnya", "Biaya pemesanan", "Biaya kemasan", "Service Charge". Sum up the values.'),
  shippingCost: z.number().optional().describe('Look for terms like "Ongkir", "Delivery Fee", "Biaya Pengiriman", "Biaya Penanganan dan Pengiriman". Extract the numeric value'),
  discount: z.number().optional().describe('The total discount amount. If multiple discounts are present, sum their absolute values.'),
});
export type AnalyzeReceiptImageOutput = z.infer<typeof AnalyzeReceiptImageOutputSchema>;

export async function analyzeReceiptImage(input: AnalyzeReceiptImageInput): Promise<AnalyzeReceiptImageOutput> {
  return analyzeReceiptImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReceiptImagePrompt',
  input: {schema: AnalyzeReceiptImageInputSchema},
  output: {schema: AnalyzeReceiptImageOutputSchema},
  prompt: `You are an expert receipt analyzer. Your role is to extract structured data from a receipt image and return a valid JSON object. Follow these rules precisely.

**General Rules:**
1.  **Item Extraction**:
    - Identify individual items and their prices.
    - If an item has a quantity (e.g., "2 x Nasi" or "5 MIE GOYANG"), extract the item name and its total price for that line. Do not multiply the price by the quantity yourself; the price shown is already the total.
    - Ignore any crossed-out prices.
2.  **Price Formatting**:
    - Prices in the receipt use dots as thousand separators (e.g., '36.000' means 36000). Remove all dots and commas before converting to a number.
3.  **Tax**:
    - **Crucial**: If the receipt anywhere mentions "Termasuk Pajak", "Sudah termasuk pajak", or similar phrases, you MUST NOT extract a separate tax value. The 'tax' field should be omitted.
    - Only extract tax if explicitly mentioned as "Pajak", "PPN", or "PB1" AND the receipt does not state that tax is already included.
    - If tax is a fixed amount (like PB1), calculate its percentage based on the item subtotal.
4.  **Discount**:
    - Look for ALL lines containing "Diskon" or "Voucher".
    - Sum the absolute values of all discounts found. For example, if a discount is shown as "-20.000", use 20000. If there are multiple discounts, add them up.

**Platform-Specific Rules:**

---

**GoFood / GrabFood Receipts:**
- **Items**: Items are usually listed under a "Pembelian" or "Ringkasan Pesanan" section. The line "Harga" or "Subtotal" is the subtotal of these items, do NOT treat it as an item itself.
- **Biaya Tambahan (additionalCharges)**: Find terms like "Biaya lainnya", "Biaya pemesanan", "Biaya kemasan", "Service Charge". Sum up their values.
- **Ongkos Kirim (shippingCost)**: Find terms like "Ongkir", "Delivery Fee", "Biaya Penanganan dan Pengiriman".

**Example Walkthrough (GoFood):**
If you see:
- Pembelian
  - Nasi Goreng 1 ... 36.000
- Detail Pembayaran
  - Harga: 36.000
  - Biaya Penanganan dan Pengiriman: 19.500
  - Biaya lainnya: 2.000
  - Diskon: -20.000

Your output MUST be:
{
  "items": [
    { "name": "Nasi Goreng", "price": 36000 }
  ],
  "shippingCost": 19500,
  "additionalCharges": 2000,
  "discount": 20000
}

**Example Walkthrough (GrabFood):**
If you see:
- 2x Ala Carte Ayam ... 52.400
- Subtotal: Rp52.400
- Ongkos kirim: 2.000
- Biaya pemesanan: 1.000
- Biaya kemasan: 2.500
- Diskon Rp2.000: -2.000
- Diskon 50%: -26.200

Your output MUST be:
{
  "items": [
    { "name": "Ala Carte Ayam", "price": 52400 }
  ],
  "shippingCost": 2000,
  "additionalCharges": 3500,
  "discount": 28200
}

---

**ShopeeFood Receipts:**
- **Items**: Items are listed with their prices. Sometimes there is a crossed-out price, which you must ignore.
- **Biaya Tambahan (additionalCharges)**: This is usually labeled as "Biaya Layanan".
- **Ongkos Kirim (shippingCost)**: This is usually labeled as "Biaya Pengiriman".
- **Diskon (discount)**: This is usually labeled as "Voucher Diskon". It will have a negative value (e.g., -Rp19.200); take its absolute value (19200).

**Example Walkthrough (ShopeeFood):**
If you see:
- 2 x Kukus Pandan ... 7.600 (Rp8.000 crossed out)
- 2 x Goreng ... 7.600 (Rp8.000 crossed out)
- 1 x Kukus Pandan ... 4.000
- Biaya Pengiriman: 8.000
- Biaya Layanan: 3.000
- Voucher Diskon: -Rp19.200
- Total Pembayaran ... (Sudah termasuk pajak)

Your output MUST be:
{
  "items": [
    { "name": "Kukus Pandan", "price": 7600 },
    { "name": "Goreng", "price": 7600 },
    { "name": "Kukus Pandan", "price": 4000 }
  ],
  "shippingCost": 8000,
  "additionalCharges": 3000,
  "discount": 19200
}
---

**Final Output Format:**
Return a single JSON object. Only include optional fields ('tax', 'additionalCharges', 'shippingCost', 'discount') if they are present and have a value greater than zero on the receipt.

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
