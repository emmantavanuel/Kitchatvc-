import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, ShieldAlert, Users, LogIn } from 'lucide-react';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  departments: { id: string; name: string }[];
  onBackToWebsite?: () => void;
}

export default function Login({ onLogin, users, departments, onBackToWebsite }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim().toLowerCase();
    const foundUser = users.find(
      u => (u.username.toLowerCase() === trimmedUsername || (u.code && u.code.toLowerCase() === trimmedUsername)) && u.password === password
    );

    if (!foundUser) {
      setError('Invalid username or password. Please try again.');
      return;
    }

    if (!foundUser.isActive) {
      setError('This account has been deactivated by the administrator.');
      return;
    }

    onLogin(foundUser);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {onBackToWebsite && (
        <div className="w-full max-w-md mb-4 flex justify-start">
          <button
            onClick={onBackToWebsite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            ← Return to College Website
          </button>
        </div>
      )}
      <div className="w-full max-w-md">
        
        {/* Header section with Logo & Titles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
            <img
              src={kitchaLogo}
              alt="KITCHA TVC Logo"
              className="w-28 h-28 object-contain rounded-full shadow-md border border-slate-100"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight leading-snug px-2">
            KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-indigo-600 tracking-wider uppercase font-mono">
            Smart College ERP & Scheduling Suite
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800">Welcome Back</h3>
            <p className="text-sm text-slate-400 mt-1">Please log in to your dashboard to manage college operations and resources</p>
          </div>

          {error && (
            <div id="login-error" className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-800 text-sm transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-800 text-sm transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer mt-2"
            >
              <LogIn className="w-4.5 h-4.5" />
              Sign In
            </button>
          </form>

          {/* Clean system stats layout inside the card to keep it professional */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="block font-bold text-indigo-600 text-base">6</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Roles</span>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="block font-bold text-indigo-600 text-base">{departments.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Depts</span>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span className="block font-bold text-indigo-600 text-base">Active</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Checks</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 font-mono">
          Kitutu Chache Technical and Vocational College © 2026
        </div>
      </div>
    </div>
  );
}
