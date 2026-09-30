import { MOCK_PROFILES } from "../mockData";
type Ref = { name: string; id?: string; constraints?: any[] };
type Store = Record<string, Record<string, any>>;
const key = "hackwarts-demo-v1";
let memory: Store | undefined;
function read(): Store {
  if (memory) return memory;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.users && parsed.swaps && parsed.messages && parsed.reviews)
        return (memory = parsed);
    }
  } catch {}
  return (memory = {
    users: Object.fromEntries(MOCK_PROFILES.map((p) => [p.id, p])),
    swaps: {},
    messages: {},
    reviews: {},
  });
}
const listeners = new Set<() => void>();
function persist(next: Store) {
  localStorage.setItem(key, JSON.stringify(next));
  memory = next;
  listeners.forEach((fn) => fn());
}
export const collection = (_: any, name: string): Ref => ({ name });
export function doc(parent: any, name?: string, id?: string): Ref {
  return parent?.name
    ? { name: parent.name, id: name || crypto.randomUUID() }
    : { name: name!, id: id! };
}
export const where = (field: string, op: string, value: any) => ({
  type: "where",
  field,
  op,
  value,
});
export const orderBy = (field: string, direction = "asc") => ({
  type: "order",
  field,
  direction,
});
export const limit = (count: number) => ({ type: "limit", count });
export const query = (ref: Ref, ...constraints: any[]) => ({
  ...ref,
  constraints,
});
export const increment = (amount: number) => ({ __increment: amount });
function snapshot(ref: Ref, store = read()): any {
  if (ref.id) {
    const data = store[ref.name]?.[ref.id];
    return { id: ref.id, exists: () => !!data, data: () => data };
  }
  let docs = Object.entries(store[ref.name] || {}).map(([id, data]) => ({
    id,
    data: () => data,
  }));
  for (const c of ref.constraints || []) {
    if (c.type === "where")
      docs = docs.filter((d) =>
        c.op === "=="
          ? d.data()[c.field] === c.value
          : c.op === "in"
            ? c.value.includes(d.data()[c.field])
            : false,
      );
    if (c.type === "order")
      docs.sort((a, b) => {
        const x = a.data()[c.field],
          y = b.data()[c.field];
        return (
          (x === y ? 0 : x < y ? -1 : 1) * (c.direction === "desc" ? -1 : 1)
        );
      });
    if (c.type === "limit") docs = docs.slice(0, c.count);
  }
  return {
    docs,
    empty: !docs.length,
    size: docs.length,
    forEach: (fn: any) => docs.forEach(fn),
  };
}
export const getDoc = async (ref: Ref) => snapshot(ref);
export const getDocs = getDoc;
export function onSnapshot(ref: Ref, next: any, error?: any) {
  const fn = () => {
    try {
      next(snapshot(ref));
    } catch (e) {
      error?.(e);
    }
  };
  listeners.add(fn);
  queueMicrotask(fn);
  return () => {
    listeners.delete(fn);
  };
}
function apply(store: Store, ref: Ref, data: any, merge = false) {
  store[ref.name] ??= {};
  const previous = store[ref.name][ref.id!] || {};
  const resolved = Object.fromEntries(
    Object.entries(data).map(([k, v]: [string, any]) => [
      k,
      v && typeof v === "object" && "__increment" in v
        ? (previous[k] || 0) + v.__increment
        : v,
    ]),
  );
  store[ref.name][ref.id!] = merge ? { ...previous, ...resolved } : resolved;
}
export async function setDoc(ref: Ref, data: any, options?: any) {
  const next = structuredClone(read());
  apply(next, ref, data, options?.merge);
  persist(next);
}
export async function updateDoc(ref: Ref, data: any) {
  if (!read()[ref.name]?.[ref.id!]) throw new Error("Record not found");
  return setDoc(ref, data, { merge: true });
}
export async function addDoc(ref: Ref, data: any) {
  const item = doc(ref);
  await setDoc(item, data);
  return item;
}
export function writeBatch(_: any) {
  const changes: any[] = [];
  return {
    set: (r: Ref, d: any) => changes.push([r, d, false]),
    update: (r: Ref, d: any) => changes.push([r, d, true]),
    commit: async () => {
      const next = structuredClone(read());
      changes.forEach(([r, d, m]) => apply(next, r, d, m));
      persist(next);
    },
  };
}
let queue: Promise<any> = Promise.resolve();
export function runTransaction(_: any, fn: any): Promise<any> {
  const run = queue.then(async () => {
    const next = structuredClone(read());
    const tx = {
      get: async (r: Ref) => snapshot(r, next),
      set: (r: Ref, d: any) => apply(next, r, d),
      update: (r: Ref, d: any) => {
        if (!next[r.name]?.[r.id!]) throw new Error("Record not found");
        apply(next, r, d, true);
      },
    };
    const result = await fn(tx);
    persist(next);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
