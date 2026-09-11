import React, { useState, useRef } from 'react';
import { 
  WebsiteSliderSlide, WebsiteConfig 
} from '../../types';
import { 
  CURATED_SLIDER_PRESETS, DEFAULT_WEBSITE_SLIDES 
} from '../../data/websiteData';
import { compressImageFile } from '../../lib/imageUtils';
import { uploadMediaFile } from '../../lib/firebase';
import { 
  Plus, Trash2, Edit2, Upload, Image as ImageIcon, Check, 
  X, Eye, ArrowUp, ArrowDown, Sparkles, ExternalLink, RefreshCw, 
  Layers, Link2, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

interface WebsiteSliderTabProps {
  formData: WebsiteConfig;
  setFormData: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  onSaveAll: () => void;
}

export default function WebsiteSliderTab({
  formData,
  setFormData,
  onSaveAll
}: WebsiteSliderTabProps) {
  const slides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;

  const [editingSlide, setEditingSlide] = useState<WebsiteSliderSlide | null>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<WebsiteSliderSlide | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for new/editing slide
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBadge, setSlideBadge] = useState('');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideButtonText, setSlideButtonText] = useState('Apply Online (TVET Admission)');
  const [slideButtonAction, setSlideButtonAction] = useState<any>('register');
  const [slideSecondaryText, setSlideSecondaryText] = useState('Explore Courses');
  const [slideSecondaryAction, setSlideSecondaryAction] = useState<any>('courses');

  // Open Add Slide Modal
  const handleOpenAdd = () => {
    setSlideTitle('');
    setSlideSubtitle('');
    setSlideBadge('Ministry of Education • TVETA Registered • CDACC & KNEC');
    setSlideImageUrl('');
    setSlideButtonText('Apply Online (TVET Admission)');
    setSlideButtonAction('register');
    setSlideSecondaryText('Explore Courses');
    setSlideSecondaryAction('courses');
    setEditingSlide(null);
    setIsAddingSlide(true);
  };

  // Open Edit Slide Modal
  const handleOpenEdit = (slide: WebsiteSliderSlide) => {
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle || '');
    setSlideBadge(slide.badge || '');
    setSlideImageUrl(slide.imageUrl);
    setSlideButtonText(slide.buttonText || 'Apply Online (TVET Admission)');
    setSlideButtonAction(slide.buttonAction || 'register');
    setSlideSecondaryText(slide.secondaryButtonText || '');
    setSlideSecondaryAction(slide.secondaryButtonAction || 'courses');
    setEditingSlide(slide);
    setIsAddingSlide(true);
  };

  // Upload image file and set URL
  const handleFileUpload = async (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    setIsUploading(true);
    setUploadMsg(`Uploading ${file.name}...`);

    try {
      // Compress to crisp full-HD banner dimensions (1920x1080)
      const compressedDataUrl = await compressImageFile(file, 1920, 1080, 0.88);
      const uploadRes = await uploadMediaFile(compressedDataUrl, file.name, file.type);
      if (uploadRes && uploadRes.url) {
        callback(uploadRes.url);
      } else {
        callback(compressedDataUrl);
      }
      setUploadMsg('Image uploaded successfully!');
      setTimeout(() => setUploadMsg(null), 3000);
    } catch (err) {
      console.warn('Image upload fallback:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) callback(e.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Save new or edited slide
  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();

    if (!slideImageUrl.trim()) {
      alert('Please upload an image or provide an image URL for the slide.');
      return;
    }

    if (!slideTitle.trim()) {
      alert('Please enter a headline title for the slide.');
      return;
    }

    const currentSlides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;

    if (editingSlide) {
      // Update existing
      const updated = currentSlides.map(s => {
        if (s.id === editingSlide.id) {
          return {
            ...s,
            title: slideTitle.trim(),
            subtitle: slideSubtitle.trim(),
            badge: slideBadge.trim(),
            imageUrl: slideImageUrl.trim(),
            buttonText: slideButtonText.trim(),
            buttonAction: slideButtonAction,
            secondaryButtonText: slideSecondaryText.trim(),
            secondaryButtonAction: slideSecondaryAction
          };
        }
        return s;
      });

      setFormData(prev => ({ ...prev, slides: updated }));
    } else {
      // Add new
      const newSlide: WebsiteSliderSlide = {
        id: `slide_${Date.now()}`,
        title: slideTitle.trim(),
        subtitle: slideSubtitle.trim(),
        badge: slideBadge.trim(),
        imageUrl: slideImageUrl.trim(),
        buttonText: slideButtonText.trim(),
        buttonAction: slideButtonAction,
        secondaryButtonText: slideSecondaryText.trim(),
        secondaryButtonAction: slideSecondaryAction,
        isActive: true,
        order: currentSlides.length + 1
      };

      setFormData(prev => ({ ...prev, slides: [...currentSlides, newSlide] }));
    }

    setIsAddingSlide(false);
    setEditingSlide(null);
  };

  // Delete slide
  const handleDeleteSlide = (id: string) => {
    const currentSlides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;
    if (currentSlides.length <= 1) {
      alert('You must have at least one slide in the carousel.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this slide from the front page carousel?')) return;

    const updated = currentSlides.filter(s => s.id !== id);
    setFormData(prev => ({ ...prev, slides: updated }));
  };

  // Toggle active
  const handleToggleActive = (id: string) => {
    const currentSlides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;
    const updated = currentSlides.map(s => {
      if (s.id === id) {
        return { ...s, isActive: s.isActive === false ? true : false };
      }
      return s;
    });
    setFormData(prev => ({ ...prev, slides: updated }));
  };

  // Move slide up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const currentSlides = [...(formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES)];
    const temp = currentSlides[index - 1];
    currentSlides[index - 1] = currentSlides[index];
    currentSlides[index] = temp;
    setFormData(prev => ({ ...prev, slides: currentSlides }));
  };

  // Move slide down
  const handleMoveDown = (index: number) => {
    const currentSlides = [...(formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES)];
    if (index >= currentSlides.length - 1) return;
    const temp = currentSlides[index + 1];
    currentSlides[index + 1] = currentSlides[index];
    currentSlides[index] = temp;
    setFormData(prev => ({ ...prev, slides: currentSlides }));
  };

  // Quick 1-click add from Curated Preset
  const handleAddPreset = (preset: typeof CURATED_SLIDER_PRESETS[0]) => {
    const currentSlides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;
    const newSlide: WebsiteSliderSlide = {
      id: `slide_${Date.now()}`,
      imageUrl: preset.imageUrl,
      title: preset.title,
      badge: preset.badge,
      subtitle: `Hands-on training, certified curriculum, and industry attachments in ${preset.category}. Direct admissions open for all qualified candidates.`,
      buttonText: 'Apply Online',
      buttonAction: 'register',
      secondaryButtonText: 'Explore Courses',
      secondaryButtonAction: 'courses',
      isActive: true,
      order: currentSlides.length + 1
    };
    setFormData(prev => ({ ...prev, slides: [...currentSlides, newSlide] }));
    setShowPresetsModal(false);
  };

  // Reset to Institutional Defaults
  const handleResetDefaults = () => {
    if (!window.confirm('Reset all carousel slides back to default institutional TVET college photography?')) return;
    setFormData(prev => ({ ...prev, slides: DEFAULT_WEBSITE_SLIDES }));
  };

  return (
    <div className="space-y-8">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-[#281A10] via-[#3A2416] to-[#281A10] rounded-2xl p-6 text-white border border-[#BA8D5C]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#C29563]/25 text-[#E2BE8D]">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white font-serif">
              Front Page Hero Carousel & Images
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#DFC5AB] max-w-2xl leading-relaxed">
            Easily upload high-definition images, customize animated typography, assign action buttons, and reorder the award-winning interactive slider displayed on the college front page.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPresetsModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#F5E6D5] hover:text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Browse 10+ high-res TVET campus presets"
          >
            <Sparkles className="w-4 h-4 text-[#BA8D5C]" />
            <span>Preset Gallery</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#C29563] hover:bg-[#B28452] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Slide</span>
          </button>
        </div>
      </div>

      {/* Upload Toast Banner */}
      {uploadMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{uploadMsg}</span>
        </div>
      )}

      {/* Hidden File Input for Direct Upload */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file, (url) => {
              // Add direct slide with this image
              const currentSlides = formData.slides && formData.slides.length > 0 ? formData.slides : DEFAULT_WEBSITE_SLIDES;
              const newSlide: WebsiteSliderSlide = {
                id: `slide_${Date.now()}`,
                imageUrl: url,
                title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                subtitle: 'Government-supported TVET institution offering modern competency-based modular training.',
                badge: 'Kitutu Chache TVC • Excellence in Technical Training',
                buttonText: 'Apply Online',
                buttonAction: 'register',
                secondaryButtonText: 'Explore Courses',
                secondaryButtonAction: 'courses',
                isActive: true,
                order: currentSlides.length + 1
              };
              setFormData(prev => ({ ...prev, slides: [...currentSlides, newSlide] }));
            });
          }
        }}
      />

      {/* Quick Image Upload Dropzone Banner */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#DFCBB5] hover:border-[#BA8D5C] rounded-2xl p-6 bg-[#FAF7F2] hover:bg-[#F5EDE1] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
      >
        <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-[#EADBCA] flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6 text-[#BA8D5C]" />
        </div>
        <div className="text-sm font-bold text-[#281A10]">
          Click here to quickly upload an image from your computer / phone
        </div>
        <p className="text-xs text-[#6B5746] max-w-md">
          Supports PNG, JPG, JPEG, WEBP. Automatically optimized and compressed for lightning-fast loading on all trainee mobile devices.
        </p>
        <span className="px-3 py-1 bg-white text-[#8F6335] text-[11px] font-black rounded-full border border-[#DFCBB5] shadow-2xs">
          + Quick Upload Image
        </span>
      </div>

      {/* Active Slides Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-black text-[#281A10] uppercase tracking-wide">
            Configured Carousel Slides ({slides.length})
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="text-xs font-bold text-[#8F6335] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {slides.map((slide, idx) => (
            <div 
              key={slide.id || idx}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-white shadow-2xs hover:shadow-md ${
                slide.isActive === false ? 'border-slate-300 opacity-60' : 'border-[#EADBCA]'
              }`}
            >
              {/* Image Preview with Badges */}
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden group">
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Order Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/20">
                    Slide #{idx + 1}
                  </span>
                  {slide.isActive === false && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase">
                      Hidden
                    </span>
                  )}
                </div>

                {/* Move & Action Controls on Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/20">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 text-white hover:text-[#BA8D5C] disabled:opacity-30 transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === slides.length - 1}
                    className="p-1 text-white hover:text-[#BA8D5C] disabled:opacity-30 transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Overlay Text Details */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  {slide.badge && (
                    <span className="text-[10px] uppercase font-bold text-[#E2BE8D] block truncate">
                      {slide.badge}
                    </span>
                  )}
                  <h5 className="font-bold text-sm sm:text-base leading-tight truncate">
                    {slide.title}
                  </h5>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-[#544030] line-clamp-2 leading-relaxed">
                  {slide.subtitle || 'No subtitle specified.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B5746] pt-2 border-t border-[#EFE5D8]">
                  <span className="font-bold text-[#281A10]">Primary:</span>
                  <span className="px-2 py-0.5 bg-[#FAF4EC] rounded border border-[#EADBCA] text-[#7D5325] font-semibold">
                    {slide.buttonText || 'Apply Online'} ({slide.buttonAction || 'register'})
                  </span>

                  {slide.secondaryButtonText && (
                    <>
                      <span className="font-bold text-[#281A10] ml-1">Secondary:</span>
                      <span className="px-2 py-0.5 bg-[#FAF4EC] rounded border border-[#EADBCA] text-[#7D5325] font-semibold">
                        {slide.secondaryButtonText}
                      </span>
                    </>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#EFE5D8]">
                  <button
                    onClick={() => handleToggleActive(slide.id)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      slide.isActive === false
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {slide.isActive === false ? 'Set Active' : 'Hide Slide'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(slide)}
                      className="px-3 py-1.5 bg-[#FAF4EC] hover:bg-[#F3E6D5] text-[#7D5325] border border-[#E0CCB8] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#BA8D5C]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Slide Modal */}
      {isAddingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#EADBCA] shadow-2xl overflow-hidden my-8">
            <div className="bg-[#281A10] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#C29563]" />
                <h4 className="font-bold text-base text-white">
                  {editingSlide ? 'Edit Carousel Slide' : 'Add New Carousel Slide'}
                </h4>
              </div>
              <button
                onClick={() => setIsAddingSlide(false)}
                className="text-[#DFC5AB] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-5">
              {/* Image Input Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#281A10] block uppercase tracking-wide">
                  Slide Image <span className="text-red-500">*</span>
                </label>

                {/* Image Preview & Upload Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative w-full sm:w-48 h-32 bg-slate-100 rounded-xl overflow-hidden border border-[#E0CCB8] shrink-0">
                    {slideImageUrl ? (
                      <img 
                        src={slideImageUrl} 
                        alt="Slide preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-xs">
                        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <input 
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setSlideImageUrl);
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3.5 py-2 bg-[#FAF4EC] hover:bg-[#F3E6D5] text-[#7D5325] border border-[#E0CCB8] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 text-[#BA8D5C]" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPresetsModal(true)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#BA8D5C]" />
                        <span>Choose Preset</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#6B5746] font-medium block mb-1">
                        Or enter direct image URL:
                      </span>
                      <input 
                        type="url"
                        value={slideImageUrl}
                        onChange={(e) => setSlideImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Slide Headline / Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="e.g. Master Cutting-Edge Software & ICT Technologies"
                    className="w-full px-3.5 py-2.5 border border-[#E0CCB8] rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Pill Badge (Top Highlight)
                  </label>
                  <input 
                    type="text"
                    value={slideBadge}
                    onChange={(e) => setSlideBadge(e.target.value)}
                    placeholder="e.g. Ministry of Education • TVETA Registered • CDACC & KNEC"
                    className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Subtitle / Description
                  </label>
                  <textarea 
                    rows={2}
                    value={slideSubtitle}
                    onChange={(e) => setSlideSubtitle(e.target.value)}
                    placeholder="Detailed explanation highlighting competency modular training, certifications, and career outcomes..."
                    className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons Configuration */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EADBCA] space-y-3">
                <span className="text-xs font-black text-[#281A10] uppercase tracking-wider block">
                  Interactive Call-To-Action (CTA) Buttons
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#544030] block mb-1">
                      Primary Button Label
                    </label>
                    <input 
                      type="text"
                      value={slideButtonText}
                      onChange={(e) => setSlideButtonText(e.target.value)}
                      placeholder="e.g. Apply Online"
                      className="w-full px-3 py-1.5 border border-[#E0CCB8] rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#544030] block mb-1">
                      Primary Action Destination
                    </label>
                    <select
                      value={slideButtonAction}
                      onChange={(e) => setSlideButtonAction(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#E0CCB8] rounded-lg text-xs bg-white"
                    >
                      <option value="register">Open Trainee Admission Form</option>
                      <option value="courses">Scroll to Courses Offered</option>
                      <option value="status">Check Trainee Admission Status</option>
                      <option value="departments">View Academic Departments</option>
                      <option value="admissions">Go to Admissions Tab</option>
                      <option value="contact">Go to Contact Us Tab</option>
                      <option value="portal">Go to Timetable / Staff Portal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#544030] block mb-1">
                      Secondary Button Label (Optional)
                    </label>
                    <input 
                      type="text"
                      value={slideSecondaryText}
                      onChange={(e) => setSlideSecondaryText(e.target.value)}
                      placeholder="e.g. Explore Courses Offered"
                      className="w-full px-3 py-1.5 border border-[#E0CCB8] rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#544030] block mb-1">
                      Secondary Action Destination
                    </label>
                    <select
                      value={slideSecondaryAction}
                      onChange={(e) => setSlideSecondaryAction(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#E0CCB8] rounded-lg text-xs bg-white"
                    >
                      <option value="courses">Scroll to Courses Offered</option>
                      <option value="register">Open Trainee Admission Form</option>
                      <option value="status">Check Trainee Admission Status</option>
                      <option value="departments">View Academic Departments</option>
                      <option value="contact">Contact College</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSlide(false)}
                  className="px-4 py-2 text-xs font-bold text-[#544030] hover:bg-[#FAF4EC] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C29563] hover:bg-[#B28452] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingSlide ? 'Update Slide' : 'Save New Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Stock TVET Images Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#EADBCA] shadow-2xl overflow-hidden my-8">
            <div className="bg-[#281A10] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C29563]" />
                <h4 className="font-bold text-base text-white">
                  Select from Curated High-Res TVET Campus Presets
                </h4>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="text-[#DFC5AB] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-[#544030]">
                Click on any curated preset to instantly adopt the photo and optimized headline for your carousel:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CURATED_SLIDER_PRESETS.map((preset, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (isAddingSlide) {
                        setSlideImageUrl(preset.imageUrl);
                        setSlideTitle(preset.title);
                        setSlideBadge(preset.badge);
                        setShowPresetsModal(false);
                      } else {
                        handleAddPreset(preset);
                      }
                    }}
                    className="group relative rounded-xl overflow-hidden border border-[#EADBCA] hover:border-[#BA8D5C] bg-white shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                      <img 
                        src={preset.imageUrl} 
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] text-white font-bold uppercase">
                        {preset.category}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] text-[#8F6335] font-bold block truncate">
                        {preset.badge}
                      </span>
                      <h5 className="font-bold text-xs text-[#281A10] mt-0.5 leading-snug">
                        {preset.title}
                      </h5>
                      <span className="mt-2 text-[11px] text-[#C29563] font-black inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Select Preset &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
