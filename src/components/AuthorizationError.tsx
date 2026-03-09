import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthorizationErrorProps {
  message: string;
  onBack?: () => void;
}

export function AuthorizationError({ message, onBack }: AuthorizationErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex items-center justify-center p-6 bg-slate-950"
    >
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-[32px] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-3">
            Access Denied
          </h2>
          
          <p className="text-slate-400 text-sm font-medium mb-8 max-w-sm">
            {message}
          </p>
          
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
