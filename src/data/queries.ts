const STORAGE_KEY = "iccb_queries";

export interface Query {
  id: string;
  type: "ask" | "enquiry" | "chat";
  name: string;
  emailOrPhone: string;
  question: string;
  language: string;
  status: "open" | "replied" | "closed";
  assignedTo?: string;
  reply?: string;
  createdAt: string;
  updatedAt: string;
  isSample: boolean;
}

const sampleQueries: Query[] = [
  {
    id: "q-001",
    type: "ask",
    name: "Fatema Begum",
    emailOrPhone: "fatema@email.com",
    question: "What is the capacity of Gulnaksha hall for a banquet-style wedding?",
    language: "en",
    status: "open",
    createdAt: "2026-11-09T14:00:00Z",
    updatedAt: "2026-11-09T14:00:00Z",
    isSample: true,
  },
  {
    id: "q-002",
    type: "ask",
    name: "Rahim Chowdhury",
    emailOrPhone: "+8801712-345678",
    question: "আপনাদের ক্যাটারিং প্যাকেজের দাম কত?",
    language: "bn",
    status: "replied",
    reply: "আমাদের ক্যাটারিং প্যাকেজ প্রতি জনপ্রতি ৮৫০ টাকা থেকে শুরু। বিস্তারিত জানতে +88-02-41091551 নম্বরে যোগাযোগ করুন।",
    createdAt: "2026-11-08T11:00:00Z",
    updatedAt: "2026-11-08T16:30:00Z",
    isSample: true,
  },
];

let _queries: Query[] | null = null;

function loadFromStorage(): Query[] {
  if (typeof window === "undefined") return sampleQueries;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return sampleQueries;
}

function saveToStorage(queries: Query[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
  } catch {}
}

function getQueries(): Query[] {
  if (!_queries) _queries = loadFromStorage();
  return _queries;
}

export const addQuery = (query: Query): void => {
  const queries = getQueries();
  queries.unshift(query);
  _queries = queries;
  saveToStorage(queries);
};

export const updateQuery = (id: string, updates: Partial<Query>): void => {
  const queries = getQueries();
  const idx = queries.findIndex((q) => q.id === id);
  if (idx >= 0) {
    queries[idx] = { ...queries[idx], ...updates, updatedAt: new Date().toISOString() };
    _queries = queries;
    saveToStorage(queries);
  }
};

export const getAllQueries = (): Query[] => getQueries();
