import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DatePicker({ selectedDate, onSelectDate, placeholder = "Select date...", allowPast = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(year, month - 1, 1)); };
  const nextMonth = (e) => { e.stopPropagation(); setCurrentDate(new Date(year, month + 1, 1)); };

  const handleDateClick = (day, e) => {
    e.stopPropagation();
    const d = new Date(year, month, day);
    const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    onSelectDate(iso);
    setIsOpen(false);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayIso = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-left flex items-center hover:bg-white/5 transition-colors focus:outline-none focus:border-primary/50 font-medium h-[50px]"
      >
        <span className={selectedDate ? 'text-white truncate' : 'text-muted truncate'}>{selectedDate || placeholder}</span>
      </button>
      {selectedDate ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSelectDate(''); setIsOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors z-10">✕</button>
      ) : (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted opacity-70 pointer-events-none">📅</span>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute top-[calc(100%+8px)] right-0 sm:left-0 mt-0 z-[100] glass-panel bg-[#1a1b26]/95 backdrop-blur-2xl p-4 rounded-2xl w-[280px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none"
          >
            <div className="flex justify-between items-center mb-4 px-1 relative z-10">
              <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 transition-colors text-muted hover:text-white border border-white/5">&larr;</button>
              <span className="font-display font-semibold text-[15px] text-white/90">{monthNames[month]} {year}</span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 transition-colors text-muted hover:text-white border border-white/5">&rarr;</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center relative z-10">
              {dayNames.map(d => (
                <span key={d} className="text-[9px] font-bold uppercase tracking-wider text-muted">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 relative z-10">
              {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
              {days.map(day => {
                const d = new Date(year, month, day);
                const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const isSelected = selectedDate === iso;
                const isToday = todayIso === iso;
                const isPast = !allowPast && iso < todayIso;

                return (
                  <button 
                    type="button"
                    key={day}
                    disabled={isPast}
                    onClick={(e) => handleDateClick(day, e)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200
                      ${isPast ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10 hover:scale-110'}
                      ${isSelected ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 z-10 ring-1 ring-primary/50' : ''}
                      ${isToday && !isSelected ? 'text-primary border border-primary/20 bg-primary/5' : ''}
                      ${!isSelected && !isPast && !isToday ? 'text-white/80' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
