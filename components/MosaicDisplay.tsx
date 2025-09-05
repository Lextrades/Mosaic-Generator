import React, { useRef, useState, useEffect } from 'react';
import type { MosaicLayout } from '../App';
import html2canvas from 'html2canvas';
import { StarRating } from './StarRating';

interface MosaicDisplayProps {
  mosaicLayout: MosaicLayout | null;
  tilePreviews: string[];
  mainImagePreview: string | null;
  isLoading: boolean;
  error: string | null;
  overlayOpacity: number;
  userRating: number;
  onRatingChange: (rating: number) => void;
}

const loadingMessages = [
    "Analysiere Farbspektren...",
    "Berechne Kachel-Positionen...",
    "Das Mosaik nimmt Form an...",
    "Komposition wird erstellt...",
    "Fast fertig, der letzte Schliff wird angelegt..."
];

const isValidLayout = (layout: unknown): layout is number[][] => {
    if (!Array.isArray(layout) || layout.length === 0 || !Array.isArray(layout[0]) || layout[0].length === 0) {
        return false;
    }
    const firstRowLength = layout[0].length;
    return layout.every(row => Array.isArray(row) && row.length === firstRowLength);
};


export const MosaicDisplay: React.FC<MosaicDisplayProps> = ({ mosaicLayout, tilePreviews, mainImagePreview, isLoading, error, overlayOpacity, userRating, onRatingChange }) => {
  const [currentMessage, setCurrentMessage] = React.useState(loadingMessages[0]);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [baseDimension, setBaseDimension] = useState<number>(0);
  const [outputDimension, setOutputDimension] = useState<number>(1024);
  const [downloadFormat, setDownloadFormat] = useState<'jpeg' | 'png'>('jpeg');

  useEffect(() => {
    if (mosaicLayout && mosaicRef.current) {
        const dim = mosaicRef.current.offsetWidth;
        if (dim > 0) {
            setBaseDimension(dim);
            // Set default output to "Mittel" (2x)
            setOutputDimension(dim * 2);
        }
    }
  }, [mosaicLayout]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => {
            const currentIndex = loadingMessages.indexOf(prev);
            const nextIndex = (currentIndex + 1) % loadingMessages.length;
            return loadingMessages[nextIndex];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

 const getMosaicAsBlob = async (width: number, height: number, format: 'image/jpeg' | 'image/png', quality: number): Promise<Blob | null> => {
    if (!mosaicRef.current) return null;
    
    // Backup original styles
    const originalStyle = {
        width: mosaicRef.current.style.width,
        height: mosaicRef.current.style.height,
        position: mosaicRef.current.style.position,
        left: mosaicRef.current.style.left,
        top: mosaicRef.current.style.top,
    };
    
    // Temporarily resize element for high-res capture
    mosaicRef.current.style.position = 'absolute';
    mosaicRef.current.style.left = '-9999px';
    mosaicRef.current.style.top = '-9999px';
    mosaicRef.current.style.width = `${width}px`;
    mosaicRef.current.style.height = `${height}px`;

    // Wait for the browser to apply styles and re-render
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

    const canvas = await html2canvas(mosaicRef.current, {
        useCORS: true,
        width: width,
        height: height,
        backgroundColor: '#1e293b',
        scale: 1, // Crucial for exact pixel output
    });

    // Restore original styles
    mosaicRef.current.style.width = originalStyle.width;
    mosaicRef.current.style.height = originalStyle.height;
    mosaicRef.current.style.position = originalStyle.position;
    mosaicRef.current.style.left = originalStyle.left;
    mosaicRef.current.style.top = originalStyle.top;

    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), format, quality);
    });
};
  
