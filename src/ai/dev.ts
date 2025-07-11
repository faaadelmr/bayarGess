import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-equitable-splits.ts';
import '@/ai/flows/analyze-receipt-image.ts';
import '@/ai/flows/analyze-text-for-splits.ts';
