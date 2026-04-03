'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const sports = [
  { name: 'NBA', emoji: '🏀', color: 'from-orange-500 to-orange-600' },
  { name: 'NFL', emoji: '🏈', color: 'from-blue-500 to-blue-600' },
  { name: 'MLB', emoji: '⚾', color: 'from-red-500 to-red-600' },
  { name: 'Soccer', emoji: '⚽', color: 'from-green-500 to-green-600' },
  { name: 'UFC', emoji: '🥊', color: 'from-red-600 to-red-700' },
  { name: 'CFB', emoji: '🏟️', color: 'from-purple-500 to-purple-600' },
];

const features = [
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'AI Predictions',
    description: 'Machine learning models trained on 10+ years of data',
    gradient: 'from-primary/20 to-primary-container/20',
    iconColor: 'text-primary',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18M7 16l4-8 4 5 5-9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Real-time Analytics',
    description: 'Live data visualization with predictive modeling',
    gradient: 'from-tertiary/20 to-tertiary-container/20',
    iconColor: 'text-tertiary',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Community Insights',
    description: 'Learn from top 1% of professional analysts',
    gradient: 'from-secondary/20 to-secondary-container/20',
    iconColor: 'text-secondary',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Bankroll Tracking',
    description: 'Advanced ROI metrics and performance analytics',
    gradient: 'from-kcm-gold/20 to-kcm-orange/20',
    iconColor: 'text-kcm-gold',
  },
];

