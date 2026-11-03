import React, { useState } from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import { UserRole } from '../types/budol.ts';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlatformBadgeSvg,
} from '../components/icons/SvgIcons.tsx';

export const AuthView: React.FC = () => {
  const role = useBudolStore((s) => s.role);
  const userName = useBudolStore((s) => s.userName);
  const userEmail = useBudolStore((s) => s.userEmail);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const setRole = useBudolStore((s) => s.setRole);
  const updateUserProfile = useBudolStore((s) => s.updateUserProfile);
  const showToast = useBudolStore((s) => s.showToast);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [nameInput, setNameInput] = useState(userName);
  const [emailInput, setEmailInput] = useState(userEmail);
  const [passwordInput, setPasswordInput] = useState('budolcheck2026');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@') || passwordInput.trim().length < 6) {
      setErrorMessage('Please enter a valid email address and a password of at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !nameInput.trim()) {
      setErrorMessage('Please enter your full name to register.');
      return;
    }

    setErrorMessage(null);
    updateUserProfile(nameInput, emailInput);
    setRole(role, true);
  };

  const handleQuickShopConnect = (shopName: string) => {
    updateUserProfile(nameInput || 'Daisy', emailInput, `${shopName} Connected`);
    showToast(`Authenticated via ${shopName} account`);
    setRole(role, true);
  };

  return (
    <section className="mx-auto max-w-md py-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateTo('front')}
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>
        <h2 className="font-editorial text-xl font-bold text-ink">
          Account Access
        </h2>
        <div className="w-12" />
      </div>

      <div className="budol-card-elevated bg-white">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border-[1.5px] border-ink bg-cream p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`min-h-[36px] rounded-full text-xs font-semibold transition-all duration-150 ${
              mode === 'login'
                ? 'border border-ink bg-white text-ink shadow-crisp'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`min-h-[36px] rounded-full text-xs font-semibold transition-all duration-150 ${
              mode === 'signup'
                ? 'border border-ink bg-white text-ink shadow-crisp'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5" noValidate>
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-full-name"
                className="mb-1 block text-xs font-semibold text-ink"
              >
                Full Name
              </label>
              <input
                id="auth-full-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Daisy Dela Cruz"
                className="w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-semibold text-ink"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="daisy@budolcheck.ph"
              className="w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-semibold text-ink"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="auth-role-select"
              className="mb-1 block text-xs font-semibold text-ink"
            >
              Role Perspective
            </label>
            <select
              id="auth-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole, false)}
              className="w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm font-medium text-ink focus:bg-white focus:outline-none"
            >
              <option value="user">Shopper (User View)</option>
              <option value="seller">Merchant (Seller Dashboard)</option>
              <option value="admin">Moderator (Administrator View)</option>
            </select>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-flag bg-blush px-3 py-2 text-xs font-medium text-flag"
            >
              {errorMessage}
            </p>
          )}

          <button type="submit" className="btn-primary-gradient mt-2 w-full py-2.5 text-sm">
            <span>{mode === 'login' ? 'Log In to BudolCheck' : 'Create Account'}</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-ink-muted">
          <div className="h-px flex-1 bg-ink/20" />
          <span>or continue with online shop account</span>
          <div className="h-px flex-1 bg-ink/20" />
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleQuickShopConnect('TikTok Shop')}
            className="btn-secondary-pill w-full py-2.5 text-xs"
          >
            <span className="font-semibold">Continue with Connected Shop Account</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(['Shopee', 'Lazada', 'TikTok Shop', 'Temu'] as const).map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => handleQuickShopConnect(plat)}
                className="transition-transform active:scale-95"
              >
                <PlatformBadgeSvg platform={plat} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthView;
