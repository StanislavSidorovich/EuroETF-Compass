import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-label="Regulatory and Educational Disclaimer"
      className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-950/45 via-slate-900/90 to-slate-900/95 px-4 py-3 text-xs text-amber-100/90 shadow-lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="leading-relaxed">
            <span className="font-semibold text-amber-300">
              Important Regulatory &amp; Educational Notice:
            </span>{' '}
            Past performance and historical investment ratings (3Y / 5Y backtests) are{' '}
            <span className="font-semibold text-white underline decoration-amber-400/60 underline-offset-2">
              not promised or reliable indicators of future results
            </span>
            . Future projections are mathematical models for educational illustration only, and
            European country tax summaries do not constitute personalized financial, legal, or tax
            advice.
          </p>
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20 sm:self-center"
          >
            {expanded ? (
              <>
                Hide Legal Notes <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Methodology &amp; Tax Notes <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {expanded && !compact && (
        <div className="mt-3 grid gap-2.5 border-t border-amber-500/20 pt-3 text-[11px] leading-relaxed text-slate-300 md:grid-cols-3">
          <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-slate-100">Market Risk &amp; Drawdowns</p>
              <p className="mt-0.5 text-slate-400">
                UCITS equity ETFs fluctuate daily and can experience 20%–45% temporary drawdowns.
                Capital invested is at risk and returns may be lower than modeled scenarios.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-slate-100">Live Market Feed &amp; Currency</p>
              <p className="mt-0.5 text-slate-400">
                Live prices use delayed/real-time Yahoo Finance European exchange feeds (fallback to
                verified 5Y baseline snapshots when offline). Always verify KIDs &amp; ISINs on
                justETF before trading.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-slate-100">Tax Residency &amp; Legislation</p>
              <p className="mt-0.5 text-slate-400">
                Tax laws (e.g., Portugal Lei n.º 31/2024, Netherlands Box 3, Germany
                Vorabpauschale, Austria Meldefonds) evolve regularly. Consult a licensed local
                tax advisor for official filings.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
