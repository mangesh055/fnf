// Robust Mock Supabase Client using JavaScript Proxy
// This dynamically handles any chain of query calls (e.g. .from().select().eq().order())
// and always resolves to a safe empty response to prevent compile-time/runtime crashes.

const makeSafeChain = (targetVal: any = []): any => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: any) => Promise.resolve({ data: targetVal, error: null }).then(resolve);
      }
      // Chainable methods returning the proxy itself
      if (typeof prop === 'string') {
        return (...args: any[]) => {
          // If it's a terminator like single() or maybeSingle(), return null-ish data instead of array
          if (prop === 'single' || prop === 'maybeSingle') {
            return makeSafeChain(null);
          }
          return makeSafeChain(targetVal);
        };
      }
      return target[prop];
    }
  };
  return new Proxy(() => {}, handler);
};

export const supabase = {
  auth: {
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
    getChannels: () => [],
    removeChannel: () => {},
    channel: () => ({
      on: () => ({
        subscribe: () => {}
      })
    })
  },
  from: (tableName: string) => {
    // Return a proxy that intercepts all subsequent calls like select, eq, order, limit
    return makeSafeChain([]);
  }
} as any;

export default supabase;
