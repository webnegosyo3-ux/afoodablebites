import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  className?: string;
}

/**
 * Compresses an image file on client-side canvas to max 1000x800 and ~0.82 quality JPEG.
 * This shrinks a 5MB phone photo down to ~60KB-90KB, preventing localStorage QuotaExceededError
 * and preventing Supabase 413 Payload Too Large errors!
 */
const compressImageFile = (file: File, maxWidth = 1000, maxHeight = 800, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If SVG, return direct text/base64 without canvas
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale proportionally if larger than maximum dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        // Export as lightweight JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput,  setUrlInput]  = useState('');
  const [showUrl,   setShowUrl]   = useState(false);
  const [previewOk, setPreviewOk] = useState(true);
  const [fileSizeNote, setFileSizeNote] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mangyaring pumili ng larawan (JPG, PNG, WebP, GIF, etc.)');
      return;
    }

    setIsLoading(true);
    setFileSizeNote(null);

    try {
      // 1. Compress image client-side to lightweight high-res JPEG (~60-90KB)
      const compressedDataUrl = await compressImageFile(file, 1000, 800, 0.82);
      const estKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setFileSizeNote(`Na-optimize: ~${estKb} KB`);

      // 2. If Supabase Storage bucket 'menu-images' is available, try uploading as real URL
      let finalImageUrl = compressedDataUrl;
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          
          // Convert dataURL to Blob for storage upload
          const res = await fetch(compressedDataUrl);
          const blob = await res.blob();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('menu-images')
            .upload(fileName, blob, {
              cacheControl: '31536000',
              upsert: true,
              contentType: 'image/jpeg'
            });

          if (!uploadError && uploadData?.path) {
            const { data: { publicUrl } } = supabase.storage
              .from('menu-images')
              .getPublicUrl(uploadData.path);
            if (publicUrl) {
              finalImageUrl = publicUrl;
            }
          }
        } catch {
          // Fallback to high-quality compressed data URL seamlessly
        }
      }

      onImageChange(finalImageUrl);
      setPreviewOk(true);
    } catch (err) {
      console.error('Image compression error:', err);
      alert('Hindi ma-process ang larawan. Subukan ang ibang image file.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const val = urlInput.trim();
    if (!val) return;
    onImageChange(val);
    setPreviewOk(true);
    setUrlInput('');
    setShowUrl(false);
    setFileSizeNote('URL Linked');
  };

  const handleRemove = () => {
    onImageChange(undefined);
    setPreviewOk(true);
    setUrlInput('');
    setFileSizeNote(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Menu Item Image
        </label>
        {fileSizeNote && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{fileSizeNote}</span>
          </span>
        )}
      </div>

      {/* ── Preview ── */}
      {currentImage && previewOk ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Preview"
            onError={() => setPreviewOk(false)}
            className="w-full h-48 object-cover rounded-xl border border-zinc-700 bg-zinc-900"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow transition opacity-80 group-hover:opacity-100"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* ── Drop zone / upload prompt ── */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-44 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-zinc-800/40 hover:bg-zinc-800 p-4 text-center"
        >
          {isLoading ? (
            <>
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-zinc-300 font-bold">Ina-optimize at sine-save ang image…</p>
              <p className="text-[11px] text-zinc-500">Ito ay tumatagal ng 1-2 segundo lamang.</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-zinc-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">I-click upang mag-upload ng image</p>
              <p className="text-xs text-zinc-500 mt-0.5">Kahit anong picture (JPG, PNG, WebP) — awtomatikong ia-adjust para mabilis mag-load at ma-save</p>
            </>
          )}
        </div>
      )}

      {/* ── Upload & URL Actions ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition shadow-sm active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>{currentImage && previewOk ? 'Palitan ang Image' : 'Mag-upload ng Image'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrl(v => !v)}
          className={`px-3 py-2.5 border rounded-xl text-sm transition flex items-center justify-center ${
            showUrl
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          title="Maglagay ng Image URL"
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      {/* ── URL input (collapsible) ── */}
      {showUrl && (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://... o link ng larawan"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition"
          >
            Gamitin
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />
    </div>
  );
};

export default ImageUpload;
