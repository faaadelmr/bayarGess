
'use server';

/**
 * @fileOverview This flow analyzes a text prompt to extract participants and their consumed items.
 *
 * - analyzeTextForSplits - A function that handles the text analysis process.
 * - AnalyzeTextForSplitsInput - The input type for the analyzeTextForSplits function.
 * - AnalyzeTextForSplitsOutput - The return type for the analyzeTextForSplits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTextForSplitsInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      "A text containing a list of people and the items they ordered. Each person is usually on a new line."
    ),
});
export type AnalyzeTextForSplitsInput = z.infer<typeof AnalyzeTextForSplitsInputSchema>;

const AnalyzeTextForSplitsOutputSchema = z.object({
  people: z.array(z.string()).describe("A unique list of all people's names found in the text."),
  assignments: z.array(z.object({
    person: z.string().describe("The person's name."),
    items: z.array(z.string()).describe("A list of item names consumed by this person."),
  })).describe("A list of each person and the items they are assigned.")
});
export type AnalyzeTextForSplitsOutput = z.infer<typeof AnalyzeTextForSplitsOutputSchema>;

export async function analyzeTextForSplits(input: AnalyzeTextForSplitsInput): Promise<AnalyzeTextForSplitsOutput> {
  return analyzeTextForSplitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTextForSplitsPrompt',
  input: {schema: AnalyzeTextForSplitsInputSchema},
  output: {schema: AnalyzeTextForSplitsOutputSchema},
  prompt: `You are an expert at parsing text to determine who ordered what.
You will be given a block of text that lists people and the food or drink items they ordered. Your task is to extract a list of all unique people and then, for each person, list the items they ordered.

Follow these rules:
1. Identify People and Items: Each line typically starts with a person's name, followed by a colon or a number. The items they ordered are listed after their name, usually separated by commas.
2. Normalize Item Names:
  -Split Compound Items: If an item name contains a +, you must split it into separate items. For example, "ricebowl black pepper + es DJ" becomes "ricebowl black pepper" and "es DJ".
  -Clean Variations: Ignore notes within parentheses, like (cabe 5). The item "Mie Goyang LVL 1 (Cabe 5)" should be treated as "Mie Goyang LVL 1".
  -Standardize Spelling: Normalize common abbreviations and alternate spellings. For example, "es DJ" becomes "Ice DJ" and "LVL1" becomes "LVL 1". Minor spelling differences, like "LVL" versus "LV", should be considered the same item.
3. Clean Output: Trim any extra whitespace from names and items.
4. Format the Output: The final output must be a JSON object with two fields:
5. people: An array of all unique person names.
6. assignments: An array of objects. Each object should have a person field and an items field (an array of the items they ordered).

Example
Input:
1. Edo : Mie Goyang LVL1, Ice DJ
2. Firman : Mie Goyang LVL 2, Green Tea, Udang Keju
3. Fadel : Mie Goyang LVL 2, Udang Keju
4. Dwi : ricebowl black pepper + es DJ
5. Winda : Mie Goyang LVL 1 + Wizz Egg, Ceker, Lemon Splash Jumbo
Output:

JSON
{
  "people": ["Edo", "Firman", "Fadel", "Dwi", "Winda"],
  "assignments": [
    { "person": "Edo", "items": ["Mie Goyang LV1", "Ice DJ"] },
    { "person": "Firman", "items": ["Mie Goyang LV2", "Green Tea", "Udang Keju"] },
    { "person": "Fadel", "items": ["Mie Goyang LVL 2 (cabae 10)", "Udang Keju"] },
    { "person": "Dwi", "items": ["ricebowl black pepper", "Ice DJ"] },
    { "person": "Winda", "items": ["Mie Goyang LVL 1", "Wizz Egg", "Ceker", "Lemon Splash Jumbo"] }
  ]
}

Now, parse the following text:

{{{prompt}}}
  `,
});

const analyzeTextForSplitsFlow = ai.defineFlow(
  {
    name: 'analyzeTextForSplitsFlow',
    inputSchema: AnalyzeTextForSplitsInputSchema,
    outputSchema: AnalyzeTextForSplitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
