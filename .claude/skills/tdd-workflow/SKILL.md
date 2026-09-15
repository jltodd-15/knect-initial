---
name: tdd-workflow
description: Test-first workflow for Knect (React Native + Jest). Use whenever a ticket's change touches testable JS/TS behavior — component logic, handlers, utils, hooks. Write a failing test before implementing, then make it pass. Not for native-only or build-config-only changes (Gradle, Kotlin, Swift, Podfile, plist), which are verified by the build and grep instead.
---

# TDD workflow

Knect ships behavior ticket by ticket, and each ticket's acceptance criteria should be provable,
not just plausible. For anything with JS/TS behavior, that proof is a test written *before* the
code that satisfies it — so you know the test is actually checking something, not just passing
because it never could have failed.

## The loop

1. **Write the test first.** It should fail for a specific, legible reason: the behavior doesn't
   exist yet, or the current behavior is what you're replacing. If you can't articulate why it
   currently fails, you don't know what you're testing.
2. **Run it via Bash — `npm test`.** Confirm it fails, and read *why* it failed. A failure from a
   typo or a bad import isn't the same as a failure because the feature is missing; fix setup
   mistakes before moving on, so the red you're looking at is the real one.
3. **Implement the change.**
4. **Run `npm test` again.** Confirm the test now passes, and that you didn't break anything else
   in the file.
5. **Don't call the step done until it's green.** A test you never watched fail is a test you can't
   fully trust — you don't know it would have caught the bug it's supposedly guarding against.

## Repo specifics

- Tests live in `__tests__/`, run via `npm test` (Jest, the `react-native` preset — see
  `jest.config.js`).
- Query and interact through `@testing-library/react-native`, not by walking the
  `react-test-renderer` tree by hand:

  ```tsx
  import {render, fireEvent, screen} from '@testing-library/react-native';

  test('shows an error when the field is empty', () => {
    render(<LoginForm />);
    fireEvent.press(screen.getByText('SUBMIT'));
    expect(screen.getByText(/required/i)).toBeTruthy();
  });
  ```

- Anything driven by `setTimeout`/timers (e.g. `App.tsx`'s `handleAuth`) needs fake timers, and the
  advance needs to be wrapped in `act()` so the state update inside the callback actually flushes
  before you assert:

  ```tsx
  import ReactTestRenderer from 'react-test-renderer';

  jest.useFakeTimers();
  render(<App />);
  fireEvent.press(screen.getByText('SIGN IN'));
  await ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(screen.getByText(/not yet implemented/i)).toBeTruthy();
  jest.useRealTimers();
  ```

- Firestore security rules are a separate track — `npm run test:rules`, needs the emulator running.
  That's rules correctness, not app behavior; it doesn't belong in this loop.

## When this doesn't apply

Not every ticket has JS behavior to red/green. A ticket that only deletes Kotlin files, edits
Gradle, touches a Podfile, or edits an Info.plist has nothing for Jest to exercise — forcing an
artificial test around a file deletion or a build-config line just adds noise. Those changes are
verified the way `CLAUDE.md`'s "Verification" section already describes: a clean build, plus a
targeted `grep` for what should (or shouldn't) be there anymore. This skill is the JS-specific
sibling of that same idea — verify by running something, not by asserting the diff looks right.
