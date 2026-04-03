'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, Zap, Trophy, TrendingUp, Users, Star, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const features = [
    { icon: Zap, label: 'AI-Powered Picks', desc: 'Advanced algorithms analyze thousands of data points' },
    { icon: Trophy, label: 'Track Performance', desc: 'Monitor your wins, losses, and ROI in real-time' },
    { icon: TrendingUp, label: 'Live Scores', desc: 'Real-time updates for all major sports' },
    { icon: Users, label: 'Community Insights', desc: 'See what other bettors are picking' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-primary/10 via-surface/50 to-surface" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="text-[25rem] font-['Space_Grotesk'] font-black italic tracking-tighter text-white/[0.015] select-none transform -rotate-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          KCM
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-tertiary z-50" />

      <main className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center p-6 sm:p-8 gap-12">
        <div className={`hidden lg:flex flex-col justify-center w-full max-w-lg space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-2xl shadow-primary/30">
                <span className="text-3xl font-black italic text-on-primary-container">K</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-tertiary rounded-full border-4 border-surface animate-pulse" />
            </div>
            <div>
              <h1 className="font-['Space_Grotesk'] text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                KCM PICKS
              </h1>
              <p className="text-on-surface-variant text-sm font-medium tracking-wide">Elite Sports Analytics</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold leading-tight">
              Dominate the sports betting arena with{' '}
              <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">AI-powered</span>{' '}
              predictions
            </h2>
            <p className="text-on-surface-variant text-lg">
              Join thousands of smart bettors who trust our advanced algorithms to make smarter picks.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <p className="text-3xl font-black font-['Space_Grotesk'] text-tertiary">82%</p>
              <p className="text-xs text-on-surface-variant">Win Rate</p>
            </div>
            <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <p className="text-3xl font-black font-['Space_Grotesk'] text-primary">$2.4M</p>
              <p className="text-xs text-on-surface-variant">Payouts</p>
            </div>
            <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <p className="text-3xl font-black font-['Space_Grotesk'] text-secondary">15K+</p>
              <p className="text-xs text-on-surface-variant">Users</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low/30 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{feature.label}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-tertiary/10 border border-white/5">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-surface flex items-center justify-center text-xs font-bold">JD</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 border-2 border-surface flex items-center justify-center text-xs font-bold">MK</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border-2 border-surface flex items-center justify-center text-xs font-bold">AS</div>
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-tertiary fill-current" />)}
              </div>
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">&quot;Game changer for my betting.&quot;</span> - Verified user
              </p>
            </div>
          </div>
        </div>

        <div className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/30">
            <div className="flex flex-col space-y-6">
              <div className="lg:hidden text-center mb-4">
                <div className="inline-flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                      <span className="text-2xl font-black italic text-on-primary-container">K</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-tertiary rounded-full border-2 border-surface animate-pulse" />
                  </div>
                  <div>
                    <h1 className="font-['Space_Grotesk'] text-2xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                      KCM PICKS
                    </h1>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-center lg:text-left">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight flex items-center gap-2 justify-center lg:justify-start">
                  <Sparkles size={22} className="text-tertiary" />
                  Welcome Back
                </h2>
                <p className="text-on-surface-variant text-sm">Sign in to access your picks and stats.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="email">Email</label>
                  <div className="flex items-center bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3.5 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
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

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="password">Password</label>
                    <Link className="text-xs font-medium text-primary hover:text-primary-container transition-colors" href="/forgot-password">Forgot?</Link>
                  </div>
                  <div className="flex items-center bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3.5 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                    <Lock size={18} className="text-on-surface-variant mr-3" />
                    <input
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/50 text-sm"
                      id="password"
                      placeholder="Enter your password"
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="glow-button w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-['Space_Grotesk'] font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-on-surface-variant text-sm font-medium">
                  New to KCM Picks?
                  <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="/register">Create an account</Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-outline font-medium tracking-tighter uppercase opacity-50 max-w-xs mx-auto">
                  By signing in, you agree to our Terms of Service. 21+ Only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
}
