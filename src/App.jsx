import { useState, useEffect } from 'react';
import { Home, BookOpen, PlusSquare, LayoutList, BarChart2, Settings } from 'lucide-react';
import { Data, KEYS, SM2 } from './lib/data';

import Dashboard from './components/Dashboard';
import Review from './components/Review';
import AddContent from './components/AddContent';
import Browse from './components/Browse';
import Stats from './components/Stats';
import SettingsModal from './components/SettingsModal';

function App() {
  const [view, setView] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [browseFilterStatus, setBrowseFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [settings, setSettings] = useState({ examDate: '2026-05-31', newCardsPerDay: 5 });
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [history, setHistory] = useState({});

  useEffect(() => {
    const loadedSubjects = Data.get(KEYS.subjects);
    setSubjects(loadedSubjects);
    setTopics(Data.get(KEYS.topics));
    const loadedSubTopics = SM2.analyzeDifficulty(Data.get(KEYS.subTopics));
    setSubTopics(loadedSubTopics);
    setSettings(Data.get(KEYS.settings, { examDate: '2026-05-31', newCardsPerDay: 5 }));
    
    const loadedStreak = Data.get(KEYS.streak, { count: 0, lastDate: null });
    checkAndUpdateStreak(loadedStreak);
    setHistory(Data.get(KEYS.history, {}));
  }, []);

  const checkAndUpdateStreak = (currentStreak) => {
    const today = Data.getTodayStr();
    if (currentStreak.lastDate) {
      const last = new Date(currentStreak.lastDate);
      const curr = new Date(today);
      const diffDays = Math.ceil(Math.abs(curr - last) / (1000 * 60 * 60 * 24)); 
      if (diffDays > 1) {
        currentStreak.count = 0; 
        Data.set(KEYS.streak, currentStreak);
      }
    }
    setStreak(currentStreak);
  };

  const saveData = (newSubjects, newTopics, newSubTopics, newSettings, newStreak, newHistory) => {
    if (newSubjects) { setSubjects(newSubjects); Data.set(KEYS.subjects, newSubjects); }
    if (newTopics) { setTopics(newTopics); Data.set(KEYS.topics, newTopics); }
    if (newSubTopics) { setSubTopics(newSubTopics); Data.set(KEYS.subTopics, newSubTopics); }
    if (newSettings) { setSettings(newSettings); Data.set(KEYS.settings, newSettings); }
    if (newStreak) { setStreak(newStreak); Data.set(KEYS.streak, newStreak); }
    if (newHistory) { setHistory(newHistory); Data.set(KEYS.history, newHistory); }
  };

  const navItems = [
    { id: 'dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { id: 'review', icon: <BookOpen size={20} />, label: 'Review' },
    { id: 'add', icon: <PlusSquare size={20} />, label: 'Add Content' },
    { id: 'browse', icon: <LayoutList size={20} />, label: 'Browse' },
    { id: 'stats', icon: <BarChart2 size={20} />, label: 'Stats' },
  ];

  return (
    <div className="flex h-screen w-full max-w-[1400px] mx-auto overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 glass-panel border-y-0 border-l-0 rounded-none flex-col py-8 z-10">
        <div className="px-8 mb-10">
          <h1 className="text-3xl font-display font-bold text-gradient">UPSC AIR 1</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'browse') setBrowseFilterStatus('all');
                setView(item.id);
              }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                view === item.id 
                  ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-2 border-primary' 
                  : 'text-muted hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <div className={view === item.id ? 'text-primary' : ''}>{item.icon}</div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 mt-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-muted hover:bg-white/5 hover:text-white transition-all font-medium border-l-2 border-transparent"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
        {view === 'dashboard' && <Dashboard state={{subjects, topics, subTopics, settings, streak}} setView={setView} navigateToBrowse={(status) => { setBrowseFilterStatus(status); setView('browse'); }} />}
        {view === 'review' && <Review state={{subjects, topics, subTopics, settings, streak, history}} saveData={saveData} setView={setView} />}
        {view === 'add' && <AddContent state={{subjects, topics, subTopics}} saveData={saveData} showToast={showToast} />}
        {view === 'browse' && <Browse state={{subjects, topics, subTopics}} saveData={saveData} filterStatus={browseFilterStatus} setFilterStatus={setBrowseFilterStatus} />}
        {view === 'stats' && <Stats state={{subjects, topics, subTopics, history}} />}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="glass-panel border-primary/50 bg-primary/20 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm">
            {toast}
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-b-0 border-x-0 rounded-none flex justify-between px-2 py-3 z-50">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'browse') setBrowseFilterStatus('all');
              setView(item.id);
            }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all ${
              view === item.id ? 'text-primary bg-primary/10' : 'text-muted'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          saveData={saveData} 
          onClose={() => setIsSettingsOpen(false)} 
          state={{subjects, topics, subTopics, settings, streak, history}}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default App;
