import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Save,
  X,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (updatedUser: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [universityName, setUniversityName] = useState(user.universityName || 'Federal University Lokoja, Kogi State (FUL)');
  const [departmentName, setDepartmentName] = useState(user.departmentName || 'Computer Science');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserProfile = {
      ...user,
      name: name.trim(),
      username: username.trim(),
      phone: phone.trim(),
      universityName,
      departmentName,
    };

    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
        
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <h2 className="text-base font-extrabold text-white">Edit Profile</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
            title="Cancel / Close"
          >
            <span>Cancel</span>
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Profile Updated Successfully!</h3>
            <p className="text-xs text-slate-400">Your profile changes have been saved to your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  id="profile-name-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  id="profile-username-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    id="profile-phone-input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">University Institution</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  id="profile-university-select"
                >
                  <option value="Federal University Lokoja, Kogi State (FUL)">
                    Federal University Lokoja, Kogi State (FUL)
                  </option>
                  <option value="Federal University of Allied Health Sciences, Enugu (FUAHSE)">
                    Federal University of Allied Health Sciences, Enugu (FUAHSE)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department & Course of Study</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  id="profile-department-input"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                id="save-profile-btn"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
