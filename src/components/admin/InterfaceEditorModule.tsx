import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
  MessageSquare,
  FileText,
  GraduationCap,
  Video,
  Globe,
  Swords,
  BookOpen,
  Zap,
  Award,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Layout,
  RefreshCw,
  Megaphone,
  Grid,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Save,
  X,
} from 'lucide-react';
import { QuickLinkItem, HomepageSection, HomepageSectionType } from '../../types';
import { StorageService } from '../../services/storage';

const PRESET_ICONS = [
  { name: 'Swords', label: 'Face Arena / Battle', icon: Swords },
  { name: 'MessageSquare', label: 'WhatsApp / Chat', icon: MessageSquare },
  { name: 'FileText', label: 'PDF / Documents', icon: FileText },
  { name: 'GraduationCap', label: 'Scholarships / Academics', icon: GraduationCap },
  { name: 'Video', label: 'YouTube / Videos', icon: Video },
  { name: 'Globe', label: 'Website / External', icon: Globe },
  { name: 'Sparkles', label: 'Sparkles / New', icon: Sparkles },
  { name: 'BookOpen', label: 'Courses / Books', icon: BookOpen },
  { name: 'Zap', label: 'Lightning / CBT', icon: Zap },
  { name: 'Award', label: 'Badges / Trophy', icon: Award },
  { name: 'HelpCircle', label: 'Support / FAQ', icon: HelpCircle },
  { name: 'Layers', label: 'Modules / Sections', icon: Layers },
];

