import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Data, SM2 } from '../lib/data';
import { Search, Plus, Trash2, Edit, X, BookA, Play } from 'lucide-react';

export default function Dictionary({ state, saveData }) {
  const { vocab = [] } = state;
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    synonyms: '',
    antonyms: '',
    example: ''
  });

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const getDueWords = () => {
    const today = Data.getTodayStr();
    let q = [];
    q.push(...vocab.filter(v => v.status === 'difficult'));
    q.push(...vocab.filter(v => (v.nextReview || today) <= today && v.status !== 'new' && v.status !== 'difficult'));
    q.push(...vocab.filter(v => v.status === 'new' || !v.status));
    return [...new Map(q.map(item => [item.id, item])).values()];
  };

  const startReview = () => {
    const q = getDueWords();
    if (q.length === 0) {
      alert("No words due for review today!");
      return;
    }
    // Ensure all words have default SM2 properties if they are older
    const sanitizedQueue = q.map(v => ({
      ...v,
      interval: v.interval || 1,
      repetitions: v.repetitions || 0,
      easeFactor: v.easeFactor || 2.5,
      nextReview: v.nextReview || Data.getTodayStr(),
      status: v.status || 'new'
    }));
    
    setReviewQueue(sanitizedQueue);
    setReviewIndex(0);
    setIsFlipped(false);
    setIsReviewing(true);
  };

  const rateWord = (rating) => {
    const word = reviewQueue[reviewIndex];
    const updatedWord = SM2.schedule(word, rating);
    
    const newVocab = [...vocab];
    const idx = newVocab.findIndex(v => v.id === word.id);
    if (idx > -1) {
      newVocab[idx] = updatedWord;
    } else {
      newVocab.push(updatedWord);
    }
    
    saveData(null, null, null, null, null, null, newVocab);
    
    setIsFlipped(false);
    const newQueue = reviewQueue.filter((_, i) => i !== reviewIndex);
    setReviewQueue(newQueue);
    
    if (newQueue.length === 0) {
      setIsReviewing(false);
    } else if (reviewIndex >= newQueue.length) {
      setReviewIndex(0);
    }
  };

  const filteredVocab = vocab.filter(v => 
    v.word.toLowerCase().includes(search.toLowerCase()) || 
    v.meaning.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.word.localeCompare(b.word));

  const handleSave = () => {
    if (!formData.word.trim() || !formData.meaning.trim()) return;

    let newVocab = [...vocab];
    if (editingId) {
      const idx = newVocab.findIndex(v => v.id === editingId);
      if (idx > -1) {
        newVocab[idx] = { ...newVocab[idx], ...formData };
      }
    } else {
      newVocab.push({
        id: Data.generateId(),
        ...formData,
        interval: 1, repetitions: 0, easeFactor: 2.5,
        nextReview: Data.getTodayStr(),
        lastReview: null, lastRating: null, status: 'new',
        createdAt: Data.getTodayStr()
      });
    }

    // Call saveData from App.jsx passing vocab as the 7th argument
    saveData(null, null, null, null, null, null, newVocab);
    setIsAdding(false);
    setEditingId(null);
    setFormData({ word: '', meaning: '', synonyms: '', antonyms: '', example: '' });
  };

  const handleEdit = (v) => {
    setFormData({
      word: v.word,
      meaning: v.meaning,
      synonyms: v.synonyms || '',
      antonyms: v.antonyms || '',
      example: v.example || ''
    });
    setEditingId(v.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      const newVocab = vocab.filter(v => v.id !== id);
      saveData(null, null, null, null, null, null, newVocab);
    }
  };

  if (isReviewing && reviewQueue.length > 0) {
    const word = reviewQueue[reviewIndex];
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center py-6">
        <div className="w-full flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-4 text-muted">
            <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white font-bold text-sm">
              {reviewIndex + 1}
            </div>
            <span className="text-sm">of {reviewQueue.length} words in queue</span>
          </div>
          <button onClick={() => setIsReviewing(false)} className="text-sm hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Quit Session</button>
        </div>

        <div className="w-full h-[400px] perspective-1000 mb-10 cursor-pointer group" onClick={() => !isFlipped && setIsFlipped(true)}>
          <motion.div 
            className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
          >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden glass-panel rounded-[2rem] p-10 flex flex-col group-hover:border-white/20 group-hover:shadow-2xl transition-all duration-300">
              <div className="flex gap-3 mb-auto">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg">Dictionary Review</span>
              </div>
              <div className="text-center my-auto px-4">
                <h2 className="text-5xl font-display leading-tight">{word.word}</h2>
              </div>
              <div className="text-center text-muted text-sm mt-auto">
                <span className="animate-pulse">Tap to reveal meaning</span>
              </div>
            </div>
            
            {/* Back */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-[2rem] p-10 flex flex-col">
              <div className="flex gap-3 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg">Dictionary Review</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <h3 className="text-3xl text-gradient font-display mb-4">{word.word}</h3>
                <p className="text-lg text-white/90 italic mb-6">{word.meaning}</p>
                
                <div className="space-y-4 pt-4 border-t border-white/10 text-sm">
                  {word.synonyms && (
                    <div><span className="text-muted font-bold uppercase tracking-widest text-[11px] block mb-1">Synonyms</span><span className="text-emerald-400">{word.synonyms}</span></div>
                  )}
                  {word.antonyms && (
                    <div><span className="text-muted font-bold uppercase tracking-widest text-[11px] block mb-1">Antonyms</span><span className="text-rose-400">{word.antonyms}</span></div>
                  )}
                  {word.example && (
                    <div className="bg-white/5 p-4 rounded-xl"><span className="text-muted font-bold uppercase tracking-widest text-[11px] block mb-2">Example</span><span className="text-white/80">"{word.example}"</span></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFlipped && (
            <motion.div initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 30}} className="w-full flex flex-col gap-5 glass-panel p-6 rounded-[2rem]">
              <h4 className="text-center text-white/70 text-sm font-medium uppercase tracking-widest">Rate Your Recall</h4>
              <div className="flex flex-wrap md:flex-nowrap gap-3 justify-between">
                {[
                  {key: '1', val: 1, label: 'Difficult', color: 'hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400'},
                  {key: '2', val: 3, label: 'Learning', color: 'hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400'},
                  {key: '3', val: 4, label: 'Review', color: 'hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-400'},
                  {key: '4', val: 5, label: 'Mastered', color: 'hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400'}
                ].map(btn => {
                  const nextInterval = SM2.schedule({ ...word, interval: word.interval||1, repetitions: word.repetitions||0, easeFactor: word.easeFactor||2.5 }, btn.val).interval;
                  const intervalStr = nextInterval === 1 ? '< 1d' : `${nextInterval}d`;
                  return (
                  <button 
                    key={btn.val} onClick={() => rateWord(btn.val)}
                    className={`flex-1 min-w-[20%] md:min-w-0 flex flex-col items-center p-4 bg-black/20 border border-white/5 rounded-xl transition-all duration-200 group ${btn.color}`}
                  >
                    <span className="text-2xl font-display font-bold mb-1">{btn.key}</span>
                    <span className="text-[11px] uppercase tracking-wider text-muted group-hover:text-inherit transition-colors mb-1.5">{btn.label}</span>
                    <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{intervalStr}</span>
                  </button>
                )})}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const dueWordsCount = getDueWords().length;

  return (
    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-display mb-2 flex items-center gap-3">
            <BookA className="text-primary" size={32} />
            Dictionary
          </h2>
          <p className="text-muted text-sm">Build your English vocabulary for CSAT and Mains.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={startReview} 
            className="btn bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 transition-all"
          >
            <Play size={20} />
            Review ({dueWordsCount} Due)
          </button>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ word: '', meaning: '', synonyms: '', antonyms: '', example: '' });
            }} 
            className="btn btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow"
          >
            <Plus size={20} />
            Add Word
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words or meanings..."
          className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <AnimatePresence>
          {filteredVocab.map(v => (
            <motion.div 
              key={v.id}
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              className="glass-panel p-6 rounded-3xl border border-white/5 group relative hover:border-primary/30 transition-all flex flex-col hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(v)} className="p-2 bg-white/5 hover:bg-white/20 rounded-lg text-muted hover:text-white transition-colors" title="Edit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-lg text-muted hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-2xl font-display text-white mb-2 pr-16">{v.word}</h3>
              <p className="text-white/80 text-[15px] mb-4 italic leading-relaxed">{v.meaning}</p>
              
              <div className="mt-auto space-y-3 pt-4 border-t border-white/10 text-[13px]">
                {v.synonyms && (
                  <div>
                    <span className="text-muted font-bold uppercase tracking-widest block mb-1 text-[10px]">Synonyms</span>
                    <span className="text-emerald-400/90">{v.synonyms}</span>
                  </div>
                )}
                {v.antonyms && (
                  <div>
                    <span className="text-muted font-bold uppercase tracking-widest block mb-1 text-[10px]">Antonyms</span>
                    <span className="text-rose-400/90">{v.antonyms}</span>
                  </div>
                )}
                {v.example && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                    <span className="text-muted font-bold uppercase tracking-widest block mb-1 text-[10px]">Example</span>
                    <span className="text-white/80">"{v.example}"</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredVocab.length === 0 && (
        <div className="col-span-full text-center py-20 text-muted bg-black/20 rounded-3xl border border-white/5 border-dashed">
          <BookA size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-xl font-display text-white mb-2">No words found</p>
          <p className="text-sm">Click 'Add Word' to start building your vocabulary dictionary.</p>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <motion.div 
              initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}}
              className="glass-panel p-8 rounded-[2rem] w-full max-w-lg border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
              
              <h3 className="text-3xl font-display mb-6">{editingId ? 'Edit Word' : 'Add New Word'}</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Word *</label>
                  <input type="text" value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="e.g. Ubiquitous" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Meaning *</label>
                  <textarea value={formData.meaning} onChange={e => setFormData({...formData, meaning: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors min-h-[80px] resize-y custom-scrollbar" placeholder="Present, appearing, or found everywhere." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Synonyms</label>
                    <input type="text" value={formData.synonyms} onChange={e => setFormData({...formData, synonyms: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="omnipresent" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Antonyms</label>
                    <input type="text" value={formData.antonyms} onChange={e => setFormData({...formData, antonyms: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="rare" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Example Sentence</label>
                  <textarea value={formData.example} onChange={e => setFormData({...formData, example: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors min-h-[80px] resize-y custom-scrollbar" placeholder="His ubiquitous influence was felt by all the family." />
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={handleSave} 
                    disabled={!formData.word.trim() || !formData.meaning.trim()}
                    className="btn btn-primary w-full py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                  >
                    {editingId ? 'Save Changes' : 'Add Word'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
