import { NormalizedListing } from '../lib/listingProvider.ts';

export interface DemoListing extends NormalizedListing {
  productGroup?: string;
  aliases?: string[];
  capturedAt: string;
}

/**
 * Hand-collected listings used for demos until live data is available.
 * Fields follow docs/demo_dataset.md. Add one entry per collected link.
 */
export const DEMO_LISTINGS: DemoListing[] = [];
