import React, { useState } from 'react';
import { AdminUser } from '../../types';

interface AdminLoginProps {
  onLogin: (user: AdminUser) => void;
  onClose: () => void;
}

const DEMO_ADMIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ADMIN === 'true';

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [error, setError] = useState('');

  const handleDemoLogin = () => {
    if (!DEMO_ADMIN_ENABLED) {
      setError('Demo admin access is disabled in this deployment.');
      return;
    }
    onLogin({ id: 'demo_1', username: 'Guest Inspector', isDemo: true });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800 text-slate-300"
          aria-label="Close management gateway"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-user-shield" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase">Management Gateway</h1>
          <p className="text-slate-400 text-xs">
            Administrative access must be granted by verified server-side roles.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">
            {error}
          </p>
        )}

        {DEMO_ADMIN_ENABLED ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs">
              Demo-only access. This does not grant real administrative permissions or access to live farmer records.
            </div>
            <button
              onClick={handleDemoLogin}
              className="w-full bg-emerald-500 text-slate-950 p-4 rounded-xl font-black uppercase tracking-wide text-sm"
            >
              Open Demo Admin
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-300 text-sm">
            Admin sign-in is unavailable until verified role-based authentication is connected. Password-only and hardcoded admin access have been disabled.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
