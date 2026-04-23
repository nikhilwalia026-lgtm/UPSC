import { RemoteData } from './remoteData';

export const KEYS = {
  subjects:  'subjects',
  topics:    'topics',
  subTopics: 'subtopics',
  streak:    'streak',
  settings:  'settings',
  history:   'history'
};

export const Data = {
  getPrefix: () => 'upsc_default_',
  // Async getter – tries remote first, falls back to localStorage
  get: async (key, def = []) => {
    if (typeof window === 'undefined') return def;
    const userId = 'default_user';
    const remoteBucket = await RemoteData.load(userId);
    if (remoteBucket && key in remoteBucket) return remoteBucket[key];
    
    const pKey = Data.getPrefix() + key;
    const val = localStorage.getItem(pKey);
    return val ? JSON.parse(val) : def;
  },
  // Async setter – writes locally and pushes whole bucket to remote
  set: async (key, val) => {
    if (typeof window === 'undefined') return;
    const pKey = Data.getPrefix() + key;
    localStorage.setItem(pKey, JSON.stringify(val));
    
    const userId = 'default_user';
    // Build the full payload from known KEYS
    const payload = {};
    Object.values(KEYS).forEach(k => {
      const stored = localStorage.getItem(`upsc_default_${k}`);
      if (stored) payload[k] = JSON.parse(stored);
    });
    // Fire‑and‑forget remote sync
    RemoteData.save(userId, payload);
  },
  generateId: () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
  getTodayStr: () => new Date().toISOString().split('T')[0]
};


export const SM2 = {
  schedule: (subTopic, rating) => {
    let { interval, repetitions, easeFactor } = subTopic;
    
    if (rating < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
    if (interval > 60) interval = 60;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    let status = 'learning';
    if (rating === 1) status = 'difficult';
    else if (rating === 3) status = 'learning';
    else if (rating === 4) status = 'review';
    else if (rating >= 5) status = 'mastered';

    return {
      ...subTopic,
      interval,
      repetitions,
      easeFactor,
      nextReview: nextReview.toISOString().split('T')[0],
      lastReview: Data.getTodayStr(),
      lastRating: rating,
      status
    };
  },

  analyzeDifficulty: (subTopics) => {
    const today = Data.getTodayStr();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    let changed = false;
    const mapped = subTopics.map(st => {
      if (st.lastRating && st.lastRating <= 2 && st.status !== 'difficult') {
        if (st.interval === 1 && st.repetitions === 0 && st.lastReview) {
           st.status = 'difficult';
           st.interval = 1;
           st.nextReview = tomorrowStr;
           changed = true;
        }
      }
      return st;
    });
    if (changed) Data.set(KEYS.subTopics, mapped);
    return mapped;
  }
};