export const InterfaceEditorModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quick_links' | 'homepage_sections' | 'preview'>('quick_links');
  
  // Data States
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLinkItem | null>(null);
  const [linkForm, setLinkForm] = useState<Omit<QuickLinkItem, 'id'>>({
    title: '',
    description: '',
    icon: 'Globe',
    url: '',
    status: 'active',
    order: 1,
    badge: '',
    target: '_self',
  });

  // Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [sectionForm, setSectionForm] = useState<Omit<HomepageSection, 'id'>>({
    type: 'announcement',
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    bgImage: '',
    bgColor: 'from-indigo-950/70 via-purple-950/50 to-slate-950',
    status: 'active',
    order: 1,
    badge: '',
  });

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'link' | 'section'; id: string; title: string } | null>(null);

  useEffect(() => {
    // Initial Load & Real-time Listeners
    setIsLoading(true);
    const unsubLinks = StorageService.listenQuickLinks((links) => {
      setQuickLinks(links);
      setIsLoading(false);
    });

    const unsubSections = StorageService.listenHomepageSections((sections) => {
      setHomepageSections(sections);
      setIsLoading(false);
    });

    return () => {
      unsubLinks();
      unsubSections();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper Icon Renderer
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="w-5 h-5 text-amber-400" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'FileText': return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-purple-400" />;
      case 'Video': return <Video className="w-5 h-5 text-rose-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-cyan-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Award': return <Award className="w-5 h-5 text-amber-500" />;
      case 'HelpCircle': return <HelpCircle className="w-5 h-5 text-blue-400" />;
      default: return <Globe className="w-5 h-5 text-slate-400" />;
    }
  };

  // ==========================================
  // QUICK LINKS HANDLERS
  // ==========================================
  const handleOpenAddLinkModal = () => {
    setEditingLink(null);
    setLinkForm({
      title: '',
      description: '',
      icon: 'Globe',
      url: '',
      status: 'active',
      order: quickLinks.length + 1,
      badge: '',
      target: '_self',
    });
    setIsLinkModalOpen(true);
  };

  const handleOpenEditLinkModal = (link: QuickLinkItem) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      description: link.description || '',
      icon: link.icon || 'Globe',
      url: link.url,
      status: link.status,
      order: link.order,
      badge: link.badge || '',
      target: link.target || '_self',
    });
    setIsLinkModalOpen(true);
  };

  const handleSaveQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title.trim() || !linkForm.url.trim()) {
      showToast('❌ Please fill in required fields (Title and URL)');
      return;
    }

    let updatedList = [...quickLinks];
    if (editingLink) {
      updatedList = updatedList.map((item) =>
        item.id === editingLink.id
          ? { ...item, ...linkForm, updatedAt: new Date().toISOString() }
          : item
      );
      showToast('✅ Quick link updated successfully!');
    } else {
      const newLink: QuickLinkItem = {
        id: `ql-${Date.now()}`,
        ...linkForm,
        createdAt: new Date().toISOString(),
      };
      updatedList.push(newLink);
      showToast('✅ New quick link created!');
    }

    StorageService.saveQuickLinks(updatedList);
    setIsLinkModalOpen(false);
  };

  const handleToggleLinkStatus = (link: QuickLinkItem) => {
    const updated = quickLinks.map((item) =>
      item.id === link.id
        ? { ...item, status: (item.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : item
    );
    StorageService.saveQuickLinks(updated);
    showToast(`Status changed to ${link.status === 'active' ? 'Inactive' : 'Active'}`);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === quickLinks.length - 1)) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newLinks = [...quickLinks];
    
    // Swap items
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    // Recalculate order indices
    const reordered = newLinks.map((item, idx) => ({ ...item, order: idx + 1 }));
    StorageService.saveQuickLinks(reordered);
    showToast('Display position reordered!');
  };

  // ==========================================
  // HOMEPAGE SECTIONS HANDLERS
  // ==========================================
  const handleOpenAddSectionModal = () => {
    setEditingSection(null);
    setSectionForm({
      type: 'announcement',
      title: '',
      subtitle: '',
      description: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      bgImage: '',
      bgColor: 'from-indigo-950/70 via-purple-950/50 to-slate-950',
      status: 'active',
      order: homepageSections.length + 1,
      badge: '',
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSectionModal = (sec: HomepageSection) => {
    setEditingSection(sec);
    setSectionForm({
      type: sec.type,
      title: sec.title,
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      buttonText: sec.buttonText || '',
      buttonLink: sec.buttonLink || '',
      imageUrl: sec.imageUrl || '',
      bgImage: sec.bgImage || '',
      bgColor: sec.bgColor || 'from-indigo-950/70 via-purple-950/50 to-slate-950',
      status: sec.status,
      order: sec.order,
      badge: sec.badge || '',
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) {
      showToast('❌ Title is required for sections');
      return;
    }

    let updatedList = [...homepageSections];
    if (editingSection) {
      updatedList = updatedList.map((item) =>
        item.id === editingSection.id
          ? { ...item, ...sectionForm, updatedAt: new Date().toISOString() }
          : item
      );
      showToast('✅ Homepage section updated!');
    } else {
      const newSec: HomepageSection = {
        id: `sec-${Date.now()}`,
        ...sectionForm,
        createdAt: new Date().toISOString(),
      };
      updatedList.push(newSec);
      showToast('✅ New homepage section created!');
    }

    StorageService.saveHomepageSections(updatedList);
    setIsSectionModalOpen(false);
  };

  const handleToggleSectionStatus = (sec: HomepageSection) => {
    const updated = homepageSections.map((item) =>
      item.id === sec.id
        ? { ...item, status: (item.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : item
    );
    StorageService.saveHomepageSections(updated);
    showToast(`Section ${sec.status === 'active' ? 'Hidden' : 'Published'}`);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === homepageSections.length - 1)) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...homepageSections];

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const reordered = newSections.map((item, idx) => ({ ...item, order: idx + 1 }));
    StorageService.saveHomepageSections(reordered);
    showToast('Section order updated!');
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'link') {
      const updated = quickLinks.filter((l) => l.id !== deleteTarget.id);
      StorageService.saveQuickLinks(updated);
      showToast('Quick link deleted');
    } else {
      const updated = homepageSections.filter((s) => s.id !== deleteTarget.id);
      StorageService.saveHomepageSections(updated);
      showToast('Homepage section deleted');
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Mini Content Management System (CMS)</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Interface & Layout Editor</h2>
            <p className="text-slate-400 text-sm mt-1">
              Add, edit, hide, show, reorder, or update quick links, banners, announcements, and homepage sections in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'quick_links' && (
              <button
                onClick={handleOpenAddLinkModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Quick Link</span>
              </button>
            )}

            {activeTab === 'homepage_sections' && (
              <button
                onClick={handleOpenAddSectionModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Section</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('quick_links')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quick_links'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Manage Quick Links ({quickLinks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('homepage_sections')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'homepage_sections'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Homepage Sections ({homepageSections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Live Interface Preview</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: QUICK LINKS MANAGEMENT */}
      {/* ========================================== */}
      {activeTab === 'quick_links' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-400" />
                <span>Quick Links List</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Managed quick links appear on the Student Dashboard, Landing Page, and Navigation Bar.
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Drag / Position numbers determine rendering order
            </span>
          </div>

          {quickLinks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <LinkIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold text-sm">No Quick Links Configured</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click below to create your first dynamic quick link.</p>
              <button
                onClick={handleOpenAddLinkModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Quick Link</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {quickLinks.map((link, idx) => (
                <div
                  key={link.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    link.status === 'inactive' ? 'opacity-50 bg-slate-900/30' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {renderIcon(link.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          #{link.order}
                        </span>
                        <h4 className="text-sm font-bold text-white">{link.title}</h4>
                        {link.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {link.badge}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            link.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {link.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {link.description && <p className="text-xs text-slate-400 mt-1">{link.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                        <span className="truncate max-w-xs">{link.url}</span>
                        <span>•</span>
                        <span>Target: {link.target === '_blank' ? 'New Tab' : 'Same Tab'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleMoveLink(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-all cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveLink(idx, 'down')}
                      disabled={idx === quickLinks.length - 1}
                      title="Move Down"
                      className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-all cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleLinkStatus(link)}
                      title={link.status === 'active' ? 'Hide Link' : 'Show Link'}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        link.status === 'active'
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {link.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEditLinkModal(link)}
                      className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'link', id: link.id, title: link.title })}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: HOMEPAGE SECTIONS MANAGEMENT */}
      {/* ========================================== */}
      {activeTab === 'homepage_sections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-400" />
                <span>Dynamic Homepage Sections</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control active layout components, announcements, banners, featured highlights, and advertisements.
              </p>
            </div>
          </div>

          {homepageSections.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Layout className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold text-sm">No Sections Configured</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click below to create your first homepage layout section.</p>
              <button
                onClick={handleOpenAddSectionModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Section</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {homepageSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`border rounded-xl p-5 transition-all ${
                    sec.status === 'inactive'
                      ? 'border-slate-800 bg-slate-950/30 opacity-60'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Position #{sec.order}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {sec.type.replace('_', ' ')}
                        </span>
                        {sec.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {sec.badge}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sec.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {sec.status === 'active' ? 'Published' : 'Hidden'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">{sec.title}</h4>
                      {sec.subtitle && <p className="text-xs text-indigo-300 font-medium">{sec.subtitle}</p>}
                      {sec.description && <p className="text-xs text-slate-400 leading-relaxed">{sec.description}</p>}

                      {(sec.buttonText || sec.imageUrl) && (
                        <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                          {sec.buttonText && (
                            <span className="bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 px-3 py-1 rounded-lg font-semibold">
                              Button: {sec.buttonText} ({sec.buttonLink || '#'})
                            </span>
                          )}
                          {sec.imageUrl && (
                            <span className="truncate max-w-xs text-slate-500 font-mono">
                              Img: {sec.imageUrl}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-all cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === homepageSections.length - 1}
                        title="Move Down"
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-all cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleSectionStatus(sec)}
                        title={sec.status === 'active' ? 'Hide Section' : 'Publish Section'}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          sec.status === 'active'
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {sec.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEditSectionModal(sec)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'section', id: sec.id, title: sec.title })}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: LIVE INTERFACE PREVIEW */}
      {/* ========================================== */}
      {activeTab === 'preview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-400" />
                <span>Live Website Interface Preview</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Here is how your dynamic homepage sections and active quick links render live to students.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-8">
            
            {/* Render Active Sections in Order */}
            {homepageSections
              .filter((s) => s.status === 'active')
              .map((sec) => (
                <div key={sec.id} className="space-y-4">
                  
                  {/* Section Type: Announcement */}
                  {sec.type === 'announcement' && (
                    <div className={`p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r ${sec.bgColor || 'from-indigo-950/70 to-purple-950/50'} relative overflow-hidden`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1">
                          {sec.badge && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 mb-1">
                              {sec.badge}
                            </span>
                          )}
                          <h3 className="text-xl font-bold text-white">{sec.title}</h3>
                          {sec.subtitle && <p className="text-xs text-indigo-300 font-medium">{sec.subtitle}</p>}
                          {sec.description && <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{sec.description}</p>}
                        </div>
                        {sec.buttonText && (
                          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shrink-0">
                            {sec.buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section Type: Quick Links */}
                  {sec.type === 'quick_links' && (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{sec.title}</h3>
                        {sec.subtitle && <p className="text-xs text-slate-400">{sec.subtitle}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickLinks
                          .filter((l) => l.status === 'active')
                          .map((link) => (
                            <div
                              key={link.id}
                              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-start gap-3 group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                {renderIcon(link.icon)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                                    {link.title}
                                  </h4>
                                  {link.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300">
                                      {link.badge}
                                    </span>
                                  )}
                                </div>
                                {link.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{link.description}</p>}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Section Type: Featured Content / Banner */}
                  {(sec.type === 'featured_content' || sec.type === 'ad_banner') && (
                    <div className={`p-6 rounded-2xl border border-slate-800 bg-gradient-to-r ${sec.bgColor || 'from-slate-900 to-slate-950'} flex flex-col md:flex-row items-center gap-6`}>
                      {sec.imageUrl && (
                        <img src={sec.imageUrl} alt={sec.title} className="w-full md:w-64 h-40 object-cover rounded-xl border border-slate-800" />
                      )}
                      <div className="space-y-2 flex-1">
                        {sec.badge && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sec.badge}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white">{sec.title}</h3>
                        {sec.subtitle && <p className="text-xs text-indigo-300">{sec.subtitle}</p>}
                        {sec.description && <p className="text-xs text-slate-400 leading-relaxed">{sec.description}</p>}
                        {sec.buttonText && (
                          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md inline-block mt-2">
                            {sec.buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: ADD/EDIT QUICK LINK */}
      {/* ========================================== */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-400" />
                <span>{editingLink ? 'Edit Quick Link' : 'Add New Quick Link'}</span>
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scholarship Updates"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Latest University & Undergraduate Scholarships"
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">URL / Link Target *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /study-materials or https://whatsapp.com/channel/..."
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Icon Style</label>
                  <select
                    value={linkForm.icon}
                    onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {PRESET_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW, HOT, LIVE"
                    value={linkForm.badge}
                    onChange={(e) => setLinkForm({ ...linkForm, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Order #</label>
                  <input
                    type="number"
                    min="1"
                    value={linkForm.order}
                    onChange={(e) => setLinkForm({ ...linkForm, order: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target</label>
                  <select
                    value={linkForm.target}
                    onChange={(e) => setLinkForm({ ...linkForm, target: e.target.value as '_blank' | '_self' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="_self">Same Tab (_self)</option>
                    <option value="_blank">New Tab (_blank)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={linkForm.status}
                    onChange={(e) => setLinkForm({ ...linkForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Quick Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: ADD/EDIT HOMEPAGE SECTION */}
      {/* ========================================== */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-400" />
                <span>{editingSection ? 'Edit Homepage Section' : 'Create New Homepage Section'}</span>
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Section Type *</label>
                <select
                  value={sectionForm.type}
                  onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value as HomepageSectionType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="announcement">Announcement Banner</option>
                  <option value="quick_links">Quick Links Grid</option>
                  <option value="featured_content">Featured Content Card</option>
                  <option value="latest_updates">Latest Updates / News</option>
                  <option value="ad_banner">Advertisement Banner</option>
                  <option value="custom_section">Custom Section</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester Examination Mock CBT Practice"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Subtitle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UNILAG, UI, ABU, FUL & Top Nigerian Universities"
                  value={sectionForm.subtitle}
                  onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description or content text for this section..."
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Start Practice"
                    value={sectionForm.buttonText}
                    onChange={(e) => setSectionForm({ ...sectionForm, buttonText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Button Link</label>
                  <input
                    type="text"
                    placeholder="e.g. /practice or https://..."
                    value={sectionForm.buttonLink}
                    onChange={(e) => setSectionForm({ ...sectionForm, buttonLink: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={sectionForm.imageUrl}
                  onChange={(e) => setSectionForm({ ...sectionForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. NOTICE"
                    value={sectionForm.badge}
                    onChange={(e) => setSectionForm({ ...sectionForm, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Position Order</label>
                  <input
                    type="number"
                    min="1"
                    value={sectionForm.order}
                    onChange={(e) => setSectionForm({ ...sectionForm, order: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={sectionForm.status}
                    onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Section</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Item?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-white">"{deleteTarget.title}"</strong>? This item will be removed immediately from the live site.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
