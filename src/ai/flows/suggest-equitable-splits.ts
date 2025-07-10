'use server';
/**
 * @fileOverview AI-powered equitable bill splitting assistant.
 *
 * - suggestEquitableSplits - A function that suggests equitable bill splits based on item consumption.
 * - SuggestEquitableSplitsInput - The input type for the suggestEquitableSplits function.
 * - SuggestEquitableSplitsOutput - The return type for the suggestEquitableSplits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEquitableSplitsInputSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().describe('The name of the item.'),
        price: z.number().describe('The price of the item.'),
        consumers: z
          .array(z.string())
          .describe('The names of the people who consumed the item.'),
      })
    )
    .describe('A list of items to split.'),
  people: z.array(z.string()).describe('A list of people to split the bill among.'),
});
export type SuggestEquitableSplitsInput = z.infer<
  typeof SuggestEquitableSplitsInputSchema
>;

const SuggestEquitableSplitsOutputSchema = z.object({
  splits: z
    .array(
      z.object({
        person: z.string().describe('The name of the person.'),
        amountOwed: z.number().describe('The amount owed by the person.'),
      })
    )
    .describe('A list of splits for each person.'),
  explanation: z
    .string()
    .describe('An explanation of how the bill was split equitably.'),
});
export type SuggestEquitableSplitsOutput = z.infer<
  typeof SuggestEquitableSplitsOutputSchema
>;

export async function suggestEquitableSplits(
  input: SuggestEquitableSplitsInput
): Promise<SuggestEquitableSplitsOutput> {
  return suggestEquitableSplitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEquitableSplitsPrompt',
  input: {schema: SuggestEquitableSplitsInputSchema},
  output: {schema: SuggestEquitableSplitsOutputSchema},
  prompt: `You are an expert in splitting bills equitably among a group of people.

  Given a list of items, their prices, and who consumed them, you will determine the most equitable way to split the bill.

  Consider the following:
  - If an item was consumed by only one person, that person should be responsible for the full cost of the item.
  - If an item was consumed by multiple people, the cost of the item should be split evenly among those people.
  - If not every person consumed every product, divide items based on who ate it.
  - If all shared the same entree, evenly distribute amongst participants.

  Return a list of splits for each person, including the amount they owe, and an explanation of how the bill was split.

  Here is the itemized bill:
  {{#each items}}
  - {{name}} (${{price}}) - Consumed by: {{#each consumers}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}

  Here is the list of people:
  {{#each people}}
  - {{{this}}}
  {{/each}}
  `,
});

const suggestEquitableSplitsFlow = ai.defineFlow(
  {
    name: 'suggestEquitableSplitsFlow',
    inputSchema: SuggestEquitableSplitsInputSchema,
    outputSchema: SuggestEquitableSplitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
