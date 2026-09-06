import React, { useState, useRef } from 'react';
import { 
  WebsiteConfig, WebsiteManager, WebsiteAdvert, WebsiteCoreValueItem, WebsiteStatItem, User 
} from '../types';
import { 
  Globe, Users, Megaphone, Building2, Sparkles, Plus, Trash2, Edit2, 
  Upload, Image as ImageIcon, Check, X, Eye, AlertCircle, Save, 
  ChevronRight, Phone, Mail, MapPin, Calendar, ExternalLink, RefreshCw
} from 'lucide-react';

interface WebsiteEditorProps {
  config: WebsiteConfig;
  onSaveConfig: (updated: WebsiteConfig) => void;
  onClose?: () => void;
  currentUser?: User;
  initialTab?: 'management' | 'adverts' | 'identity' | 'hero' | 'stats';
}

export default function WebsiteEditor({
  config,
  onSaveConfig,
  onClose,
  currentUser,
  initialTab = 'management'
}: WebsiteEditorProps) {
  const [formData, setFormData] = useState<WebsiteConfig>(() => ({
    ...config,
    managers: config.managers || [],
    adverts: config.adverts || [],
    coreValues: config.coreValues || [],
    stats: config.stats || []
  }));

  const [activeTab, setActiveTab] = useState<'management' | 'adverts' | 'identity' | 'hero' | 'stats'>(initialTab);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Management sub-states
  const [editingManager, setEditingManager] = useState<WebsiteManager | null>(null);
  const [isAddingManager, setIsAddingManager] = useState(false);
  const managerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingManagerImageId, setPendingManagerImageId] = useState<string | null>(null);

  // Advert sub-states
  const [editingAdvert, setEditingAdvert] = useState<WebsiteAdvert | null>(null);
  const [isAddingAdvert, setIsAddingAdvert] = useState(false);
  const advertFileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to trigger save
  const handleSaveAll = () => {
    const updated = {
      ...formData,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Super Admin'
    };
    onSaveConfig(updated);
    setSaveSuccessMessage('Website content saved and synchronized successfully!');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Convert uploaded image to Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Limit size to ~4MB to ensure fast state syncing
    if (file.size > 4 * 1024 * 1024) {
      alert('Image size exceeds 4MB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        callback(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // MANAGEMENT CRUD
  // ==========================================
  const handleQuickUploadManagerPhoto = (managerId: string, dataUrl: string) => {
    const updatedManagers = formData.managers.map(m => 
      m.id === managerId ? { ...m, image: dataUrl } : m
    );
    const newConfig = { ...formData, managers: updatedManagers };
    setFormData(newConfig);
    onSaveConfig(newConfig);
  };

  const handleRemoveManagerPhoto = (managerId: string) => {
    const updatedManagers = formData.managers.map(m => 
      m.id === managerId ? { ...m, image: '' } : m
    );
    const newConfig = { ...formData, managers: updatedManagers };
    setFormData(newConfig);
    onSaveConfig(newConfig);
  };

  const handleSaveManager = (manager: WebsiteManager) => {
    let updatedManagers: WebsiteManager[];
    if (formData.managers.some(m => m.id === manager.id)) {
      updatedManagers = formData.managers.map(m => m.id === manager.id ? manager : m);
    } else {
      updatedManagers = [...formData.managers, manager];
    }
    const newConfig = { ...formData, managers: updatedManagers };
    setFormData(newConfig);
    onSaveConfig(newConfig);
    setEditingManager(null);
    setIsAddingManager(false);
  };

  const handleDeleteManager = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this manager position from the leadership team?')) return;
    const updatedManagers = formData.managers.filter(m => m.id !== id);
    const newConfig = { ...formData, managers: updatedManagers };
    setFormData(newConfig);
    onSaveConfig(newConfig);
  };

  // ==========================================
  // ADVERTS CRUD
  // ==========================================
  const handleSaveAdvert = (advert: WebsiteAdvert) => {
    let updatedAdverts: WebsiteAdvert[];
    if (formData.adverts.some(a => a.id === advert.id)) {
      updatedAdverts = formData.adverts.map(a => a.id === advert.id ? advert : a);
    } else {
      updatedAdverts = [advert, ...formData.adverts];
    }
    const newConfig = { ...formData, adverts: updatedAdverts };
    setFormData(newConfig);
    onSaveConfig(newConfig);
    setEditingAdvert(null);
    setIsAddingAdvert(false);
  };

  const handleDeleteAdvert = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this advert?')) return;
    const updatedAdverts = formData.adverts.filter(a => a.id !== id);
    const newConfig = { ...formData, adverts: updatedAdverts };
    setFormData(newConfig);
    onSaveConfig(newConfig);
  };

  const handleToggleAdvertStatus = (id: string) => {
    const updatedAdverts = formData.adverts.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    );
    const newConfig = { ...formData, adverts: updatedAdverts };
    setFormData(newConfig);
    onSaveConfig(newConfig);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-w-7xl mx-auto my-4 min-h-[700px]">
      {/* Hidden file input for manager direct upload */}
      <input 
        type="file" 
        ref={managerFileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          if (pendingManagerImageId) {
            handleImageFileChange(e, (url) => handleQuickUploadManagerPhoto(pendingManagerImageId, url));
            setPendingManagerImageId(null);
          }
        }}
      />

      {/* Editor Header Bar */}
      <div className="bg-[#281A10] text-white p-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#3D291C]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#BA8D5C] rounded-xl text-white shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#BA8D5C]/30 text-[#EADBCA] px-2 py-0.5 rounded border border-[#BA8D5C]/40">
                Super Admin Console
              </span>
              <span className="text-xs text-amber-200/80 font-mono">Real-time Website CMS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Front Website Content Manager
            </h2>
            <p className="text-xs text-[#EADBCA]/80">
              Update leadership management team, adverts, banners, contact details, and institutional statements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {saveSuccessMessage && (
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-pulse bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <Check className="w-4 h-4 text-emerald-400" />
              {saveSuccessMessage}
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-[#C29563] hover:bg-[#B28452] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#EADBCA] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="bg-[#FAF8F5] border-b border-[#EADBCA] px-6 sm:px-8 flex items-center gap-2 overflow-x-auto py-2.5">
        <button
          onClick={() => setActiveTab('management')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'management'
              ? 'bg-[#281A10] text-white shadow-xs'
              : 'text-[#453629] hover:bg-[#EADBCA]/50'
          }`}
        >
          <Users className="w-4 h-4 text-[#BA8D5C]" />
          <span>Management Team & Photos</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">{formData.managers.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('adverts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'adverts'
              ? 'bg-[#281A10] text-white shadow-xs'
              : 'text-[#453629] hover:bg-[#EADBCA]/50'
          }`}
        >
          <Megaphone className="w-4 h-4 text-[#BA8D5C]" />
          <span>Adverts & Announcements</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">{formData.adverts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-[#281A10] text-white shadow-xs'
              : 'text-[#453629] hover:bg-[#EADBCA]/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#BA8D5C]" />
          <span>College Identity & Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-[#281A10] text-white shadow-xs'
              : 'text-[#453629] hover:bg-[#EADBCA]/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#BA8D5C]" />
          <span>Hero & Principal's Welcome</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#281A10] text-white shadow-xs'
              : 'text-[#453629] hover:bg-[#EADBCA]/50'
          }`}
        >
          <Globe className="w-4 h-4 text-[#BA8D5C]" />
          <span>Key Statistics</span>
        </button>
      </div>

      {/* Main Tab Viewport */}
      <div className="p-6 sm:p-8 flex-1 bg-white overflow-y-auto">
        {/* ====================================================================
            TAB 1: MANAGEMENT TEAM & PHOTO UPLOADS
        ==================================================================== */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-[#281A10]">College Leadership & Management</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Manage the college executive team displayed on the front website under <strong>About Us &gt; Management</strong>. 
                  You can upload or replace portraits, change positions, and add new administrative or academic managers.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingManager(null);
                  setIsAddingManager(true);
                }}
                className="px-4 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Manager & Position</span>
              </button>
            </div>

            {/* Note banner about placeholder space */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reserved Portrait Space Active</p>
                <p className="mt-0.5 text-amber-700">
                  Management member cards without an uploaded photo display a designated placeholder space on the front page. 
                  Click <strong>"Upload Photo"</strong> on any card to immediately attach a photo from your computer.
                </p>
              </div>
            </div>

            {/* Manager Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.managers.map((mgr, index) => (
                <div 
                  key={mgr.id || index}
                  className="bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Portrait / Photo Space */}
                  <div className="relative aspect-[4/3] w-full bg-slate-100 border-b border-[#EADBCA] flex items-center justify-center overflow-hidden group">
                    {mgr.image ? (
                      <>
                        <img 
                          src={mgr.image} 
                          alt={mgr.name} 
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                          <button
                            onClick={() => {
                              setPendingManagerImageId(mgr.id);
                              managerFileInputRef.current?.click();
                            }}
                            className="px-3 py-1.5 bg-white text-slate-800 font-bold text-xs rounded-lg shadow-sm hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#BA8D5C]" />
                            Change Photo
                          </button>
                          <button
                            onClick={() => handleRemoveManagerPhoto(mgr.id)}
                            className="px-2.5 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-red-700 cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-[#BA8D5C]/40 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#FAF8F5] to-[#EADBCA]/30">
                        <div className="w-14 h-14 rounded-full bg-[#EADBCA] text-[#8F6335] flex items-center justify-center mb-2 shadow-inner">
                          <ImageIcon className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-xs text-[#453629]">Photo Pending Upload</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Placeholder space reserved</span>
                        
                        <button
                          onClick={() => {
                            setPendingManagerImageId(mgr.id);
                            managerFileInputRef.current?.click();
                          }}
                          className="mt-3 px-3 py-1.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Portrait
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Content & Action Bar */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#BA8D5C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EADBCA]">
                            {mgr.department || 'Executive'}
                          </span>
                          <h4 className="font-bold text-base text-[#281A10] mt-1 leading-snug">
                            {mgr.name}
                          </h4>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[#8F6335] mt-1">
                        {mgr.role}
                      </p>
                      {mgr.bio && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {mgr.bio}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Order: #{mgr.order || index + 1}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingManager(mgr);
                            setIsAddingManager(false);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-[#BA8D5C] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteManager(mgr.id)}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Remove manager"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.managers.length === 0 && (
              <div className="text-center py-12 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EADBCA] p-8">
                <Users className="w-12 h-12 text-[#BA8D5C] mx-auto mb-3" />
                <h4 className="font-bold text-[#281A10]">No Management Positions Added</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click the button below to add the college leadership team including the Principal, Deputy Principals, Registrar, and Deans.
                </p>
                <button
                  onClick={() => setIsAddingManager(true)}
                  className="mt-4 px-4 py-2 bg-[#BA8D5C] text-white font-bold text-xs rounded-xl hover:bg-[#AA7E4D] transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add First Manager
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 2: ADVERTS & ANNOUNCEMENTS
        ==================================================================== */}
        {activeTab === 'adverts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-[#281A10]">Adverts, Notices & Vacancies</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Publish career vacancies, student intakes, attachment opportunities, and general advertisements on the front page.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingAdvert(null);
                  setIsAddingAdvert(true);
                }}
                className="px-4 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Advert</span>
              </button>
            </div>

            {/* Adverts Grid */}
            <div className="space-y-4">
              {formData.adverts.map((adv, index) => (
                <div 
                  key={adv.id || index}
                  className="bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start justify-between"
                >
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    {/* Advert Image Thumbnail or Category Icon */}
                    <div className="w-20 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-[#EADBCA]/40 border border-[#EADBCA] shrink-0 flex items-center justify-center">
                      {adv.image ? (
                        <img 
                          src={adv.image} 
                          alt={adv.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Megaphone className="w-8 h-8 text-[#BA8D5C]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#BA8D5C] text-white">
                          {adv.category || 'General'}
                        </span>
                        {adv.ref && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {adv.ref}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          adv.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {adv.active ? '● Active' : '○ Draft / Inactive'}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-[#281A10]">
                        {adv.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {adv.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#BA8D5C]" />
                          Posted: {adv.date}
                        </span>
                        {adv.deadline && (
                          <span className="flex items-center gap-1 font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Deadline: {adv.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <button
                      onClick={() => handleToggleAdvertStatus(adv.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        adv.active 
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {adv.active ? 'Unpublish' : 'Publish'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingAdvert(adv);
                          setIsAddingAdvert(false);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#BA8D5C] hover:border-[#BA8D5C] rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteAdvert(adv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete advert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {formData.adverts.length === 0 && (
                <div className="text-center py-12 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EADBCA] p-8">
                  <Megaphone className="w-12 h-12 text-[#BA8D5C] mx-auto mb-3" />
                  <h4 className="font-bold text-[#281A10]">No Adverts Published Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Click the button below to upload career opportunities, admissions flyers, or general college announcements.
                  </p>
                  <button
                    onClick={() => setIsAddingAdvert(true)}
                    className="mt-4 px-4 py-2 bg-[#BA8D5C] text-white font-bold text-xs rounded-xl hover:bg-[#AA7E4D] transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Post New Advert
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: COLLEGE IDENTITY & CONTACTS
        ==================================================================== */}
        {activeTab === 'identity' && (
          <div className="space-y-6 max-w-4xl">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#281A10]">College Identity & Official Contacts</h3>
              <p className="text-xs text-slate-500 mt-1">
                Amend core institutional details, contact phone numbers, official email, and strategic statements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Institution Name
                </label>
                <input 
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Acronym / Brand Name
                </label>
                <input 
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Motto
                </label>
                <input 
                  type="text"
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Phone / Mobile
                </label>
                <input 
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Campus Location
                </label>
                <input 
                  type="text"
                  value={formData.physicalAddress}
                  onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Postal Address
                </label>
                <input 
                  type="text"
                  value={formData.postalAddress}
                  onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Working Hours
                </label>
                <input 
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intake / Notice Announcement Ticker
                </label>
                <input 
                  type="text"
                  value={formData.intakeAnnouncement}
                  onChange={(e) => setFormData({ ...formData, intakeAnnouncement: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Vision Statement
                </label>
                <textarea 
                  rows={2}
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Mission Statement
                </label>
                <textarea 
                  rows={2}
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAll}
                className="px-5 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Identity Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: HERO & PRINCIPAL'S WELCOME
        ==================================================================== */}
        {activeTab === 'hero' && (
          <div className="space-y-6 max-w-4xl">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#281A10]">Hero Banner & Principal's Welcome</h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize the prime welcoming text, hero headline, and official Principal's address on the front page.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Headline
                </label>
                <input 
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Subheadline / Descriptive Paragraph
                </label>
                <textarea 
                  rows={3}
                  value={formData.heroSubheadline}
                  onChange={(e) => setFormData({ ...formData, heroSubheadline: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accreditation & Regulatory Badge Text
                </label>
                <input 
                  type="text"
                  value={formData.heroBadge}
                  onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-bold text-sm text-[#281A10] mb-3">Principal's Welcome Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Principal's Name
                    </label>
                    <input 
                      type="text"
                      value={formData.principalName}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Principal's Official Title
                    </label>
                    <input 
                      type="text"
                      value={formData.principalTitle}
                      onChange={(e) => setFormData({ ...formData, principalTitle: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Welcome Message Speech / Statement
                  </label>
                  <textarea 
                    rows={5}
                    value={formData.principalWelcomeMessage}
                    onChange={(e) => setFormData({ ...formData, principalWelcomeMessage: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAll}
                className="px-5 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Hero & Welcome Speech</span>
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: KEY STATISTICS
        ==================================================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-6 max-w-4xl">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#281A10]">Public Impact & Growth Statistics</h3>
              <p className="text-xs text-slate-500 mt-1">
                Amend the 4 primary metric counters displayed across the website.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {formData.stats.map((stat, idx) => (
                <div key={stat.id || idx} className="p-4 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-[#BA8D5C] uppercase tracking-wider">
                    Stat Metric #{idx + 1}
                  </span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Value (e.g. 1,200+, 94%)</label>
                    <input 
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...formData.stats];
                        updated[idx] = { ...stat, value: e.target.value };
                        setFormData({ ...formData, stats: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-[#281A10]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Label</label>
                    <input 
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const updated = [...formData.stats];
                        updated[idx] = { ...stat, label: e.target.value };
                        setFormData({ ...formData, stats: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Sub-label / Helper</label>
                    <input 
                      type="text"
                      value={stat.helper || ''}
                      onChange={(e) => {
                        const updated = [...formData.stats];
                        updated[idx] = { ...stat, helper: e.target.value };
                        setFormData({ ...formData, stats: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveAll}
                className="px-5 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Statistics</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL: ADD / EDIT MANAGER FORM
      ==================================================================== */}
      {(isAddingManager || editingManager) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#BA8D5C]" />
                <h4 className="font-bold text-base text-[#281A10]">
                  {editingManager ? 'Edit Manager Details' : 'Add New Manager & Position'}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setIsAddingManager(false);
                  setEditingManager(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ManagerFormModalContent 
              initialData={editingManager || {
                id: `mgr_${Date.now()}`,
                name: '',
                role: '',
                department: 'Administration',
                image: '',
                bio: '',
                order: formData.managers.length + 1
              }}
              onSave={handleSaveManager}
              onCancel={() => {
                setIsAddingManager(false);
                setEditingManager(null);
              }}
              onImageUpload={handleImageFileChange}
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT ADVERT FORM
      ==================================================================== */}
      {(isAddingAdvert || editingAdvert) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#BA8D5C]" />
                <h4 className="font-bold text-base text-[#281A10]">
                  {editingAdvert ? 'Edit Advert / Announcement' : 'Post New Advert / Opportunity'}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setIsAddingAdvert(false);
                  setEditingAdvert(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AdvertFormModalContent 
              initialData={editingAdvert || {
                id: `adv_${Date.now()}`,
                title: '',
                category: 'Careers',
                description: '',
                image: '',
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                deadline: '',
                ref: `KTVC/ADV/${new Date().getFullYear()}/${String(formData.adverts.length + 1).padStart(2, '0')}`,
                actionText: 'View Details',
                active: true
              }}
              onSave={handleSaveAdvert}
              onCancel={() => {
                setIsAddingAdvert(false);
                setEditingAdvert(null);
              }}
              onImageUpload={handleImageFileChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Manager Form inside modal
function ManagerFormModalContent({
  initialData,
  onSave,
  onCancel,
  onImageUpload
}: {
  initialData: WebsiteManager;
  onSave: (m: WebsiteManager) => void;
  onCancel: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}) {
  const [data, setData] = useState<WebsiteManager>(initialData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim() || !data.role.trim()) {
      alert('Please enter both the Manager Name and Position / Title.');
      return;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => onImageUpload(e, (url) => setData({ ...data, image: url }))}
      />

      {/* Portrait Photo Upload Preview */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
          {data.image ? (
            <img src={data.image} alt="Preview" className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-center p-2">
              <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
              <span className="text-[9px] text-slate-400 block mt-0.5">Placeholder</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-xs font-bold text-slate-800">Manager Portrait Photo</label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {data.image ? 'Custom photo attached' : 'No photo uploaded — will show placeholder space on website'}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{data.image ? 'Replace Photo' : 'Upload Photo'}</span>
            </button>
            {data.image && (
              <button
                type="button"
                onClick={() => setData({ ...data, image: '' })}
                className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input 
          type="text"
          placeholder="e.g. Mr. John Doe or Dr. Jane Smith"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          required
          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Position / Official Title <span className="text-red-500">*</span>
        </label>
        <input 
          type="text"
          placeholder="e.g. Principal, Deputy Principal Academics, Dean of Students, Finance Officer"
          value={data.role}
          onChange={(e) => setData({ ...data, role: e.target.value })}
          required
          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Department / Office
          </label>
          <input 
            type="text"
            placeholder="e.g. Administration, Academics, Registry"
            value={data.department || ''}
            onChange={(e) => setData({ ...data, department: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Display Order
          </label>
          <input 
            type="number"
            value={data.order || 1}
            onChange={(e) => setData({ ...data, order: parseInt(e.target.value) || 1 })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Brief Bio / Profile Summary (Optional)
        </label>
        <textarea 
          rows={2}
          placeholder="Summary of responsibilities and academic background..."
          value={data.bio || ''}
          onChange={(e) => setData({ ...data, bio: e.target.value })}
          className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
        />
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          Save Manager Position
        </button>
      </div>
    </form>
  );
}

// Sub-component for Advert Form inside modal
function AdvertFormModalContent({
  initialData,
  onSave,
  onCancel,
  onImageUpload
}: {
  initialData: WebsiteAdvert;
  onSave: (a: WebsiteAdvert) => void;
  onCancel: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}) {
  const [data, setData] = useState<WebsiteAdvert>(initialData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim() || !data.description.trim()) {
      alert('Please fill in both the Title and Description for the advert.');
      return;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => onImageUpload(e, (url) => setData({ ...data, image: url }))}
      />

      {/* Advert Banner Poster Upload */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-20 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
          {data.image ? (
            <img src={data.image} alt="Advert Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Megaphone className="w-6 h-6 text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-xs font-bold text-slate-800">Advert Banner / Poster Image</label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {data.image ? 'Banner image attached' : 'Optional banner image (PNG, JPG)'}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{data.image ? 'Change Banner' : 'Upload Banner'}</span>
            </button>
            {data.image && (
              <button
                type="button"
                onClick={() => setData({ ...data, image: '' })}
                className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Advert Headline / Title <span className="text-red-500">*</span>
        </label>
        <input 
          type="text"
          placeholder="e.g. Part-Time Trainer Vacancies in Mechanical & ICT"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          required
          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Category
          </label>
          <select
            value={data.category}
            onChange={(e) => setData({ ...data, category: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent bg-white"
          >
            <option value="Careers">Careers & Vacancies</option>
            <option value="Admissions">Admissions & Intakes</option>
            <option value="Opportunities">Attachment & Industry</option>
            <option value="Tenders">Tenders & Procurement</option>
            <option value="Events">Events & Workshops</option>
            <option value="General">General Notice</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Reference Number
          </label>
          <input 
            type="text"
            placeholder="e.g. KTVC/ADV/2026/01"
            value={data.ref || ''}
            onChange={(e) => setData({ ...data, ref: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Advert Description & Requirements <span className="text-red-500">*</span>
        </label>
        <textarea 
          rows={3}
          placeholder="Detailed description, qualification criteria, application instructions..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          required
          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Publish Date
          </label>
          <input 
            type="text"
            placeholder="e.g. September 06, 2026"
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Application Deadline (Optional)
          </label>
          <input 
            type="text"
            placeholder="e.g. September 30, 2026"
            value={data.deadline || ''}
            onChange={(e) => setData({ ...data, deadline: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input 
          type="checkbox"
          id="advertActiveCheck"
          checked={data.active}
          onChange={(e) => setData({ ...data, active: e.target.checked })}
          className="w-4 h-4 text-[#BA8D5C] rounded border-slate-300"
        />
        <label htmlFor="advertActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
          Publish immediately on website (Visible to public)
        </label>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          Save Advert
        </button>
      </div>
    </form>
  );
}
