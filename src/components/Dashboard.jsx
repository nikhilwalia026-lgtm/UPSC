import React from 'react';
import { Data } from '../lib/data';
import { motion } from 'framer-motion';

export default function Dashboard({ state, setView, navigateToBrowse }) {
  const today = Data.getTodayStr();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  
  let daysToExam = '--';
  if (state.settings.examDate) {
    const diff = new Date(state.settings.examDate) - new Date();
    daysToExam = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (daysToExam < 0) daysToExam = 0;
  }

  const dueCards = state.subTopics.filter(st => st.nextReview <= today && st.status !== 'new');
  const diffCards = state.subTopics.filter(st => st.status === 'difficult');
  const mastered = state.subTopics.filter(st => st.status === 'mastered');
  const newCards = state.subTopics.filter(st => st.status === 'new');
  
  let toReview = dueCards.length + diffCards.length + newCards.length;

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-display mb-3">Today is <span className="text-gradient">{dateStr}</span></h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
            <span className="text-muted">Streak:</span>
            <span className="text-primary font-bold">{state.streak.count} days</span>
            <span>🔥</span>
          </div>
        </div>
        <div className="glass-panel px-6 py-4 rounded-2xl text-left md:text-right flex gap-6 items-center">
          <div>
            <span className="block text-muted text-xs uppercase tracking-widest font-semibold mb-1">Countdown</span>
            <span className="block text-sm">Days to UPSC</span>
          </div>
          <h2 className="text-5xl font-display text-gradient leading-none">{daysToExam}</h2>
        </div>
      </div>

      {toReview > 0 ? (
        <div className="relative overflow-hidden glass-panel border-primary/30 p-10 rounded-3xl text-center mb-10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <h2 className="text-3xl text-white mb-4 font-display">Ready for today's session?</h2>
            <p className="text-muted mb-8 text-lg">You have <strong className="text-white text-xl mx-1">{toReview}</strong> cards scheduled for today.</p>
            <button className="btn btn-primary text-lg px-10 py-4 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.4)]" onClick={() => setView('review')}>
              Start Review Session
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel border-emerald-500/30 p-10 rounded-3xl text-center mb-10 bg-emerald-500/5">
          <h2 className="text-3xl text-emerald-400 mb-3 font-display">You're all caught up! 🎉</h2>
          <p className="text-muted text-lg">Excellent work. Come back tomorrow or add more content.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
        <div className="glass-panel p-6 rounded-2xl text-center cursor-pointer hover:-translate-y-1.5 hover:border-primary/50 transition-all duration-300 group" onClick={() => setView('review')}>
          <h3 className="text-4xl font-display text-primary mb-2 group-hover:scale-110 transition-transform">{toReview}</h3>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Due Today</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl text-center cursor-pointer hover:-translate-y-1.5 hover:border-rose-500/50 transition-all duration-300 group" onClick={() => navigateToBrowse('difficult')}>
          <h3 className="text-4xl font-display text-rose-400 mb-2 group-hover:scale-110 transition-transform">{diffCards.length}</h3>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Difficult</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl text-center cursor-pointer hover:-translate-y-1.5 hover:border-emerald-500/50 transition-all duration-300 group" onClick={() => navigateToBrowse('mastered')}>
          <h3 className="text-4xl font-display mb-2 group-hover:scale-110 transition-transform">{mastered.length}</h3>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Mastered</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl text-center cursor-pointer hover:-translate-y-1.5 hover:border-white/20 transition-all duration-300 group" onClick={() => navigateToBrowse('all')}>
          <h3 className="text-4xl font-display mb-2 group-hover:scale-110 transition-transform">{state.subTopics.length}</h3>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">Total Cards</p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
          <span className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-accent"></span>
          Subject Mastery
        </h3>
        <div className="space-y-6">
          {state.subjects.map(sub => {
            const subCards = state.subTopics.filter(st => st.subjectId === sub.id);
            if (subCards.length === 0) return null;
            const subMastered = subCards.filter(st => st.status === 'mastered').length;
            const pct = Math.round((subMastered / subCards.length) * 100);
            
            return (
              <div key={sub.id}>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span style={{color: sub.color}}>{sub.name}</span>
                  <span className="text-muted bg-white/5 px-2 py-0.5 rounded text-xs">{pct}% ({subMastered}/{subCards.length})</span>
                </div>
                <div className="h-2.5 bg-black/50 border border-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{width: 0}} animate={{width: `${pct}%`}} 
                    transition={{duration: 1, ease: "easeOut"}}
                    className="h-full rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: sub.color, color: sub.color}} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
