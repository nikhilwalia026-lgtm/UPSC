import React, { useState, useEffect } from 'react';
import { Data, SM2 } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from './ui/DatePicker';

export default function Review({ state, saveData, setView }) {
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [sessionMode, setSessionMode] = useState('sm2'); // 'sm2' or 'custom'
  const [menuTab, setMenuTab] = useState('due'); // 'due' or 'custom'
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [cramSubId, setCramSubId] = useState('');
  const [cramChapId, setCramChapId] = useState('');
  const [cramDate, setCramDate] = useState('');

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Global due cards logic
  const getDueCards = () => {
    const today = Data.getTodayStr();
    let q = [];
    q.push(...state.subTopics.filter(st => st.status === 'difficult'));
    q.push(...state.subTopics.filter(st => st.nextReview <= today && st.status !== 'new' && st.status !== 'difficult'));
    q.push(...state.subTopics.filter(st => st.status === 'new'));
    return [...new Map(q.map(item => [item.id, item])).values()];
  };

  const startSession = (subId) => {
    setSessionMode('sm2');
    setSelectedSubjectId(subId);
    let q = getDueCards();
    if (subId !== 'all') {
      q = q.filter(c => c.subjectId === subId);
    }
    setQueue(q);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setIsSessionStarted(true);
  };

  const startCustomSession = (chapId) => {
    const targetChapId = chapId || cramChapId;
    if (!targetChapId) return;
    const q = state.subTopics.filter(st => st.topicId === targetChapId);
    if (q.length === 0) {
      alert("No cards in this chapter!");
      return;
    }
    setSessionMode('custom');
    setQueue(q);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setIsSessionStarted(true);
  };

  const scheduleRevision = () => {
    if (!cramSubId || !cramChapId || !cramDate) return;
    const newRev = {
      id: Data.generateId(),
      subjectId: cramSubId,
      chapterId: cramChapId,
      date: cramDate
    };
    const currentSettings = state.settings || {};
    const scheduledRevisions = currentSettings.scheduledRevisions || [];
    const newSettings = { ...currentSettings, scheduledRevisions: [...scheduledRevisions, newRev] };
    saveData(null, null, null, newSettings, null, null);
    setCramDate('');
    alert("Chapter revision scheduled!");
  };

  const deleteScheduledRevision = (revId) => {
    const currentSettings = state.settings || {};
    const scheduledRevisions = (currentSettings.scheduledRevisions || []).filter(r => r.id !== revId);
    const newSettings = { ...currentSettings, scheduledRevisions };
    saveData(null, null, null, newSettings, null, null);
  };

  const nextCustomCard = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const rateCard = (rating) => {
    const card = queue[currentIndex];
    const updatedCard = SM2.schedule(card, rating);
    
    const newSubTopics = [...state.subTopics];
    const idx = newSubTopics.findIndex(st => st.id === card.id);
    if (idx > -1) newSubTopics[idx] = updatedCard;

    const today = Data.getTodayStr();
    const newHistory = { ...state.history, [today]: (state.history[today] || 0) + 1 };
    
    const newStreak = { ...state.streak };
    if (newStreak.lastDate !== today) {
       newStreak.count += 1;
       newStreak.lastDate = today;
    }

    saveData(null, null, newSubTopics, null, newStreak, newHistory);

    setIsFlipped(false);
    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    if (!isSessionStarted || isComplete || queue.length === 0) return;

    const handleKeyDown = (e) => {
      if (!isFlipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault(); setIsFlipped(true);
      } else if (isFlipped && sessionMode === 'sm2' && ['1','2','3','4'].includes(e.key)) {
        const keyMap = { '1': 1, '2': 3, '3': 4, '4': 5 };
        rateCard(keyMap[e.key]);
      } else if (isFlipped && sessionMode === 'custom' && (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowRight')) {
        nextCustomCard();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isSessionStarted, isComplete, queue, currentIndex, state.subTopics, sessionMode]);

  // View: Subject Selection
  if (!isSessionStarted) {
    const dueCards = getDueCards();
    const subjectCounts = {};
    dueCards.forEach(c => {
      subjectCounts[c.subjectId] = (subjectCounts[c.subjectId] || 0) + 1;
    });
    const activeSubjects = state.subjects.filter(s => subjectCounts[s.id] > 0);

    return (
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-4xl font-display mb-2">Review Content</h2>
            <p className="text-muted text-sm">Clear your queue or schedule specific chapters</p>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button onClick={() => setMenuTab('due')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${menuTab === 'due' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}>Spaced Repetition</button>
            <button onClick={() => setMenuTab('custom')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${menuTab === 'custom' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}>Cram & Schedule</button>
          </div>
        </div>

        {menuTab === 'due' && (
          dueCards.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/5 border-dashed mt-8">
              <span className="text-6xl mb-4 block">☕️</span>
              <h3 className="text-2xl font-display text-white mb-2">You're all caught up!</h3>
              <p className="text-muted">No cards due for review. Take a break or cram a chapter.</p>
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div 
                onClick={() => startSession('all')}
                className="glass-panel p-8 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all flex flex-col items-center justify-center text-center group border border-primary/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-2xl font-display text-white mb-3 z-10">All Subjects</h3>
                <span className="text-sm font-medium bg-primary/20 text-primary px-4 py-1.5 rounded-full z-10">{dueCards.length} cards due</span>
              </div>

              {activeSubjects.map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => startSession(sub.id)}
                  className="glass-panel p-8 rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col group relative overflow-hidden"
                  style={{borderColor: `${sub.color}40`}}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{backgroundColor: sub.color}}></div>
                  <div className="flex flex-col h-full z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-5 h-5 rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: sub.color, color: sub.color}}></div>
                      <h3 className="text-xl font-bold text-white">{sub.name}</h3>
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-xs text-muted uppercase tracking-wider font-semibold">Queue</span>
                      <span className="text-sm font-bold px-3 py-1 rounded-full bg-white/10 text-white shadow-sm" style={{color: sub.color}}>{subjectCounts[sub.id]} due</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )
        )}

        {menuTab === 'custom' && (
          <motion.div initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} className="space-y-8">
            <div className="glass-panel p-10 rounded-3xl max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-[80px]"></div>
              <h3 className="text-3xl font-display mb-4">Chapter Revision Mode</h3>
              <p className="text-muted text-sm mb-8 leading-relaxed">Study an entire chapter instantly, or schedule it for a future date. <strong className="text-white/80">This will not affect your spaced repetition algorithm.</strong></p>
              
              <div className="space-y-6 mb-10 relative z-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Subject</label>
                  <select className="input-field" value={cramSubId} onChange={e=>{setCramSubId(e.target.value); setCramChapId('');}}>
                    <option value="">-- Choose Subject --</option>
                    {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Chapter</label>
                  <select className="input-field" value={cramChapId} onChange={e=>setCramChapId(e.target.value)} disabled={!cramSubId}>
                    <option value="">-- Choose Chapter --</option>
                    {state.topics.filter(t => t.subjectId === cramSubId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="relative z-50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Schedule Date (Optional)</label>
                  <DatePicker selectedDate={cramDate} onSelectDate={setCramDate} placeholder="Select a future date..." />
                </div>
              </div>
              
              <div className="flex gap-4 relative z-10">
                <button 
                  className={`btn flex-1 py-4 text-lg flex items-center justify-center gap-2 ${(!cramSubId || !cramChapId) ? 'bg-white/5 text-white/30 cursor-not-allowed border-transparent' : 'btn-primary'}`}
                  disabled={!cramSubId || !cramChapId}
                  onClick={() => startCustomSession()}
                >
                  Start Now
                </button>
                <button 
                  className={`btn flex-1 py-4 text-lg flex items-center justify-center gap-2 ${(!cramSubId || !cramChapId || !cramDate) ? 'bg-white/5 text-white/30 cursor-not-allowed border-transparent' : 'btn-secondary'}`}
                  disabled={!cramSubId || !cramChapId || !cramDate}
                  onClick={scheduleRevision}
                >
                  Schedule for Later
                </button>
              </div>
            </div>

            {/* Scheduled Revisions List */}
            {state.settings?.scheduledRevisions?.length > 0 && (
              <div className="max-w-2xl mx-auto mt-8">
                <h4 className="text-xl font-display mb-4">Upcoming Scheduled Revisions</h4>
                <div className="space-y-4">
                  {state.settings.scheduledRevisions.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(rev => {
                    const sub = state.subjects.find(s => s.id === rev.subjectId);
                    const chap = state.topics.find(t => t.id === rev.chapterId);
                    const isDue = rev.date <= Data.getTodayStr();
                    if (!sub || !chap) return null;
                    
                    return (
                      <div key={rev.id} className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-white/20 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: sub.color}}></span>
                            <span className="text-sm font-medium text-white/80">{sub.name}</span>
                          </div>
                          <h5 className="font-bold text-white text-lg">{chap.name}</h5>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-sm font-medium px-3 py-1 rounded-lg ${isDue ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-muted'}`}>
                            {isDue ? 'Due Today!' : rev.date}
                          </div>
                          <button 
                            onClick={() => startCustomSession(chap.id)}
                            className="btn btn-primary px-4 py-2 text-sm"
                          >
                            Start
                          </button>
                          <button 
                            onClick={() => deleteScheduledRevision(rev.id)}
                            className="text-muted hover:text-rose-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // View: Session Complete
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center mt-20">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.5)]">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-5xl font-display text-white mb-4 tracking-tight">Session Complete!</h2>
        <p className="text-muted mb-10 text-xl max-w-md">You've successfully reviewed all cards in this queue.</p>
        <div className="flex gap-4">
          <button className="btn btn-secondary px-8 py-3 text-lg rounded-full" onClick={() => setIsSessionStarted(false)}>Review More</button>
          <button className="btn btn-primary px-8 py-3 text-lg rounded-full" onClick={() => setView('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // View: Review Card
  if (queue.length === 0) return null;

  const card = queue[currentIndex];
  const subject = state.subjects.find(s => s.id === card.subjectId) || {name: 'Unknown', color: '#fff'};
  const topic = state.topics.find(t => t.id === card.topicId) || {name: 'Unknown'};

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center py-6">
      <div className="w-full flex justify-between items-center text-muted mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white font-bold text-sm">
            {currentIndex + 1}
          </div>
          <span className="text-sm">of {queue.length} cards in queue</span>
        </div>
        <button onClick={() => setIsSessionStarted(false)} className="text-sm hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Quit Session</button>
      </div>
      
      <div className="w-full h-[450px] perspective-1000 mb-10 cursor-pointer group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <motion.div 
          className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className={`absolute w-full h-full backface-hidden glass-panel rounded-[2rem] p-10 flex flex-col transition-all duration-300 ${card.status === 'difficult' ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'group-hover:border-white/20 group-hover:shadow-2xl'}`}>
            <div className="flex gap-3 mb-auto items-center justify-between">
              <div className="flex gap-3">
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-medium" style={{borderLeft: `3px solid ${subject.color}`}}>{subject.name}</span>
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-muted font-medium">{topic.name}</span>
              </div>
              {sessionMode === 'custom' && <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-1 rounded">Cram Mode</span>}
            </div>
            <div className="text-center my-auto px-4">
              <h2 className="text-4xl md:text-5xl font-display leading-tight">{card.name}</h2>
            </div>
            <div className="text-center text-muted text-sm mt-auto flex items-center justify-center gap-2">
              <span className="animate-pulse">Tap or press Space to reveal</span>
            </div>
          </div>
          
          {/* Back */}
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-[2rem] p-10 flex flex-col ${card.status === 'difficult' ? 'border-rose-500/40' : ''}`}>
            <div className="flex gap-3 mb-6 items-center justify-between">
              <div className="flex gap-3">
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-medium" style={{borderLeft: `3px solid ${subject.color}`}}>{subject.name}</span>
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-muted font-medium">{topic.name}</span>
              </div>
              {sessionMode === 'custom' && <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-1 rounded">Cram Mode</span>}
            </div>
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <h3 className="text-2xl text-gradient font-display mb-6">{card.name}</h3>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed border-t border-white/10 pt-6 text-white/90">
                {card.notes || 'No extra notes provided.'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 30}}
            transition={{type: "spring", stiffness: 300, damping: 25}}
            className="w-full flex flex-col gap-5 glass-panel p-6 rounded-[2rem]"
          >
            {sessionMode === 'sm2' ? (
              <>
                <h4 className="text-center text-white/70 text-sm font-medium uppercase tracking-widest">Rate Your Recall</h4>
                <div className="flex flex-wrap md:flex-nowrap gap-3 justify-between">
                  {[
                    {key: '1', val: 1, label: 'Difficult', color: 'hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400', active: 'active:bg-rose-500/20'},
                    {key: '2', val: 3, label: 'Learning', color: 'hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400', active: 'active:bg-amber-500/20'},
                    {key: '3', val: 4, label: 'Review', color: 'hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-400', active: 'active:bg-teal-500/20'},
                    {key: '4', val: 5, label: 'Mastered', color: 'hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400', active: 'active:bg-emerald-500/20'}
                  ].map(btn => {
                    const nextInterval = SM2.schedule({ ...card }, btn.val).interval;
                    const intervalStr = nextInterval === 1 ? '< 1d' : `${nextInterval}d`;
                    return (
                    <button 
                      key={btn.val}
                      onClick={(e) => { e.stopPropagation(); rateCard(btn.val); }}
                      className={`flex-1 min-w-[20%] md:min-w-0 flex flex-col items-center p-4 bg-black/20 border border-white/5 rounded-xl transition-all duration-200 group ${btn.color} ${btn.active}`}
                    >
                      <span className="text-2xl font-display font-bold mb-1">{btn.key}</span>
                      <span className="text-[11px] uppercase tracking-wider text-muted group-hover:text-inherit transition-colors mb-1.5">{btn.label}</span>
                      <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{intervalStr}</span>
                    </button>
                  )})}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <p className="text-center text-accent text-sm font-medium">Custom Revision (No algorithm updates)</p>
                <button onClick={(e) => { e.stopPropagation(); nextCustomCard(); }} className="btn btn-primary w-full max-w-sm py-4 text-lg rounded-xl">
                  Next Card <span className="text-sm font-normal opacity-70 ml-2">(Space)</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
