import { motion } from 'motion/react';
import { Lightbulb, CloudRain, Moon, MapPin } from 'lucide-react';

export function SafetyTips() {
  const tips = [
    {
      icon: <CloudRain className="w-4 h-4 text-blue-400" />,
      text: "Wet roads detected. Increase following distance by 2x.",
      type: "Weather"
    },
    {
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      text: "Night driving active. Watch for pedestrians.",
      type: "Visibility"
    },
    {
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
      text: "Entering School Zone. Speed reduced to 20 KM/H.",
      type: "Zone"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Safety Recommendations</h3>
      </div>
      <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar snap-x snap-mandatory">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-[280px] sm:w-72 bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 flex items-start gap-3 snap-center shadow-xl"
          >
            <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              {tip.icon}
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{tip.type}</div>
              <p className="text-xs text-slate-200 leading-tight font-bold">{tip.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
