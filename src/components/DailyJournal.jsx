import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Data } from '../lib/data';
import DatePicker from './ui/DatePicker';
import { 
  BookOpen, Clock, Flame, Calendar, Search, Trash2, Edit3, Plus, 
  Check, FileText, Sparkles, Filter, Smile, Notebook, Award 
} from 'lucide-react';

export default function DailyJournal({ state, saveData, showToast }) {
  const { dailyLogs = [], subjects = [] } = state;

  const todayStr = Data.getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [hoursStudied, setHoursStudied] = useState('');
  const [focusLevel, setFocusLevel] = useState('Good'); // 'Peak', 'Good', 'Moderate', 'Low', 'Exhausted'
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [topicsCovered, setTopicsCovered] = useState('');
  const [takeaways, setTakeaways] = useState('');
  
  const [editingLogId, setEditingLogId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  const [expandedLogIds, setExpandedLogIds] = useState([]);

  const focusOptions = [
    { label: 'Peak Focus', icon: '🔥', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { label: 'Good Focus', icon: '⚡️', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: 'Moderate', icon: '😐', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
    { label: 'Low Focus', icon: '🥱', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { label: 'Exhausted', icon: '😫', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
  ];

  // Load existing log if selectedDate changes or editing starts
  useEffect(() => {
    const existing = dailyLogs.find(log => log.date === selectedDate);
    if (existing && !editingLogId) {
      setHoursStudied(existing.hours ? existing.hours.toString() : '');
      setFocusLevel(existing.focusLevel || 'Good');
      setSelectedSubjectIds(existing.subjectIds || []);
      setTopicsCovered(existing.topicsCovered || '');
      setTakeaways(existing.takeaways || '');
      setEditingLogId(existing.id);
    } else if (!existing && !editingLogId) {
      // Clear form for new date
      setHoursStudied('');
      setFocusLevel('Good');
      setSelectedSubjectIds([]);
      setTopicsCovered('');
      setTakeaways('');
      setEditingLogId(null);
    }
  }, [selectedDate, dailyLogs]);

  const handleSubjectToggle = (subId) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const addHours = (amount) => {
    const curr = parseFloat(hoursStudied) || 0;
    const updated = Math.max(0, parseFloat((curr + amount).toFixed(1)));
    setHoursStudied(updated.toString());
  };

  const handleSaveLog = (e) => {
    if (e) e.preventDefault();

    if (!selectedDate) {
      if (showToast) showToast('Please select a date');
      return;
    }

    if (!topicsCovered.trim() && !takeaways.trim() && !hoursStudied) {
      if (showToast) showToast('Please enter what you studied or hours spent today!');
      return;
    }

    const logEntry = {
      id: editingLogId || Data.generateId(),
      date: selectedDate,
      hours: parseFloat(hoursStudied) || 0,
      focusLevel: focusLevel,
      subjectIds: selectedSubjectIds,
      topicsCovered: topicsCovered.trim(),
      takeaways: takeaways.trim(),
      updatedAt: Data.getTodayStr()
    };

    let newLogs = [...dailyLogs];
    const existingIdx = newLogs.findIndex(l => l.date === selectedDate || l.id === logEntry.id);

    if (existingIdx > -1) {
      newLogs[existingIdx] = logEntry;
    } else {
      newLogs.push(logEntry);
    }

    // Sort by date descending
    newLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    saveData(null, null, null, null, null, null, null, newLogs);

    if (showToast) showToast(`Study Log for ${selectedDate} saved! 📖`);
  };

  const handleEditLog = (log) => {
    setSelectedDate(log.date);
    setHoursStudied(log.hours ? log.hours.toString() : '');
    setFocusLevel(log.focusLevel || 'Good');
    setSelectedSubjectIds(log.subjectIds || []);
    setTopicsCovered(log.topicsCovered || '');
    setTakeaways(log.takeaways || '');
    setEditingLogId(log.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLog = (id) => {
    if (window.confirm("Are you sure you want to delete this study log entry?")) {
      const updatedLogs = dailyLogs.filter(l => l.id !== id);
      saveData(null, null, null, null, null, null, null, updatedLogs);
      if (editingLogId === id) {
        setEditingLogId(null);
        setTopicsCovered('');
        setTakeaways('');
        setHoursStudied('');
      }
      if (showToast) showToast("Study log deleted.");
    }
  };

  const resetForm = () => {
    setSelectedDate(todayStr);
    setHoursStudied('');
    setFocusLevel('Good');
    setSelectedSubjectIds([]);
    setTopicsCovered('');
    setTakeaways('');
    setEditingLogId(null);
  };

  const toggleExpandLog = (id) => {
    if (expandedLogIds.includes(id)) {
      setExpandedLogIds(expandedLogIds.filter(i => i !== id));
    } else {
      setExpandedLogIds([...expandedLogIds, id]);
    }
  };

  // Filter logs for past history timeline
  const filteredLogs = dailyLogs.filter(log => {
    const matchesSearch = 
      log.topicsCovered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.takeaways?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date.includes(searchQuery);

    const matchesSubject = 
      filterSubjectId === 'all' || 
      (log.subjectIds && log.subjectIds.includes(filterSubjectId));

    return matchesSearch && matchesSubject;
  });

  // Calculate statistics
  const totalDaysLogged = dailyLogs.length;
  const totalHoursLogged = dailyLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
  const avgHoursPerDay = totalDaysLogged > 0 ? (totalHoursLogged / totalDaysLogged).toFixed(1) : '0';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-1">
            <Notebook size={18} />
            <span>Personal UPSC Logbook</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">Daily Study Journal</h2>
          <p className="text-muted text-sm mt-1">Record what you covered today, track your study hours, and build consistency.</p>
        </div>

        <button 
          onClick={resetForm}
          className="btn btn-secondary text-sm px-4 py-2.5 flex items-center gap-2 rounded-xl"
        >
          <Plus size={16} />
          <span>New Entry Today</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
            📚
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{totalDaysLogged}</div>
            <div className="text-xs text-muted font-medium">Days Logged</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
            ⏱️
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{totalHoursLogged.toFixed(1)} hrs</div>
            <div className="text-xs text-muted font-medium">Total Study Hours</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            🔥
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{avgHoursPerDay} hrs</div>
            <div className="text-xs text-muted font-medium">Avg Hours / Day</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xl">
            🎯
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{dailyLogs.find(l => l.date === todayStr) ? 'Logged!' : 'Pending'}</div>
            <div className="text-xs text-muted font-medium">Today's Status</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Entry Form (Left/Top) and Past Logs (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Log Entry Form */}
        <div className="lg:col-span-7 glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              <span>{editingLogId ? `Editing Entry (${selectedDate})` : "Log Today's Preparation"}</span>
            </h3>
            {editingLogId && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                Editing Existing Log
              </span>
            )}
          </div>

          <form onSubmit={handleSaveLog} className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Date of Study
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <DatePicker 
                    selectedDate={selectedDate} 
                    onSelectDate={(date) => { setSelectedDate(date); setEditingLogId(null); }} 
                    placeholder="Select Date..." 
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedDate(todayStr); setEditingLogId(null); }}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    selectedDate === todayStr 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                      : 'bg-white/5 border-white/10 text-muted hover:text-white'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Hours Studied & Focus Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Hours Studied
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="e.g. 6.5"
                      value={hoursStudied}
                      onChange={(e) => setHoursStudied(e.target.value)}
                      className="input-field pr-12 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-bold">hrs</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => addHours(1)}
                      className="px-2.5 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white font-mono"
                      title="Add 1 hour"
                    >
                      +1h
                    </button>
                    <button
                      type="button"
                      onClick={() => addHours(2)}
                      className="px-2.5 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white font-mono"
                      title="Add 2 hours"
                    >
                      +2h
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Focus / Energy Level
                </label>
                <select
                  value={focusLevel}
                  onChange={(e) => setFocusLevel(e.target.value)}
                  className="input-field"
                >
                  {focusOptions.map(opt => (
                    <option key={opt.label} value={opt.label}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subjects Covered Pills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Subjects Studied Today (Optional)
              </label>
              {subjects.length === 0 ? (
                <p className="text-xs text-muted italic">No subjects created yet. Add subjects in 'Add Content' view.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map(sub => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubjectToggle(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 select-none ${
                          isSelected 
                            ? 'bg-white/20 text-white border-white/40 shadow-md' 
                            : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                        style={{
                          borderColor: isSelected ? sub.color : undefined,
                          backgroundColor: isSelected ? `${sub.color}35` : undefined
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }}></span>
                        <span>{sub.name}</span>
                        {isSelected && <Check size={12} className="ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Topics & Study Summary */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                What Did You Study Today?
              </label>
              <textarea
                rows={5}
                value={topicsCovered}
                onChange={(e) => setTopicsCovered(e.target.value)}
                placeholder="• Read Polity Ch 4 (Preamble & Fundamental Rights)&#10;• Solved 50 Economy MCQs on Inflation&#10;• Revised Modern History Timeline (1857-1947)"
                className="input-field resize-y text-sm font-sans leading-relaxed min-h-[120px]"
              />
            </div>

            {/* Key Learnings / Takeaways */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Key Takeaways & Reflections (Optional)
              </label>
              <textarea
                rows={3}
                value={takeaways}
                onChange={(e) => setTakeaways(e.target.value)}
                placeholder="Note down formulas, weak areas to revisit tomorrow, or personal reflections..."
                className="input-field resize-y text-sm font-sans leading-relaxed min-h-[80px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary flex-1 py-3.5 text-base font-bold flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-primary/25"
              >
                <Check size={18} />
                <span>{editingLogId ? 'Update Log' : 'Save Study Log'}</span>
              </button>
              {editingLogId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary px-5 py-3.5 text-sm rounded-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Past Logbook Timeline & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                <span>Past Logbook</span>
              </h3>
              <span className="text-xs text-muted font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {filteredLogs.length} entries
              </span>
            </div>

            {/* Search & Subject Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search notes or dates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 text-sm py-2.5"
                />
              </div>

              {subjects.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <button
                    onClick={() => setFilterSubjectId('all')}
                    className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-all ${
                      filterSubjectId === 'all' 
                        ? 'bg-primary text-white' 
                        : 'bg-white/5 text-muted hover:text-white'
                    }`}
                  >
                    All Subjects
                  </button>
                  {subjects.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFilterSubjectId(s.id)}
                      className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-all ${
                        filterSubjectId === s.id 
                          ? 'bg-white/20 text-white border border-white/30' 
                          : 'bg-white/5 text-muted hover:text-white'
                      }`}
                      style={{ color: filterSubjectId === s.id ? s.color : undefined }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Logs List */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <span className="text-4xl mb-2 block">📖</span>
                <p className="text-muted text-sm font-medium">No study logs found.</p>
                <p className="text-xs text-muted/70 mt-1">Start logging your preparation using the form.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredLogs.map(log => {
                  const focusOpt = focusOptions.find(o => o.label === log.focusLevel) || focusOptions[1];
                  const logSubjects = (log.subjectIds || [])
                    .map(id => subjects.find(s => s.id === id))
                    .filter(Boolean);
                  const isExpanded = expandedLogIds.includes(log.id);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`glass-panel p-5 rounded-2xl border transition-all duration-200 ${
                        selectedDate === log.date 
                          ? 'border-primary/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-primary/5' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Log Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-white text-base">{log.date}</span>
                            {log.date === todayStr && (
                              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {log.hours > 0 && (
                              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                ⏱ {log.hours} hrs
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 ${focusOpt.color}`}>
                              <span>{focusOpt.icon}</span>
                              <span>{focusOpt.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditLog(log)}
                            className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Log"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Log"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Subject Chips */}
                      {logSubjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {logSubjects.map(sub => (
                            <span
                              key={sub.id}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-black/40 border border-white/10 font-medium text-white/80"
                              style={{ borderLeft: `3px solid ${sub.color}` }}
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Topics Covered Content */}
                      {log.topicsCovered && (
                        <div className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 mb-3 font-sans">
                          {log.topicsCovered}
                        </div>
                      )}

                      {/* Key Takeaways */}
                      {log.takeaways && (
                        <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-200/90 p-3 rounded-xl leading-relaxed flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <div className="flex-1 whitespace-pre-wrap">{log.takeaways}</div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
