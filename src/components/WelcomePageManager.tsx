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
  Sliders,
  Menu
} from 'lucide-react';
import { useWelcomePage } from '../hooks/useWelcomePage';
import { WelcomeSlide } from '../types';
import ImageUpload from './ImageUpload';

interface WelcomePageManagerProps {
  onBack: () => void;
  onOpenSlideMenu?: () => void;
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

const WelcomePageManager: React.FC<WelcomePageManagerProps> = ({ onBack, onOpenSlideMenu }) => {
  const { 
    config, 
    updateConfig, 
    addSlide, 
    updateSlide, 
    deleteSlide, 
    reorderSlides, 
    resetToDefaults 
  } = useWelcomePage();

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
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
              {onOpenSlideMenu && (
                <button
                  type="button"
                  onClick={onOpenSlideMenu}
                  className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 text-amber-500 border border-gray-300 rounded-xl transition active:scale-95 flex-shrink-0"
                  title="Open Navigation Menu"
                  aria-label="Open slide menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-1 text-gray-600 hover:text-black transition text-xs sm:text-sm font-medium flex-shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden xs:inline sm:inline">Dashboard</span>
              </button>
              <div className="h-4 sm:h-5 w-px bg-gray-300 flex-shrink-0" />
              <div className="flex items-center space-x-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <h1 className="text-xs sm:text-base md:text-lg font-bold text-gray-900 truncate whitespace-nowrap">
                  Welcome Slides
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 rounded-xl transition-all flex items-center space-x-1 flex-shrink-0"
                title="Reset to default slides"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddSlide}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all flex items-center space-x-1 flex-shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Add Slide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Section 1: General Welcome Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                <span>Display & Transition Settings</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Configure tagline, order button text, and automatic slideshow speed.
              </p>
            </div>
            {generalSaveSuccess && (
              <span className="flex items-center space-x-1 text-emerald-600 text-xs sm:text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGeneral} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                  placeholder="TAP TO ORDER"
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
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center space-x-2">
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
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all flex items-center justify-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Slide</span>
            </button>
          </div>

          {/* Slideshow Image Size Guidelines */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 m-3 sm:m-5 mb-2 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm mt-0.5">
              📐
            </div>
            <div className="text-xs min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  Recommended Slideshow Image Size
                </h4>
                <span className="bg-amber-200/90 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-black flex-shrink-0">
                  1200 × 800 PX
                </span>
              </div>
              <p className="text-zinc-700 mt-1 leading-relaxed">
                <strong>Resolution:</strong> 1200 × 800 px (o 1920 × 1080 px Full HD). <strong>Ratio:</strong> 16:9 o 4:3 (Landscape).
              </p>
              <p className="text-zinc-600 mt-0.5 leading-relaxed">
                Siguraduhing nasa gitna ang focus ng pagkain para maganda ang display sa mobile at desktop.
              </p>
            </div>
          </div>

          {/* Slides List */}
          <div className="divide-y divide-gray-100">
            {config.slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className="p-3.5 sm:p-5 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-start space-x-2.5 sm:space-x-4 flex-1 min-w-0 w-full">
                  {/* Position number & Reorder controls */}
                  <div className="flex flex-col items-center justify-center space-y-0.5 pt-0.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSlide(index, 'up')}
                      className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-20 transition"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-black text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded-md">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === config.slides.length - 1}
                      onClick={() => handleMoveSlide(index, 'down')}
                      className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-20 transition"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-20 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 shadow-sm border border-gray-200 relative group">
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
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] sm:text-xs font-bold space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${slide.badgeColor}`}>
                        {slide.badge}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 break-words line-clamp-2">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {slide.subtitle}
                    </p>
                    {slide.tagline && (
                      <div className="flex items-center space-x-1 text-[11px] text-amber-600 font-medium pt-0.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{slide.tagline}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSlide(slide)}
                    className="px-2.5 py-1.5 text-gray-600 hover:text-amber-600 bg-gray-50 hover:bg-amber-50 border border-gray-200 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold"
                    title="Edit slide"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id, slide.title)}
                    className="px-2.5 py-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold"
                    title="Delete slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
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
              <div className="space-y-2 pt-1">
                <ImageUpload
                  currentImage={slideForm.image || undefined}
                  onImageChange={(url) => setSlideForm(prev => ({ ...prev, image: url || '' }))}
                  maxWidth={1280}
                  maxHeight={720}
                  quality={0.85}
                  sizeHint="1280 × 720 px (16:9)"
                  sizeNote="Landscape na larawan para sa slideshow • JPG, PNG, WebP"
                />
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
                  disabled={isSavingSlide}
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
