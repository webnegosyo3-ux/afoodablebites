import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Utensils, Flame, Sparkles, ArrowDown } from 'lucide-react';

interface SlideshowProps {
  onOrderNow: () => void;
}

interface Slide {
  id: number;
  badge: string;
  badgeColor: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  image: string;
  accentPrice?: string;
  tagline?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: '🔥 Always Serving Hot!',
    badgeColor: 'bg-red-600 text-white',
    title: 'Welcome to',
    highlight: 'Afoodable Bites',
    subtitle: 'Delicious Sizzling & Rice Meals That Fit Your Budget!',
    description: 'Freshly prepared, sizzling hot meals made with love. Taste the flavor, enjoy the savings!',
    image: '/images/afodable-bites-logo.jpg',
    tagline: 'Authentic Pinoy Comfort Food'
  },
  {
    id: 2,
    badge: '⭐ #1 Crowd Favorite',
    badgeColor: 'bg-amber-500 text-black',
    title: 'Sizzling Hot',
    highlight: 'Pork Sisig',
    subtitle: 'Crispy, savory, and perfectly seasoned on a smoking cast-iron plate!',
    description: 'Topped with fresh egg, onions, and spicy chili peppers. Best paired with extra rice!',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80',
    accentPrice: '₱139'
  },
  {
    id: 3,
    badge: '🥩 Savory Steaks',
    badgeColor: 'bg-orange-600 text-white',
    title: 'Garlic Pepper &',
    highlight: 'Burger Steak',
    subtitle: 'Smothered in rich, creamy mushroom sauce or aromatic toasted garlic sauce!',
    description: 'Thick, juicy patties served piping hot with steamed white rice.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=1000&auto=format&fit=crop&q=80',
    accentPrice: 'From ₱129'
  },
  {
    id: 4,
    badge: '🍲 Warm Pinoy Soups',
    badgeColor: 'bg-emerald-600 text-white',
    title: 'Chicken Tinola &',
    highlight: 'Sinigang na Bangus',
    subtitle: 'Comforting, soul-warming broths cooked fresh daily.',
    description: 'Real ginger broth and sour tamarind soup with fresh milkfish belly & green vegetables.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1000&auto=format&fit=crop&q=80',
    accentPrice: 'From ₱129'
  },
  {
    id: 5,
    badge: '🍗 Crispy & Creamy',
    badgeColor: 'bg-yellow-500 text-black',
    title: 'Chicken Fillet w/',
    highlight: 'Creamy White Sauce',
    subtitle: 'Golden breaded chicken fillet drenched in rich velvety sauce.',
    description: 'Plus Sizzling Pork with Gravy, Pork Stir-Fry & delicious Siomai Rice!',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1000&auto=format&fit=crop&q=80',
    accentPrice: '₱135'
  },
  {
    id: 6,
    badge: '🥤 Refresh & Complete',
    badgeColor: 'bg-sky-500 text-white',
    title: 'Cold Drinks &',
    highlight: 'Delicious Add-ons',
    subtitle: 'Ice-cold Iced Tea, Lemonade, Sodas, Garlic Rice, Fried Egg & Mushroom Soup.',
    description: 'Complete your sizzling meal with our refreshing beverages and savory extras!',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1000&auto=format&fit=crop&q=80',
    accentPrice: 'Starts at ₱15'
  }
];

const Slideshow: React.FC<SlideshowProps> = ({ onOrderNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance slides every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div 
      className="relative w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-amber-950 text-white overflow-hidden shadow-2xl border-b-4 border-amber-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Slide Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[380px] md:min-h-[440px] lg:min-h-[480px]">
          
          {/* Text & Promotion Information (Left Column on Tablet/Desktop) */}
          <div className="md:col-span-7 flex flex-col justify-center space-y-4 text-center md:text-left z-10">
            {/* Badge */}
            <div className="flex justify-center md:justify-start">
              <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg ${slide.badgeColor}`}>
                <Sparkles className="w-4 h-4" />
                <span>{slide.badge}</span>
              </span>
            </div>

            {/* Headline */}
            <div>
              <p className="text-xl sm:text-2xl font-medium text-amber-200">
                {slide.title}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mt-1 drop-shadow-md">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                  {slide.highlight}
                </span>
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl font-semibold text-amber-100/90 leading-snug">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto md:mx-0">
              {slide.description}
            </p>

            {/* Price Pill if available */}
            {slide.accentPrice && (
              <div className="flex justify-center md:justify-start pt-1">
                <span className="inline-block bg-white/10 backdrop-blur-md border border-amber-400/40 text-amber-300 text-lg sm:text-xl font-bold px-4 py-1.5 rounded-xl shadow-inner">
                  {slide.accentPrice}
                </span>
              </div>
            )}
          </div>

          {/* Visual Showcase / Image (Right Column on Tablet/Desktop) */}
          <div className="md:col-span-5 flex justify-center items-center z-10">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/60 bg-zinc-800 transition-transform duration-500 hover:scale-105">
              <img
                src={slide.image}
                alt={slide.highlight}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs sm:text-sm font-semibold text-amber-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  {slide.tagline || 'Afoodable Bites Special'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Dots */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black transition-all text-white border border-white/20 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2">
            {slides.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? 'w-8 sm:w-10 h-3 bg-amber-400 ring-2 ring-amber-300/50'
                    : 'w-3 h-3 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black transition-all text-white border border-white/20 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* PROMINENT "ORDER NOW" CALL TO ACTION BUTTON */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onOrderNow}
            className="group relative inline-flex items-center justify-center space-x-3 px-8 sm:px-12 py-4 sm:py-5 text-xl sm:text-2xl font-black rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-2xl hover:from-amber-400 hover:via-orange-400 hover:to-red-400 transition-all duration-300 transform hover:scale-105 active:scale-95 ring-4 ring-amber-400/30"
          >
            <Flame className="w-7 h-7 text-yellow-200 animate-bounce" />
            <span className="tracking-wide uppercase drop-shadow-md">ORDER NOW</span>
            <Utensils className="w-6 h-6 text-yellow-200" />
            <ArrowDown className="w-6 h-6 text-yellow-100 group-hover:translate-y-1 transition-transform" />
          </button>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-2 font-medium">
            👇 Click to browse all delicious meals, rice bowls & drinks!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Slideshow;
