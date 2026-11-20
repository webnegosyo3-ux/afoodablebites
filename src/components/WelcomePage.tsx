import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  Calendar
} from 'lucide-react';

interface WelcomePageProps {
  onOrderNow: () => void;
}

interface PromoEventSlide {
  id: number;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
}

const promoSlides: PromoEventSlide[] = [
  {
    id: 1,
    badge: '🎉 WEEKEND BARKADA PROMO',
    badgeColor: 'bg-red-600 text-white',
    title: 'Barkada Feast Special',
    subtitle: 'Order 3 Sizzling Meals & Get 1 Free Drink + Mushroom Soup!',
    tagline: 'Available every Saturday & Sunday',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    badge: '⏰ LUNCH RUSH HOUR',
    badgeColor: 'bg-amber-500 text-black',
    title: 'Lunch Sizzler Combo',
    subtitle: 'Sizzling Pork Sisig + Extra Garlic Rice & Cold Drink for only ₱149!',
    tagline: '11:00 AM to 2:00 PM Daily',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    badge: '🎓 STUDENT BUDGET PROMO',
    badgeColor: 'bg-emerald-600 text-white',
    title: 'Budget Bites Meal',
    subtitle: 'Steamed Siomai Rice + Cold House Blend Iced Tea for ₱89 Only!',
    tagline: 'Pang-masa sarap everyday',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    badge: '🎸 RESTO EVENT NIGHT',
    badgeColor: 'bg-purple-600 text-white',
    title: 'Live Acoustic Dinner Nights',
    subtitle: 'Chill and enjoy your hot sizzling favorites with live acoustic music!',
    tagline: 'Every Friday & Saturday • 6:00 PM onwards',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 5,
    badge: '🍱 PARTY TRAYS & CATERING',
    badgeColor: 'bg-orange-600 text-white',
    title: 'Events & Party Trays',
    subtitle: 'Large pans of Sizzling Sisig, Stir-Fry & Chicken Fillet for your celebrations!',
    tagline: 'Book your orders in advance',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80'
  }
];

const SLIDE_DURATION = 3500; // 3.5s per slide

const WelcomePage: React.FC<WelcomePageProps> = ({ onOrderNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatic slideshow transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const slide = promoSlides[currentSlide];

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
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl object-cover"
            onError={(e) => {
              e.currentTarget.src = "/logo.jpg";
            }}
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>Afoodable Bites</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold italic">
              Always Serving Hot!
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-amber-300 bg-white/5 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Promos & Events</span>
        </div>
      </div>

      {/* Slide Progress Indicator Bar */}
      <div className="w-full bg-white/5 h-1 overflow-hidden z-20">
        <div 
          key={currentSlide}
          className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500"
          style={{
            animation: `slideProgress ${SLIDE_DURATION}ms linear forwards`
          }}
        />
      </div>

      {/* Center Promo/Event Showcase: Larger Image, Reduced Title & Subtitle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col justify-center w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
          
          {/* Promo Text Column (Reduced Font Sizes) */}
          <div 
            key={`promo-text-${slide.id}`} 
            className="md:col-span-5 flex flex-col justify-center space-y-2.5 text-center md:text-left animate-fade-in order-2 md:order-1"
          >
            {/* Promo Badge */}
            <div className="flex justify-center md:justify-start">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${slide.badgeColor}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{slide.badge}</span>
              </span>
            </div>

            {/* Reduced Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                {slide.title}
              </span>
            </h2>

            {/* Reduced Subtitle */}
            <p className="text-sm sm:text-base md:text-lg font-medium text-amber-100/90 leading-relaxed drop-shadow-sm">
              {slide.subtitle}
            </p>

            {/* Schedule / Tagline */}
            <p className="text-xs sm:text-sm text-zinc-400 flex items-center justify-center md:justify-start space-x-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{slide.tagline}</span>
            </p>
          </div>

          {/* Promo Visual Image (ENLARGED IMAGE SIZE) */}
          <div 
            key={`promo-img-${slide.id}`} 
            className="md:col-span-7 flex justify-center items-center animate-scale-in order-1 md:order-2"
          >
            <div className="relative w-full max-w-xl md:max-w-none h-64 sm:h-80 md:h-[420px] lg:h-[480px] xl:h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 group">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                <span className="text-xs sm:text-sm font-bold text-amber-300 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                  {slide.badge}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Slide Dots Indicator (No Arrows) */}
        <div className="flex items-center justify-center space-x-2 mt-6 pt-2">
          {promoSlides.map((s, index) => (
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
      </div>

      {/* Sleek, Reduced Size "ORDER NOW" Button */}
      <div className="w-full py-4 sm:py-5 px-4 z-20 flex justify-center">
        <button
          type="button"
          onClick={onOrderNow}
          className="py-3 sm:py-3.5 px-8 sm:px-12 text-base sm:text-lg font-black rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-xl hover:from-amber-400 hover:via-orange-400 hover:to-red-400 transition-all duration-300 transform hover:scale-105 active:scale-95 inline-flex items-center justify-center space-x-2"
        >
          <Flame className="w-5 h-5 text-yellow-200 animate-bounce" />
          <span className="tracking-wide uppercase drop-shadow">ORDER NOW</span>
        </button>
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
