import React, { useEffect, useRef, useState } from 'react';
import { useBudolStore } from '../store/useBudolStore.ts';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
} from '../components/icons/SvgIcons.tsx';

const GOOGLE_CLIENT_ID =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_GOOGLE_CLIENT_ID ||
  '273040203030-havjghcgh6ns548jvhr26umlho3c5ca4.apps.googleusercontent.com';

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      shape?: 'pill' | 'rectangular';
      width?: number;
      text?: 'signin_with' | 'signup_with' | 'continue_with';
    }
  ) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export const AuthView: React.FC = () => {
  const authLoading = useBudolStore((s) => s.authLoading);
  const navigateTo = useBudolStore((s) => s.navigateTo);
  const login = useBudolStore((s) => s.login);
  const register = useBudolStore((s) => s.register);
  const connectShop = useBudolStore((s) => s.connectShop);
  const loginWithGoogle = useBudolStore((s) => s.loginWithGoogle);
  const requestPasswordReset = useBudolStore((s) => s.requestPasswordReset);
  const resetPassword = useBudolStore((s) => s.resetPassword);

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [shopConnectPickerOpen, setShopConnectPickerOpen] = useState(false);
  const [shopPlatform, setShopPlatform] = useState<'Shopee' | 'Lazada' | 'Temu'>('Shopee');
  const [shopNameInput, setShopNameInput] = useState('');
  const [shopUrlInput, setShopUrlInput] = useState('');
  const [shopEmailInput, setShopEmailInput] = useState('');
  const [shopPasswordInput, setShopPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetInfoMessage, setResetInfoMessage] = useState<string | null>(null);
  const [signupRole, setSignupRole] = useState<'user' | 'seller'>('user');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initGoogleIdentity = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) {
              setErrorMessage(null);
              void loginWithGoogle(response.credential, signupRole).catch((err) => {
                setErrorMessage(
                  err instanceof Error
                    ? err.message
                    : 'Unable to complete Google sign-in.'
                );
              });
            }
          },
        });
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            width: 340,
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
          });
        }
        setGsiReady(true);
      } catch {
        setGsiReady(false);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleIdentity();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', initGoogleIdentity);
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', initGoogleIdentity);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleIdentity;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, mode, signupRole]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();

    if (mode === 'forgot') {
      if (!cleanEmail.includes('@')) {
        setErrorMessage('Please enter the email address associated with your account.');
        return;
      }
      setErrorMessage(null);
      try {
        const res = await requestPasswordReset(cleanEmail);
        setResetInfoMessage(res.message);
        setMode('reset');
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to send reset code right now.'
        );
      }
      return;
    }

    if (mode === 'reset') {
      if (!cleanEmail.includes('@')) {
        setErrorMessage('Please enter your account email address.');
        return;
      }
      if (!/^\d{6}$/.test(resetCodeInput.trim())) {
        setErrorMessage('Please enter the 6-digit numeric verification code.');
        return;
      }
      if (newPasswordInput.length < 6) {
        setErrorMessage('Your new password must be at least 6 characters long.');
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        setErrorMessage('New password and confirmation password do not match.');
        return;
      }
      setErrorMessage(null);
      try {
        await resetPassword({
          email: cleanEmail,
          code: resetCodeInput.trim(),
          newPassword: newPasswordInput,
        });
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to reset password right now.'
        );
      }
      return;
    }

    if (!cleanEmail.includes('@') || passwordInput.length < 6) {
      setErrorMessage(
        'Please enter a valid email address and a password of at least 6 characters.'
      );
      return;
    }
    if (mode === 'signup' && nameInput.trim().length < 2) {
      setErrorMessage('Please enter your full name to create an account.');
      return;
    }

    setErrorMessage(null);
    try {
      if (mode === 'login') {
        await login(cleanEmail, passwordInput);
      } else {
        await register({
          fullName: nameInput.trim(),
          email: cleanEmail,
          password: passwordInput,
          role: signupRole,
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to authenticate right now.'
      );
    }
  };

  const handleFallbackGooglePrompt = () => {
    setErrorMessage(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return;
    }
    setErrorMessage(
      'Google Identity Services is initializing or requires an active internet connection for popup sign-in.'
    );
  };

  return (
    <section className="mx-auto max-w-md py-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeftIcon size={16} />
          <span>Back to Home</span>
        </button>
        <h1 className="font-editorial text-xl font-bold text-ink">
          {mode === 'forgot' || mode === 'reset' ? 'Password Recovery' : 'Account Access'}
        </h1>
        <div className="w-16" />
      </div>

      <div className="budol-card-elevated bg-white">
        {(mode === 'login' || mode === 'signup') && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border-[1.5px] border-ink bg-cream p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`min-h-[40px] rounded-full text-xs font-semibold transition-all duration-150 ${
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
              className={`min-h-[40px] rounded-full text-xs font-semibold transition-all duration-150 ${
                mode === 'signup'
                  ? 'border border-ink bg-white text-ink shadow-crisp'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div className="mb-4 rounded-2xl border-[1.5px] border-ink bg-cream p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="sticker bg-butter text-ink">
                <ShieldIcon size={13} />
                <span>{mode === 'forgot' ? 'Step 1 of 2: Request Code' : 'Step 2 of 2: Set New Password'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setResetInfoMessage(null);
                }}
                className="text-xs font-semibold text-forest underline"
              >
                Back to Log In
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {mode === 'forgot'
                ? 'Enter your registered BudolCheck email address to generate a 6-digit password reset code.'
                : resetInfoMessage ||
                  'Enter the 6-digit verification code and choose a new password.'}
            </p>
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="mb-4 space-y-2.5">
            <div
              ref={googleBtnContainerRef}
              className={`flex justify-center ${gsiReady ? 'min-h-[44px]' : 'hidden'}`}
            />
            {!gsiReady && (
              <button
                type="button"
                disabled={authLoading}
                onClick={handleFallbackGooglePrompt}
                className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-xs font-semibold text-ink shadow-crisp transition-transform hover:bg-cream active:scale-[0.99]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>
                  {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 text-xs font-medium text-ink-muted">
              <div className="h-px flex-1 bg-ink/20" />
              <span>or use email &amp; password</span>
              <div className="h-px flex-1 bg-ink/20" />
            </div>
          </div>
        )}

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
                autoComplete="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Daisy Dela Cruz"
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
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
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
            />
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-ink"
                >
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setResetInfoMessage(null);
                    }}
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="At least 6 characters"
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label
                  htmlFor="auth-reset-code"
                  className="mb-1 block text-xs font-semibold text-ink"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="auth-reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCodeInput}
                  onChange={(e) =>
                    setResetCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 font-mono text-sm tracking-widest text-ink focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="auth-new-password"
                  className="mb-1 block text-xs font-semibold text-ink"
                >
                  New Password
                </label>
                <input
                  id="auth-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="At least 6 characters"
                  className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="mb-1 block text-xs font-semibold text-ink"
                >
                  Confirm New Password
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Repeat new password"
                  className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm text-ink focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-account-type"
                className="mb-1 block text-xs font-semibold text-ink"
              >
                Account Type
              </label>
              <select
                id="auth-account-type"
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as 'user' | 'seller')}
                className="min-h-[44px] w-full rounded-xl border-[1.5px] border-ink bg-cream/60 px-3.5 py-2.5 text-sm font-medium text-ink focus:bg-white focus:outline-none"
              >
                <option value="user">Shopper Account</option>
                <option value="seller">Merchant / Seller Account</option>
              </select>
            </div>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-flag bg-blush px-3 py-2 text-xs font-medium text-flag"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="btn-primary-gradient mt-2 w-full py-2.5 text-sm"
          >
            <span>
              {authLoading
                ? 'Processing...'
                : mode === 'login'
                ? 'Log In to BudolCheck'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'forgot'
                ? 'Send 6-Digit Reset Code'
                : 'Reset Password & Sign In'}
            </span>
            <ArrowRightIcon size={16} />
          </button>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-xs font-medium text-ink-muted">
              <div className="h-px flex-1 bg-ink/20" />
              <span>Or</span>
              <div className="h-px flex-1 bg-ink/20" />
            </div>

            {!shopConnectPickerOpen ? (
              <button
                type="button"
                disabled={authLoading}
                onClick={() => setShopConnectPickerOpen(true)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-[#D7E6D0] px-4 py-2.5 text-xs font-bold text-ink shadow-crisp transition-transform hover:bg-mint active:scale-[0.99]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l1.5-5h15L21 9" />
                  <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
                  <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
                </svg>
                <span>Continue with Shop Account</span>
              </button>
            ) : (
              <div className="rounded-2xl border-[1.5px] border-ink bg-cream p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">
                    Connect Your Marketplace Storefront
                  </span>
                  <button
                    type="button"
                    onClick={() => setShopConnectPickerOpen(false)}
                    className="text-[11px] font-semibold text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Link your Shopee, Lazada, or Temu seller storefront with your merchant credentials to manage products and run self-audits:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Shopee', 'Lazada', 'Temu'] as const).map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      disabled={authLoading}
                      onClick={() => setShopPlatform(platform)}
                      className={`min-h-[38px] rounded-xl border-[1.5px] border-ink px-2.5 py-1.5 text-xs font-bold transition-colors ${
                        shopPlatform === platform
                          ? 'bg-forest text-white shadow-crisp'
                          : 'bg-white text-ink hover:bg-mint'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="shop-connect-name"
                    className="mb-1 block text-[11px] font-bold text-ink"
                  >
                    Shop / Storefront Name
                  </label>
                  <input
                    id="shop-connect-name"
                    type="text"
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    placeholder={`e.g., Manila Craft Official (${shopPlatform})`}
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shop-connect-url"
                    className="mb-1 block text-[11px] font-bold text-ink"
                  >
                    Storefront Link (URL)
                  </label>
                  <input
                    id="shop-connect-url"
                    type="url"
                    value={shopUrlInput}
                    onChange={(e) => setShopUrlInput(e.target.value)}
                    placeholder={
                      shopPlatform === 'Shopee'
                        ? 'https://shopee.ph/shop/your-store'
                        : shopPlatform === 'Lazada'
                        ? 'https://www.lazada.com.ph/shop/your-store'
                        : 'https://www.temu.com/mall.html'
                    }
                    className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="shop-connect-email"
                      className="mb-1 block text-[11px] font-bold text-ink"
                    >
                      Merchant Email
                    </label>
                    <input
                      id="shop-connect-email"
                      type="email"
                      value={shopEmailInput}
                      onChange={(e) => setShopEmailInput(e.target.value)}
                      placeholder="seller@yourshop.ph"
                      className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shop-connect-password"
                      className="mb-1 block text-[11px] font-bold text-ink"
                    >
                      Password
                    </label>
                    <input
                      id="shop-connect-password"
                      type="password"
                      value={shopPasswordInput}
                      onChange={(e) => setShopPasswordInput(e.target.value)}
                      placeholder="At least 6 characters"
                      className="min-h-[40px] w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => {
                    if (!shopEmailInput.trim().includes('@') || shopPasswordInput.length < 6) {
                      setErrorMessage(
                        'Please enter your merchant email and password (at least 6 characters) to connect your storefront.'
                      );
                      return;
                    }
                    setErrorMessage(null);
                    void connectShop({
                      platform: shopPlatform,
                      shopName: shopNameInput.trim() || undefined,
                      storeUrl: shopUrlInput.trim() || undefined,
                      email: shopEmailInput.trim(),
                      password: shopPasswordInput,
                    }).catch((err) => {
                      setErrorMessage(
                        err instanceof Error
                          ? err.message
                          : 'Unable to connect shop account.'
                      );
                    });
                  }}
                  className="btn-primary-gradient w-full py-2.5 text-xs"
                >
                  <CheckIcon size={14} />
                  <span>Connect {shopPlatform} Storefront &amp; Enter Seller Portal</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 border-t border-ink/15 pt-3.5 text-center text-[11px] text-ink-muted">
          <span>By continuing, you agree to BudolCheck&apos;s </span>
          <button
            type="button"
            onClick={() => navigateTo('terms')}
            className="font-semibold text-ink underline hover:text-forest"
          >
            Terms of Service
          </button>
          <span> and </span>
          <button
            type="button"
            onClick={() => navigateTo('privacy')}
            className="font-semibold text-ink underline hover:text-forest"
          >
            Privacy Policy
          </button>
          <span>.</span>
        </div>
      </div>
    </section>
  );
};

export default AuthView;
