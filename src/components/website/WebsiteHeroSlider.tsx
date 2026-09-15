import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Sparkles, 
  GraduationCap, ArrowRight, BookOpen, Search, Plus, 
  Image as ImageIcon, Edit2, CheckCircle2, Phone, Building,
  Upload, Camera, RefreshCw, X, Check, Layers, ChevronDown, Loader2
} from 'lucide-react';
import { WebsiteSliderSlide, User } from '../../types';
import { compressImageFile } from '../../lib/imageUtils';
import { uploadMediaFile } from '../../lib/firebase';

interface WebsiteHeroSliderProps {
  slides?: WebsiteSliderSlide[];
  onApply: () => void;
  onExploreCourses: () => void;
  onCheckStatus: () => void;
  onNavigateTab: (tab: any) => void;
  currentUser?: User;
  onOpenSliderCMS?: () => void;
  onUpdateSlides?: (slides: WebsiteSliderSlide[]) => void;
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
  onUpdateSlides,
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

  // Direct upload & editing state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  // Quick edit modal form states
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editButtonText, setEditButtonText] = useState('Apply Online (TVET Admission)');
  const [editButtonAction, setEditButtonAction] = useState<any>('register');
  const [editSecondaryText, setEditSecondaryText] = useState('Explore Courses');
  const [editSecondaryAction, setEditSecondaryAction] = useState<any>('courses');

  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement | null>(null);

  // Close upload dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SLIDE_DURATION_MS = 6000;
  const PROGRESS_INTERVAL_MS = 50;

  const currentSlide = slideList[currentIndex] || slideList[0];

  // Open Quick Edit Modal for current slide
  const handleOpenQuickEdit = () => {
    setEditTitle(currentSlide.title);
    setEditSubtitle(currentSlide.subtitle || '');
    setEditBadge(currentSlide.badge || '');
    setEditImageUrl(currentSlide.imageUrl);
    setEditButtonText(currentSlide.buttonText || 'Apply Online (TVET Admission)');
    setEditButtonAction(currentSlide.buttonAction || 'register');
    setEditSecondaryText(currentSlide.secondaryButtonText || 'Explore Courses');
    setEditSecondaryAction(currentSlide.secondaryButtonAction || 'courses');
    setShowUploadMenu(false);
    setIsQuickEditOpen(true);
  };

  // Upload handler for slide images directly from device
  const handleUploadImage = async (file: File, mode: 'replace' | 'add' | 'modal') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    setIsUploading(true);
    setUploadStatus(`Optimizing & uploading ${file.name}...`);

    try {
      // Compress to crisp 1080p full-HD banner dimensions (1920x1080)
      const compressedDataUrl = await compressImageFile(file, 1920, 1080, 0.88);
      const uploadRes = await uploadMediaFile(compressedDataUrl, file.name, file.type);
      const finalUrl = (uploadRes && uploadRes.url) ? uploadRes.url : compressedDataUrl;

      if (mode === 'modal') {
        setEditImageUrl(finalUrl);
        setUploadStatus('Image uploaded for current slide preview ✓');
        setTimeout(() => setUploadStatus(null), 3000);
      } else if (mode === 'replace') {
        // Replace current slide's image directly
        const updated = slideList.map((s, idx) => {
          if (idx === currentIndex) {
            return { ...s, imageUrl: finalUrl };
          }
          return s;
        });
        if (onUpdateSlides) {
          onUpdateSlides(updated);
        }
        setUploadStatus('Front page slide image updated and saved ✓');
        setTimeout(() => setUploadStatus(null), 3500);
      } else if (mode === 'add') {
        // Add as a new slide in carousel
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        const newSlide: WebsiteSliderSlide = {
          id: `slide_${Date.now()}`,
          imageUrl: finalUrl,
          title: cleanTitle || 'Modern Technical & Vocational Training',
          subtitle: 'Equipping trainees with hands-on skills, recognized certifications, and industry-ready practical experience.',
          badge: 'Kitutu Chache TVC • Ministry of Education • TVETA Registered',
          buttonText: 'Apply Online',
          buttonAction: 'register',
          secondaryButtonText: 'Explore Courses',
          secondaryButtonAction: 'courses',
          isActive: true,
          order: slideList.length + 1
        };
        const updated = [...slideList, newSlide];
        if (onUpdateSlides) {
          onUpdateSlides(updated);
        }
        setCurrentIndex(updated.length - 1);
        setUploadStatus('New slide added to front page and saved ✓');
        setTimeout(() => setUploadStatus(null), 3500);
      }
    } catch (err: any) {
      console.error('[Slide Upload Error]:', err);
      // Fallback reader
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          const fallbackUrl = e.target.result;
          if (mode === 'modal') {
            setEditImageUrl(fallbackUrl);
          } else if (mode === 'replace') {
            const updated = slideList.map((s, idx) => idx === currentIndex ? { ...s, imageUrl: fallbackUrl } : s);
            if (onUpdateSlides) onUpdateSlides(updated);
          } else {
            const newSlide: WebsiteSliderSlide = {
              id: `slide_${Date.now()}`,
              imageUrl: fallbackUrl,
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              subtitle: 'Hands-on practical training with accredited national certifications.',
              badge: 'Kitutu Chache TVC • TVETA Accredited',
              buttonText: 'Apply Online',
              buttonAction: 'register',
              secondaryButtonText: 'Explore Courses',
              secondaryButtonAction: 'courses',
              isActive: true,
              order: slideList.length + 1
            };
            const updated = [...slideList, newSlide];
            if (onUpdateSlides) onUpdateSlides(updated);
            setCurrentIndex(updated.length - 1);
          }
          setUploadStatus('Image loaded from device ✓');
          setTimeout(() => setUploadStatus(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setShowUploadMenu(false);
    }
  };

  // Save changes from Quick Edit Modal
  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editImageUrl.trim()) {
      alert('Please upload an image or provide an image for the slide.');
      return;
    }
    if (!editTitle.trim()) {
      alert('Please enter a headline title for the slide.');
      return;
    }

    const updated = slideList.map((s, idx) => {
      if (idx === currentIndex) {
        return {
          ...s,
          title: editTitle.trim(),
          subtitle: editSubtitle.trim(),
          badge: editBadge.trim(),
          imageUrl: editImageUrl.trim(),
          buttonText: editButtonText.trim(),
          buttonAction: editButtonAction,
          secondaryButtonText: editSecondaryText.trim(),
          secondaryButtonAction: editSecondaryAction
        };
      }
      return s;
    });

    if (onUpdateSlides) {
      onUpdateSlides(updated);
    }
    setIsQuickEditOpen(false);
    setUploadStatus('Slide changes saved successfully ✓');
    setTimeout(() => setUploadStatus(null), 3000);
  };

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
      onDragOver={(e) => {
        e.preventDefault();
        if (currentUser?.role === 'admin' || onUpdateSlides) {
          setIsDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          handleUploadImage(file, 'replace');
        }
      }}
    >
      {/* Hidden File Inputs for Direct Slide Image Uploading */}
      <input 
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadImage(file, 'replace');
          e.target.value = '';
        }}
      />

      <input 
        ref={addFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadImage(file, 'add');
          e.target.value = '';
        }}
      />

      {/* Drag & Drop Overlaid Zone */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-[#170E08]/92 backdrop-blur-md border-4 border-dashed border-[#C29563] flex flex-col items-center justify-center text-white p-6 transition-all animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-[#C29563]/20 flex items-center justify-center text-[#E2BE8D] mb-4 border border-[#C29563]/40 animate-pulse">
            <Upload className="w-10 h-10 animate-bounce" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Drop Image to Set Slide Background</h3>
          <p className="text-sm text-[#DFC5AB] max-w-md text-center">
            Your image will be automatically optimized to crisp 1080p full-HD resolution and saved to the front page.
          </p>
        </div>
      )}

      {/* Upload & Toast Status Notification */}
      {uploadStatus && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full bg-[#1E120A]/90 border border-[#C29563] text-[#F5E6D5] backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-3">
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-[#E2BE8D] animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
            <span>{uploadStatus}</span>
          </div>
        </div>
      )}

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

      {/* Admin Quick Action Controls Bar on Hero Slider */}
      {(currentUser?.role === 'admin' || onUpdateSlides) && (
        <div className="absolute top-4 right-4 sm:right-8 z-40 flex items-center gap-2">
          {/* Upload Slide Image Dropdown / Button */}
          <div className="relative" ref={uploadMenuRef}>
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="px-3.5 py-1.5 bg-[#BA8D5C] hover:bg-[#A87948] text-white rounded-full border border-amber-300/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 cursor-pointer"
              title="Upload an image file directly for front page slider"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Slide Image</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUploadMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUploadMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1E130B] border border-[#BA8D5C]/60 rounded-2xl shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-white/10 text-[11px] font-bold text-[#E2BE8D] uppercase tracking-wider">
                  Slide Image Manager
                </div>

                <div className="space-y-1 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadMenu(false);
                      replaceFileInputRef.current?.click();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-[#EDE2D5] hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#BA8D5C]" />
                    <div>
                      <div className="font-bold">Replace Current Slide Photo</div>
                      <div className="text-[10px] text-white/50">Upload file from computer/phone</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadMenu(false);
                      addFileInputRef.current?.click();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-[#EDE2D5] hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold">+ Add New Slide from Photo</div>
                      <div className="text-[10px] text-white/50">Upload image and create new slide</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenQuickEdit}
                    className="w-full px-3 py-2 text-left text-xs text-[#EDE2D5] hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-bold">Edit Slide Text & Buttons</div>
                      <div className="text-[10px] text-white/50">Change headlines, badge, CTA</div>
                    </div>
                  </button>
                </div>

                {onOpenSliderCMS && (
                  <div className="pt-1 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadMenu(false);
                        onOpenSliderCMS();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-[#E2BE8D] hover:bg-white/10 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Open Full Slider CMS</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Edit Current Slide Button */}
          <button
            onClick={handleOpenQuickEdit}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/85 text-[#F5E6D5] hover:text-white rounded-full border border-[#C29563]/60 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 cursor-pointer"
            title="Edit headline, badge and image of current slide"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#C29563]" />
            <span className="hidden sm:inline">Edit Slide</span>
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

      {/* Quick Edit Slide Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-800 rounded-2xl max-w-2xl w-full border border-[#E0CCB8] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#281A10] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#BA8D5C]/30 flex items-center justify-center text-[#E2BE8D] border border-[#BA8D5C]/50">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Slide #{currentIndex + 1}</h3>
                  <p className="text-[11px] text-[#DFC5AB]">Update slide image, text, and call-to-action buttons</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="text-[#DFC5AB] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="p-6 space-y-5">
              {/* Primary Image Upload Dropzone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#281A10] uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#BA8D5C]" />
                    <span>Slide Image File (Primary)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Auto-optimized to 1080p full-HD</span>
                </div>

                <input 
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file, 'modal');
                    e.target.value = '';
                  }}
                />

                {editImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#E0CCB8] bg-slate-900 group">
                    <img 
                      src={editImageUrl} 
                      alt="Slide preview" 
                      className="w-full h-44 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/90 text-white text-[11px] font-bold shadow">
                        <Check className="w-3 h-3" /> Image Ready
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => modalFileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-3 py-1.5 bg-[#BA8D5C] hover:bg-[#A87948] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : 'Replace Image File'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => modalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#C29563] hover:border-[#8F6335] bg-[#FAF5EE] hover:bg-[#F3E8D9] rounded-xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EADBCA] text-[#7D5325] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-[#281A10]">
                      Click to choose an image file from your device
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Supports JPG, PNG, WEBP • Automatically compressed for blazing fast loading
                    </div>
                  </div>
                )}

                {/* Optional Web URL Input Toggle */}
                <div className="pt-1">
                  <details className="text-xs text-slate-600">
                    <summary className="cursor-pointer text-[#8F6335] font-semibold hover:underline">
                      Need to use an external web link instead? (Optional)
                    </summary>
                    <div className="mt-2">
                      <input 
                        type="url"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                      />
                    </div>
                  </details>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Slide Headline / Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Empowering Hands, Transforming Minds"
                    className="w-full px-3.5 py-2.5 border border-[#E0CCB8] rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Descriptive Subtitle Paragraph
                  </label>
                  <textarea 
                    rows={2}
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    placeholder="Provide a welcoming overview of training opportunities..."
                    className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                      Accreditation Badge Text
                    </label>
                    <input 
                      type="text"
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      placeholder="e.g. TVETA Registered • CDACC & KNEC"
                      className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                      Primary Button Text
                    </label>
                    <input 
                      type="text"
                      value={editButtonText}
                      onChange={(e) => setEditButtonText(e.target.value)}
                      placeholder="Apply Online"
                      className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EADBCA]">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 border border-[#E0CCB8] text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-[#7D5325] hover:bg-[#63421C] text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Slide Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
