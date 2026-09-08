import React, { useState, useRef } from 'react';
import { 
  FileText, FileDown, UploadCloud, Plus, Trash2, Edit2, 
  Check, X, Eye, AlertCircle, Save, ExternalLink, RefreshCw, 
  Search, Filter, Tag, Calendar, ShieldCheck, FolderDown, ArrowUpRight, Clock
} from 'lucide-react';
import { WebsiteDownloadDocument } from '../../types';

interface WebsiteDocumentsTabProps {
  downloads: WebsiteDownloadDocument[];
  tenders: WebsiteDownloadDocument[];
  onSaveDownload: (doc: WebsiteDownloadDocument) => void;
  onDeleteDownload: (docId: string) => void;
  onSaveTender: (tender: WebsiteDownloadDocument) => void;
  onDeleteTender: (tenderId: string) => void;
  onUploadMediaFile: (
    file: File, 
    callback: (info: { url: string; fileName: string; fileSize: string; fileType: string }) => void
  ) => void;
  isUploadingMedia: boolean;
  uploadProgressMsg: string | null;
}

export default function WebsiteDocumentsTab({
  downloads,
  tenders,
  onSaveDownload,
  onDeleteDownload,
  onSaveTender,
  onDeleteTender,
  onUploadMediaFile,
  isUploadingMedia,
  uploadProgressMsg
}: WebsiteDocumentsTabProps) {
  const [subTab, setSubTab] = useState<'downloads' | 'tenders'>('downloads');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [editingDownload, setEditingDownload] = useState<WebsiteDownloadDocument | null>(null);
  const [isAddingDownload, setIsAddingDownload] = useState(false);
  const [editingTender, setEditingTender] = useState<WebsiteDownloadDocument | null>(null);
  const [isAddingTender, setIsAddingTender] = useState(false);

  // File replacement ref
  const replaceFileTargetRef = useRef<{ id: string; type: 'download' | 'tender' } | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQuickReplaceClick = (id: string, type: 'download' | 'tender') => {
    replaceFileTargetRef.current = { id, type };
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = replaceFileTargetRef.current;
    if (!file || !target) return;

    onUploadMediaFile(file, ({ url, fileName, fileSize, fileType }) => {
      if (target.type === 'download') {
        const item = downloads.find(d => d.id === target.id);
        if (item) {
          onSaveDownload({
            ...item,
            fileData: url,
            fileName,
            fileSize,
            fileType,
            dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      } else {
        const item = tenders.find(t => t.id === target.id);
        if (item) {
          onSaveTender({
            ...item,
            fileData: url,
            fileName,
            fileSize,
            fileType
          });
        }
      }
    });
  };

  // Filtered downloads
  const filteredDownloads = downloads.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.ref && d.ref.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || d.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Filtered tenders
  const filteredTenders = tenders.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ref && t.ref.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hidden input for quick replacement */}
      <input 
        type="file" 
        ref={replaceFileInputRef} 
        onChange={handleReplaceFileChange} 
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" 
        className="hidden" 
      />

      {/* Header section with Cloud notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-[#281A10]">College Official Downloads, PDFs & Tenders</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Cloud Storage Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload, update, and manage official documents, fee structures, application forms, charters, and procurement tender notices published on the front college portal. 
            All files are directly saved and hosted in cloud storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'downloads' ? (
            <button
              onClick={() => {
                setEditingDownload(null);
                setIsAddingDownload(true);
              }}
              className="px-4 py-2.5 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Official PDF / Form</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingTender(null);
                setIsAddingTender(true);
              }}
              className="px-4 py-2.5 bg-[#281A10] hover:bg-[#3D2819] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#BA8D5C]" />
              <span>Post New Tender Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Uploading indicator */}
      {isUploadingMedia && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900 animate-pulse">
          <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
          <span className="font-semibold">{uploadProgressMsg || 'Uploading file to cloud storage...'}</span>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSubTab('downloads')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'downloads'
                ? 'bg-white text-[#281A10] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderDown className="w-4 h-4 text-[#BA8D5C]" />
            <span>Official College Downloads</span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-extrabold text-slate-700">
              {downloads.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('tenders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'tenders'
                ? 'bg-white text-[#281A10] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-[#BA8D5C]" />
            <span>Tenders & Procurement Notices</span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-extrabold text-slate-700">
              {tenders.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={subTab === 'downloads' ? "Search downloads, forms, fee structures..." : "Search tenders, reference numbers..."}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:bg-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          SUB-TAB 1: OFFICIAL COLLEGE DOWNLOADS (PDFs)
      ==================================================================== */}
      {subTab === 'downloads' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Admission', 'Finance', 'Academic', 'Policy', 'Examination', 'Attachment'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#281A10] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredDownloads.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <FolderDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">No download documents found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== 'All' 
                  ? 'No documents match the current search or category filter.' 
                  : 'Start by uploading official college documents like Fee Structure, Application Form, and Handbooks.'}
              </p>
              <button
                onClick={() => {
                  setEditingDownload(null);
                  setIsAddingDownload(true);
                }}
                className="mt-4 px-4 py-2 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Official Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDownloads.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-600 shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EADBCA]/60 text-[#453629] mb-1">
                            {doc.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#281A10] leading-snug line-clamp-2">
                            {doc.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => setEditingDownload(doc)}
                          className="p-1.5 hover:bg-[#EADBCA]/70 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Document Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDownload(doc.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {doc.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      <span>Ref: {doc.ref || 'KTVC/DOC'}</span>
                      <span>•</span>
                      <span>Size: {doc.fileSize || 'PDF'}</span>
                      <span>•</span>
                      <span>Added: {doc.dateAdded}</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 mt-3 border-t border-[#EADBCA] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleQuickReplaceClick(doc.id, 'download')}
                      className="text-[11px] font-bold text-[#BA8D5C] hover:text-[#9A7347] flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Replace PDF File</span>
                    </button>

                    {doc.fileData ? (
                      <a
                        href={doc.fileData}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#281A10] hover:bg-[#3D2819] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#BA8D5C]" />
                        <span>Preview / Download</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-amber-600 italic">No file attached</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: TENDERS & PROCUREMENT NOTICES
      ==================================================================== */}
      {subTab === 'tenders' && (
        <div className="space-y-4">
          {filteredTenders.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">No tender notices posted</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Publish procurement opportunities, expressions of interest, and tender documents for suppliers.
              </p>
              <button
                onClick={() => {
                  setEditingTender(null);
                  setIsAddingTender(true);
                }}
                className="mt-4 px-4 py-2 bg-[#281A10] hover:bg-[#3D2819] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#BA8D5C]" />
                <span>Post First Tender Notice</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenders.map((tender) => {
                const isOpen = tender.status?.toLowerCase() === 'open' || tender.status?.toLowerCase() === 'active';
                return (
                  <div 
                    key={tender.id}
                    className="bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOpen 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'}`} />
                          {isOpen ? 'Active / Open' : 'Closed'}
                        </span>

                        <span className="text-xs font-black text-[#BA8D5C] font-mono">
                          {tender.ref || 'KTVC/TND/2026'}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EADBCA]/60 text-[#453629]">
                          {tender.category || 'Procurement'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#281A10] leading-snug">
                        {tender.title}
                      </h4>

                      {tender.description && (
                        <p className="text-xs text-slate-600">
                          {tender.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap pt-1">
                        <span className="flex items-center gap-1 text-red-600 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          Closing Date: {tender.deadline || 'To be announced'}
                        </span>
                        <span>•</span>
                        <span>Published: {tender.dateAdded}</span>
                        {tender.fileSize && (
                          <>
                            <span>•</span>
                            <span>Document Size: {tender.fileSize}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EADBCA]">
                      <button
                        onClick={() => {
                          onSaveTender({
                            ...tender,
                            status: isOpen ? 'Closed' : 'Open'
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isOpen 
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                            : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                        title="Toggle Open or Closed status"
                      >
                        {isOpen ? 'Mark as Closed' : 'Re-open Tender'}
                      </button>

                      <button
                        onClick={() => handleQuickReplaceClick(tender.id, 'tender')}
                        className="p-2 hover:bg-[#EADBCA]/70 text-[#BA8D5C] rounded-xl transition-colors cursor-pointer"
                        title="Replace Attached Tender Document (PDF)"
                      >
                        <UploadCloud className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingTender(tender)}
                        className="p-2 hover:bg-[#EADBCA]/70 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Edit Tender Notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteTender(tender.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Tender"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {tender.fileData ? (
                        <a
                          href={tender.fileData}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-[#BA8D5C] hover:bg-[#AA7E4D] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Download PDF</span>
                        </a>
                      ) : (
                        <span className="text-xs text-amber-600 italic">No Document</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT DOWNLOAD DOCUMENT FORM
      ==================================================================== */}
      {(isAddingDownload || editingDownload) && (
        <DownloadFormModal
          initialData={editingDownload || {
            id: `doc_${Date.now()}`,
            title: '',
            category: 'Admission',
            ref: `KTVC/DOC/${new Date().getFullYear()}/${String(downloads.length + 1).padStart(2, '0')}`,
            dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            fileType: 'application/pdf',
            fileSize: 'PDF Document',
            description: ''
          }}
          onSave={onSaveDownload}
          onCancel={() => {
            setIsAddingDownload(false);
            setEditingDownload(null);
          }}
          onUploadMediaFile={onUploadMediaFile}
        />
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT TENDER NOTICE FORM
      ==================================================================== */}
      {(isAddingTender || editingTender) && (
        <TenderFormModal
          initialData={editingTender || {
            id: `tnd_${Date.now()}`,
            title: '',
            category: 'Supply and Delivery of Training Materials',
            ref: `KTVC/TND/${new Date().getFullYear()}-${new Date().getFullYear() + 1}/${String(tenders.length + 1).padStart(2, '0')}`,
            dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            deadline: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: 'Open',
            fileType: 'application/pdf',
            description: 'Tender documents should be submitted in sealed envelopes to the Procurement Office.'
          }}
          onSave={onSaveTender}
          onCancel={() => {
            setIsAddingTender(false);
            setEditingTender(null);
          }}
          onUploadMediaFile={onUploadMediaFile}
        />
      )}
    </div>
  );
}

// ====================================================================
// SUB-MODAL 1: ADD / EDIT DOWNLOAD
// ====================================================================
interface DownloadFormModalProps {
  initialData: WebsiteDownloadDocument;
  onSave: (doc: WebsiteDownloadDocument) => void;
  onCancel: () => void;
  onUploadMediaFile: (
    file: File, 
    callback: (info: { url: string; fileName: string; fileSize: string; fileType: string }) => void
  ) => void;
}

function DownloadFormModal({ initialData, onSave, onCancel, onUploadMediaFile }: DownloadFormModalProps) {
  const [data, setData] = useState<WebsiteDownloadDocument>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploadMediaFile(file, ({ url, fileName, fileSize, fileType }) => {
      setData(prev => ({
        ...prev,
        fileData: url,
        fileName,
        fileSize,
        fileType
      }));
      setIsUploading(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim()) {
      alert('Please enter a document title.');
      return;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-[#BA8D5C]" />
            <h4 className="font-bold text-base text-[#281A10]">
              {initialData.id.startsWith('doc_') ? 'Upload Official Document / PDF' : 'Edit Document Details'}
            </h4>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelected} 
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" 
            className="hidden" 
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title *
            </label>
            <input 
              type="text"
              required
              placeholder="e.g. Approved Fee Structure 2026-2027"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={data.category}
                onChange={(e) => setData({ ...data, category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#BA8D5C]"
              >
                <option value="Admission">Admission & Registration</option>
                <option value="Finance">Finance & Fee Structures</option>
                <option value="Academic">Academic & Calendars</option>
                <option value="Policy">Policies & Citizen Charters</option>
                <option value="Examination">Examination Timetables</option>
                <option value="Attachment">Industrial Attachment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference Number
              </label>
              <input 
                type="text"
                placeholder="e.g. KTVC/DOC/2026/01"
                value={data.ref || ''}
                onChange={(e) => setData({ ...data, ref: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Brief Description / Guidance
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Official fee structure covering all Certificate and Diploma programs for the current academic year."
              value={data.description || ''}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium resize-none"
            />
          </div>

          {/* Attached Document Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PDF / Document File *
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#BA8D5C]/50 hover:border-[#BA8D5C] rounded-xl p-4 text-center cursor-pointer bg-[#FAF8F5] transition-colors"
            >
              {data.fileData ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{data.fileName || 'Attached Document'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready in Cloud ({data.fileSize || 'PDF'})
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="text-xs font-bold text-[#BA8D5C] hover:underline shrink-0"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-8 h-8 text-[#BA8D5C] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Click to select PDF or Document</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Supports PDF, Word (DOCX), Excel (XLSX)</p>
                </div>
              )}
              {isUploading && (
                <p className="text-xs text-amber-600 font-bold mt-2 animate-pulse">Uploading to cloud server...</p>
              )}
            </div>
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
              Save & Publish Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====================================================================
// SUB-MODAL 2: ADD / EDIT TENDER
// ====================================================================
interface TenderFormModalProps {
  initialData: WebsiteDownloadDocument;
  onSave: (tender: WebsiteDownloadDocument) => void;
  onCancel: () => void;
  onUploadMediaFile: (
    file: File, 
    callback: (info: { url: string; fileName: string; fileSize: string; fileType: string }) => void
  ) => void;
}

function TenderFormModal({ initialData, onSave, onCancel, onUploadMediaFile }: TenderFormModalProps) {
  const [data, setData] = useState<WebsiteDownloadDocument>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const tenderFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploadMediaFile(file, ({ url, fileName, fileSize, fileType }) => {
      setData(prev => ({
        ...prev,
        fileData: url,
        fileName,
        fileSize,
        fileType
      }));
      setIsUploading(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim()) {
      alert('Please enter a tender title.');
      return;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#BA8D5C]" />
            <h4 className="font-bold text-base text-[#281A10]">
              {initialData.id.startsWith('tnd_') ? 'Post New Tender Notice' : 'Edit Tender Notice'}
            </h4>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input 
            type="file" 
            ref={tenderFileInputRef} 
            onChange={handleFileSelected} 
            accept=".pdf,.doc,.docx" 
            className="hidden" 
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tender Title *
            </label>
            <input 
              type="text"
              required
              placeholder="e.g. Tender for Supply of Workshop Training Tools"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#BA8D5C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tender Reference No. *
              </label>
              <input 
                type="text"
                required
                placeholder="e.g. KTVC/TND/2026-2027/01"
                value={data.ref || ''}
                onChange={(e) => setData({ ...data, ref: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status *
              </label>
              <select
                value={data.status || 'Open'}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#BA8D5C]"
              >
                <option value="Open">Active / Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <input 
                type="text"
                placeholder="e.g. Goods & Training Materials"
                value={data.category || ''}
                onChange={(e) => setData({ ...data, category: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Submission Deadline *
              </label>
              <input 
                type="text"
                required
                placeholder="e.g. October 15, 2026 - 10:00 AM"
                value={data.deadline || ''}
                onChange={(e) => setData({ ...data, deadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructions / Submission Guidelines
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Completed tender documents in plain sealed envelopes marked with the tender number to be deposited in the Tender Box."
              value={data.description || ''}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium resize-none"
            />
          </div>

          {/* Attached Document Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attached Tender Document (PDF)
            </label>
            <div 
              onClick={() => tenderFileInputRef.current?.click()}
              className="border-2 border-dashed border-[#BA8D5C]/50 hover:border-[#BA8D5C] rounded-xl p-4 text-center cursor-pointer bg-[#FAF8F5] transition-colors"
            >
              {data.fileData ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{data.fileName || 'Attached Tender Document'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready in Cloud ({data.fileSize || 'PDF'})
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="text-xs font-bold text-[#BA8D5C] hover:underline shrink-0"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-8 h-8 text-[#BA8D5C] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Click to attach Tender Specification PDF</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Suppliers can download this document directly</p>
                </div>
              )}
              {isUploading && (
                <p className="text-xs text-amber-600 font-bold mt-2 animate-pulse">Uploading to cloud server...</p>
              )}
            </div>
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
              Save & Post Tender
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
