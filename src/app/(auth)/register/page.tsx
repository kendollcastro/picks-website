'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen">
      {/* Auth Background with Watermark */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container/10 via-surface/80 to-surface" />
        <div className="text-[20rem] font-['Space_Grotesk'] font-black italic tracking-tighter text-white/[0.02] select-none transform -rotate-12">
          KCM
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-8">
        {/* Header / Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-['Space_Grotesk'] text-3xl font-black italic tracking-tighter text-blue-500">
            KCM PICKS
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 font-medium tracking-wide uppercase">Elite Sports Analytics</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card w-full max-w-md p-8 rounded-xl border border-white/5 shadow-2xl shadow-black/50">
          <div className="flex flex-col space-y-8">
            {/* Title */}
            <div className="space-y-1">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-on-primary-container">Create Account</h2>
              <p className="text-on-surface-variant text-sm">Join the arena and start winning.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleEmailRegister}>
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="username">Username</label>
                <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 transition-all duration-300">
                  <User size={18} className="text-on-surface-variant mr-3" />
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/50 text-sm"
                    id="username"
                    placeholder="sharpplayer"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="email">Email</label>
                <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 transition-all duration-300">
                  <Mail size={18} className="text-on-surface-variant mr-3" />
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/50 text-sm"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="password">Password</label>
                <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 transition-all duration-300">
                  <Lock size={18} className="text-on-surface-variant mr-3" />
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/50 text-sm"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-glow flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3.5 transition-all duration-300">
                  <Lock size={18} className="text-on-surface-variant mr-3" />
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/50 text-sm"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-outline-variant/30 bg-surface-container-lowest text-primary-container focus:ring-primary/50"
                  required
                />
                <span className="text-xs text-on-surface-variant">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:text-primary-container">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary-container">Privacy Policy</Link>
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="glow-button w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-['Space_Grotesk'] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95 mt-4"
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/5" />
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-outline">Or connect with</span>
              <div className="flex-grow border-t border-white/5" />
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="flex items-center justify-center p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-300 group"
              >
                <svg className="w-5 h-5 opacity-80 group-hover:opacity-100" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
              <button className="flex items-center justify-center p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-300 group">
                <svg className="w-5 h-5 fill-on-surface opacity-80 group-hover:opacity-100" viewBox="0 0 384 512">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
              </button>
              <button className="flex items-center justify-center p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-300 group">
                <svg className="w-5 h-5 fill-[#5865F2] opacity-80 group-hover:opacity-100" viewBox="0 0 640 512">
                  <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.819,1.819,0,0,0-1.017-2.526,322.249,322.249,0,0,1-44.592-21.23,1.892,1.892,0,0,1-.176-3.127c3.084-2.311,6.166-4.706,9.056-7.14a1.823,1.823,0,0,1,1.9-.262c94.6,43.276,197.155,43.276,290.41,0a1.825,1.825,0,0,1,1.914.256c2.89,2.434,5.972,4.829,9.056,7.14a1.894,1.894,0,0,1-.17,3.127,312.773,312.773,0,0,1-44.592,21.23,1.828,1.828,0,0,0-1.017,2.526,355.915,355.915,0,0,0,30.034,48.842,1.883,1.883,0,0,0,2.063.676A486.555,486.555,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.844,59.239C275.335,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-10 text-center">
          <p className="text-on-surface-variant text-sm font-medium">
            Already have an account?
            <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="/login">Sign in</Link>
          </p>
        </div>
      </main>

      {/* Visual Accents */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-tertiary to-purple-600 opacity-30 z-50" />
      <div className="fixed bottom-0 left-0 w-full h-[265px] bg-gradient-t from-primary-container/5 to-transparent pointer-events-none" />
    </div>
  );
}
