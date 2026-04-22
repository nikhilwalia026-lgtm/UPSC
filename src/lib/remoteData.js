export const RemoteData = {
  // Load the whole bucket for a user
  async load(userId) {
    try {
      const res = await fetch(`/api/userData?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('network');
      const { payload } = await res.json();
      return payload ?? {};
    } catch (e) {
      console.warn('Remote load failed – fallback to localStorage', e);
      return null;
    }
  },

  // Save the whole bucket for a user
  async save(userId, payload) {
    try {
      const res = await fetch('/api/userData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, payload }),
      });
      if (!res.ok) throw new Error('network');
      return true;
    } catch (e) {
      console.warn('Remote save failed – data stays local', e);
      return false;
    }
  },
};
