
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
1.  **Identify the Person**: The person's name is usually at the start of the line, often followed by a colon (:) or a number. Extract only the name.
2.  **Identify the Items**: The items are listed after the person's name. They are typically separated by commas (,).
3.  **Handle Variations**: Sometimes there are variations or notes with items (e.g., "Mie Goyang LVL 1 + Wizz Egg"). Treat this entire string as a single, unique item name. Do not try to split "Wizz Egg" into a separate item unless it's listed separately. For "ricebowl black pepper + es DJ", the items are "ricebowl black pepper" and "es DJ".
4.  **Cleaning**: Trim any extra whitespace from names and items.
5.  **Output Structure**:
    - The 'people' field must be an array of unique names.
    - The 'assignments' field must be an array of objects, where each object contains a person's name and an array of the item names they ordered.

**Example Input:**
1. Edo : Mie Goyang LVL1, Ice DJ
2. Firman : Mie Goyang LVL 2, Green Tea, Udang Keju
3. Fadel : Mie Goyang LVL 2, Udang Keju
4. Dwi : ricebowl black pepper + es DJ
5. Winda : Mie Goyang LVL 1 + Wizz Egg, Ceker, Lemon Splash Jumbo

**Correct Example Output:**
{
  "people": ["Edo", "Firman", "Fadel", "Dwi", "Winda"],
  "assignments": [
    { "person": "Edo", "items": ["Mie Goyang LVL1", "Ice DJ"] },
    { "person": "Firman", "items": ["Mie Goyang LVL 2", "Green Tea", "Udang Keju"] },
    { "person": "Fadel", "items": ["Mie Goyang LVL 2", "Udang Keju"] },
    { "person": "Dwi", "items": ["ricebowl black pepper", "es DJ"] },
    { "person": "Winda", "items": ["Mie Goyang LVL 1 + Wizz Egg", "Ceker", "Lemon Splash Jumbo"] }
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
