import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Sparkles,
  Bot,
  Move,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Bell,
  Star,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import {
  MenCoreSettings,
  MenCoreConversationLog,
  MenCoreAnnouncementItem,
  UserProfile,
  MenCoreNavigationTarget
} from '../types';
import { MenCoreService, DEFAULT_MENCORE_SETTINGS } from '../services/mencoreService';
import { MenCoreAvatar } from './MenCoreLogo';

interface MenCoreWidgetProps {
  currentUser?: UserProfile | null;
  onNavigate?: (view: string, tab?: string) => void;
  isAuthModalOpen?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'mencore' | 'user';
  text: string;
  time: string;
  navigationTarget?: MenCoreNavigationTarget;
  logId?: string;
  starRating?: number;
  wasHelpful?: boolean;
}

export const MenCoreWidget: React.FC<MenCoreWidgetProps> = ({
  currentUser,
  onNavigate,
  isAuthModalOpen = false,
}) => {
  const [settings, setSettings] = useState<MenCoreSettings>(MenCoreService.getSettings());
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => !document.documentElement.classList.contains('light-theme'));

  // Sync with global theme class changes
  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light-theme');
      setIsDarkMode(!isLight);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [announcements, setAnnouncements] = useState<MenCoreAnnouncementItem[]>(MenCoreService.getAnnouncements());

  // Welcome message as first item
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'mencore',
        text: settings.welcomeMessage || DEFAULT_MENCORE_SETTINGS.welcomeMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Dragging state
  const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 90 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [showWelcomePill, setShowWelcomePill] = useState(true);
  const dragOffset = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Refresh settings periodically or on focus
  useEffect(() => {
    const updateState = () => {
      setSettings(MenCoreService.getSettings());
      setAnnouncements(MenCoreService.getAnnouncements());
    };
    window.addEventListener('storage', updateState);
    const interval = setInterval(updateState, 5000);
    return () => {
      window.removeEventListener('storage', updateState);
      clearInterval(interval);
    };
  }, []);

  // Handle Drag Events for circular floating button
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on primary click and if not clicking a control button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 70, e.clientX - dragOffset.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 70, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
      setHasDragged(true);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle Touch Drag for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = {
      x: touch.clientX - pos.x,
      y: touch.clientY - pos.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(10, Math.min(window.innerWidth - 70, touch.clientX - dragOffset.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 70, touch.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });
    setHasDragged(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Skip rendering if disabled or if on auth modal without override
  if (!settings.isEnabled) return null;
  if (isAuthModalOpen && !settings.showOnAuthPages) return null;

  const activeAnnouncements = announcements.filter((a) => a.isActive);
  const totalBadge = activeAnnouncements.reduce((acc, curr) => acc + (curr.badgeCount || 1), 0);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsTyping(true);

    // Simulate natural typing delay based on admin speed settings
    const delay = settings.responseSpeed === 'instant' ? 400 : settings.responseSpeed === 'fast' ? 900 : 1500;

    setTimeout(async () => {
      const res = await MenCoreService.queryMenCoreAsync(textToSend.trim(), currentUser);
      const logId = `log-${Date.now()}`;

      // Save log
      const newLog: MenCoreConversationLog = {
        id: logId,
        userId: currentUser?.id || 'anonymous',
        userName: currentUser?.name || 'Guest User',
        userEmail: currentUser?.email || 'guest@cbtmaster.ng',
        userRole: currentUser?.role || 'student',
        question: textToSend.trim(),
        answer: res.answer,
        questionType: res.questionType,
        createdAt: new Date().toISOString(),
        unanswered: res.unanswered,
      };

      MenCoreService.saveLog(newLog);

      const botMsg: ChatMessage = {
        id: `mencore-${Date.now()}`,
        sender: 'mencore',
        text: res.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        navigationTarget: res.navigationTarget,
        logId: logId,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleRateHelpful = (msgId: string, logId?: string, isHelpful?: boolean, star?: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              wasHelpful: isHelpful !== undefined ? isHelpful : m.wasHelpful,
              starRating: star !== undefined ? star : m.starRating,
            }
          : m
      )
    );

    if (logId) {
      MenCoreService.updateLogFeedback(
        logId,
        isHelpful !== undefined ? isHelpful : true,
        star
      );
    }
  };

  const QUICK_QUESTIONS = [
    'How do I start CBT?',
    'Where is Practice Mode?',
    'How do I subscribe?',
    'What are Premium benefits?',
    'Where are study materials?',
  ];

  return (
    <div
      className="fixed z-[9999] animate-in fade-in transition-all duration-150"
      style={
        hasDragged
          ? { left: `${pos.x}px`, top: `${pos.y}px` }
          : { bottom: '24px', right: '24px' }
      }
    >
      {/* ========================================================================= */}
      {/* 1. EXPANDABLE CHAT WINDOW                                                 */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          className={`absolute bottom-16 right-0 w-[92vw] sm:w-[380px] md:w-[410px] rounded-3xl shadow-2xl border transition-all overflow-hidden flex flex-col ${
            isDarkMode
              ? 'bg-slate-950 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800 shadow-xl'
          } ${isMinimized ? 'h-14' : 'h-[520px] max-h-[80vh]'}`}
        >
          {/* Top Header Bar */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between border-b border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MenCoreAvatar size="md" className="border-white/30" src={settings.avatarUrl} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                    settings.onlineStatus === 'online'
                      ? 'bg-emerald-400'
                      : settings.onlineStatus === 'busy'
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">{settings.name || 'MenCore'}</h3>
                  <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded font-bold text-amber-300">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100/90 font-medium">
                  {settings.subtitle || 'Powered by Menmex'} •{' '}
                  <span className="text-emerald-300 font-bold">
                    {settings.onlineStatus === 'online' ? 'Online' : settings.onlineStatus.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Window Controls: Dark Mode, Minimize, Close */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title="Toggle theme"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Active Announcements Broadcast Bar (if any) */}
              {activeAnnouncements.length > 0 && (
                <div className="bg-amber-500/10 border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-medium truncate">
                    <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{activeAnnouncements[0].title}: {activeAnnouncements[0].content}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                    NEW
                  </span>
                </div>
              )}

              {/* Chat Message Scroll Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    } animate-in fade-in-50`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        m.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                          : isDarkMode
                          ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                          : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                      {/* Navigation Assistant Button */}
                      {m.navigationTarget && (
                        <button
                          onClick={() => {
                            if (onNavigate && m.navigationTarget) {
                              onNavigate(m.navigationTarget.view, m.navigationTarget.tab);
                            } else {
                              alert(`Navigating to ${m.navigationTarget?.label || 'Target Section'}...`);
                            }
                          }}
                          className="mt-3 w-full py-2 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <span>{m.navigationTarget.label}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span
                        className={`block text-[10px] mt-1.5 text-right ${
                          m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>

                    {/* Feedback Rating System after MenCore answer: "Was this helpful? ⭐⭐⭐⭐⭐" */}
                    {m.sender === 'mencore' && m.id !== 'msg-welcome' && (
                      <div className="flex items-center gap-2 mt-1.5 px-2">
                        <span className="text-[11px] text-slate-400 font-medium">Was this helpful?</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateHelpful(m.id, m.logId, true, star)}
                              title={`${star} Stars`}
                              className={`cursor-pointer transition-transform hover:scale-125 ${
                                m.starRating && star <= m.starRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-500 hover:text-amber-300'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ))}
                        </div>
                        {m.starRating && (
                          <span className="text-[10px] font-bold text-emerald-400 ml-1">
                            ✓ {m.starRating}/5 Rated
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse px-2">
                    <MenCoreAvatar size="sm" src={settings.avatarUrl} />
                    <span className="font-medium">{settings.name || 'MenCore'} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-900/50 flex gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium rounded-full shrink-0 border border-slate-700/80 cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Message Input Bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask MenCore about CBT, practice, subscriptions..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CIRCULAR FLOATING BUTTON WITH PROMPT PILL (DRAGGABLE OR CLICKABLE)     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-3">
        {/* Floating Welcome Bubble Pill on Dashboard */}
        {!isOpen && showWelcomePill && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 border border-indigo-500/50 rounded-full shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="text-xs font-semibold text-slate-200 cursor-pointer hover:text-white"
            >
              Ask MenCore AI ({settings.name || 'MenCore'})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomePill(false);
              }}
              className="text-slate-400 hover:text-slate-200 ml-1 cursor-pointer"
              title="Dismiss prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Circular Button */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (!isDragging) {
              setIsOpen(!isOpen);
              setIsMinimized(false);
            }
          }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer select-none shadow-2xl transition-transform hover:scale-105 active:scale-95 ${
            settings.glowingAnimation ? 'ring-4 ring-indigo-500/30 animate-pulse' : ''
          } ${
            settings.themeColor === 'emerald'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
              : settings.themeColor === 'violet'
              ? 'bg-gradient-to-tr from-violet-600 to-purple-500'
              : settings.themeColor === 'amber'
              ? 'bg-gradient-to-tr from-amber-600 to-orange-500'
              : 'bg-gradient-to-tr from-indigo-600 to-indigo-500'
          }`}
          title="MenCore AI Assistant • Powered by Menmex (Drag to move)"
        >
          <MenCoreAvatar size="lg" className="w-12 h-12 shadow-lg" src={settings.avatarUrl} />

          {/* Unread Announcements or Online Badge */}
          {totalBadge > 0 && !isOpen ? (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center border-2 border-slate-900 shadow">
              {totalBadge}
            </span>
          ) : (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          )}
        </div>
      </div>
    </div>
  );
};
