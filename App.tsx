import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { MosaicDisplay } from './components/MosaicDisplay';
import { getMosaicLayoutGenerator } from './services/mosaicService';
import { StarRating } from './components/StarRating';
import { FeedbackList } from './components/FeedbackList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SparklesIcon, SpinnerIcon } from './components/Icons';

export type MosaicLayout = number[][];

interface AverageRatingInfo {
    average: number;
    count: number;
}

export interface Feedback {
    id: string; // User's unique ID
    name: string;
    location?: string;
    rating: number;
    message: string;
    date: string;
}


const App: React.FC = () => {
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [tileImages, setTileImages] = useState<File[]>([]);
  
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [tileImagePreviews, setTileImagePreviews] = useState<string[]>([]);

  const [generatedMosaicLayout, setGeneratedMosaicLayout] = useState<MosaicLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);
  const [gridSize, setGridSize] = useState(20);

  // Rating and Feedback State
  const [userRating, setUserRating] = useState(0);
  const [averageRatingInfo, setAverageRatingInfo] = useState<AverageRatingInfo>({ average: 0, count: 0 });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Modal States
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [feedbackToSubmit, setFeedbackToSubmit] = useState<Feedback | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showMissingInputModal, setShowMissingInputModal] = useState(false);


  // Effect to manage a unique user ID for feedback
  useEffect(() => {
    let storedUserId = localStorage.getItem('mosaicGenerator_userId');
    if (!storedUserId) {
        storedUserId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('mosaicGenerator_userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Load rating and feedback from localStorage on initial mount
  useEffect(() => {
    try {
        const storedUserRating = localStorage.getItem('mosaicGenerator_userRating');
        if (storedUserRating) {
            setUserRating(JSON.parse(storedUserRating));
        }

        const storedAverageRating = localStorage.getItem('mosaicGenerator_averageRating');
        if (storedAverageRating) {
            setAverageRatingInfo(JSON.parse(storedAverageRating));
        } else {
            // Reset to 0 on first load.
            setAverageRatingInfo({ average: 0, count: 0 });
        }

        const storedFeedback = localStorage.getItem('mosaicGenerator_feedback');
        if (storedFeedback) {
            setFeedbackList(JSON.parse(storedFeedback));
        }

    } catch (err) {
        console.error("Failed to parse data from localStorage", err);
    }
  }, []);

  const handleRatingChange = useCallback((newRating: number) => {
    const oldRating = userRating; // The rating before this change
    
    setAverageRatingInfo(prev => {
        let newTotalRating = prev.average * prev.count;
        let newCount = prev.count;
        
        const hadRatedBefore = oldRating > 0;
        const isRatingNow = newRating > 0;
        
        if (hadRatedBefore) {
            newTotalRating -= oldRating;
        }
        
        if (isRatingNow) {
            newTotalRating += newRating;
        }

        if (!hadRatedBefore && isRatingNow) {
            newCount++;
        } else if (hadRatedBefore && !isRatingNow) {
            newCount--;
        }

        const newAverage = newCount > 0 ? newTotalRating / newCount : 0;
        const newInfo = { average: newAverage, count: Math.max(0, newCount) };
        
        localStorage.setItem('mosaicGenerator_averageRating', JSON.stringify(newInfo));
        
        return newInfo;
    });

    setUserRating(newRating);
    localStorage.setItem('mosaicGenerator_userRating', JSON.stringify(newRating));

  }, [userRating]);

  const processFeedbackSubmission = (feedback: Feedback) => {
    setFeedbackList(prev => {
        const filteredList = prev.filter(fb => fb.id !== userId);
        const updatedList = [feedback, ...filteredList];
        localStorage.setItem('mosaicGenerator_feedback', JSON.stringify(updatedList));
        return updatedList;
    });
    
    setShowThankYou(true);
    setShowFeedbackForm(false);
    setFeedbackMessage('');
    // No need to reset the form, as it gets unmounted.
  };

  const handleFeedbackSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get('feedbackName') as string).trim();
    const location = (formData.get('feedbackLocation') as string).trim();
    const message = feedbackMessage; // Use state for controlled component

    if (userRating === 0 && !message.trim()) {
        setShowMissingInputModal(true);
        return;
    }

    const newFeedback: Feedback = {
        id: userId,
        name: name || 'Anonym',
        location: location || undefined,
        rating: userRating,
        message: message.trim(),
        date: new Date().toISOString(),
    };
    
    const existingFeedback = feedbackList.find(fb => fb.id === userId);
    
    if (existingFeedback) {
        setFeedbackToSubmit(newFeedback);
        setShowOverwriteConfirm(true);
    } else {
        processFeedbackSubmission(newFeedback);
    }
  };


  // Effect to create/revoke object URLs for previews
  useEffect(() => {
    if (mainImage) {
      const url = URL.createObjectURL(mainImage);
      setMainImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setMainImagePreview(null);
    }
  }, [mainImage]);

  useEffect(() => {
    const urls = tileImages.map(file => URL.createObjectURL(file));
    setTileImagePreviews(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [tileImages]);


  const handleSetMainImage = useCallback((files: File[]) => {
    setMainImage(files[0] || null);
  }, []);

  const handleAddTileImages = useCallback((files: File[]) => {
    setTileImages(prev => [...prev, ...files]);
  }, []);
  
  const handleRemoveMainImage = useCallback(() => {
    setMainImage(null);
  }, []);

  const handleRemoveTileImage = useCallback((indexToRemove: number) => {
    setTileImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);


  const handleGenerate = async () => {
    if (!mainImage || tileImages.length < 2) {
      setError("Bitte laden Sie ein Hauptbild und mindestens ZWEI Kachelbilder hoch.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedMosaicLayout(null);

    try {
      const generator = getMosaicLayoutGenerator();
      const result = await generator.generate(mainImage, tileImages, gridSize);
      setGeneratedMosaicLayout(result);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`Fehler bei der Generierung: ${e.message}`);
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const canGenerate = mainImage !== null && tileImages.length > 1 && !isLoading;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <ConfirmationModal
        isOpen={showOverwriteConfirm}
        onClose={() => setShowOverwriteConfirm(false)}
        onConfirm={() => {
            if (feedbackToSubmit) {
                processFeedbackSubmission(feedbackToSubmit);
            }
            setShowOverwriteConfirm(false);
        }}
        title="Feedback überschreiben?"
        confirmText="Überschreiben"
        cancelText="Abbrechen"
      >
        <p>Sie haben bereits Feedback abgegeben. Möchten Sie Ihr vorheriges Feedback wirklich mit dem neuen überschreiben?</p>
      </ConfirmationModal>

      <ConfirmationModal
          isOpen={showThankYou}
          onClose={() => setShowThankYou(false)}
          title="Feedback gesendet"
      >
          <p>Vielen Dank! Ihre Meinung hilft uns, die App zu verbessern.</p>
      </ConfirmationModal>

      <ConfirmationModal
          isOpen={showMissingInputModal}
          onClose={() => setShowMissingInputModal(false)}
          title="Eingabe fehlt"
      >
          <p>Bitte geben Sie eine Bewertung oder eine Nachricht ein, um Feedback zu senden.</p>
      </ConfirmationModal>
      
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
              <StarRating rating={averageRatingInfo.average} size="sm" disabled={true} />
              <p className="text-slate-400 text-sm">
                  {averageRatingInfo.count > 0 
                    ? `${averageRatingInfo.average.toFixed(1)} (${averageRatingInfo.count.toLocaleString()} Bewertungen)`
                    : `0 Bewertungen`
                  }
              </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
            Mosaic Generator
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Verwandeln Sie Ihre Fotos in ein einzigartiges Mosaik-Kunstwerk.
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-8">
              <ImageUploader
                title="1. Hauptbild hochladen"
                description="Dieses Bild wird die Vorlage für Ihr Mosaik sein."
                onFilesAdd={handleSetMainImage}
                previews={mainImagePreview ? [mainImagePreview] : []}
                onFileRemove={() => handleRemoveMainImage()}
                multiple={false}
                accept="image/png, image/jpeg, image/webp"
              />
              <ImageUploader
                title="2. Kachelbilder hochladen"
                description="Je mehr Bilder mit unterschiedlichen Farben Sie bereitstellen, desto besser wird das Ergebnis."
                onFilesAdd={handleAddTileImages}
                previews={tileImagePreviews}
                onFileRemove={handleRemoveTileImage}
                multiple={true}
                accept="image/png, image/jpeg, image/webp"
              />
              <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label htmlFor="opacitySlider" className="block text-sm font-medium text-slate-300 mb-2">
                      Deckkraft des Hauptbildes: {Math.round(overlayOpacity * 100)}%
                    </label>
                    <input
                      id="opacitySlider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      disabled={isLoading}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="gridSizeInput" className="block text-sm font-medium text-slate-300 mb-2">
                      Mosaik-Auflösung (10-100)
                    </label>
                    <div className="flex gap-2">
                      <input
                          id="gridSizeInput"
                          type="number"
                          min="10"
                          max="100"
                          value={gridSize}
                          onChange={(e) => {
                              const val = Math.max(10, Math.min(100, parseInt(e.target.value, 10) || 10));
                              setGridSize(val);
                          }}
                          disabled={isLoading}
                          className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                          placeholder="z.B. 20"
                      />
                      {[20, 32, 48].map(size => (
                          <button 
                              key={size}
                              onClick={() => setGridSize(size)}
                              disabled={isLoading}
                              className={`px-4 py-2 rounded-md transition-colors duration-200 text-sm font-semibold whitespace-nowrap ${gridSize === size ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                          >
                              {size} x {size}
                          </button>
                      ))}
                    </div>
                  </div>
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={`w-full text-lg font-semibold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-3
                      ${canGenerate 
                        ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon />
                        Generiere Mosaik...
                      </>
                    ) : (
                      <>
                        <SparklesIcon />
                        Mosaik generieren
                      </>
                    )}
                  </button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 min-h-[400px] lg:min-h-full">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                  <h2 className="text-2xl font-bold text-slate-100">3. Ergebnis</h2>
                  <StarRating rating={userRating} onRatingChange={handleRatingChange} size="sm" />
              </div>
              <MosaicDisplay 
                  mosaicLayout={generatedMosaicLayout} 
                  tilePreviews={tileImagePreviews}
                  mainImagePreview={mainImagePreview}
                  isLoading={isLoading} 
                  error={error} 
                  overlayOpacity={overlayOpacity}
                  userRating={userRating}
                  onRatingChange={handleRatingChange}
              />
            </div>
          </div>

          <section className="mt-8">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">4. Feedback & Bewertung</h2>
                <p className="text-slate-400 mb-4">Ihre Meinung hilft uns, die App zu verbessern.</p>
                {!showFeedbackForm ? (
                    <button onClick={() => setShowFeedbackForm(true)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                        Feedback geben
                    </button>
                ) : (
                    <form onSubmit={handleFeedbackSubmit}>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <label className="text-sm font-semibold text-slate-300 flex-shrink-0">Ihre Bewertung</label>
                                    <input
                                        type="text"
                                        name="feedbackName"
                                        maxLength={64}
                                        className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 w-full sm:w-96"
                                        placeholder="Name (Ohne Angabe erscheint Anonym)"
                                    />
                                    <input
                                        type="text"
                                        name="feedbackLocation"
                                        maxLength={20}
                                        className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 w-full sm:w-48"
                                        placeholder="Ort (optional)"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-4 mb-2 flex-wrap">
                                    <label htmlFor="feedbackText" className="block text-sm font-semibold text-slate-300">
                                        Ihre Nachricht (optional)
                                    </label>
                                    <StarRating rating={userRating} onRatingChange={handleRatingChange} size="lg" />
                                </div>
                                <textarea
                                    id="feedbackText"
                                    name="feedbackText"
                                    rows={4}
                                    maxLength={500}
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                                    placeholder="Teilen Sie uns Ihre Ideen, Wünsche oder einen Fehler mit..."
                                ></textarea>
                                <div className="text-right text-xs text-slate-500 mt-1">
                                    {feedbackMessage.length} / 500
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                                    Feedback senden
                                </button>
                                <button type="button" onClick={() => setShowFeedbackForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </form>
                )}
                <FeedbackList feedbackList={feedbackList} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};



export default App;
