import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Sparkles, 
  GraduationCap, ArrowRight, BookOpen, Search, Plus, 
  Image as ImageIcon, Edit2, CheckCircle2, Phone, Building
} from 'lucide-react';
import { WebsiteSliderSlide, User } from '../../types';

interface WebsiteHeroSliderProps {
  slides?: WebsiteSliderSlide[];
  onApply: () => void;
  onExploreCourses: () => void;
  onCheckStatus: () => void;
  onNavigateTab: (tab: any) => void;
  currentUser?: User;
  onOpenSliderCMS?: () => void;
  announcementText?: string;
}

export default function WebsiteHeroSlider({
  slides = [],
  onApply,
  onExploreCourses,
  onCheckStatus,
  onNavigateTab,
  currentUser,
  onOpenSliderCMS,
  announcementText
}: WebsiteHeroSliderProps) {
  // Filter active slides, fallback if empty
  const activeSlides = slides.filter(s => s.isActive !== false);
  const slideList = activeSlides.length > 0 ? activeSlides : [
    {
      id: 'default_fallback',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80',
      badge: 'Ministry of Education • TVETA Registered • CDACC & KNEC Accredited',
      title: 'Empowering Hands, Transforming Minds, Building Futures',
      subtitle: 'Government-supported TVET institution offering modern competency-based modular training (CBET), industry apprenticeships, and direct pathways to self-reliance.',
      buttonText: 'Apply Online (TVET Admission)',
      buttonAction: 'register' as const,
      secondaryButtonText: 'Explore Courses Offered',
      secondaryButtonAction: 'courses' as const,
      isActive: true,
      order: 1
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const SLIDE_DURATION_MS = 6000;
  const PROGRESS_INTERVAL_MS = 50;

  // Next slide handler
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
    setProgress(0);
  }, [slideList.length]);

  // Previous slide handler
  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length);
    setProgress(0);
  }, [slideList.length]);

  // Jump to specific slide
  const handleSelectSlide = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Timer & progress bar tick
  useEffect(() => {
    if (!isPlaying || isHovered || slideList.length <= 1) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (PROGRESS_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, PROGRESS_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, slideList.length, handleNext]);

  // Reset progress when index changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const currentSlide = slideList[currentIndex] || slideList[0];

  // Action dispatcher
  const handleActionClick = (action?: string, url?: string) => {
    if (!action) return onApply();

    switch (action) {
      case 'register':
        onApply();
        break;
      case 'courses':
        onExploreCourses();
        break;
      case 'status':
        onCheckStatus();
        break;
      case 'departments':
        onNavigateTab('departments');
        break;
      case 'admissions':
        onNavigateTab('admissions');
        break;
      case 'contact':
        onNavigateTab('contact');
        break;
      case 'portal':
        onNavigateTab('portal');
        break;
      case 'custom':
        if (url) {
          if (url.startsWith('#')) {
            const el = document.getElementById(url.replace('#', ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.open(url, '_blank');
          }
        }
        break;
      default:
        onApply();
    }
  };

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div 
      id="college-hero-slider"
      className="relative w-full min-h-[540px] sm:min-h-[580px] md:min-h-[620px] lg:min-h-[660px] bg-[#1a120c] overflow-hidden select-none border-b border-[#DEC8B2]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image Carousel with Ken-Burns and Crossfade */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide.id || currentIndex}
          custom={direction}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-[6000ms] ease-out scale-105"
            style={{
              backgroundImage: `url('${currentSlide.imageUrl}')`,
              backgroundPosition: 'center 35%'
            }}
          />

          {/* Cinematic Multi-Stop Gradient Overlays for Maximum Contrast & Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#170E08]/95 via-[#23150D]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140C07] via-transparent to-black/30" />
          <div className="absolute inset-0 bg-[#281A10]/25 mix-blend-multiply" />
        </motion.div>
      </AnimatePresence>

      {/* Top Segmented Progress Countdown Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-1.5 px-4 sm:px-8 py-2.5 bg-gradient-to-b from-black/60 to-transparent">
        {slideList.map((_, idx) => (
          <div 
            key={idx}
            onClick={() => handleSelectSlide(idx)}
            className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer transition-all hover:h-2"
            title={`Slide ${idx + 1}`}
          >
            <div 
              className="h-full bg-gradient-to-r from-[#BA8D5C] to-[#E2BE8D] transition-all duration-75"
              style={{
                width: idx === currentIndex 
                  ? `${progress}%` 
                  : idx < currentIndex 
                    ? '100%' 
                    : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Super Admin Quick Edit Button on Slider */}
      {currentUser?.role === 'admin' && onOpenSliderCMS && (
        <div className="absolute top-4 right-4 sm:right-8 z-40 flex items-center gap-2">
          <button
            onClick={onOpenSliderCMS}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/85 text-[#F5E6D5] hover:text-white rounded-full border border-[#C29563]/60 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 cursor-pointer"
            title="Add or manage front page slider images"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#C29563]" />
            <span className="hidden sm:inline">Manage Slider & Images</span>
            <span className="sm:hidden">Slider</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        </div>
      )}

      {/* Center / Left Content Overlay with Staggered Kinetic Typography */}
      <div className="relative z-20 max-w-7xl mx-auto h-full min-h-[540px] sm:min-h-[580px] md:min-h-[620px] lg:min-h-[660px] px-6 sm:px-10 lg:px-12 flex flex-col justify-center py-16 sm:py-20">
        <div className="max-w-3xl space-y-4 sm:space-y-6 text-left">
          {/* Animated Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`badge-${currentIndex}`}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.45 }}
              className="inline-block"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C29563]/25 border border-[#C29563]/50 text-[#F5E6D5] font-black text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-[#E2BE8D] shrink-0" />
                <span>{currentSlide.badge || 'Ministry of Education • TVETA Registered • CDACC & KNEC'}</span>
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Animated Main Title */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={`title-${currentIndex}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] drop-shadow-md font-serif"
            >
              {currentSlide.title}
            </motion.h2>
          </AnimatePresence>

          {/* Animated Subtitle */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${currentIndex}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="text-sm sm:text-base md:text-lg text-[#EDE2D5] font-medium leading-relaxed max-w-2xl drop-shadow"
            >
              {currentSlide.subtitle}
            </motion.p>
          </AnimatePresence>

          {/* Action CTAs */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`cta-${currentIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4"
            >
              {/* Primary Button */}
              <button
                onClick={() => handleActionClick(currentSlide.buttonAction, currentSlide.buttonUrl)}
                className="px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-[#C29563] to-[#BA8D5C] hover:from-[#BA8D5C] hover:to-[#A87B4C] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-2.5 active:scale-95 cursor-pointer border border-[#E2BE8D]/40"
              >
                <GraduationCap className="w-5 h-5 text-[#FAF3EA]" />
                <span>{currentSlide.buttonText || 'Apply Online (TVET Admission)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Button */}
              {currentSlide.secondaryButtonText && (
                <button
                  onClick={() => handleActionClick(currentSlide.secondaryButtonAction, currentSlide.secondaryButtonUrl)}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white/10 hover:bg-white/20 text-[#FAF3EA] hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-all backdrop-blur-md border border-white/25 shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#E2BE8D]" />
                  <span>{currentSlide.secondaryButtonText}</span>
                </button>
              )}

              {/* Quick Check Status Link Button */}
              <button
                onClick={onCheckStatus}
                className="px-4 py-3 sm:py-3.5 bg-black/40 hover:bg-black/60 text-[#DFC5AB] hover:text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors border border-white/10 backdrop-blur-sm flex items-center gap-1.5"
                title="Check trainee admission status"
              >
                <Search className="w-3.5 h-3.5 text-[#BA8D5C]" />
                <span>Check Status</span>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Interactive Controls Bar (Bottom) */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-8 sm:right-8 z-30 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Prev / Next Buttons & Play/Pause & Slide Number */}
        <div className="flex items-center gap-2 sm:gap-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-xl">
          <button
            onClick={handlePrev}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Previous Slide (Left Arrow)"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isPlaying ? "Pause auto-scroll" : "Play auto-scroll"}
            aria-label={isPlaying ? "Pause auto-scroll" : "Play auto-scroll"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Next Slide (Right Arrow)"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="px-3 py-1 text-xs font-mono text-white/90 font-bold border-l border-white/20">
            <span className="text-[#E2BE8D]">0{currentIndex + 1}</span>
            <span className="text-white/40"> / 0{slideList.length}</span>
          </div>
        </div>

        {/* Right Side: Interactive Miniature Thumbnail Strip */}
        <div className="hidden md:flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-xl">
          {slideList.map((slide, idx) => {
            const isSel = idx === currentIndex;
            return (
              <button
                key={slide.id || idx}
                onClick={() => handleSelectSlide(idx)}
                className={`group relative w-16 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isSel 
                    ? 'border-[#BA8D5C] ring-2 ring-[#BA8D5C]/50 scale-105 shadow-lg' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={slide.title}
              >
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                {isSel && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#BA8D5C]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ongoing Announcement Ribbon */}
      {announcementText && (
        <div className="relative z-30 bg-[#DEC8B2] text-[#3D2713] py-2.5 px-4 text-center font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 border-y border-[#CBB39B] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#8F6335] animate-ping inline-block" />
          <span>{announcementText}</span>
          <button 
            onClick={onApply}
            className="underline ml-2 text-[#7D5325] hover:text-[#523414] transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Apply Now &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
