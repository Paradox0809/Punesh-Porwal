import React from 'react';
import { MetricStatus } from '../types';
import { Flame, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface MetricDisplayProps {
  label: string;
  value: string | number;
  status: MetricStatus;
  description?: string;
  className?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({ label, value, status, description, className }) => {
  const getStatusConfig = (status: MetricStatus) => {
    switch (status) {
      case MetricStatus.EXCEPTIONAL:
        return { emoji: "🔥", color: "text-terminal-accent", icon: <Flame className="w-4 h-4" /> };
      case MetricStatus.GOOD:
        return { emoji: "✅", color: "text-terminal-green", icon: <CheckCircle2 className="w-4 h-4" /> };
      case MetricStatus.MODERATE:
        return { emoji: "🟡", color: "text-yellow-400", icon: <AlertCircle className="w-4 h-4" /> };
      case MetricStatus.WEAK:
        return { emoji: "🟠", color: "text-orange-500", icon: <AlertTriangle className="w-4 h-4" /> };
      case MetricStatus.RED_FLAG:
        return { emoji: "🔴", color: "text-terminal-red", icon: <XCircle className="w-4 h-4" /> };
      default:
        return { emoji: "⚪", color: "text-terminal-dim", icon: null };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-terminal-dim">
        <span>{label}</span>
        <span className={config.color}>{config.emoji}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold">{value}</span>
      </div>
      {description && <p className="text-[10px] text-terminal-dim leading-tight">{description}</p>}
    </div>
  );
};
