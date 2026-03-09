import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface SOSButtonProps {
  onSOS: () => void;
}

export function SOSButton({ onSOS }: SOSButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsConfirming(true)}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] relative overflow-hidden group"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-red-400 rounded-full"
        />
        <AlertCircle className="w-6 h-6 md:w-7 h-7 text-white relative z-10" />
      </motion.button>
      <span className="mt-2 text-red-500 font-black tracking-[0.2em] text-[7px] md:text-[8px] uppercase">Emergency SOS</span>

      {isConfirming && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Confirm Emergency?</h3>
            <p className="text-slate-400 mb-8">This will immediately notify emergency services with your location.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onSOS();
                  setIsConfirming(false);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-colors"
              >
                YES, SEND SOS
              </button>
              <button
                onClick={() => setIsConfirming(false)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
