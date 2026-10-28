import React from 'react';
import { getRiskLevel } from '../../lib/utils';
import { LayerCallVerdict } from '../../types/ipqs';

interface ScoreGaugeProps {
  score: number;
  verdict?: LayerCallVerdict;
  size?: 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  verdict,
  size = 'lg',
  showLabel = true,
}) => {
  const risk = getRiskLevel(score, verdict);

  // Generous sizing for spacious feel
  const radius = size === 'xl' ? 70 : size === 'lg' ? 56 : 42;
  const strokeWidth = size === 'xl' ? 10 : size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const boxSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          width={boxSize}
          height={boxSize}
          viewBox={`0 0 ${boxSize} ${boxSize}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={boxSize / 2}
            cy={boxSize / 2}
            r={radius}
            className="stroke-slate-200 dark:stroke-white/[0.08] transition-colors"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={boxSize / 2}
            cy={boxSize / 2}
            r={radius}
            className={`transition-all duration-1000 ease-out ${
              risk.verdict === 'allow'
                ? 'stroke-emerald-500 dark:stroke-emerald-400'
                : risk.verdict === 'review'
                ? 'stroke-amber-500 dark:stroke-amber-400'
                : 'stroke-rose-500'
            }`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-mono font-bold tabular-nums tracking-tight ${
              size === 'xl'
                ? 'text-4xl'
                : size === 'lg'
                ? 'text-3xl'
                : 'text-2xl'
            } ${risk.textColor}`}
          >
            {score}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-4 text-center space-y-1.5">
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border font-mono ${risk.badgeBg}`}
            >
              {risk.verdictLabel}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{risk.label}</p>
        </div>
      )}
    </div>
  );
};
