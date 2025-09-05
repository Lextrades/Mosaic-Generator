import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, CloseIconSmall } from './Icons';

interface ImageUploaderProps {
  title: string;
  description: string;
  onFilesAdd: (files: File[]) => void;
  previews: string[];
  onFileRemove: (index: number) => void;
  multiple: boolean;
  accept: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onFilesAdd, previews, onFileRemove, multiple, accept }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onFilesAdd(Array.from(files));
      // Clear the input value to allow re-selecting the same file
      event.target.value = '';
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length) {
      onFilesAdd(Array.from(files));
    }
  }, [onFilesAdd]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      <p className="text-slate-400 mt-1 mb-4">{description}</p>
      <p className="text-xs text-slate-500 -mt-3 mb-4">
        Tipp: Für eine hochauflösende PNG-Ausgabe werden PNG-Dateien empfohlen.
      </p>
      
      <div 
        onClick={triggerFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300
          ${isDragging ? 'border-sky-500 bg-sky-900/20' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          multiple={multiple} 
          accept={accept}
          onChange={handleFileChange} 
          className="hidden"
        />
        <UploadIcon />
        <p className="mt-2 font-semibold text-slate-300">Dateien per Drag & Drop hier ablegen</p>
        <p className="text-sm text-slate-500">oder klicken, um auszuwählen</p>
        <p className="text-xs text-slate-600 mt-2">Unterstützte Formate: PNG, JPG, WebP</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-300 mb-2">Vorschau:</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {previews.map((src, index) => (
              <div key={index} className="relative group">
                <img 
                  src={src} 
                  alt={`Preview ${index}`} 
                  className="w-full h-24 object-cover rounded-md border-2 border-slate-700"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering file select
                        onFileRemove(index);
                    }}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Remove image"
                >
                    <CloseIconSmall />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
