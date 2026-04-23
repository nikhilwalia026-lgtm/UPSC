export const KEYS = {
  subjects:  'subjects',
  topics:    'topics',
  subTopics: 'subtopics',
  streak:    'streak',
  settings:  'settings',
  history:   'history'
};

export const Data = {
  getPrefix: () => 'upsc_',
  get: (key, def = []) => {
    try {
      const pKey = Data.getPrefix() + key;
      let val = localStorage.getItem(pKey);

      // Auto-migrate from any "default_user" or previous owner keys if they got trapped there
      if (!val) {
        const fallbackVal = localStorage.getItem('upsc_default_' + key) || localStorage.getItem('upsc_owner_' + key);
        if (fallbackVal) {
          localStorage.setItem(pKey, fallbackVal);
          val = fallbackVal;
        }
      }

      return val ? JSON.parse(val) : def;
    } catch (e) {
      return def;
    }
  },
  set: (key, val) => {
    const pKey = Data.getPrefix() + key;
    localStorage.setItem(pKey, JSON.stringify(val));
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

