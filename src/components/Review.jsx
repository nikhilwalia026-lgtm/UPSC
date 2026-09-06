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
  const [forgottenText, setForgottenText] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [autoStartTimer, setAutoStartTimer] = useState(state.settings?.autoStartTimer ?? false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAutoStartToggle = (val) => {
    setAutoStartTimer(val);
    const currentSettings = state.settings || {};
    const newSettings = { ...currentSettings, autoStartTimer: val };
    saveData(null, null, null, newSettings, null, null);
  };

  useEffect(() => {
    if (state.settings?.autoStartTimer !== undefined) {
      setAutoStartTimer(state.settings.autoStartTimer);
    }
  }, [state.settings]);

  useEffect(() => {
    let timer;
    if (isSessionStarted && !isComplete && queue.length > 0 && isTimerRunning) {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionStarted, isComplete, queue.length, currentIndex, isTimerRunning]);

  useEffect(() => {
    setForgottenText('');
    setTimeSpent(0);
    setIsTimerRunning(autoStartTimer);
    if (queue[currentIndex]) {
      setConfidence(queue[currentIndex].confidence || 50);
    } else {
      setConfidence(50);
    }
  }, [currentIndex, queue, autoStartTimer]);

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

  const startCreationTimeframeSession = (tf) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const q = state.subTopics.filter(st => {
      const cardDate = new Date(st.createdAt || Data.getTodayStr());
      const diffMs = Math.max(0, today - cardDate);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (tf === 'today') return diffDays <= 1;
      if (tf === '7days') return diffDays <= 7;
      if (tf === '30days') return diffDays <= 30;
      if (tf === '60days') return diffDays <= 60;
      return true;
    });

    if (q.length === 0) {
      alert("No cards found created in this timeframe!");
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
    setForgottenText('');
    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const rateCard = (rating) => {
    const card = queue[currentIndex];
    const updatedCard = SM2.schedule(card, rating);
    const todayStr = Data.getTodayStr();
    
    updatedCard.confidence = parseInt(confidence, 10);
    updatedCard.confidenceHistory = [
      ...(updatedCard.confidenceHistory || []),
      { date: todayStr, confidence: parseInt(confidence, 10) }
    ];
    updatedCard.timeSpentHistory = [
      ...(updatedCard.timeSpentHistory || []),
      { date: todayStr, time: timeSpent }
    ];
    
    let newSubTopics = [...state.subTopics];
    
    if (forgottenText.trim()) {
      updatedCard.reviewHistory = [
        ...(updatedCard.reviewHistory || []),
        { date: todayStr, text: forgottenText.trim() }
      ];

      // Create a new card for each line in the forgotten text
      const forgottenLines = forgottenText.split('\n').map(line => line.trim()).filter(line => line);
      forgottenLines.forEach(line => {
        const newCard = {
          id: Data.generateId(),
          subjectId: card.subjectId,
          topicId: card.topicId,
          name: line,
          notes: `Created from forgotten topics on ${todayStr} during review of "${card.name}"`,
          interval: 1, repetitions: 0, easeFactor: 2.5,
          nextReview: todayStr,
          lastReview: null, lastRating: null, status: 'new',
          createdAt: todayStr
        };
        newSubTopics.push(newCard);
      });
    }
    
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
    setForgottenText('');
    
    // Remove the rated card from the session queue
    const newQueue = queue.filter((_, i) => i !== currentIndex);
    setQueue(newQueue);
    
    if (newQueue.length === 0) {
      setIsComplete(true);
    } else if (currentIndex >= newQueue.length) {
      setCurrentIndex(0);
    }
  };

  useEffect(() => {
    if (!isSessionStarted || isComplete || queue.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsTimerRunning(prev => !prev);
      } else if (!isFlipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault(); setIsFlipped(true);
      } else if (isFlipped && sessionMode === 'sm2' && ['1','2','3','4'].includes(e.key)) {
        const keyMap = { '1': 1, '2': 3, '3': 4, '4': 5 };
        rateCard(keyMap[e.key]);
      } else if (isFlipped && sessionMode === 'custom' && (e.code === 'Space' || e.code === 'Enter')) {
        nextCustomCard();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(prev + 1, queue.length - 1));
        setIsFlipped(false);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
        setIsFlipped(false);
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

            {/* Creation Timeframe Review Box */}
            <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto relative overflow-hidden border border-white/10">
              <h3 className="text-2xl font-display mb-2 flex items-center gap-2">
                <span>📅</span> Review by Creation Timeframe
              </h3>
              <p className="text-muted text-sm mb-6 leading-relaxed">Instantly review all flashcards you created over a specific recent timeframe.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'today', title: 'Created Today', icon: '⚡', color: 'from-amber-500/20 to-orange-500/20 text-amber-300' },
                  { id: '7days', title: 'Last 7 Days', icon: '🗓️', color: 'from-primary/20 to-indigo-500/20 text-primary-light' },
                  { id: '30days', title: 'Last 30 Days', icon: '📆', color: 'from-violet-500/20 to-purple-500/20 text-violet-300' },
                  { id: '60days', title: 'Last 60 Days', icon: '⏳', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300' },
                ].map(item => {
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  const count = state.subTopics.filter(st => {
                    const cardDate = new Date(st.createdAt || Data.getTodayStr());
                    const diffMs = Math.max(0, today - cardDate);
                    const diffDays = diffMs / (1000 * 60 * 60 * 24);
                    if (item.id === 'today') return diffDays <= 1;
                    if (item.id === '7days') return diffDays <= 7;
                    if (item.id === '30days') return diffDays <= 30;
                    if (item.id === '60days') return diffDays <= 60;
                    return true;
                  }).length;

                  return (
                    <button
                      key={item.id}
                      onClick={() => startCreationTimeframeSession(item.id)}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-white/10 hover:border-white/30 hover:scale-105 transition-all text-left flex flex-col justify-between group cursor-pointer`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                      <div>
                        <h4 className="font-bold text-white text-sm leading-tight mb-1">{item.title}</h4>
                        <span className="text-xs text-white/60 font-medium">{count} card{count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  );
                })}
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

  const toggleRecallType = (e, cardId) => {
    if (e) e.stopPropagation();
    const cardToUpdate = state.subTopics.find(st => st.id === cardId);
    if (!cardToUpdate) return;
    const currentType = cardToUpdate.recallType || 'recall';
    const newType = currentType === 'understanding' ? 'recall' : 'understanding';
    const newSubTopics = state.subTopics.map(st => 
      st.id === cardId ? { ...st, recallType: newType } : st
    );
    setQueue(prevQueue => prevQueue.map(c => c.id === cardId ? { ...c, recallType: newType } : c));
    saveData(null, null, newSubTopics, null, null, null);
  };

  const renderRecallTypeButton = (card) => {
    const isUnderstanding = card.recallType === 'understanding';
    return (
      <button
        type="button"
        onClick={(e) => toggleRecallType(e, card.id)}
        className={`text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 shadow-md cursor-pointer select-none border ${
          isUnderstanding
            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
            : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
        }`}
        title={isUnderstanding ? "Mode: Needs Understanding — Click to toggle to Active Recall" : "Mode: Active Recall — Click to toggle to Needs Understanding"}
      >
        {isUnderstanding ? (
          <>
            <span>🧠</span>
            <span className="font-semibold">Needs Understanding</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span className="font-semibold">Active Recall</span>
          </>
        )}
      </button>
    );
  };

  const renderTimerButton = () => (
    <button 
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsTimerRunning(prev => !prev);
      }}
      className={`text-xs font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer select-none border ${
        isTimerRunning
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
          : timeSpent > 0
          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
          : 'bg-primary/20 border-primary/40 text-primary-light hover:bg-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-pulse'
      }`}
      title={isTimerRunning ? "Click to Pause Timer (Shortcut: T)" : "Click to Start Timer (Shortcut: T)"}
    >
      {isTimerRunning ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>⏱ {formatTime(timeSpent)}</span>
          <span className="text-[10px] font-sans uppercase font-bold tracking-wider opacity-80 bg-black/30 px-1.5 py-0.5 rounded">Pause</span>
        </>
      ) : (
        <>
          <span className="text-xs">▶</span>
          <span>{timeSpent > 0 ? `⏱ ${formatTime(timeSpent)}` : 'Start Timer'}</span>
          <span className="text-[10px] font-sans uppercase font-bold tracking-wider opacity-90 bg-white/10 px-1.5 py-0.5 rounded">
            {timeSpent > 0 ? 'Resume' : 'Start'}
          </span>
        </>
      )}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center py-6">
      <div className="w-full flex flex-wrap justify-between items-center gap-4 text-muted mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white font-bold text-sm">
            {currentIndex + 1}
          </div>
          <span className="text-sm">of {queue.length} cards in queue</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => { setCurrentIndex(Math.max(currentIndex - 1, 0)); setIsFlipped(false); }} 
            disabled={currentIndex === 0}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 hover:text-white border border-white/5"
            title="Previous Card (Left Arrow)"
          >
            &larr; Prev
          </button>
          <button 
            onClick={() => { setCurrentIndex(Math.min(currentIndex + 1, queue.length - 1)); setIsFlipped(false); }} 
            disabled={currentIndex === queue.length - 1}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 hover:text-white border border-white/5"
            title="Next Card (Right Arrow)"
          >
            Next &rarr;
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-none" title="Toggle whether timer starts automatically on card load">
            <input 
              type="checkbox"
              checked={autoStartTimer}
              onChange={(e) => handleAutoStartToggle(e.target.checked)}
              className="accent-primary rounded cursor-pointer"
            />
            <span>Auto-start Timer</span>
          </label>
          <button onClick={() => setIsSessionStarted(false)} className="text-sm hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Quit Session</button>
        </div>
      </div>
      
      <div className="w-full h-[450px] perspective-1000 mb-10 cursor-pointer group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <motion.div 
          className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className={`absolute w-full h-full backface-hidden glass-panel rounded-[2rem] p-10 flex flex-col transition-all duration-300 ${card.status === 'difficult' ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'group-hover:border-white/20 group-hover:shadow-2xl'}`}>
            <div className="flex gap-3 mb-auto items-center justify-between">
              <div className="flex gap-3 items-center flex-wrap">
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-medium" style={{borderLeft: `3px solid ${subject.color}`}}>{subject.name}</span>
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-muted font-medium">{topic.name}</span>
                {renderRecallTypeButton(card)}
              </div>
              <div className="flex gap-2 items-center">
                {sessionMode === 'custom' && <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-1 rounded">Cram Mode</span>}
                {renderTimerButton()}
              </div>
            </div>
            <div className="text-center my-auto px-4">
              <h2 className="text-4xl md:text-5xl font-display leading-tight">{card.name}</h2>
              {card.recallType === 'understanding' ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-300/80 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full inline-block">
                  🧠 Concept Card: Focus on deep understanding & explanation
                </p>
              ) : (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full inline-block">
                  ⚡ Active Recall Card: Test memory before flipping
                </p>
              )}
            </div>
            <div className="text-center text-muted text-sm mt-auto flex items-center justify-center gap-3">
              <span className="animate-pulse">Tap or press Space to reveal</span>
              {!isTimerRunning && timeSpent === 0 && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="text-xs text-primary-light font-medium">Press 'T' or click ▶ to start timer</span>
                </>
              )}
            </div>
          </div>
          
          {/* Back */}
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-[2rem] p-10 flex flex-col ${card.status === 'difficult' ? 'border-rose-500/40' : ''}`}>
            <div className="flex gap-3 mb-6 items-center justify-between">
              <div className="flex gap-3 items-center flex-wrap">
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-medium" style={{borderLeft: `3px solid ${subject.color}`}}>{subject.name}</span>
                <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-muted font-medium">{topic.name}</span>
                {renderRecallTypeButton(card)}
              </div>
              <div className="flex gap-2 items-center">
                {sessionMode === 'custom' && <span className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-1 rounded">Cram Mode</span>}
                {renderTimerButton()}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <h3 className="text-2xl text-gradient font-display mb-6">{card.name}</h3>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed border-t border-white/10 pt-6 text-white/90">
                {card.notes || 'No extra notes provided.'}
              </div>
              
              {card.reviewHistory && card.reviewHistory.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400/80 mb-3 flex items-center gap-2">
                    <span>⚠️</span> Previously Forgotten
                  </h4>
                  <ul className="space-y-2">
                    {card.reviewHistory.map((item, i) => (
                      <li key={i} className="text-[13px] bg-rose-500/10 text-rose-200 px-3 py-2.5 rounded-lg border border-rose-500/20 leading-relaxed">
                        <span className="opacity-50 mr-2 font-mono text-[11px] bg-black/20 px-1.5 py-0.5 rounded">[{item.date}]</span> 
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-4">
               {((card.confidenceHistory && card.confidenceHistory.length > 0) || (card.timeSpentHistory && card.timeSpentHistory.length > 0)) && (
                 <div className="flex flex-col gap-2 items-end">
                   {card.confidenceHistory && card.confidenceHistory.length > 0 && (
                     <div className="flex flex-wrap gap-2 justify-end items-center">
                       <span className="text-[10px] text-muted uppercase tracking-widest mr-1">Confidence History:</span>
                       {card.confidenceHistory.map((ch, i) => (
                         <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/70 shadow-sm">
                           {ch.date}: <strong className="text-white">{ch.confidence}%</strong>
                         </span>
                       ))}
                     </div>
                   )}
                   {card.timeSpentHistory && card.timeSpentHistory.length > 0 && (
                     <div className="flex flex-wrap gap-2 justify-end items-center">
                       <span className="text-[10px] text-muted uppercase tracking-widest mr-1">Time History:</span>
                       {card.timeSpentHistory.map((th, i) => (
                         <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/70 shadow-sm">
                           {th.date}: <strong className="text-white">{formatTime(th.time)}</strong>
                         </span>
                       ))}
                     </div>
                   )}
                 </div>
               )}

               <textarea 
                 value={forgottenText} 
                 onChange={e => setForgottenText(e.target.value)} 
                 placeholder="Topics forgotten this time? (one per line, optional)" 
                 className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-muted resize-y min-h-[60px]"
                 onClick={e => e.stopPropagation()}
                 onKeyDown={e => e.stopPropagation()}
               />
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
