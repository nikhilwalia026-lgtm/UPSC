import React from 'react';
import { motion } from 'framer-motion';

export default function Stats({ state }) {
  const { subjects, topics, subTopics, history } = state;
  
  // Heatmap
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Status Colors
  const sColors = { new: '#3b82f6', learning: '#f59e0b', review: '#14b8a6', mastered: '#10b981', difficult: '#f43f5e' };

  const getStatusCounts = (cards) => {
    const counts = { new:0, learning:0, review:0, mastered:0, difficult:0 };
    cards.forEach(c => counts[c.status]++);
    return counts;
  };

  const globalCounts = getStatusCounts(subTopics);
  const maxS = Math.max(...Object.values(globalCounts), 1);

  const StackedBar = ({ counts, total }) => {
    if (total === 0) return <div className="h-1.5 w-full bg-white/5 rounded-full" />;
    const getPct = (val) => Math.round((val/total)*100);
    return (
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
        <div style={{width: `${(counts.difficult/total)*100}%`}} className="bg-rose-500 transition-all duration-500" title={`Difficult: ${counts.difficult} (${getPct(counts.difficult)}%)`} />
        <div style={{width: `${(counts.new/total)*100}%`}} className="bg-blue-500 transition-all duration-500" title={`New: ${counts.new} (${getPct(counts.new)}%)`} />
        <div style={{width: `${(counts.learning/total)*100}%`}} className="bg-amber-500 transition-all duration-500" title={`Learning: ${counts.learning} (${getPct(counts.learning)}%)`} />
        <div style={{width: `${(counts.review/total)*100}%`}} className="bg-teal-500 transition-all duration-500" title={`Review: ${counts.review} (${getPct(counts.review)}%)`} />
        <div style={{width: `${(counts.mastered/total)*100}%`}} className="bg-emerald-500 transition-all duration-500" title={`Mastered: ${counts.mastered} (${getPct(counts.mastered)}%)`} />
      </div>
    );
  };

  const StatsBreakdown = ({ counts, total }) => {
    if (total === 0) return null;
    const getPct = (val) => Math.round((val/total)*100);
    return (
      <div className="flex gap-2.5 text-[9px] mt-2.5 flex-wrap font-bold uppercase tracking-wider">
        {counts.difficult > 0 && <span className="text-rose-400">{getPct(counts.difficult)}% Diff</span>}
        {counts.new > 0 && <span className="text-blue-400">{getPct(counts.new)}% New</span>}
        {counts.learning > 0 && <span className="text-amber-400">{getPct(counts.learning)}% Learn</span>}
        {counts.review > 0 && <span className="text-teal-400">{getPct(counts.review)}% Review</span>}
        {counts.mastered > 0 && <span className="text-emerald-400">{getPct(counts.mastered)}% Mastered</span>}
      </div>
    );
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-4xl font-display mb-2">Statistics & Insights</h2>
        <p className="text-muted text-sm">Visualize your study progress and pain points</p>
      </div>
      
      {/* Heatmap */}
      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
          <span className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-accent"></span>
          Review Activity (Last 90 Days)
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {days.map(day => {
            const count = history[day] || 0;
            let bg = 'bg-white/5 border border-white/5';
            if(count > 0) bg = 'bg-primary/30 border border-primary/20';
            if(count > 10) bg = 'bg-primary/60 border border-primary/40';
            if(count > 30) bg = 'bg-primary border border-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]';
            if(count > 50) bg = 'bg-accent border border-accent shadow-[0_0_15px_rgba(139,92,246,0.6)]';
            return <div key={day} className={`w-3.5 h-3.5 rounded-sm transition-colors ${bg}`} title={`${day}: ${count} reviews`} />
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted justify-end">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5"></div>
            <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
            <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
            <div className="w-3 h-3 rounded-sm bg-primary"></div>
            <div className="w-3 h-3 rounded-sm bg-accent"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Global Status */}
        <div className="glass-panel p-8 rounded-3xl md:col-span-1">
          <h3 className="text-xl font-display mb-6 text-white">Global Status</h3>
          <div className="space-y-5">
            {Object.keys(globalCounts).map(k => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1.5 uppercase tracking-wider font-semibold">
                  <span className="text-muted">{k}</span>
                  <span className="text-white">{globalCounts[k]}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{width:0}} animate={{width:`${(globalCounts[k]/maxS)*100}%`}} 
                    className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]" style={{backgroundColor: sColors[k], color: sColors[k]}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="glass-panel p-8 rounded-3xl md:col-span-2 flex flex-col max-h-[600px]">
          <h3 className="text-xl font-display mb-2 text-white">Detailed Subject & Chapter Breakdown</h3>
          <p className="text-xs text-muted mb-6 flex gap-3">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Difficult</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> New</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Learning</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Review</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Mastered</span>
          </p>

          <div className="overflow-y-auto pr-4 custom-scrollbar flex-1 space-y-6">
            {subjects.map(sub => {
              const subCards = subTopics.filter(st => st.subjectId === sub.id);
              if (subCards.length === 0) return null;
              
              const subCounts = getStatusCounts(subCards);
              const subChaps = topics.filter(t => t.subjectId === sub.id);

              return (
                <div key={sub.id} className="bg-black/30 p-5 rounded-2xl border border-white/5">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-lg" style={{color: sub.color}}>{sub.name}</h4>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-white/80 text-xs font-medium">{subCards.length} cards</span>
                    </div>
                    <StackedBar counts={subCounts} total={subCards.length} />
                    <StatsBreakdown counts={subCounts} total={subCards.length} />
                  </div>
                  
                  <div className="space-y-3 pl-4 border-l-2 border-white/5">
                    {subChaps.map(chap => {
                      const chapCards = subCards.filter(c => c.topicId === chap.id);
                      if(chapCards.length === 0) return null;
                      const chapCounts = getStatusCounts(chapCards);
                      return (
                        <div key={chap.id} className="bg-white/5 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-white/80 font-medium truncate pr-2">{chap.name}</span>
                            <span className="text-muted whitespace-nowrap text-[10px] bg-black/20 px-1.5 py-0.5 rounded">{chapCards.length} cards</span>
                          </div>
                          <StackedBar counts={chapCounts} total={chapCards.length} />
                          <StatsBreakdown counts={chapCounts} total={chapCards.length} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
