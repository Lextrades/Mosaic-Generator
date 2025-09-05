// services/mosaicService.ts
// This service is responsible for providing the mosaic generation logic. The previous filename (aiService.ts) was historical.

import { ClientMosaicLayoutGenerator } from './generatorService';
import type { MosaicLayout } from '../App';

/**
 * Defines the general interface for any mosaic layout generator.
 */
export interface MosaicLayoutGenerator {
  generate(mainImage: File, tileImages: File[], gridSize: number): Promise<MosaicLayout>;
}

/**
 * Factory function to create the layout generator.
 * 
 * @returns An instance of a service that implements the MosaicLayoutGenerator interface.
 */
export const getMosaicLayoutGenerator = (): MosaicLayoutGenerator => {
  return new ClientMosaicLayoutGenerator();
};