const handleDownload = async () => {
    if (!mosaicRef.current) return;
    setIsDownloading(true);
    setShowDownloadOptions(false);

    const mimeType = `image/${downloadFormat}` as 'image/jpeg' | 'image/png';
    const quality = downloadFormat === 'jpeg' ? 0.9 : 1;
    const ext = downloadFormat === 'jpeg' ? 'jpg' : 'png';
    const dim = Math.max(128, Math.min(16000, outputDimension));

    try {
        const blob = await getMosaicAsBlob(dim, dim, mimeType, quality);
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `nxtlvl-mosaic-${dim}x${dim}.${ext}`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error("Failed to download image:", err);
    } finally {
        setIsDownloading(false);
    }
};

 const handleShare = async () => {
    if (!navigator.share) {
        alert("Die Teilen-Funktion wird von Ihrem Browser nicht unterstützt.");
        return;
    }
    setIsSharing(true);
    
    const shareUrl = "https://aistudio.google.com/";

    const shareData: ShareData = {
        title: 'Mein Mosaik Kunstwerk',
        text: `Schau dir dieses Mosaik an, das ich mit dem Mosaic Generator erstellt habe! Erstelle dein eigenes hier: ${shareUrl}`,
        url: shareUrl,
    };

    try {
        const shareDim = baseDimension > 0 ? baseDimension : 512;
        const blob = await getMosaicAsBlob(shareDim, shareDim, 'image/jpeg', 0.85);
        if (blob) {
            const file = new File([blob], `nxtlvl-mosaic-${shareDim}x${shareDim}.jpg`, { type: 'image/jpeg' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ ...shareData, files: [file] });
            } else {
                await navigator.share(shareData);
            }
        } else {
            await navigator.share(shareData);
        }
    } catch (err) {
        if ((err as Error).name !== 'AbortError') {
            console.error("Fehler beim Teilen:", err);
        }
    } finally {
        setIsSharing(false);
    }
};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <SpinnerIcon />
        <p className="text-lg font-semibold text-sky-400 mt-4">Ihr Mosaik wird generiert...</p>
        <p className="text-slate-400 mt-2">{currentMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <ErrorIcon />
        <p className="text-lg font-semibold text-red-400 mt-4">Ein Fehler ist aufgetreten</p>
        <p className="text-slate-300 mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (mosaicLayout && tilePreviews.length > 0) {
    if (!isValidLayout(mosaicLayout)) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                <ErrorIcon />
                <p className="text-lg font-semibold text-yellow-400 mt-4">Fehlerhaftes Layout</p>
                <p className="text-slate-300 mt-2 text-sm">Das Mosaik konnte nicht erstellt werden. Das Format der generierten Daten ist unerwartet.</p>
            </div>
        )
    }
    
    const cols = mosaicLayout[0].length;
    const isShareSupported = 'share' in navigator && 'canShare' in navigator;

    return (
      <>
        <div className="relative">
           <div 
              ref={mosaicRef}
              className="w-full h-auto aspect-square bg-slate-900"
            >
              <div
                  className="w-full h-full"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  }}
              >
                {mosaicLayout.flat().map((tileIndex, i) => {
                  const safeIndex = Math.abs(tileIndex) % tilePreviews.length;
                  return (
                    <div key={i} className="w-full h-full overflow-hidden">
                      <img 
                        src={tilePreviews[safeIndex]} 
                        alt={`Tile ${safeIndex}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        crossOrigin="anonymous"
                      />
                    </div>
                  );
                })}
              </div>
              {/* Transparent Overlay */}
              {mainImagePreview && (
                  <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                          backgroundImage: `url(${mainImagePreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: overlayOpacity,
                      }}
                  />
              )}
          </div>

          <button
              onClick={() => setIsFullScreen(true)}
              className="absolute top-2 left-2 bg-slate-900/50 hover:bg-sky-500 text-white font-bold p-2 rounded-full backdrop-blur-sm transition-all duration-300"
              aria-label="Vollbild-Ansicht"
          >
              <FullScreenIcon />
          </button>

          <div className="absolute top-2 right-2 flex items-center gap-2">
              {isShareSupported && (
                   <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="bg-slate-900/50 hover:bg-sky-500 text-white font-bold p-2 rounded-full backdrop-blur-sm transition-all duration-300"
                      aria-label="Share Mosaic"
                  >
                      {isSharing ? <SpinnerIconSmall/> : <ShareIcon />}
                  </button>
              )}
              <div className="relative">
                  <button
                      onClick={() => setShowDownloadOptions(prev => !prev)}
                      disabled={isDownloading}
                      className="bg-slate-900/50 hover:bg-sky-500 text-white font-bold p-2 rounded-full backdrop-blur-sm transition-all duration-300"
                      aria-label="Download Mosaic"
                  >
                      <DownloadIcon />
                  </button>
                  {showDownloadOptions && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 p-4 text-sm">
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-2">Ausgabengröße (Pixel)</label>
                                  <div className="flex items-center gap-2">
                                      <input 
                                          type="number"
                                          value={outputDimension}
                                          onChange={(e) => setOutputDimension(parseInt(e.target.value, 10) || 0)}
                                          className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                                      />
                                      <span className="text-slate-500 font-mono">x</span>
                                      <input 
                                          type="number"
                                          value={outputDimension}
                                          onChange={(e) => setOutputDimension(parseInt(e.target.value, 10) || 0)}
                                          className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                                      />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center mt-2">
                                      {[
                                          ['Klein', baseDimension || 512],
                                          ['Mittel', (baseDimension || 512) * 2],
                                          ['Groß', (baseDimension || 512) * 4]
                                      ].map(([label, dim]) => (
                                          <button 
                                              key={label as string}
                                              onClick={() => setOutputDimension(dim as number)}
                                              className={`px-3 py-1.5 rounded-md transition-colors duration-200 text-xs ${outputDimension === dim ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-700 hover:bg-slate-600'}`}
                                          >
                                              {label as string}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                               <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-2">Format</label>
                                  <div className="grid grid-cols-2 gap-2">
                                       <button 
                                          onClick={() => setDownloadFormat('jpeg')}
                                          className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${downloadFormat === 'jpeg' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-700 hover:bg-slate-600'}`}
                                      >
                                          JPG
                                      </button>
                                       <button 
                                          onClick={() => setDownloadFormat('png')}
                                          className={`px-3 py-1.5 rounded-md transition-colors duration-200 ${downloadFormat === 'png' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-700 hover:bg-slate-600'}`}
                                      >
                                          PNG
                                      </button>
                                  </div>
                              </div>
                              <div className="pt-2 border-t border-slate-700/50">
                                 <label className="block text-sm font-semibold text-slate-300 mb-2">Ergebnis bewerten</label>
                                 <StarRating rating={userRating} onRatingChange={onRatingChange} size="sm" />
                              </div>
                              <button 
                                  onClick={handleDownload}
                                  disabled={isDownloading}
                                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-300"
                              >
                                  {isDownloading ? <SpinnerIconSmall /> : <DownloadIconSmall />}
                                  <span>Herunterladen</span>
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>
        {isFullScreen && (
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
                onClick={() => setIsFullScreen(false)}
                role="dialog"
                aria-modal="true"
            >
                <div
                    className="relative w-[95vmin] h-[95vmin]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="w-full h-full bg-slate-900"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        }}
                    >
                        {mosaicLayout.flat().map((tileIndex, i) => {
                          const safeIndex = Math.abs(tileIndex) % tilePreviews.length;
                          return (
                              <div key={`fs-${i}`} className="w-full h-full overflow-hidden">
                              <img
                                  src={tilePreviews[safeIndex]}
                                  alt={`Fullscreen Tile ${safeIndex}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                              />
                              </div>
                          );
                        })}
                    </div>
                    {mainImagePreview && (
                        <div
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{
                                backgroundImage: `url(${mainImagePreview})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                opacity: overlayOpacity,
                            }}
                        />
                    )}
                </div>
                 <button
                    onClick={() => setIsFullScreen(false)}
                    className="absolute top-4 right-4 text-white hover:text-sky-400 transition-colors"
                    aria-label="Vollbild schließen"
                >
                    <CloseIcon />
                </button>
            </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
      <ImageIcon />
      <p className="mt-4 text-lg font-medium">Ihr generiertes Mosaik wird hier angezeigt.</p>
      <p className="mt-1 text-sm">Führen Sie die Schritte 1 und 2 aus und klicken Sie auf "Mosaik generieren".</p>
    </div>
  );
};

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-10 w-10 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SpinnerIconSmall: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const DownloadIconSmall: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const FullScreenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m0 0v-4m0 4l-5-5" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);