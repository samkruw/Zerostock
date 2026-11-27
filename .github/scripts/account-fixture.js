// Local adapter for exercising the real sign-in form and auth-state observer.
(() => {
  const profiles = {
    supervisor: {name: 'Testleitung', role: 'admin', active: true},
    worker: {name: 'Testteam', role: 'employee', active: true},
    client: {name: 'Testkunde', role: 'customer', active: true}
  };
  const data = {
    users: profiles,
    cartons: {test: {article: 'PRIVATE-TEST-ARTICLE', name: 'Test', stock: 4}},
    '.info': {connected: true}
  };
  const auth = {currentUser: null};
  let observer;
  const listeners = new Set();
  const snapshot = path => ({val: () => path.split('/').reduce((value, part) => value?.[part], data) ?? null});
  window.fixtureSubscriptions = () => Array.from(listeners, listener => listener.path);
  window.ZeroStockFirebaseNative = {
    app: {initializeApp: options => ({options})},
    auth: {
      getAuth: () => auth,
      setPersistence: async () => {},
      onAuthStateChanged(_, callback) {
        observer = callback;
        callback(auth.currentUser);
      },
      async signInWithEmailAndPassword(_, email, password) {
        const uid = Object.keys(profiles).find(id => email === id + '@example.invalid');
        if (!uid || password !== 'fixture-only') throw Object.assign(Error(), {code: 'auth/invalid-credential'});
        auth.currentUser = {uid, email};
        await observer(auth.currentUser);
      },
      async signOut() {
        auth.currentUser = null;
        await observer(null);
      }
    },
    database: {
      getDatabase: () => ({}),
      ref: (_, path) => path,
      query: path => path,
      limitToLast: count => count,
      get: async path => snapshot(path),
      set: async () => {},
      onValue(path, callback) {
        const listener = {path};
        listeners.add(listener);
        callback(snapshot(path));
        return () => listeners.delete(listener);
      }
    }
  };
})();
