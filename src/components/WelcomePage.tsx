import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  Calendar
} from 'lucide-react';
import { useWelcomePage } from '../hooks/useWelcomePage';

interface WelcomePageProps {
  onOrderNow: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onOrderNow }) => {
  const { config } = useWelcomePage();
  const slides = config.slides && config.slides.length > 0 ? config.slides : [];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Keep currentSlide within valid range if slides change
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Automatic slideshow transition
  useEffect(() => {
    if (!config.autoSlide || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, config.slideDuration || 3500);

    return () => clearInterval(timer);
  }, [currentSlide, config.autoSlide, config.slideDuration, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Full-bleed Ambient Background Image with Dark Vignette */}
      <div 
        key={`bg-${slide.id}`}
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/80 to-zinc-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Seamless Top Branding */}
      <div className="w-full py-4 px-6 sm:px-10 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/afodable-bites-logo.jpg" 
            alt="Afoodable Bites" 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl object-cover ring-2 ring-amber-500/30"
            onError={(e) => {
              e.currentTarget.src = "/logo.jpg";
            }}
          />
          {/* Header name hidden on mobile */}
          <div className="hidden sm:block">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>Afoodable Bites</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold italic">
              {config.tagline || 'Always Serving Hot!'}
            </p>
          </div>
        </div>
      </div>

      {/* Slide Progress Indicator Bar */}
      {config.autoSlide && slides.length > 1 && (
        <div className="w-full bg-white/5 h-1 overflow-hidden z-20">
          <div 
            key={currentSlide}
            className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500"
            style={{
              animation: `slideProgress ${config.slideDuration || 3500}ms linear forwards`
            }}
          />
        </div>
      )}

      {/* Center Promo/Event Showcase: Large Image, Balanced Text */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col justify-center w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
          
          {/* Promo Text Column */}
          <div 
            key={`promo-text-${slide.id}`} 
            className="md:col-span-5 flex flex-col justify-center space-y-2.5 text-center md:text-left animate-fade-in order-2 md:order-1"
          >
            {/* Promo Badge */}
            <div className="flex justify-center md:justify-start">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${slide.badgeColor || 'bg-red-600 text-white'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{slide.badge}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                {slide.title}
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg font-medium text-amber-100/90 leading-relaxed drop-shadow-sm">
              {slide.subtitle}
            </p>

            {/* Schedule / Tagline */}
            {slide.tagline && (
              <p className="text-xs sm:text-sm text-zinc-400 flex items-center justify-center md:justify-start space-x-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{slide.tagline}</span>
              </p>
            )}
          </div>

          {/* Promo Visual Image */}
          <div 
            key={`promo-img-${slide.id}`} 
            className="md:col-span-7 w-full flex flex-col justify-center items-center gap-4 sm:gap-5 animate-scale-in order-1 md:order-2"
          >
            <div className="relative w-full max-w-xl md:max-w-none h-64 sm:h-80 md:h-[420px] lg:h-[480px] xl:h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 group border border-white/5">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                <span className="text-xs sm:text-sm font-bold text-amber-300 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  {slide.badge}
                </span>
              </div>
            </div>

            {/* Touch-friendly order action directly below the promo image */}
            <button
              type="button"
              onClick={onOrderNow}
              className="w-full sm:w-auto py-3.5 sm:py-4 px-8 sm:px-14 text-base sm:text-lg font-black rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-xl hover:from-amber-400 hover:via-orange-400 hover:to-red-400 transition-all duration-300 transform hover:scale-105 active:scale-95 inline-flex items-center justify-center space-x-2"
            >
              <Flame className="w-5 h-5 text-yellow-200 animate-bounce" />
              <span className="tracking-wide uppercase drop-shadow">
                {config.buttonText || 'TAP TO ORDER'}
              </span>
            </button>
          </div>
        </div>

        {/* Clean Slide Dots Indicator (No Arrows) */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6 pt-2">
            {slides.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? 'w-8 h-2.5 bg-amber-400 shadow-md shadow-amber-400/50'
                    : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Seamless Progress Animation */}
      <style>{`
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
