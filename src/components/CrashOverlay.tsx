import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CrashDetectionResult } from '../utils/crashDetection';

interface CrashOverlayProps {
  crashDetectionResult?: CrashDetectionResult | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CrashOverlay({ crashDetectionResult, onCancel, onConfirm }: CrashOverlayProps) {
  const AUTO_DISPATCH_DELAY_SECONDS = 100;
  const [countdown, setCountdown] = useState(AUTO_DISPATCH_DELAY_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/90 backdrop-blur-xl p-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/20"
        />
      </div>

      <div className="relative w-full max-w-md text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="mx-auto w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
        >
          <AlertTriangle className="w-12 h-12 text-white" />
        </motion.div>

        <h2 className="text-4xl font-bold text-white mb-4">CRASH DETECTED</h2>
        <p className="text-red-200 text-lg mb-6">
          Auto alert will be sent in {AUTO_DISPATCH_DELAY_SECONDS} seconds unless you cancel.
        </p>

        {/* Show crash detection details */}
        {crashDetectionResult && (
          <div className="mb-8 bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-red-200 uppercase tracking-widest">
                Detection Confidence
              </span>
              <span className="text-2xl font-black text-white">
                {crashDetectionResult.confidence}%
              </span>
            </div>
            <div className="text-xs text-red-300 mb-3">
              {crashDetectionResult.indicatorCount} of {crashDetectionResult.threshold} indicators triggered
            </div>
            <div className="space-y-2">
              {crashDetectionResult.triggeredIndicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-100">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-red-900/30"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={553}
              animate={{ strokeDashoffset: 553 - (553 * countdown) / 100 }}
              className="text-red-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-white leading-none">{countdown}</span>
            <span className="text-sm text-red-300 uppercase tracking-widest mt-1">Seconds</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-semibold text-xl transition-all flex items-center justify-center gap-3"
        >
          <X className="w-6 h-6" />
          I AM SAFE - CANCEL
        </button>
      </div>
    </motion.div>
  );
}
