import React, { useState } from 'react';
import { Data } from '../lib/data';
import DatePicker from './ui/DatePicker';

export default function SettingsModal({ settings, saveData, onClose, state, showToast }) {
  const [examDate, setExamDate] = useState(settings.examDate || '');

  const handleSave = () => {
    saveData(null, null, null, { examDate }, null, null);
    onClose();
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `upsc-backup-${Data.getTodayStr()}.json`);
    dlAnchorElem.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.subjects && data.topics && data.subTopics) {
          saveData(data.subjects, data.topics, data.subTopics, data.settings, data.streak, data.history);
          showToast('Data imported successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast('Invalid backup file format.');
        }
      } catch(err) {
        showToast('Error parsing JSON');
      }
    };
    reader.readAsText(file);
  };

  const factoryReset = () => {
    if (confirm("WARNING: This will delete all your data from the browser. A backup will automatically be downloaded first. Are you absolutely sure?")) {
      exportData();
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in">
      <div className="bg-surface border border-border p-8 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-gold font-heading mb-6">Settings</h2>
        
        <div className="space-y-4 mb-8 flex flex-col items-center">
          <div className="w-full">
            <label className="block text-sm text-muted mb-2 font-bold uppercase tracking-widest text-left">UPSC Prelims Exam Date</label>
            <div className="flex justify-center relative z-[100]">
              <DatePicker selectedDate={examDate} onSelectDate={setExamDate} placeholder="Select target exam date..." />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 mb-8">
          <h3 className="text-xl mb-2 font-heading text-gold">Data Management</h3>
          <p className="text-sm text-muted mb-4">Export your data to a JSON file to back it up, or import an existing backup.</p>
          <div className="flex gap-4 mb-6">
            <button className="btn btn-primary" onClick={exportData}>Export Data</button>
            <button className="btn btn-secondary" onClick={()=>document.getElementById('import-file').click()}>Import Data</button>
            <input type="file" id="import-file" className="hidden" accept=".json" onChange={importData} />
          </div>
          <button className="btn btn-danger w-full bg-red text-white hover:bg-red/80" onClick={factoryReset}>
            Factory Reset (Delete All)
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}
