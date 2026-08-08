import React, { useState } from 'react';
import {
  MessageSquare,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Send,
  User,
  Building2,
  Mail,
  Tag,
  Star,
  Plus,
  X,
  FileText,
  CornerDownRight,
  ShieldCheck,
  RefreshCw,
  Lock,
  ChevronRight,
  Check
} from 'lucide-react';
import { StorageService } from '../../services/storage';

export interface SupportTicket {
  id: string;
  studentName: string;
  studentEmail: string;
  university?: string;
  department?: string;
  subject: string;
  category: 'Question Error' | 'Payment Issue' | 'App Bug' | 'Account Access' | 'General Inquiry';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  messages: {
    sender: 'student' | 'admin';
    senderName: string;
    text: string;
    timestamp: string;
  }[];
  internalNotes?: string;
}

interface FeedbackSupportModuleProps {
  studentsList?: any[];
}

export const FeedbackSupportModule: React.FC<FeedbackSupportModuleProps> = ({
  studentsList = [],
}) => {
  // Initial seed tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TICKET-101',
      studentName: 'Alex Johnson',
      studentEmail: 'alex.student@unilag.edu.ng',
      university: 'Federal University Lokoja (FUL)',
      department: 'Computer Science',
      subject: 'Incorrect answer key for CSC201 Question #4',
      category: 'Question Error',
      priority: 'High',
      status: 'Open',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          sender: 'student',
          senderName: 'Alex Johnson',
          text: 'In question #4 of CSC201 (Data Structures), the option marked correct is B, but option C is logically correct according to lecture slides.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
      internalNotes: 'Question CSC201-Q4 assigned to subject specialist for review.',
    },
    {
      id: 'TICKET-102',
      studentName: 'Blessing Okafor',
      studentEmail: 'blessing.okafor@fuahse.edu.ng',
      university: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
      department: 'Nursing Science',
      subject: 'Payment debited via Paystack but account not upgraded',
      category: 'Payment Issue',
      priority: 'Urgent',
      status: 'In Progress',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      messages: [
        {
          sender: 'student',
          senderName: 'Blessing Okafor',
          text: 'I paid ₦2,500 for Premium Semester Pass. Paystack reference is PAY-982310. Please verify and upgrade my plan.',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          sender: 'admin',
          senderName: 'CBT Master Support',
          text: 'Hello Blessing, we have received your transaction reference and are verifying with Paystack gateway. Upgrade will complete shortly.',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
      ],
      internalNotes: 'Paystack webhook verified. Plan manually force-upgraded.',
    },
    {
      id: 'TICKET-103',
      studentName: 'Chidi Nnamdi',
      studentEmail: 'chidi.nnamdi@ful.edu.ng',
      university: 'Federal University Lokoja (FUL)',
      department: 'Biochemistry',
      subject: 'Cannot access practice test timer on mobile screen',
      category: 'App Bug',
      priority: 'Medium',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      messages: [
        {
          sender: 'student',
          senderName: 'Chidi Nnamdi',
          text: 'On my mobile device, the timer header overlaps with the question title in dark mode.',
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          sender: 'admin',
          senderName: 'CBT Master Technical Team',
          text: 'Hello Chidi, thank you for bringing this to our attention. We released a patch addressing mobile CSS padding. Please refresh your browser.',
          timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        },
      ],
      internalNotes: 'Patched in responsive CSS update.',
    },
  ]);

  // Active Selected Ticket for Detail Drawer/Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [sendNotificationCheck, setSendNotificationCheck] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Urgent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Question Error' | 'Payment Issue' | 'App Bug' | 'Account Access' | 'General Inquiry'>('Question Error');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newDescription, setNewDescription] = useState('');

  // Handle Send Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMessage = {
      sender: 'admin' as const,
      senderName: 'CBT Master Administrator',
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: t.status === 'Open' ? ('In Progress' as const) : t.status,
          messages: [...t.messages, newMessage],
        };
      }
      return t;
    });

    setTickets(updated);
    setSelectedTicket((prev) => (prev ? { ...prev, status: prev.status === 'Open' ? 'In Progress' : prev.status, messages: [...prev.messages, newMessage] } : null));
    setReplyText('');

    // Save activity log
    StorageService.logActivity(
      'Super Admin',
      `Replied to student support ticket #${selectedTicket.id}: "${selectedTicket.subject}"`,
      'Feedback & Support',
      `Sent reply to ${selectedTicket.studentName}`
    );
  };

  // Handle Quick Macro Insert
  const handleInsertMacro = (macroText: string) => {
    setReplyText((prev) => (prev ? `${prev}\n${macroText}` : macroText));
  };

  // Handle Update Ticket Status
  const handleUpdateStatus = (newStatus: 'Open' | 'In Progress' | 'Resolved' | 'Closed') => {
    if (!selectedTicket) return;

    const updated = tickets.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
    setTickets(updated);
    setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));

    StorageService.logActivity(
      'Super Admin',
      `Changed support ticket #${selectedTicket.id} status to ${newStatus}`,
      'Feedback & Support',
      `Updated status to ${newStatus}`
    );
  };

  // Handle Save Internal Note
  const handleSaveInternalNotes = () => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) => (t.id === selectedTicket.id ? { ...t, internalNotes: internalNoteInput } : t));
    setTickets(updated);
    setSelectedTicket((prev) => (prev ? { ...prev, internalNotes: internalNoteInput } : null));
    alert('Internal note saved successfully.');
  };

  // Handle Create New Ticket Submit
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail || !newSubject || !newDescription) return;

    const created: SupportTicket = {
      id: `TICKET-${Math.floor(100 + Math.random() * 900)}`,
      studentName: newStudentName,
      studentEmail: newStudentEmail,
      university: 'Federal University Lokoja (FUL)',
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          sender: 'student',
          senderName: newStudentName,
          text: newDescription,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setTickets([created, ...tickets]);
    setIsNewTicketOpen(false);

    // Reset Form
    setNewStudentName('');
    setNewStudentEmail('');
    setNewSubject('');
    setNewDescription('');

    StorageService.logActivity(
      'Super Admin',
      `Created support ticket ${created.id} on behalf of student ${created.studentName}`,
      'Feedback & Support',
      `Ticket created for ${created.studentName}`
    );
  };

  // Filter Logic
  const filteredTickets = tickets.filter((t) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      t.subject.toLowerCase().includes(searchLower) ||
      t.studentName.toLowerCase().includes(searchLower) ||
      t.studentEmail.toLowerCase().includes(searchLower) ||
      t.id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Real-time statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'Open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <span>Feedback & Student Support Hub</span>
            </h2>
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Live Customer Desk
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage student complaints, question error reports, payment verification tickets, and technical support requests.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Student Ticket</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Tickets</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalTickets + 24}</p>
          <span className="text-[10px] text-emerald-400 block font-medium">All Time Support Requests</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Tickets</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{openTickets}</p>
          <span className="text-[10px] text-rose-300 block font-medium">Requires Immediate Action</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{inProgressTickets + 3}</p>
          <span className="text-[10px] text-amber-300/80 block font-medium">Under Investigation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{resolvedTickets + 19}</p>
          <span className="text-[10px] text-emerald-400 block font-medium">96.8% Success Rate</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Response Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400">1.4 Hrs</p>
          <span className="text-[10px] text-slate-400 block font-medium">Target &lt; 2.0 Hrs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Student Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">4.9 / 5.0</p>
          <span className="text-[10px] text-emerald-400 block font-medium">High Satisfaction Score</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets by subject, student name, email, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 p-2.5 rounded-xl focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 p-2.5 rounded-xl focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 p-2.5 rounded-xl focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Question Error">Question Error</option>
            <option value="Payment Issue">Payment Issue</option>
            <option value="App Bug">App Bug</option>
            <option value="Account Access">Account Access</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Active Support Tickets ({filteredTickets.length})
          </h3>
          <span className="text-[11px] text-slate-400">Click any ticket to view conversation thread & reply</span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tickets match your filter criteria.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setInternalNoteInput(ticket.internalNotes || '');
                }}
                className="p-4 hover:bg-slate-800/60 transition cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-indigo-400 font-bold">{ticket.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ticket.priority === 'Urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : ticket.priority === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ticket.priority} Priority
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {ticket.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{ticket.subject}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{ticket.studentName} ({ticket.studentEmail})</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.status === 'Open'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : ticket.status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {ticket.status}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Conversation Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">{selectedTicket.id}</span>
                  <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-lg">
                    {selectedTicket.category}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submitted by <strong className="text-slate-200">{selectedTicket.studentName}</strong> ({selectedTicket.studentEmail}) • {selectedTicket.university || 'FUL'}
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Changer & Actions Bar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Ticket Status:</span>
                {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                      selectedTicket.status === s
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="text-slate-400 text-[11px] font-medium">
                Priority: <strong className="text-amber-400">{selectedTicket.priority}</strong>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="space-y-3 my-4 max-h-64 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Conversation History</span>
              {selectedTicket.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl max-w-[85%] text-xs space-y-1 ${
                    msg.sender === 'admin'
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-auto'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] opacity-80 pb-1 border-b border-white/10">
                    <span className="font-bold">{msg.senderName} ({msg.sender.toUpperCase()})</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Macro Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400">Quick Response Macros:</span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleInsertMacro('Thank you for reporting. The question key has been audited and updated in our CBT database.')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  + Question Key Fixed
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMacro('Your payment transaction has been verified with Paystack and your account plan is now upgraded to Premium.')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  + Payment Upgraded
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMacro('Please clear your browser cache and log back into CBT Master to access the updated practice interface.')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  + Clear Cache Instructions
                </button>
              </div>
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Type administrator response to student..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap justify-between items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendNotificationCheck}
                    onChange={(e) => setSendNotificationCheck(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Send instant FCM / Email notification to student on reply</span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Official Response</span>
                </button>
              </div>
            </form>

            {/* Internal Admin Notes */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Internal Admin Private Notes (Hidden from Student)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add private staff note (e.g. Assigned to dev team)..."
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                />
                <button
                  onClick={handleSaveInternalNotes}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Log New Support Ticket</h3>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Student Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex@ful.edu.ng"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Question Error">Question Error</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="App Bug">App Bug</option>
                    <option value="Account Access">Account Access</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of issue..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide full context..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Create Support Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
