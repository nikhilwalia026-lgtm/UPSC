import React, { useState } from 'react';
import { Data } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Layers, Database } from 'lucide-react';

export default function AddContent({ state, saveData, showToast }) {
  const [activeTab, setActiveTab] = useState('cards');

  // Subject State
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#6366f1');
  
  // Topic State
  const [topicSubId, setTopicSubId] = useState('');
  const [topicName, setTopicName] = useState('');

  // Card State
  const [cardSubId, setCardSubId] = useState('');
  const [cardChapterId, setCardChapterId] = useState('');
  const [cardTopicName, setCardTopicName] = useState('');
  const [cardSubTopicName, setCardSubTopicName] = useState('');
  const [cardNotes, setCardNotes] = useState('');
  const [bulkText, setBulkText] = useState('');

  const colors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const addSubject = () => {
    if (!subName.trim()) return;
    const newSub = { id: Data.generateId(), name: subName, color: subColor, createdAt: Data.getTodayStr() };
    saveData([...state.subjects, newSub], null, null, null, null, null);
    setSubName('');
    showToast('Subject created successfully!');
  };

  const deleteSubject = (id) => {
    if(!confirm('Delete this Subject and ALL its Topics and Cards?')) return;
    const newSubjects = state.subjects.filter(s => s.id !== id);
    const newTopics = state.topics.filter(t => t.subjectId !== id);
    const newSubTopics = state.subTopics.filter(st => st.subjectId !== id);
    saveData(newSubjects, newTopics, newSubTopics, null, null, null);
    showToast('Subject deleted');
  };

  const addChapter = () => {
    if (!topicSubId || !topicName.trim()) return;
    const newTop = { id: Data.generateId(), subjectId: topicSubId, name: topicName, createdAt: Data.getTodayStr() };
    saveData(null, [...state.topics, newTop], null, null, null, null);
    setTopicName('');
    showToast('Chapter created successfully!');
  };

  const deleteChapter = (id) => {
    if(!confirm('Delete this Chapter and ALL its contents?')) return;
    const newTopics = state.topics.filter(t => t.id !== id);
    const newSubTopics = state.subTopics.filter(st => st.topicId !== id);
    saveData(null, newTopics, newSubTopics, null, null, null);
    showToast('Chapter deleted');
  };

  const createCardObj = (sId, tId, name, notes) => ({
    id: Data.generateId(), subjectId: sId, topicId: tId, name, notes,
    interval: 1, repetitions: 0, easeFactor: 2.5, nextReview: Data.getTodayStr(),
    lastReview: null, lastRating: null, status: 'new', createdAt: Data.getTodayStr()
  });

  const addCard = () => {
    if (!cardSubId || !cardChapterId || !cardTopicName.trim() || !cardSubTopicName.trim()) {
      showToast('Please fill all required fields');
      return;
    }
    const combinedName = `${cardTopicName} — ${cardSubTopicName}`;
    const newCard = createCardObj(cardSubId, cardChapterId, combinedName, cardNotes);
    saveData(null, null, [...state.subTopics, newCard], null, null, null);
    setCardSubTopicName('');
    setCardNotes('');
    showToast('Added to your queue!');
  };

  const addBulk = () => {
    if (!cardSubId || !cardChapterId || !bulkText.trim()) {
      showToast('Please select subject, chapter, and enter content');
      return;
    }
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);
    const newCards = lines.map(l => createCardObj(cardSubId, cardChapterId, l, ''));
    saveData(null, null, [...state.subTopics, ...newCards], null, null, null);
    setBulkText('');
    showToast(`${newCards.length} cards added instantly!`);
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-display mb-2">Add Content</h2>
          <p className="text-muted text-sm">Create and organize your UPSC study material</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'cards' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
          >
            <Layers size={16} /> Add Cards
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
          >
            <Database size={16} /> Manage Categories
          </button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'cards' && (
          <motion.div key="cards" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-3xl md:col-span-2">
              <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
                <span className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-accent"></span>
                Select Destination
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select className="input-field mb-0" value={cardSubId} onChange={e=>{setCardSubId(e.target.value); setCardChapterId('');}}>
                  <option value="">-- Select Subject --</option>
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="input-field mb-0" value={cardChapterId} onChange={e=>setCardChapterId(e.target.value)}>
                  <option value="">-- Select Chapter --</option>
                  {state.topics.filter(t => t.subjectId === cardSubId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {(!cardSubId || !cardChapterId) ? (
                <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                  <p className="text-muted">Please select a Subject and Chapter above to start adding content.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-white/10 pt-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium mb-2 text-white">Add Individual Content</h4>
                    <input className="input-field mb-0" value={cardTopicName} onChange={e=>setCardTopicName(e.target.value)} placeholder="Topic (e.g. Fundamental Rights)" />
                    <input className="input-field mb-0" value={cardSubTopicName} onChange={e=>setCardSubTopicName(e.target.value)} placeholder="Sub-Topic / Question (e.g. Article 14)" />
                    <textarea className="input-field h-24 mb-0" value={cardNotes} onChange={e=>setCardNotes(e.target.value)} placeholder="Optional: Answer / Detailed Notes" />
                    <button className="btn btn-primary w-full flex justify-center items-center gap-2" onClick={addCard}>
                      <Plus size={18} /> Add Content
                    </button>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-white">Bulk Add</h4>
                    <textarea className="input-field h-[184px]" value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Paste multiple concepts here.&#10;Each line becomes a separate card instantly!&#10;&#10;e.g.&#10;Article 14&#10;Article 19&#10;Article 21" />
                    <button className="btn btn-secondary w-full" onClick={addBulk}>Bulk Import</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'manage' && (
          <motion.div key="manage" initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-10}} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Add Subject */}
              <div className="glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-display mb-4">Create Subject</h3>
                <input className="input-field" value={subName} onChange={e=>setSubName(e.target.value)} placeholder="e.g. Polity, History" />
                <div className="flex gap-3 mb-6">
                  {colors.map(c => (
                    <div 
                      key={c} onClick={() => setSubColor(c)}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${subColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                      style={{backgroundColor: c}}
                    />
                  ))}
                </div>
                <button className="btn btn-primary w-full" onClick={addSubject}>Create Subject</button>
              </div>

              {/* Add Chapter */}
              <div className="glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-display mb-4">Create Chapter</h3>
                <select className="input-field" value={topicSubId} onChange={e=>setTopicSubId(e.target.value)}>
                  <option value="">-- Assign to Subject --</option>
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input className="input-field" value={topicName} onChange={e=>setTopicName(e.target.value)} placeholder="e.g. Chapter 1: Introduction" />
                <button className="btn btn-secondary w-full" onClick={addChapter}>Create Chapter</button>
              </div>
            </div>

            {/* List and Delete */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col h-full max-h-[800px]">
              <h3 className="text-xl font-display mb-6">Existing Categories</h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6 flex-1">
                {state.subjects.length === 0 && <p className="text-muted text-sm italic">No subjects created yet.</p>}
                {state.subjects.map(sub => (
                  <div key={sub.id} className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: sub.color}}></div>
                        <h4 className="font-bold text-white text-lg">{sub.name}</h4>
                      </div>
                      <button onClick={() => deleteSubject(sub.id)} className="text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 rounded-lg transition-colors" title="Delete Subject">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 pl-6">
                      {state.topics.filter(t => t.subjectId === sub.id).length === 0 && <span className="text-xs text-muted">No chapters inside</span>}
                      {state.topics.filter(t => t.subjectId === sub.id).map(top => (
                        <div key={top.id} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-lg">
                          <span className="text-sm text-white/80">{top.name}</span>
                          <button onClick={() => deleteChapter(top.id)} className="text-rose-400/60 hover:text-rose-300 transition-colors" title="Delete Chapter">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
