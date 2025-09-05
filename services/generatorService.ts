import type { MosaicLayout } from '../App';
import { MosaicLayoutGenerator } from './mosaicService';

type RGBColor = { r: number; g: number; b: number };

/**
 * Calculates the average color of an image file.
 */
const getAverageColor = (file: File): Promise<RGBColor> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 20; // Small size for quick analysis
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return reject(new Error('Could not get canvas context'));
                
                ctx.drawImage(img, 0, 0, size, size);
                
                const imageData = ctx.getImageData(0, 0, size, size).data;
                let r = 0, g = 0, b = 0;
                
                for (let i = 0; i < imageData.length; i += 4) {
                    r += imageData[i];
                    g += imageData[i + 1];
                    b += imageData[i + 2];
                }
                
                const pixelCount = imageData.length / 4;
                resolve({
                    r: Math.floor(r / pixelCount),
                    g: Math.floor(g / pixelCount),
                    b: Math.floor(b / pixelCount),
                });
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Analyzes the main image and returns a grid of its average colors.
 */
const getMainImageColorGrid = (mainImage: File, gridSize: number): Promise<RGBColor[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return reject(new Error('Could not get canvas context'));

                ctx.drawImage(img, 0, 0);

                const cellWidth = img.width / gridSize;
                const cellHeight = img.height / gridSize;
                const colorGrid: RGBColor[][] = [];

                for (let r = 0; r < gridSize; r++) {
                    const row: RGBColor[] = [];
                    for (let c = 0; c < gridSize; c++) {
                        const startX = Math.floor(c * cellWidth);
                        const startY = Math.floor(r * cellHeight);
                        const endX = Math.floor(startX + cellWidth);
                        const endY = Math.floor(startY + cellHeight);
                        
                        const w = endX - startX;
                        const h = endY - startY;

                        if (w === 0 || h === 0) continue;
                        
                        const imageData = ctx.getImageData(startX, startY, w, h).data;
                        let avgR = 0, avgG = 0, avgB = 0;
                        
                        for (let i = 0; i < imageData.length; i += 4) {
                            avgR += imageData[i];
                            avgG += imageData[i + 1];
                            avgB += imageData[i + 2];
                        }
                        
                        const pixelCount = imageData.length / 4;
                        row.push({
                            r: Math.floor(avgR / pixelCount),
                            g: Math.floor(avgG / pixelCount),
                            b: Math.floor(avgB / pixelCount),
                        });
                    }
                    colorGrid.push(row);
                }
                resolve(colorGrid);
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(mainImage);
    });
};


const colorDistance = (rgb1: RGBColor, rgb2: RGBColor): number => {
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  // Euclidean distance
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
};

export class ClientMosaicLayoutGenerator implements MosaicLayoutGenerator {
  
  async generate(mainImage: File, tileImages: File[], gridSize: number): Promise<MosaicLayout> {
    
    // 1. Analyze all images client-side
    const [mainImageGrid, tileColors] = await Promise.all([
        getMainImageColorGrid(mainImage, gridSize),
        Promise.all(tileImages.map(getAverageColor))
    ]);
    
    const numRows = gridSize;
    const numCols = gridSize;
    const totalCells = numRows * numCols;
    const numTiles = tileImages.length;

    const mosaicLayout: MosaicLayout = Array(numRows).fill(null).map(() => Array(numCols).fill(-1));
    
    // --- Systematic Tile Assignment ---

    // Create a flat list of all cells with their color and position
    const cells: { r: number; c: number; color: RGBColor }[] = [];
    for(let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            cells.push({ r, c, color: mainImageGrid[r][c] });
        }
    }
    
    const isCellFilled: boolean[][] = Array(numRows).fill(null).map(() => Array(numCols).fill(false));
    const isTileUsed: boolean[] = Array(numTiles).fill(false);
    const tileUsageCount: number[] = Array(numTiles).fill(0);

    // Pass 1: Assign each unique tile to its single best-fit location.
    // This implements the core of the assignment problem logic.
    const costs: { distance: number; r: number; c: number; tileIndex: number }[] = [];
    for(let i = 0; i < totalCells; i++) {
        for(let j = 0; j < numTiles; j++) {
            costs.push({
                distance: colorDistance(cells[i].color, tileColors[j]),
                r: cells[i].r,
                c: cells[i].c,
                tileIndex: j
            });
        }
    }
    
    // Sort all possible assignments by best fit (lowest distance)
    costs.sort((a, b) => a.distance - b.distance);
    
    let tilesPlacedInPass1 = 0;
    for(const cost of costs) {
        if (tilesPlacedInPass1 >= numTiles) break; // Stop when all unique tiles are placed
        
        if (!isCellFilled[cost.r][cost.c] && !isTileUsed[cost.tileIndex]) {
            mosaicLayout[cost.r][cost.c] = cost.tileIndex;
            isCellFilled[cost.r][cost.c] = true;
            isTileUsed[cost.tileIndex] = true;
            tileUsageCount[cost.tileIndex]++;
            tilesPlacedInPass1++;
        }
    }

    // Pass 2: Fill the remaining empty cells with a penalty for reuse
    // This ensures diversity.
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (!isCellFilled[r][c]) {
                const cellColor = mainImageGrid[r][c];
                let bestTileIndex = -1;
                let minScore = Infinity;

                // Find best tile considering color distance and usage penalty
                for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
                    const distance = colorDistance(cellColor, tileColors[tileIndex]);
                    // Penalty increases with usage to promote diversity
                    const penalty = tileUsageCount[tileIndex] * 50; 
                    const score = distance + penalty;

                    if (score < minScore) {
                        minScore = score;
                        bestTileIndex = tileIndex;
                    }
                }

                if (bestTileIndex !== -1) {
                    mosaicLayout[r][c] = bestTileIndex;
                    tileUsageCount[bestTileIndex]++;
                } else {
                    mosaicLayout[r][c] = 0; // Fallback, should not happen
                }
            }
        }
    }

    return mosaicLayout;
  }
}