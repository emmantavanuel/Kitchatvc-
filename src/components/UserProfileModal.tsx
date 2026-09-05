import React, { useState } from 'react';
import { User, Department, Student } from '../types';
import { X, Lock, Mail, Phone, Shield, User as UserIcon, Save, Eye, EyeOff, IdCard, Hash } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  users: User[];
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onSaveUsers: (updatedUsers: User[]) => void;
  students?: Student[];
  onSaveStudents?: (updatedStudents: Student[]) => void;
}

export default function UserProfileModal({
  currentUser,
  users,
  departments,
  isOpen,
  onClose,
  onSaveUsers,
  students,
  onSaveStudents
}: UserProfileModalProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [nationalId, setNationalId] = useState(currentUser.nationalId || '');
  const [pfNumber, setPfNumber] = useState(currentUser.pfNumber || '');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Find department name for display
  const userDept = departments.find(d => d.id === currentUser.departmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    // Check username uniqueness
    const usernameExists = users.some(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== currentUser.id
    );
    if (usernameExists) {
      setError('This username is already taken by another account.');
      return;
    }

    // Map updated user back to the users list
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          name: name.trim(),
          username: username.trim(),
          password: password,
          phone: phone.trim(),
          email: email.trim(),
          nationalId: nationalId.trim(),
          pfNumber: pfNumber.trim(),
        };
      }
      return u;
    });

    onSaveUsers(updatedUsers);

    // Sync student profile record if currentUser is a student
    if (currentUser.role === 'student' && students && onSaveStudents) {
      const updatedStudents = students.map(s => {
        if (
          s.regNumber.toUpperCase() === currentUser.username.toUpperCase() ||
          s.regNumber.toUpperCase() === currentUser.code?.toUpperCase() ||
          s.name.toLowerCase() === currentUser.name.toLowerCase()
        ) {
          return {
            ...s,
            name: name.trim(),
            email: email.trim() || s.email,
            phone: phone.trim() || s.phone,
            nationalId: nationalId.trim() || s.nationalId,
          };
        }
        return s;
      });
      onSaveStudents(updatedStudents);
    }

    setSuccess('Your profile has been updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div id="modal-profile-edit" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-50 to-[#fdf8f4] p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-lg text-slate-800">My Personal Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your credentials and contact information.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {success}
            </div>
          )}

          {/* Locked / SuperAdmin Only Block */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              SuperAdmin Controlled Fields (Locked)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">System Role</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Teacher Code</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  {currentUser.code || 'N/A'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Department</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1 truncate max-w-full">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  {userDept ? userDept.code : 'None'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * To modify system role, department assignment, or teacher code, please contact the Super Administrator.
            </p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emmanuel Ariga"
                className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Username {currentUser.role !== 'admin' && <span className="text-[10px] text-amber-600 lowercase font-normal">(locked by admin)</span>}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  disabled={currentUser.role !== 'admin'}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Login Username"
                  className={`block w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                    currentUser.role !== 'admin'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200/80'
                      : 'bg-slate-50/50 text-slate-800 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set Login Password"
                    className="block w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +254 700 000000"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@kitcha.studio"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <IdCard className="w-3.5 h-3.5 text-slate-400" /> National ID Number
                  </span>
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. 12345678"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" /> PF / Payroll Number
                  </span>
                </label>
                <input
                  type="text"
                  value={pfNumber}
                  onChange={(e) => setPfNumber(e.target.value)}
                  placeholder="e.g. PF9982"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
