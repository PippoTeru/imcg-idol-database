const STORAGE_KEY = 'user';

export type User = { id: number; nickname: string };

class UserStore {
  current = $state<User | null>(null);

  load() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.current = JSON.parse(saved);
    } catch { /* ignore */ }
  }

  set(user: User) {
    this.current = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  clear() {
    this.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const userStore = new UserStore();
