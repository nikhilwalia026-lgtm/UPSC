import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Data } from '../lib/data';
import { Search, Plus, Trash2, Edit, X, BookA } from 'lucide-react';

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
