import {doc, getDoc} from '@react-native-firebase/firestore';
import {db} from '../services/firestore';

// Ticket 2.3: bounds the profile-creation write. Firestore's commit() resolves only once the
// server acks; with persistence on (2.1), an offline commit() never rejects — it just hangs
// forever. This is what turns "offline" into a visible, timed-out failure instead of an
// indefinite spinner. Kept out of App.tsx on purpose: that file must never schedule its own
// setTimeout (the old fake-delay pattern this repo is done with), so the real timer lives here.
export const WRITE_TIMEOUT_MS = 15000;

export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Races `promise` against a bounded timer. Settles however `promise` does if it settles first;
// otherwise rejects with TimeoutError once `timeoutMs` elapses. `promise` itself is never
// cancelled (Firestore's commit() can't be aborted) — this only stops the UI from waiting on it.
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// One-time existence check for Users/{uid} — a get(), never an onSnapshot/listener. Uses the
// SDK's default source (server, falling back to cache when offline). A signed-in user's own
// document should already be cached locally (from their own signup write, or a previous read),
// so this resolves even offline in the common case. Rejects — does not resolve false — on a
// genuine read failure (no cache, no connection); callers must not treat a rejection as "missing".
export async function checkUserProfileExists(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'Users', uid));
  return snapshot.exists();
}
