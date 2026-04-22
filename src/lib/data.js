export const KEYS = {
  subjects:  'subjects',
  topics:    'topics',
  subTopics: 'subtopics',
  streak:    'streak',
  settings:  'settings',
  history:   'history'
};

export const Data = {
  getPrefix: () => window.CURRENT_USER_ID ? `upsc_${window.CURRENT_USER_ID}_` : 'upsc_',
  get: (key, def = []) => {
    try {
      const pKey = Data.getPrefix() + key;
      let val = localStorage.getItem(pKey);
      
      // Auto-migrate old un-namespaced data for seamless transition
      if (!val && window.CURRENT_USER_ID) {
        const oldVal = localStorage.getItem('upsc_' + key);
        if (oldVal) {
          localStorage.setItem(pKey, oldVal);
          val = oldVal;
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

export const AuthStore = {
  getUsers: () => {
    try {
      const users = localStorage.getItem('upsc_auth_users');
      return users ? JSON.parse(users) : [];
    } catch { return []; }
  },
  saveUsers: (users) => localStorage.setItem('upsc_auth_users', JSON.stringify(users)),
  login: (username, password) => {
    const users = AuthStore.getUsers();
    return users.find(u => u.username === username && u.password === password) || null;
  },
  register: (username, password) => {
    const users = AuthStore.getUsers();
    if (users.find(u => u.username === username)) return null;
    const newUser = { id: Data.generateId(), username, password, role: username === 'owner' ? 'admin' : 'user' };
    users.push(newUser);
    AuthStore.saveUsers(users);
    return newUser;
  },
  deleteUser: (id) => {
    const users = AuthStore.getUsers();
    AuthStore.saveUsers(users.filter(u => u.id !== id));
    
    const prefix = `upsc_${id}_`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    }
  }
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

// Ensure a master owner account exists on first load
(function ensureOwner(){
  const users = AuthStore.getUsers();
  const ownerExists = users.some(u=>u.username==='owner');
  if(!ownerExists){
    const ownerUser = { id: Data.generateId(), username: 'owner', password: 'owner123', role: 'admin' };
    users.push(ownerUser);
    AuthStore.saveUsers(users);
    console.log('Owner account created');
  }
})();
