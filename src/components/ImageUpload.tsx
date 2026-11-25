import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  className?: string;
  /** Max output width in px (default 800 for menu items) */
  maxWidth?: number;
  /** Max output height in px (default 600 for menu items) */
  maxHeight?: number;
  /** JPEG quality 0–1 (default 0.78) */
  quality?: number;
  /** Label shown in the size hint badge */
  sizeHint?: string;
  /** Short description shown below the size hint */
  sizeNote?: string;
}

// ── Client-side canvas compression ───────────────────────────────────────────
const compressImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > maxWidth || h > maxHeight) {
          if (w / h > maxWidth / maxHeight) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          } else {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(ev.target?.result as string); return; }

        ctx.imageSmoothingEnabled  = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

// ── Component ─────────────────────────────────────────────────────────────────
const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  className = '',
  maxWidth  = 800,
  maxHeight = 600,
  quality   = 0.78,
  sizeHint  = '800 × 600 px',
  sizeNote  = 'Square o landscape • JPG, PNG, WebP',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [urlInput,     setUrlInput]     = useState('');
  const [showUrl,      setShowUrl]      = useState(false);
  const [previewOk,    setPreviewOk]    = useState(true);
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
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      const estKb = Math.round((compressed.length * 3) / 4 / 1024);
      setFileSizeNote(`✓ Na-optimize: ~${estKb} KB`);

      // Try Supabase Storage first; fall back to base64 silently
      let finalUrl = compressed;
      if (isSupabaseConfigured) {
        try {
          const ext      = file.name.split('.').pop() || 'jpg';
          const fileName = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const res  = await fetch(compressed);
          const blob = await res.blob();
          const { data: up, error: upErr } = await supabase.storage
            .from('menu-images')
            .upload(fileName, blob, { cacheControl: '31536000', upsert: true, contentType: 'image/jpeg' });
          if (!upErr && up?.path) {
            const { data: { publicUrl } } = supabase.storage
              .from('menu-images')
              .getPublicUrl(up.path);
            if (publicUrl) finalUrl = publicUrl;
          }
        } catch { /* silent — stay with base64 */ }
      }

      onImageChange(finalUrl);
      setPreviewOk(true);
    } catch (err) {
      console.error('Image error:', err);
      alert('Hindi ma-process ang larawan. Subukan ang ibang file.');
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
    setFileSizeNote('URL Linked ✓');
  };

  const handleRemove = () => {
    onImageChange(undefined);
    setPreviewOk(true);
    setFileSizeNote(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Header: label + size badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Image
        </label>
        <span className="inline-flex items-center space-x-1 text-[11px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
          <span>📐</span>
          <span>Required: {sizeHint}</span>
        </span>
      </div>

      {/* Size note */}
      <p className="text-[11px] text-zinc-500">{sizeNote} — awtomatikong ia-resize at ia-compress bago i-save.</p>

      {/* Preview */}
      {currentImage && previewOk ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Preview"
            onError={() => setPreviewOk(false)}
            className="w-full h-44 object-cover rounded-xl border border-zinc-700 bg-zinc-900"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow transition opacity-80 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {fileSizeNote && (
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-emerald-400 px-2 py-0.5 rounded-full">
              {fileSizeNote}
            </span>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-44 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-zinc-800/40 hover:bg-zinc-800 p-4 text-center"
        >
          {isLoading ? (
            <>
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-zinc-300 font-semibold">Ina-compress at sine-save…</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Ilang segundo lamang.</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">I-click para mag-upload</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Max recommended: <strong className="text-zinc-400">{sizeHint}</strong>
              </p>
            </>
          )}
        </div>
      )}

      {/* Buttons row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>{currentImage && previewOk ? 'Palitan ang Image' : 'Mag-upload ng Image'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrl(v => !v)}
          title="Maglagay ng Image URL"
          className={`px-3 py-2.5 border rounded-xl text-sm transition ${
            showUrl
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      {/* URL input */}
      {showUrl && (
        <div className="flex gap-2">
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
