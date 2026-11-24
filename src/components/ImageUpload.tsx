import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  className?: string;
}

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept any image, any size — store as base64 in state/localStorage
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif','image/svg+xml'];
    if (!allowed.includes(file.type) && !file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP, GIF, etc.)');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(reader.result as string);
      setPreviewOk(true);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file. Please try another.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);

    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlSubmit = () => {
    const val = urlInput.trim();
    if (!val) return;
    onImageChange(val);
    setPreviewOk(true);
    setUrlInput('');
    setShowUrl(false);
  };

  const handleRemove = () => {
    onImageChange(undefined);
    setPreviewOk(true);
    setUrlInput('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
        Menu Item Image
      </label>

      {/* ── Preview ── */}
      {currentImage && previewOk ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Preview"
            onError={() => setPreviewOk(false)}
            className="w-full h-44 object-cover rounded-xl border border-zinc-700"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow transition opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ── Drop zone / upload prompt ── */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-44 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-zinc-800/40 hover:bg-zinc-800"
        >
          {isLoading ? (
            <>
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-zinc-400">Loading image…</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-zinc-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Click to upload image</p>
              <p className="text-xs text-zinc-500 mt-0.5">JPG, PNG, WebP, GIF — any size</p>
            </>
          )}
        </div>
      )}

      {/* ── Upload button ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition"
        >
          <Upload className="w-4 h-4" />
          <span>{currentImage && previewOk ? 'Replace Image' : 'Upload Image'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrl(v => !v)}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm transition"
          title="Use image URL instead"
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      {/* ── URL input (collapsible) ── */}
      {showUrl && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://... or /images/..."
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition"
          >
            Use
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