const recentWins = [
  { match: 'LAL vs GSW', pick: 'LAL +3.5', odds: '+105', result: 'WIN' },
  { match: 'KC vs BUF', pick: 'OVER 48.5', odds: '-110', result: 'WIN' },
  { match: 'BOS vs MIA', pick: 'BOS -6', odds: '+120', result: 'WIN' },
  { match: 'PHI vs NYG', pick: 'PHI ML', odds: '-150', result: 'WIN' },
  { match: 'MCY vs LIV', pick: 'BTTS YES', odds: '+155', result: 'WIN' },
  { match: 'DUKE vs UNC', pick: 'OVER 158', odds: '-105', result: 'WIN' },
];

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.015]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} 
      />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg shadow-lg shadow-primary/25">
                K
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-tertiary rounded-full border-2 border-surface" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent font-['Space_Grotesk']">
                KCM PICKS
              </span>
              <span className="text-[10px] text-on-surface-variant -mt-1">Elite Predictions</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/login" className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="pt-24 pb-28 relative z-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col justify-center px-6 overflow-hidden">
          {/* Floating Gradient Orbs */}
          <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-tertiary/5 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Hero Content */}
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <span className="font-label text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant">
                Live Analysis Active
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="font-label text-[11px] uppercase tracking-[0.2em] font-semibold text-tertiary">
                847 picks today
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-['Space_Grotesk'] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="text-on-surface">Track your</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                predictions.
              </span>
              <br />
              <span className="text-on-surface">Beat the</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-primary">
                odds.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Access elite data visualization for NBA, NFL, MLB, Soccer, UFC, and College sports. 
              Join <span className="text-primary font-semibold">10,000+</span> tactical analysts using our proprietary AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/register" className="group">
                <button className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-['Space_Grotesk'] font-bold py-4 px-10 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 active:scale-95 transition-all text-center relative overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Join the Elite
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </Link>
              <button className="w-full sm:w-auto bg-white/[0.03] backdrop-blur-xl border border-white/10 text-on-surface font-['Space_Grotesk'] font-bold py-4 px-10 rounded-2xl hover:bg-white/[0.06] hover:border-white/15 transition-all text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full"
          >
            {[
              { label: 'Success Rate', value: '82%', subtext: 'Last 30 Days', color: 'tertiary', icon: '📈' },
              { label: 'Community', value: '10k+', subtext: 'Active Users', color: 'primary', icon: '👥' },
              { label: 'Avg ROI', value: '+14.2%', subtext: 'Per pick', color: 'on-surface', icon: '💰' },
              { label: 'Live Coverage', value: '24/7', subtext: 'Global Sports', color: 'secondary', icon: '🌍' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/15 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className={`text-${stat.color} text-[10px] font-bold uppercase tracking-wider`}>
                      {stat.label}
                    </span>
                  </div>
                  <h3 className={`font-['Space_Grotesk'] text-3xl md:text-4xl font-black text-${stat.color} mb-1`}>
                    {stat.value}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant/60">{stat.subtext}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Live Wins Ticker */}
        <section className="relative w-full py-6 border-y border-white/5 bg-surface-container-low/50">
          <div className="ticker-wrap flex">
            <div className="ticker-move flex gap-12 items-center">
              {[...recentWins, ...recentWins].map((win, i) => (
                <div key={i} className="flex items-center gap-4 shrink-0">
                  <span className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface-variant text-sm">{win.match}</span>
                    <span className="text-on-surface-variant/50">|</span>
                    <span className="font-medium text-on-surface text-sm">{win.pick}</span>
                    <span className="text-on-surface-variant/50">@</span>
                    <span className="text-on-surface-variant text-sm">{win.odds}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold">
                    {win.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              Premium Features
            </span>
            <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl font-black mb-4">
              The Pro Edge
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Everything you need to analyze, predict, and win
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl p-6 group hover:border-white/15 transition-all duration-300 bg-gradient-to-br ${feature.gradient}`}
              >
                <div className={`${feature.iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Featured Cards */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Large Featured Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-tertiary/10" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Data Visualization
                </span>
                <h3 className="text-3xl md:text-4xl font-['Space_Grotesk'] font-black mb-4 max-w-md">
                  Real-time Heat Maps & Shot Charts
                </h3>
                <p className="text-on-surface-variant max-w-lg mb-8 leading-relaxed">
                  Visualize player performance, team dynamics, and game flow with our proprietary analytics dashboard. 
                  Updated in real-time during live games.
                </p>
                <Link href="/register">
                  <button className="inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all group/btn">
                    Explore Analytics
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
              </div>
              {/* Decorative Elements */}
              <div className="absolute right-8 top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute right-16 bottom-8 w-24 h-24 bg-tertiary/10 rounded-full blur-xl" />
            </motion.div>

            {/* Win Probability Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-3xl p-8 relative overflow-hidden group border-tertiary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-tertiary/10 to-transparent" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-['Space_Grotesk'] font-bold mb-3">
                  Win Probability Engine
                </h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  AI simulates games 10,000 times to find the most profitable discrepancies.
                </p>
                <div className="p-4 rounded-xl bg-surface-container-high/50 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-on-surface-variant">NFL Model v4.2</span>
                    <span className="text-xs font-bold text-tertiary">ACTIVE</span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-tertiary to-tertiary/50 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sports Grid */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-black mb-4">
              Covered Sports
            </h2>
            <p className="text-on-surface-variant">
              Real-time data from the world&apos;s biggest leagues
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sports.map((sport, i) => (
              <motion.div
                key={sport.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 text-center group cursor-pointer hover:border-white/15 transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${sport.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {sport.emoji}
                </div>
                <span className="font-semibold text-sm">{sport.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative py-20 px-8 md:px-16 rounded-3xl overflow-hidden text-center"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface-container to-tertiary/20" />
            <div className="absolute inset-0 backdrop-blur-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
                  Ready to Win?
                </h2>
                <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
                  Stop guessing. Start winning. Join thousands of analysts today and secure your edge.
                </p>
                <Link href="/register" className="inline-block">
                  <button className="bg-gradient-to-r from-tertiary to-tertiary/80 text-on-tertiary font-['Space_Grotesk'] font-bold py-5 px-14 rounded-2xl text-lg hover:shadow-2xl hover:shadow-tertiary/30 active:scale-95 transition-all">
                    Create Free Account
                  </button>
                </Link>
                <p className="text-on-surface-variant/60 text-sm mt-4">
                  No credit card required • Free tier available
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-t border-white/5">
        <div className="flex justify-around items-center px-2 pb-5 pt-3 max-w-lg mx-auto">
          {[
            { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', active: false },
            { href: '/picks', icon: 'sports', label: 'Picks', active: false },
            { href: '/live', icon: 'live', label: 'Live', active: false },
            { href: '/stats', icon: 'stats', label: 'Stats', active: false },
            { href: '/profile', icon: 'profile', label: 'Profile', active: false },
          ].map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all duration-200 ${
                item.active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              {item.icon === 'dashboard' && (
                <svg className="w-6 h-6" fill={item.active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.active ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                </svg>
              )}
              {item.icon === 'sports' && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.active ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              {item.icon === 'live' && (
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.active ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                  {item.active && <span className="absolute -top-1 -right-1 w-2 h-2 bg-tertiary rounded-full" />}
                </div>
              )}
              {item.icon === 'stats' && (
                <svg className="w-6 h-6" fill={item.active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.active ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {item.icon === 'profile' && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={item.active ? 0 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span className="font-medium text-[11px] mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
