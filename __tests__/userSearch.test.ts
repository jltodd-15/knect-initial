/**
 * Ticket 4.3: the user search's logic, with no Firestore and no React.
 *
 * Everything here can be wrong without looking wrong on a screen: a query fired a keystroke too
 * early, a bound built from the un-lowercased text, a slow old answer painted over a newer one.
 * The Firestore wrapper and the screen only wire these functions together.
 */

import {
  DEBOUNCE_MS,
  MIN_QUERY_LENGTH,
  RESULT_LIMIT,
  buildNameBounds,
  createLatestTracker,
  createSearchScheduler,
  excludeSelf,
} from '../services/userSearch';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const scheduler = () => {
  const runQuery = jest.fn();
  const onBelowMinimum = jest.fn();
  return {runQuery, onBelowMinimum, ...createSearchScheduler(runQuery, onBelowMinimum)};
};

test('the cost controls are the ticket\'s numbers', () => {
  expect(MIN_QUERY_LENGTH).toBe(3);
  expect(DEBOUNCE_MS).toBe(300);
  expect(RESULT_LIMIT).toBe(10);
});

test('2 characters produce no query', () => {
  const s = scheduler();

  s.input('ky');
  jest.advanceTimersByTime(DEBOUNCE_MS * 10);

  expect(s.runQuery).not.toHaveBeenCalled();
  expect(s.onBelowMinimum).toHaveBeenCalled();
});

test('3 characters produce exactly one query', () => {
  const s = scheduler();

  s.input('kys');
  jest.advanceTimersByTime(DEBOUNCE_MS * 10);

  expect(s.runQuery).toHaveBeenCalledTimes(1);
  expect(s.runQuery).toHaveBeenCalledWith('kys');
});

test('nothing is queried before the 300ms debounce has passed', () => {
  const s = scheduler();

  s.input('kys');
  jest.advanceTimersByTime(DEBOUNCE_MS - 1);
  expect(s.runQuery).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);
  expect(s.runQuery).toHaveBeenCalledTimes(1);
});

test('five keystrokes inside 300ms produce one query, not five', () => {
  const s = scheduler();

  for (const text of ['kys', 'kyso', 'kyson', 'kyson ', 'kyson c']) {
    s.input(text);
    jest.advanceTimersByTime(50);
  }
  jest.advanceTimersByTime(DEBOUNCE_MS);

  expect(s.runQuery).toHaveBeenCalledTimes(1);
  expect(s.runQuery).toHaveBeenCalledWith('kyson c');
});

test('deleting back under 3 characters cancels the query that was waiting', () => {
  const s = scheduler();

  s.input('kys');
  jest.advanceTimersByTime(100);
  s.input('ky');
  jest.advanceTimersByTime(DEBOUNCE_MS * 10);

  expect(s.runQuery).not.toHaveBeenCalled();
});

test('spaces around the text do not count toward the 3 characters', () => {
  const s = scheduler();

  s.input('   ');
  s.input(' ky ');
  jest.advanceTimersByTime(DEBOUNCE_MS * 10);

  expect(s.runQuery).not.toHaveBeenCalled();
});

test('cancel() drops a query that was waiting', () => {
  const s = scheduler();

  s.input('kys');
  s.cancel();
  jest.advanceTimersByTime(DEBOUNCE_MS * 10);

  expect(s.runQuery).not.toHaveBeenCalled();
});

test('"KYS" and "kys" produce identical query bounds', () => {
  expect(buildNameBounds('KYS')).toEqual(buildNameBounds('kys'));
  expect(buildNameBounds('KYS').start).toBe('kys');
});

test('the upper bound is the lowercased input plus \\uf8ff', () => {
  expect(buildNameBounds('Kys').end).toBe('kys');
  expect(buildNameBounds('Kys').end).toHaveLength(4);
});

test('the bounds ignore spaces around the text but keep the one inside a name', () => {
  expect(buildNameBounds('  John S ')).toEqual({start: 'john s', end: 'john s'});
});

test('a result set containing the signed-in user comes back one shorter, without them', () => {
  const results = [
    {uid: 'a', name: 'Kyson A'},
    {uid: 'me', name: 'Kyson Childs'},
    {uid: 'b', name: 'Kyson B'},
  ];

  const filtered = excludeSelf(results, 'me');

  expect(filtered).toHaveLength(results.length - 1);
  expect(filtered.map(r => r.uid)).toEqual(['a', 'b']);
});

test('a result set without the signed-in user comes back unchanged', () => {
  const results = [{uid: 'a', name: 'Kyson A'}];

  expect(excludeSelf(results, 'me')).toEqual(results);
});

test('a response for an older search that arrives after a newer one is ignored', () => {
  const tracker = createLatestTracker();

  const older = tracker.start();
  const newer = tracker.start();

  // The newer search answers first, then the older, slower one comes back.
  expect(tracker.isLatest(newer)).toBe(true);
  expect(tracker.isLatest(older)).toBe(false);
});

test('invalidate() makes every search already in flight stale', () => {
  const tracker = createLatestTracker();

  const inFlight = tracker.start();
  tracker.invalidate();

  expect(tracker.isLatest(inFlight)).toBe(false);
});
