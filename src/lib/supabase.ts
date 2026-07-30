// Robust Mock Supabase Client mapping to MongoDB Backend via API Gateway
// This translates Supabase chains (.from().select().eq()) into microservices HTTP calls.

import { gatewayFetch } from './apiGateway';

class MockSupabaseQuery {
  private tableName: string;
  private operation: 'select' | 'insert' | 'upsert' | 'update' | 'delete';
  private payload: any;
  private filters: Array<(item: any) => boolean>;
  private rawFilters: Array<{ column: string; value: any }>;
  private sortCol: string | null;
  private sortAscending: boolean;
  private limitCount: number | null;
  private isSingle: boolean;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.operation = 'select';
    this.payload = null;
    this.filters = [];
    this.rawFilters = [];
    this.sortCol = null;
    this.sortAscending = true;
    this.limitCount = null;
    this.isSingle = false;
  }

  // Load table data from LocalStorage (Fallback)
  private getTableData(): any[] {
    try {
      const data = localStorage.getItem(`mock_sb_${this.tableName}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Save table data to LocalStorage (Fallback)
  private setTableData(data: any[]) {
    try {
      localStorage.setItem(`mock_sb_${this.tableName}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to write mock Supabase state:', e);
    }
  }

  select(fields?: string) {
    this.operation = 'select';
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.payload = data;
    return this;
  }

  upsert(data: any) {
    this.operation = 'upsert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.rawFilters.push({ column, value });
    this.filters.push((item) => String(item[column]) === String(value));
    return this;
  }

  in(column: string, values: any[]) {
    this.rawFilters.push({ column, value: values });
    const stringValues = values.map(v => String(v));
    this.filters.push((item) => stringValues.includes(String(item[column])));
    return this;
  }

  or(queryStr: string) {
    this.filters.push((item) => {
      const parts = queryStr.split(',');
      return parts.some(part => {
        const match = part.match(/(\w+)\.ilike\.%?([^%]+)%?/);
        if (match) {
          const [_, col, val] = match;
          return String(item[col] || '').toLowerCase().includes(val.toLowerCase());
        }
        return true;
      });
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sortCol = column;
    this.sortAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any) {
    // Map table names to gatewayFetch endpoints
    const tableMapping: Record<string, string> = {
      mess_menus: '/messes/menus',
      mess_plans: '/messes/plans',
      student_subscriptions: '/messes/subscriptions',
      mess_payment_settings: '/messes/payment-settings',
      mess_transactions: '/messes/transactions',
      student_attendance: '/messes/attendance',
      messes: '/messes',
      platform_feedback: '/community/feedback'
    };

    if (tableMapping[this.tableName]) {
      const endpoint = tableMapping[this.tableName];
      console.log(`[Supabase Mock Proxy] Table "${this.tableName}" mapped to endpoint "${endpoint}". Operation: ${this.operation}`);

      // POST / INSERT / UPSERT
      if (this.operation === 'insert' || this.operation === 'upsert') {
        const body = this.payload;
        console.log(`[Supabase Mock Proxy] Sending POST to ${endpoint} with body:`, body);
        const res = await gatewayFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        console.log(`[Supabase Mock Proxy] POST to ${endpoint} returned success:`, res.success);
        return resolve({ 
          data: res.success ? res.data : null, 
          error: res.success ? null : { message: res.error || 'Failed to save data' } 
        });
      }

      // PUT / UPDATE
      if (this.operation === 'update') {
        let idVal = '';
        for (const filter of this.rawFilters) {
          if (filter.column === 'id') idVal = filter.value;
        }
        
        const path = idVal ? `${endpoint}/${idVal}` : endpoint;
        console.log(`[Supabase Mock Proxy] Sending PUT to ${path} with body:`, this.payload);
        const res = await gatewayFetch(path, {
          method: 'PUT',
          body: JSON.stringify(this.payload)
        });
        console.log(`[Supabase Mock Proxy] PUT to ${path} returned success:`, res.success);
        return resolve({ 
          data: res.success ? res.data : null, 
          error: res.success ? null : { message: res.error || 'Failed to update data' } 
        });
      }

      // DELETE
      if (this.operation === 'delete') {
        let idVal = '';
        for (const filter of this.rawFilters) {
          if (filter.column === 'id') idVal = filter.value;
        }
        if (idVal) {
          console.log(`[Supabase Mock Proxy] Sending DELETE to ${endpoint}/${idVal}`);
          const res = await gatewayFetch(`${endpoint}/${idVal}`, {
            method: 'DELETE'
          });
          console.log(`[Supabase Mock Proxy] DELETE returned success:`, res.success);
          return resolve({ 
            data: res.success ? res.data : null, 
            error: res.success ? null : { message: res.error || 'Failed to delete data' } 
          });
        }
      }

      // SELECT
      if (this.operation === 'select') {
        const params = new URLSearchParams();
        for (const filter of this.rawFilters) {
          if (filter.column === 'owner_id') params.append('owner_id', filter.value);
          if (filter.column === 'mess_id') params.append('mess_id', filter.value);
          if (filter.column === 'student_id') params.append('student_id', filter.value);
          if (filter.column === 'date') params.append('date', filter.value);
        }
        const queryString = params.toString() ? `?${params.toString()}` : '';
        console.log(`[Supabase Mock Proxy] Sending GET to ${endpoint}${queryString}`);
        const res = await gatewayFetch(`${endpoint}${queryString}`);
        console.log(`[Supabase Mock Proxy] GET returned success:`, res.success, `data count:`, res.data?.length);
        
        let result = res.success ? res.data : [];
        if (!Array.isArray(result)) {
          result = result ? [result] : [];
        }

        // Apply sorting
        if (this.sortCol && result.length > 0) {
          const col = this.sortCol;
          const asc = this.sortAscending ? 1 : -1;
          result.sort((a: any, b: any) => {
            const valA = a[col];
            const valB = b[col];
            if (valA < valB) return -1 * asc;
            if (valA > valB) return 1 * asc;
            return 0;
          });
        }

        // Apply limit
        if (this.limitCount !== null) {
          result = result.slice(0, this.limitCount);
        }

        // Apply single
        if (this.isSingle) {
          result = result.length > 0 ? result[0] : null;
        }

        return resolve({ 
          data: result, 
          error: res.success ? null : { message: res.error || 'Failed to fetch data' } 
        });
      }
    }

    // LocalStorage Fallback database engine
    let data = this.getTableData();

    if (this.operation === 'insert') {
      const newItems = Array.isArray(this.payload) ? this.payload : [this.payload];
      data = [...newItems, ...data];
      this.setTableData(data);
      return resolve({ data: this.payload, error: null });
    }

    if (this.operation === 'upsert') {
      const upsertItems = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const item of upsertItems) {
        const id = item.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        if (!item.id) item.id = id;
        
        const idx = data.findIndex((d) => String(d.id) === String(id));
        if (idx !== -1) {
          data[idx] = { ...data[idx], ...item };
        } else {
          data.unshift(item);
        }
      }
      this.setTableData(data);
      return resolve({ data: this.payload, error: null });
    }

    if (this.operation === 'update') {
      data = data.map((item) => {
        const matches = this.filters.every(f => f(item));
        if (matches) {
          return { ...item, ...this.payload };
        }
        return item;
      });
      this.setTableData(data);
      return resolve({ data: this.payload, error: null });
    }

    if (this.operation === 'delete') {
      data = data.filter((item) => {
        const matches = this.filters.every(f => f(item));
        return !matches;
      });
      this.setTableData(data);
      return resolve({ data: [], error: null });
    }

    // Select operation filters
    if (this.filters.length > 0) {
      data = data.filter(item => this.filters.every(f => f(item)));
    }

    // Sorting
    if (this.sortCol) {
      const col = this.sortCol;
      const asc = this.sortAscending ? 1 : -1;
      data.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA < valB) return -1 * asc;
        if (valA > valB) return 1 * asc;
        return 0;
      });
    }

    // Limit
    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    // Single
    let result: any = data;
    if (this.isSingle) {
      result = data.length > 0 ? data[0] : null;
    }

    return resolve({ data: result, error: null });
  }
}

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
    return new MockSupabaseQuery(tableName);
  }
} as any;

export default supabase;
