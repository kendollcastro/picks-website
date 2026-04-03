'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAgents, formatMessageAge } from '@/hooks/useAgents';
import type { AgentMessage } from '@/lib/agents';
import {
  Sparkles,
  TrendingUp,
  Target,
  Bell,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Bolt,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface AIAssistantProps {
  sport?: string;
  className?: string;
}

export function AIAssistant({ sport = 'nba', className }: AIAssistantProps) {
  const {
    messages,
    predictions,
    alerts,
    insights,
    loading,
    runAgents,
    dismissMessage,
  } = useAgents(sport);

  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'predictions' | 'alerts' | 'insights'>('all');

  const filteredMessages = filter === 'all' ? messages :
    filter === 'predictions' ? predictions :
    filter === 'alerts' ? alerts :
    insights;

  if (messages.length === 0 && !loading) {
    return (
      <div className={cn('glass-card rounded-2xl border p-5', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
              <Sparkles size={18} className="text-on-primary-container" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] font-bold">AI Assistant</h3>
              <p className="text-xs text-on-surface-variant">Powered by advanced ML models</p>
            </div>
          </div>
          <button
            onClick={runAgents}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-variant flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
        <div className="mt-6 p-6 rounded-xl bg-surface-container-high/50 border border-white/5 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lightbulb size={28} className="text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Unlock AI Insights</h4>
          <p className="text-sm text-on-surface-variant">
            Take some picks to unlock personalized AI analysis and predictions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card rounded-2xl border overflow-hidden', className)}>
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles size={18} className="text-on-primary-container" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] font-bold">AI Assistant</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {messages.length} insights
                </span>
                <span className="flex items-center gap-1 text-[10px] text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAgents}
              disabled={loading}
              className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center transition-colors"
              title="Refresh insights"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-variant flex items-center justify-center transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-2 p-4 border-b border-white/5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all' as const, label: 'All', count: messages.length, icon: null },
              { id: 'predictions' as const, label: 'Picks', count: predictions.length, icon: Target },
              { id: 'alerts' as const, label: 'Alerts', count: alerts.length, icon: Bell },
              { id: 'insights' as const, label: 'Insights', count: insights.length, icon: Lightbulb },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                  filter === f.id
                    ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                )}
              >
                {f.icon && <f.icon size={14} />}
                {f.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                  filter === f.id ? 'bg-on-primary-container/20' : 'bg-surface-container-highest'
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <Clock size={24} className="text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant">No {filter} at the moment.</p>
              </div>
            ) : (
              <div>
                {filteredMessages.map((message, i) => (
                  <AgentMessageCard
                    key={message.id}
                    message={message}
                    onDismiss={() => dismissMessage(message.id)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MESSAGE CARD
// ============================================
function AgentMessageCard({
  message,
  onDismiss,
  index,
}: {
  message: AgentMessage;
  onDismiss: () => void;
  index: number;
}) {
  const config: Record<string, { icon: React.ReactNode; bg: string; border: string; color: string }> = {
    prediction: { 
      icon: <Target size={16} />, 
      bg: 'bg-primary/5', 
      border: 'border-primary/10',
      color: 'text-primary'
    },
    analysis: { 
      icon: <TrendingUp size={16} />, 
      bg: 'bg-tertiary/5', 
      border: 'border-tertiary/10',
      color: 'text-tertiary'
    },
    recommendation: { 
      icon: <Bolt size={16} />, 
      bg: 'bg-kcm-gold/5', 
      border: 'border-kcm-gold/10',
      color: 'text-kcm-gold'
    },
    alert: { 
      icon: <Bell size={16} />, 
      bg: 'bg-error/5', 
      border: 'border-error/10',
      color: 'text-error'
    },
    insight: { 
      icon: <Lightbulb size={16} />, 
      bg: 'bg-secondary/5', 
      border: 'border-secondary/10',
      color: 'text-secondary'
    },
  };

  const { icon, bg, color } = config[message.type] || config.insight;

  return (
    <div 
      className={cn('p-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-b-0', bg)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg, color)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{message.title}</h4>
              <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider', bg, color)}>
                {message.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock size={10} />
                {formatMessageAge(message.timestamp)}
              </span>
              <button
                onClick={onDismiss}
                className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{message.content}</p>

          {/* Action Button */}
          {message.action && (
            <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary-container text-xs font-bold hover:bg-primary/90 transition-colors">
              {message.action.label}
              <ArrowRight size={12} />
            </button>
          )}

          {/* Confidence & Agent */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Confidence</span>
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      i < Math.round(message.confidence * 5) ? 'bg-tertiary' : 'bg-surface-container-highest'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-tertiary">
                {Math.round(message.confidence * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
              <div className="w-4 h-4 rounded bg-surface-container-high flex items-center justify-center">
                <Sparkles size={8} />
              </div>
              {message.agent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
