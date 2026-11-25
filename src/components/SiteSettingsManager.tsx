import React, { useState } from 'react';
import { Save, Upload, X, Loader, Flame, QrCode, Printer } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useImageUpload } from '../hooks/useImageUpload';
import QRCodeDisplay from './QRCodeDisplay';

const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';

const SiteSettingsManager: React.FC = () => {
  const { siteSettings, loading, updateSiteSettings } = useSiteSettings();
  const { uploadImage, uploading } = useImageUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    currency: '',
    currency_code: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  React.useEffect(() => {
    if (siteSettings) {
      setFormData({
        site_name: siteSettings.site_name,
        site_description: siteSettings.site_description,
        currency: siteSettings.currency,
        currency_code: siteSettings.currency_code
      });
      setLogoPreview(siteSettings.site_logo);
    }
  }, [siteSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = e => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = logoPreview;
      if (logoFile) {
        try {
          logoUrl = await uploadImage(logoFile);
        } catch (uploadError) {
          alert(`❌ Failed to upload logo: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setIsSaving(false);
          return;
        }
      }
      await updateSiteSettings({
        site_name: formData.site_name,
        site_description: formData.site_description,
        currency: formData.currency,
        currency_code: formData.currency_code,
        site_logo: logoUrl
      });
      alert('✅ Site settings saved! Changes will appear after page refresh.');
      setIsEditing(false);
      setLogoFile(null);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      alert(`❌ Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (siteSettings) {
      setFormData({
        site_name: siteSettings.site_name,
        site_description: siteSettings.site_description,
        currency: siteSettings.currency,
        currency_code: siteSettings.currency_code
      });
      setLogoPreview(siteSettings.site_logo);
    }
    setIsEditing(false);
    setLogoFile(null);
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-zinc-800 rounded w-1/4" />
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-white">Site Settings</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-sm font-bold rounded-xl shadow hover:from-amber-400 hover:to-red-400 transition-all"
          >
            <Save className="h-3.5 w-3.5" /><span>Edit Settings</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button onClick={handleCancel} disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
              <X className="h-3.5 w-3.5" /><span>Cancel</span>
            </button>
            <button onClick={handleSave} disabled={isSaving || uploading}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-sm font-bold rounded-xl shadow hover:from-amber-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving || uploading ? (
                <><Loader className="h-3.5 w-3.5 animate-spin" /><span>{uploading ? 'Uploading…' : 'Saving…'}</span></>
              ) : (
                <><Save className="h-3.5 w-3.5" /><span>Save Changes</span></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center space-x-3">
          <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-amber-300 text-sm font-medium">
            {uploading ? 'Uploading logo…' : 'Saving settings…'}
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Site Logo */}
        <div>
          <label className={labelCls}>🔥 Brand Logo</label>
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex-shrink-0 shadow-lg">
              {logoPreview ? (
                <img src={logoPreview} alt="Site Logo" className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" disabled={isSaving || uploading} />
                  <label htmlFor="logo-upload"
                    className={`inline-flex items-center space-x-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-amber-500 text-zinc-300 hover:text-amber-400 rounded-xl text-sm font-semibold cursor-pointer transition ${isSaving || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="h-4 w-4" />
                    <span>{uploading ? 'Uploading…' : 'Upload New Logo'}</span>
                  </label>
                  <p className="text-xs text-zinc-500 mt-1.5">JPG, PNG, WebP, GIF · Max 5 MB</p>
                  {logoFile && <p className="text-xs text-amber-400 mt-1 font-semibold">✓ Selected: {logoFile.name}</p>}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Current logo shown. Click Edit Settings to upload a new one.</p>
              )}
            </div>
          </div>
        </div>

        {/* Site Name */}
        <div>
          <label className={labelCls}>Restaurant / Site Name</label>
          {isEditing ? (
            <input type="text" name="site_name" value={formData.site_name} onChange={handleInputChange} className={inputCls} placeholder="Afoodable Bites" />
          ) : (
            <p className="text-white font-semibold">{siteSettings?.site_name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Tagline / Description</label>
          {isEditing ? (
            <textarea name="site_description" value={formData.site_description} onChange={handleInputChange} rows={3} className={inputCls} placeholder="Always Serving Hot! …" />
          ) : (
            <p className="text-zinc-400 text-sm leading-relaxed">{siteSettings?.site_description}</p>
          )}
        </div>

        {/* Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Currency Symbol</label>
            {isEditing ? (
              <input type="text" name="currency" value={formData.currency} onChange={handleInputChange} className={inputCls} placeholder="₱" />
            ) : (
              <p className="text-white font-semibold text-lg">{siteSettings?.currency}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Currency Code</label>
            {isEditing ? (
              <input type="text" name="currency_code" value={formData.currency_code} onChange={handleInputChange} className={inputCls} placeholder="PHP" />
            ) : (
              <p className="text-white font-semibold">{siteSettings?.currency_code}</p>
            )}
          </div>
        </div>

        {/* ── QR Code Section ── */}
        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Website QR Code</h3>
          </div>
          <p className="text-xs text-zinc-400">
            I-print o i-display ang QR code na ito sa inyong tindahan. 
            I-scan ng customers para maabot ang online ordering page.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <QRCodeDisplay size={220} />

            <div className="space-y-3">
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xs space-y-1">
                <p className="text-zinc-400">Points to:</p>
                <p className="text-amber-400 font-mono font-bold break-all">https://afoodablebites.vercel.app/</p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Code</span>
              </button>

              <p className="text-[11px] text-zinc-500">
                💡 Right-click the QR image → "Save image as…" to download it.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SiteSettingsManager;
