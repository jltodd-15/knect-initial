// Ticket 4.3: the user search's logic as plain functions. No Firestore and no React in this file,
// so every rule below is tested on its own (__tests__/userSearch.test.ts).
// services/UserSearchService.ts is the Firestore wrapper that uses them.

// No read until this many characters are typed, and none until the typing has paused this long.
// Both exist to save database reads.
export const MIN_QUERY_LENGTH = 3;
export const DEBOUNCE_MS = 300;
export const RESULT_LIMIT = 10;

// A very high Unicode character: every string that starts with q sorts below q + this.
const HIGH_CHARACTER = '';

export interface UserSearchResult {
  uid: string;
  name: string;
}

// Lowercased to match the stored name_lowercase field. Spaces around the text are dropped: a
// leading one would match no stored name, and three of them are not a search.
const normalize = (text: string): string => text.trim().toLowerCase();

// The 3-character gate: anything shorter is not a search and costs no read.
export const isSearchable = (text: string): boolean => normalize(text).length >= MIN_QUERY_LENGTH;

// The range that covers every name_lowercase starting with what was typed: >= start, < end.
// Prefix-only on purpose: "smith" does not find "John Smith".
export const buildNameBounds = (text: string): {start: string; end: string} => {
  const q = normalize(text);
  return {start: q, end: q + HIGH_CHARACTER};
};

// Fed every keystroke. Calls runQuery once the text is long enough and the typing has paused, and
// onBelowMinimum straight away when it is too short to search, dropping any query still waiting.
export const createSearchScheduler = (
  runQuery: (text: string) => void,
  onBelowMinimum: () => void,
): {input: (text: string) => void; cancel: () => void} => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const input = (text: string) => {
    cancel();
    if (!isSearchable(text)) {
      onBelowMinimum();
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      runQuery(text);
    }, DEBOUNCE_MS);
  };

  return {input, cancel};
};

// Done on the phone, after the read: Firestore can't combine != with a range on the same field.
// A search can therefore show one fewer than it fetched.
export const excludeSelf = (results: UserSearchResult[], selfUid: string): UserSearchResult[] =>
  results.filter(result => result.uid !== selfUid);

// Only the latest search's results render. Each search takes a ticket when it starts and checks
// it when its answer comes back; an older, slower answer finds its ticket stale and is dropped.
export const createLatestTracker = (): {
  start: () => number;
  isLatest: (ticket: number) => boolean;
  invalidate: () => void;
} => {
  let latest = 0;
  return {
    start: () => ++latest,
    isLatest: ticket => ticket === latest,
    invalidate: () => {
      latest++;
    },
  };
};
