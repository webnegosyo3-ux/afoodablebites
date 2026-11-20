import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Sparkles, 
  MoveUp, 
  MoveDown, 
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  Flame,
  Clock,
  Sliders
} from 'lucide-react';
import { useWelcomePage } from '../hooks/useWelcomePage';
import { useImageUpload } from '../hooks/useImageUpload';
import { WelcomeSlide } from '../types';

interface WelcomePageManagerProps {
  onBack: () => void;
}

const BADGE_COLOR_OPTIONS = [
  { label: 'Red Flame', value: 'bg-red-600 text-white' },
  { label: 'Amber Gold', value: 'bg-amber-500 text-black' },
  { label: 'Orange Sizzle', value: 'bg-orange-600 text-white' },
  { label: 'Emerald Fresh', value: 'bg-emerald-600 text-white' },
  { label: 'Purple Night', value: 'bg-purple-600 text-white' },
  { label: 'Blue Cool', value: 'bg-blue-600 text-white' },
  { label: 'Pink Special', value: 'bg-pink-600 text-white' },
  { label: 'Bright Yellow', value: 'bg-yellow-400 text-black' }
];

const WelcomePageManager: React.FC<WelcomePageManagerProps> = ({ onBack }) => {
  const { 
    config, 
    updateConfig, 
    addSlide, 
    updateSlide, 
    deleteSlide, 
    reorderSlides, 
    resetToDefaults 
  } = useWelcomePage();

  const { uploadImage, uploading, uploadProgress } = useImageUpload();

  // General Settings state
  const [generalSettings, setGeneralSettings] = useState({
    tagline: config.tagline,
    buttonText: config.buttonText,
    slideDuration: config.slideDuration,
    autoSlide: config.autoSlide
  });
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);

  // Slide modal / form state
  const [editingSlide, setEditingSlide] = useState<WelcomeSlide | null>(null);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [slideForm, setSlideForm] = useState<Omit<WelcomeSlide, 'id'>>({
    badge: '🔥 HOT PROMO',
    badgeColor: 'bg-red-600 text-white',
    title: '',
    subtitle: '',
    tagline: 'Available all day',
    image: ''
  });
  const [isSavingSlide, setIsSavingSlide] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<WelcomeSlide | null>(null);

  // Sync general settings when config loads
  React.useEffect(() => {
    setGeneralSettings({
      tagline: config.tagline,
      buttonText: config.buttonText,
      slideDuration: config.slideDuration,
      autoSlide: config.autoSlide
    });
  }, [config]);

  // Handle General Settings save
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingGeneral(true);
      await updateConfig(generalSettings);
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save welcome page settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Open Add Slide Modal
  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setSlideForm({
      badge: '🔥 HOT DEAL',
      badgeColor: 'bg-amber-500 text-black',
      title: '',
      subtitle: '',
      tagline: 'Available daily • Dine-in & Takeout',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80'
    });
    setIsCreatingSlide(true);
  };

  // Open Edit Slide Modal
  const handleOpenEditSlide = (slide: WelcomeSlide) => {
    setEditingSlide(slide);
    setSlideForm({
      badge: slide.badge,
      badgeColor: slide.badgeColor,
      title: slide.title,
      subtitle: slide.subtitle,
      tagline: slide.tagline,
      image: slide.image
    });
    setIsCreatingSlide(true);
  };

  // Handle Image Upload for Slide
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await uploadImage(file);
      setSlideForm(prev => ({ ...prev, image: publicUrl }));
    } catch (err) {
      alert('Failed to upload image: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Save Slide (Add or Update)
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim()) {
      alert('Please enter a slide title.');
      return;
    }
    if (!slideForm.subtitle.trim()) {
      alert('Please enter a slide subtitle/description.');
      return;
    }
    if (!slideForm.image.trim()) {
      alert('Please provide an image URL or upload an image.');
      return;
    }

    try {
      setIsSavingSlide(true);
      if (editingSlide) {
        await updateSlide(editingSlide.id, slideForm);
      } else {
        await addSlide(slideForm);
      }
      setIsCreatingSlide(false);
      setEditingSlide(null);
    } catch (err) {
      alert('Failed to save slide: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingSlide(false);
    }
  };

  // Delete Slide
  const handleDeleteSlide = async (id: string, title: string) => {
    if (config.slides.length <= 1) {
      alert('You must have at least 1 promo slide on the welcome page.');
      return;
    }
    if (confirm(`Are you sure you want to delete the slide "${title}"?`)) {
      try {
        await deleteSlide(id);
      } catch (err) {
        alert('Failed to delete slide: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  // Reorder Slide (Up/Down)
  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.slides.length) return;

    const newSlides = [...config.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    try {
      await reorderSlides(newSlides);
    } catch (err) {
      alert('Failed to reorder slides: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Reset to Defaults
  const handleReset = async () => {
    if (confirm('Are you sure you want to restore the default promo slides and welcome settings? Any custom slides will be replaced.')) {
      try {
        await resetToDefaults();
        alert('Welcome page reset to original default promo slides!');
      } catch (err) {
        alert('Failed to reset: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome Page & Promo Slides
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-all flex items-center space-x-1.5"
                title="Reset to default slides"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddSlide}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Promo Slide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: General Welcome Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                <span>Display & Transition Settings</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Configure tagline, order button text, and automatic slideshow speed.
              </p>
            </div>
            {generalSaveSuccess && (
              <span className="flex items-center space-x-1 text-emerald-600 text-xs sm:text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGeneral} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Brand Tagline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Header Tagline
                </label>
                <input
                  type="text"
                  value={generalSettings.tagline}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Always Serving Hot!"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Shown below the restaurant name</p>
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Action Button Text
                </label>
                <input
                  type="text"
                  value={generalSettings.buttonText}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, buttonText: e.target.value }))}
                  placeholder="ORDER NOW"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Button to proceed to menus</p>
              </div>

              {/* Slide Duration */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Slide Interval
                </label>
                <select
                  value={generalSettings.slideDuration}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, slideDuration: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value={2500}>2.5 seconds (Fast)</option>
                  <option value={3500}>3.5 seconds (Default)</option>
                  <option value={5000}>5.0 seconds (Relaxed)</option>
                  <option value={7000}>7.0 seconds (Slow)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Time per promo showcase</p>
              </div>

              {/* Auto Slide Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Auto-Play Slideshow
                </label>
                <div className="pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.autoSlide}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoSlide: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {generalSettings.autoSlide ? 'Automatic' : 'Manual only'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingGeneral}
                className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingGeneral ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Slides Manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Promo Slides ({config.slides.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Reorder, edit, add promos or restaurant event highlights displayed on the welcome page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddSlide}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Slide</span>
            </button>
          </div>

          {/* Slides List */}
          <div className="divide-y divide-gray-100">
            {config.slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className="p-5 sm:p-6 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  {/* Position number & Reorder controls */}
                  <div className="flex flex-col items-center justify-center space-y-1 pt-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSlide(index, 'up')}
                      className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === config.slides.length - 1}
                      onClick={() => handleMoveSlide(index, 'down')}
                      className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 shadow-sm border border-gray-200 relative group">
                    <img 
                      src={slide.image} 
                      alt={slide.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewSlide(slide)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${slide.badgeColor}`}>
                        {slide.badge}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {slide.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {slide.subtitle}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-amber-600 font-medium pt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{slide.tagline}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSlide(slide)}
                    className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center space-x-1"
                    title="Edit slide"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-xs font-semibold sm:inline hidden">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id, slide.title)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-semibold sm:inline hidden">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Slide */}
      {isCreatingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">
                  {editingSlide ? 'Edit Promo Slide' : 'Create New Promo Slide'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingSlide(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSlide} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Badge & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Badge Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={slideForm.badge}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. 🎉 WEEKEND SPECIAL"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Badge Color Theme
                  </label>
                  <select
                    value={slideForm.badgeColor}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, badgeColor: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {BADGE_COLOR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Headline Title *
                </label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Sizzling Sisig Festival"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-gray-900"
                />
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Promo Details / Subtitle *
                </label>
                <textarea
                  rows={3}
                  required
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Get 2 Sizzling Pork Sisig + 2 Iced Teas for only ₱249!"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Tagline / Schedule */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Schedule / Tagline
                </label>
                <input
                  type="text"
                  value={slideForm.tagline}
                  onChange={(e) => setSlideForm(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Valid Monday to Friday 2PM-5PM"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Image Input & Upload */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Promo Image *
                </label>

                {/* Upload File Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl border border-zinc-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors">
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span>{uploading ? `Uploading (${uploadProgress}%)` : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-400 text-center sm:text-left">OR paste URL:</span>
                  <input
                    type="url"
                    value={slideForm.image}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Image Live Preview */}
                {slideForm.image && (
                  <div className="relative mt-3 rounded-2xl overflow-hidden h-44 bg-zinc-950 border border-gray-300 shadow-inner group">
                    <img 
                      src={slideForm.image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mb-1 ${slideForm.badgeColor}`}>
                          {slideForm.badge}
                        </span>
                        <p className="text-white font-bold text-sm truncate">{slideForm.title || 'Your Slide Title'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingSlide(false)}
                  disabled={isSavingSlide}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSlide || uploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-sm hover:from-amber-600 hover:to-red-600 shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSlide ? 'Saving...' : editingSlide ? 'Update Slide' : 'Add Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Visual Modal Preview */}
      {previewSlide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl p-6 text-white space-y-4">
            <button
              type="button"
              onClick={() => setPreviewSlide(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <Eye className="w-4 h-4" />
              <span>Full-Size Slide Preview</span>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden relative shadow-lg">
              <img 
                src={previewSlide.image} 
                alt={previewSlide.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 space-y-2">
                <span className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${previewSlide.badgeColor}`}>
                  {previewSlide.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                  {previewSlide.title}
                </h3>
                <p className="text-sm sm:text-base text-amber-100/90 font-medium">
                  {previewSlide.subtitle}
                </p>
                <p className="text-xs text-zinc-400 flex items-center space-x-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{previewSlide.tagline}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePageManager;
