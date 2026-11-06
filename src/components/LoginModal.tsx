import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, User, Hash, Mail, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canDismiss = false }) => {
  const { login, register, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmpNum, setLoginEmpNum] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmpNum, setRegEmpNum] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginStatus(null);

    if (!loginEmpNum.trim() || !loginPass.trim()) {
      setLoginError('Please enter both Employee Number and Password.');
      return;
    }

    const res = login(loginEmpNum, loginPass);
    if (!res.success) {
      setLoginError(res.error || 'Login failed.');
      if (res.status) setLoginStatus(res.status);
    } else {
      if (onClose) onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regFirstName.trim() || !regLastName.trim() || !regEmpNum.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('All fields are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    const res = register({
      firstName: regFirstName,
      lastName: regLastName,
      employeeNumber: regEmpNum,
      email: regEmail,
      password: regPassword,
    });

    if (!res.success) {
      setRegError(res.error || 'Registration failed.');
    } else {
      setRegSuccess(
        `Account request for ${regFirstName} ${regLastName} (Emp #${regEmpNum}) created successfully! It is now pending approval by the Admin (Dr. Mansour).`
      );
      // Reset registration fields
      setRegFirstName('');
      setRegLastName('');
      setRegEmpNum('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    }
  };

  const fillQuickAdmin = () => {
    setLoginEmpNum('1001');
    setLoginPass('admin');
    setLoginError(null);
  };

  const fillQuickPhysician = () => {
    setLoginEmpNum('1002');
    setLoginPass('password123');
    setLoginError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 text-white p-5 relative">
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-teal-200 hover:text-white hover:bg-teal-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">Pediatric Oncology Tracker</h2>
              <p className="text-xs text-teal-200 font-medium">Secure Clinical Access Portal</p>
            </div>
          </div>

          {currentUser && (
            <div className="mt-3 text-[11px] bg-teal-900/60 rounded-lg p-2 border border-teal-600/40 text-teal-100 flex items-center justify-between">
              <span>Currently logged in: <strong>{currentUser.firstName} {currentUser.lastName}</strong> (#{currentUser.employeeNumber})</span>
              <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500 text-teal-950">{currentUser.role}</span>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'login'
                ? 'border-teal-600 text-teal-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In with Employee #
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-teal-600 text-teal-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request New Account
          </button>
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
            {loginError && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  loginStatus === 'pending'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{loginError}</div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-teal-700" />
                Employee Number
              </label>
              <input
                type="text"
                required
                value={loginEmpNum}
                onChange={(e) => setLoginEmpNum(e.target.value)}
                placeholder="e.g. 1001"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-700" />
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Quick Login helper buttons */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                Quick Demo Logins:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillQuickAdmin}
                  className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-md font-semibold text-[11px] transition-colors text-left truncate"
                >
                  Dr. Mansour (Admin #1001)
                </button>
                <button
                  type="button"
                  onClick={fillQuickPhysician}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md font-semibold text-[11px] transition-colors text-left truncate"
                >
                  Dr. Elena (#1002)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Log In to Tracker</span>
            </button>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{regError}</div>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-snug">
                  <strong>Success!</strong> {regSuccess}
                </div>
              </div>
            )}

            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900">
              <strong>Notice:</strong> All new registrations require verification and approval by the Admin (Dr. Mansour) before access is activated.
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="e.g. Tariq"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="e.g. Al-Mansour"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-teal-700" />
                Employee Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regEmpNum}
                onChange={(e) => setRegEmpNum(e.target.value)}
                placeholder="e.g. 1045"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-700" />
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@pedonco.org"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <User className="w-4 h-4" />
              <span>Submit Registration for Admin Approval</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
