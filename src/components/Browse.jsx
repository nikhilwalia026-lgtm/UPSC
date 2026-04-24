import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Data } from '../lib/data';
import { Search, Filter, Trash2, Edit } from 'lucide-react';

export default function Browse({ state, saveData, filterStatus = 'all', setFilterStatus }) {
  const [search, setSearch] = useState('');
  const [filterSub, setFilterSub] = useState('all');
  const [viewingCard, setViewingCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', notes: '', subjectId: '', topicId: '' });

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.subjectId || !editForm.topicId) return;
    const newCards = state.subTopics.map(c => 
      c.id === viewingCard.id ? { ...c, ...editForm } : c
    );
    saveData(null, null, newCards, null, null, null);
    setViewingCard({ ...viewingCard, ...editForm });
    setIsEditing(false);
  };

  const deleteCard = (id) => {
    if(confirm('Are you sure you want to delete this card?')) {
      const newCards = state.subTopics.filter(st => st.id !== id);
      saveData(null, null, newCards, null, null, null);
    }
  };

  const filtered = state.subTopics.filter(c => {
    if (filterSub !== 'all' && c.subjectId !== filterSub) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getRelativeTime = (dateStr) => {
    const today = Data.getTodayStr();
    if (dateStr === today) return <span className="text-amber-400 font-medium">Due Today</span>;
    if (dateStr < today) return <span className="text-rose-400 font-bold">Overdue</span>;
    
    const d1 = new Date(today);
    const d2 = new Date(dateStr);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return <span className="text-white/60">In {diffDays} days</span>;
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-4xl font-display mb-2">Browse Library</h2>
        <p className="text-muted text-sm">Search, filter, and manage all your flashcards across subjects.</p>
      </div>
      
      {/* Search and Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors" 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            placeholder="Search for concepts, keywords..." 
          />
        </div>
        
        <div className="flex w-full lg:w-auto gap-4">
          <div className="relative flex-1 lg:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <select 
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer" 
              value={filterSub} 
              onChange={e=>setFilterSub(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="relative flex-1 lg:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <select 
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer" 
              value={filterStatus} 
              onChange={e=>setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="learning">Learning</option>
              <option value="review">Review</option>
              <option value="mastered">Mastered</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Meta */}
      <div className="flex justify-between items-center px-2">
        <span className="text-sm font-medium text-white/70">Showing {filtered.length} card{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-muted text-xs uppercase tracking-widest font-bold">
                <th className="p-5 whitespace-nowrap">Subject</th>
                <th className="p-5 whitespace-nowrap">Chapter</th>
                <th className="p-5 w-full">Card Name</th>
                <th className="p-5 whitespace-nowrap">Status</th>
                <th className="p-5 whitespace-nowrap">Schedule</th>
                <th className="p-5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((card, idx) => {
                const sub = state.subjects.find(s => s.id === card.subjectId);
                const top = state.topics.find(t => t.id === card.topicId);
                if(!sub || !top) return null;
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    key={card.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => setViewingCard(card)}
                  >
                    <td className="p-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: sub.color}}></span>
                        <span className="text-sm font-medium text-white/90">{sub.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-muted whitespace-nowrap">{top.name}</td>
                    <td className="p-5 font-semibold text-white/90 text-[15px]">{card.name}</td>
                    <td className="p-5 whitespace-nowrap">
                      <span className={`badge badge-${card.status}`}>{card.status}</span>
                    </td>
                    <td className="p-5 text-sm whitespace-nowrap">
                      {card.status === 'new' ? <span className="text-muted italic">-</span> : getRelativeTime(card.nextReview)}
                    </td>
                    <td className="p-5 whitespace-nowrap text-right">
                      <button 
                        className="p-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" 
                        onClick={(e)=>{e.stopPropagation(); deleteCard(card.id);}}
                        title="Delete Card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted">
                      <Search size={32} className="mb-4 opacity-20" />
                      <p className="text-lg">No cards found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingCard && (() => {
        const sub = state.subjects.find(s => s.id === viewingCard.subjectId) || {name: 'Unknown', color: '#fff'};
        const top = state.topics.find(t => t.id === viewingCard.topicId) || {name: 'Unknown'};
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in" onClick={() => { setViewingCard(null); setIsEditing(false); }}>
            <div 
              className="glass-panel p-10 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar border border-white/20 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-muted hover:text-white"
                onClick={() => { setViewingCard(null); setIsEditing(false); }}
              >
                ✕
              </button>
              
              {isEditing ? (
                <div className="space-y-4 pr-6">
                  <h3 className="text-2xl font-display text-white mb-6">Edit Card</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted font-bold uppercase tracking-widest mb-2 block">Subject</label>
                      <select 
                        value={editForm.subjectId} 
                        onChange={e => {
                          const newSubId = e.target.value;
                          const firstTopic = state.topics.find(t => t.subjectId === newSubId);
                          setEditForm({...editForm, subjectId: newSubId, topicId: firstTopic ? firstTopic.id : ''});
                        }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                      >
                        {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted font-bold uppercase tracking-widest mb-2 block">Topic</label>
                      <select 
                        value={editForm.topicId} 
                        onChange={e => setEditForm({...editForm, topicId: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                      >
                        {state.topics.filter(t => t.subjectId === editForm.subjectId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted font-bold uppercase tracking-widest mb-2 block">Card Name</label>
                    <input 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-bold uppercase tracking-widest mb-2 block">Notes</label>
                    <textarea 
                      value={editForm.notes} 
                      onChange={e => setEditForm({...editForm, notes: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white h-32 focus:outline-none focus:border-primary/50 transition-colors custom-scrollbar"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-medium text-muted hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={saveEdit} className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 transition-colors">Save Changes</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-8 items-center border-b border-white/10 pb-6 pr-8">
                    <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-medium" style={{borderLeft: `3px solid ${sub.color}`}}>{sub.name}</span>
                    <span className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-muted font-medium">{top.name}</span>
                    <span className={`ml-auto badge badge-${viewingCard.status}`}>{viewingCard.status}</span>
                    <button 
                      onClick={() => {
                        setEditForm({ name: viewingCard.name, notes: viewingCard.notes || '', subjectId: viewingCard.subjectId, topicId: viewingCard.topicId });
                        setIsEditing(true);
                      }}
                      className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Card"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                  
                  <h3 className="text-3xl font-display text-white mb-6 leading-tight pr-6">{viewingCard.name}</h3>
                  
                  <div className="bg-black/30 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Notes & Details</h4>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/90">
                      {viewingCard.notes || <span className="text-white/40 italic">No additional notes provided.</span>}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between text-xs text-muted font-medium uppercase tracking-widest">
                    <span>Created: {viewingCard.createdAt || 'Unknown'}</span>
                    <span>Next Review: {viewingCard.nextReview}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

    </motion.div>
  );
}
