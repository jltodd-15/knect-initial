/**
 * Ticket 1.4: the onboarding sequence. Step one collects credentials, step two the profile (name,
 * optional bio, interests, the initials avatar). Only one step is on screen at a time. A user who
 * arrives already signed in (a social sign-in, or a resumed signup) skips step one entirely.
 *
 * Ticket 2.3's `submitting` prop still drives the step-two button: 'submitting' is the spinner,
 * 'failed' is TRY AGAIN.
 */

import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react-native';
import CreateProfilePage from '../components/CreateProfilePage';

type Submitting = 'idle' | 'submitting' | 'failed';

// Copied from the ticket, not imported from the component: this is the check that the
// component's list is the ticket's list.
const TICKET_INTERESTS = [
  'Hiking', 'Art', 'Fashion', 'Style', 'Photography', 'Board games', 'Movies', 'TV Shows',
  'Video Games', 'Baking', 'Cooking', 'Fast Food', 'Fine Dining', 'Running', 'Bodybuilding',
  'Camping', 'Outdoors', 'Indoors', 'Music', 'Concerts', 'Dancing', 'Musicals & Theater',
  'Travel', 'Family', 'Pets & Animals', 'Dating', 'Tech', 'Basketball', 'Baseball',
  'Football', 'Hockey', 'Soccer', 'Sports', 'Reading', 'History',
];

const PASSWORD_COPY =
  'Password must be at least 8 characters and include a capital letter and a number';

const EMAIL = 'username@example.com';
const PASSWORD = 'Create a password';
const NAME = 'e.g. Alex Rivera';
const BIO = 'A line about you (optional)';

const renderPage = async (
  props: Partial<React.ComponentProps<typeof CreateProfilePage>> = {},
) => {
  const onComplete = jest.fn();
  const utils = await render(
    <CreateProfilePage onComplete={onComplete} submitting="idle" {...props} />,
  );
  return {onComplete, ...utils};
};

const fillStepOne = async (email = 'a@b.com', password = 'Passw0rd') => {
  await fireEvent.changeText(screen.getByPlaceholderText(EMAIL), email);
  await fireEvent.changeText(screen.getByPlaceholderText(PASSWORD), password);
  await fireEvent.press(screen.getByLabelText('Next'));
};

const renderAtStepTwo = async (submitting: Submitting = 'idle') => {
  const result = await renderPage({submitting});
  await fillStepOne();
  await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex Rivera');
  return result;
};

describe('step machine', () => {
  test('next and back are arrows, not words', async () => {
    await renderPage();
    expect(screen.getByLabelText('Next')).toBeTruthy();
    expect(screen.queryByText('NEXT')).toBeNull();
    await fillStepOne();
    expect(screen.getByLabelText('Back')).toBeTruthy();
    expect(screen.queryByText('BACK')).toBeNull();
  });

  test('starts on step one only', async () => {
    await renderPage();
    expect(screen.getByPlaceholderText(EMAIL)).toBeTruthy();
    expect(screen.queryByPlaceholderText(NAME)).toBeNull();
  });

  test('NEXT with valid credentials hides step one and shows step two', async () => {
    await renderPage();
    await fillStepOne();

    expect(screen.queryByPlaceholderText(EMAIL)).toBeNull();
    expect(screen.queryByPlaceholderText(PASSWORD)).toBeNull();
    expect(screen.queryByLabelText('Next')).toBeNull();
    expect(screen.getByPlaceholderText(NAME)).toBeTruthy();
  });

  test('BACK returns to step one with the email kept, and an edited email is what gets submitted', async () => {
    const {onComplete} = await renderPage();
    await fillStepOne('typo@b.com');

    await fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.queryByPlaceholderText(NAME)).toBeNull();
    expect(screen.getByDisplayValue('typo@b.com')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText(EMAIL), 'fixed@b.com');
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex Rivera');
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

    expect(onComplete).toHaveBeenCalledWith(expect.anything(), {
      email: 'fixed@b.com',
      password: 'Passw0rd',
    });
  });

  test.each<Submitting>(['submitting', 'failed'])(
    'BACK is disabled once the account exists or is being created (%s)',
    async submitting => {
      await renderAtStepTwo(submitting);
      expect(screen.getByTestId('back-button')).toBeDisabled();
    },
  );

  test('BACK is enabled before anything is submitted', async () => {
    await renderAtStepTwo('idle');
    expect(screen.getByTestId('back-button')).toBeEnabled();
  });
});

describe('password rule', () => {
  test.each([
    ['Passw0rd', '8 chars, a capital, a number'],
    ['Passw0rdPassw0rdPassw0rd', '24 chars'],
  ])('%s is accepted (%s)', async password => {
    await renderPage();
    await fillStepOne('a@b.com', password);
    expect(screen.getByPlaceholderText(NAME)).toBeTruthy();
    expect(screen.queryByText(PASSWORD_COPY)).toBeNull();
  });

  test.each([
    ['Passw0r', '7 chars'],
    ['password1', 'no capital'],
    ['Password', 'no number'],
    ['Passw0rdPassw0rdPassw0rdP', '25 chars'],
  ])('%s is rejected (%s), with the rule as the error', async password => {
    await renderPage();
    await fillStepOne('a@b.com', password);
    expect(screen.queryByPlaceholderText(NAME)).toBeNull();
    expect(screen.getByText(PASSWORD_COPY)).toBeTruthy();
  });

  test('the requirements are on screen before anything is submitted', async () => {
    await renderPage();
    expect(screen.getByText('8–24 characters')).toBeTruthy();
    expect(screen.getByText('A capital letter')).toBeTruthy();
    expect(screen.getByText('A number')).toBeTruthy();
    expect(screen.queryByText(PASSWORD_COPY)).toBeNull();
  });
});

describe('interests', () => {
  test('offers exactly the 35 listed values, in order, and no free-text entry', async () => {
    await renderAtStepTwo();
    const offered = screen.getAllByTestId('interest-option').map(el => el.props.children);
    expect(offered).toEqual(TICKET_INTERESTS);
    expect(screen.queryByPlaceholderText('Add an interest...')).toBeNull();
  });

  test('selected interests are submitted verbatim, and tapping again deselects', async () => {
    const {onComplete} = await renderAtStepTwo();
    await fireEvent.press(screen.getByText('Board games'));
    await fireEvent.press(screen.getByText('Musicals & Theater'));
    await fireEvent.press(screen.getByText('TV Shows'));
    await fireEvent.press(screen.getByText('TV Shows')); // deselect

    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

    expect(onComplete.mock.calls[0][0].interests).toEqual(['Board games', 'Musicals & Theater']);
  });

  test('zero selected is a valid finish', async () => {
    const {onComplete} = await renderAtStepTwo();
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));
    expect(onComplete.mock.calls[0][0].interests).toEqual([]);
  });
});

describe('avatar', () => {
  test('step two shows the initials avatar, updating as the name is typed', async () => {
    await renderPage();
    await fillStepOne();
    expect(screen.getByTestId('initials-avatar-fallback')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex');
    expect(screen.getByText('A')).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex Rivera');
    expect(screen.getByText('AR')).toBeTruthy();
  });
});

describe('the handoff', () => {
  test('one profile payload (name, bio, interests, picture), with credentials passed separately', async () => {
    const {onComplete} = await renderAtStepTwo();
    await fireEvent.changeText(screen.getByPlaceholderText(BIO), 'Weekend hiker');
    await fireEvent.press(screen.getByText('Hiking'));
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const [profile, credentials] = onComplete.mock.calls[0];
    expect(profile).toEqual({
      name: 'Alex Rivera',
      bio: 'Weekend hiker',
      interests: ['Hiking'],
      profile_picture_url: '',
    });
    expect(credentials).toEqual({email: 'a@b.com', password: 'Passw0rd'});
  });

  test('bio is optional: COMPLETE PROFILE is enabled with only a name', async () => {
    await renderAtStepTwo();
    expect(screen.getByTestId('complete-button')).toBeEnabled();
  });

  test('COMPLETE PROFILE is disabled without a name', async () => {
    await renderPage();
    await fillStepOne();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
    await fireEvent.changeText(screen.getByPlaceholderText(NAME), '   ');
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});

describe('submitting state (from 2.3)', () => {
  test('submitting: spinner, label swaps, button disabled', async () => {
    await renderAtStepTwo('submitting');
    expect(screen.getByTestId('submit-spinner')).toBeTruthy();
    expect(screen.getByText('SAVING PROFILE...')).toBeTruthy();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
    expect(screen.queryByText('COMPLETE PROFILE')).toBeNull();
  });

  test('idle: no spinner', async () => {
    await renderAtStepTwo('idle');
    expect(screen.queryByTestId('submit-spinner')).toBeNull();
  });

  test('failed: TRY AGAIN, tappable, nothing typed is cleared, and it resubmits the current values', async () => {
    const {onComplete} = await renderAtStepTwo('failed');
    expect(screen.getByTestId('complete-button')).toBeEnabled();
    expect(screen.getByDisplayValue('Alex Rivera')).toBeTruthy();

    await fireEvent.press(screen.getByText('TRY AGAIN'));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Alex Rivera'}),
      {email: 'a@b.com', password: 'Passw0rd'},
    );
  });
});

describe('arriving with an identity (social sign-in, or a resumed signup)', () => {
  test('skips step one, has no BACK, and hands over no credentials', async () => {
    const {onComplete} = await renderPage({identity: {email: 'a@b.com'}});
    expect(screen.queryByPlaceholderText(EMAIL)).toBeNull();
    expect(screen.queryByLabelText('Back')).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex Rivera');
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({name: 'Alex Rivera'}), null);
  });

  test('with a name: does not ask for it, and submits it', async () => {
    const {onComplete} = await renderPage({identity: {email: 'a@b.com', name: 'Alex Rivera'}});
    expect(screen.queryByPlaceholderText(NAME)).toBeNull();
    expect(screen.getByText('Alex Rivera')).toBeTruthy();
    expect(screen.getByText('AR')).toBeTruthy();

    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));
    expect(onComplete.mock.calls[0][0].name).toBe('Alex Rivera');
  });

  test('with a name the user wants to change: CHANGE opens it for editing', async () => {
    const {onComplete} = await renderPage({identity: {email: 'a@b.com', name: 'Alex Rivera'}});
    await fireEvent.press(screen.getByText('CHANGE'));
    expect(screen.getByDisplayValue('Alex Rivera')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText(NAME), 'Alex R.');
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));
    expect(onComplete.mock.calls[0][0].name).toBe('Alex R.');
  });

  test('without a name (e.g. Apple withheld it): asks for it', async () => {
    await renderPage({identity: {email: 'a@b.com', name: null}});
    expect(screen.getByPlaceholderText(NAME)).toBeTruthy();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});

describe('errors from creating the account', () => {
  test('an email error sends the user back to step one and shows it under the email', async () => {
    const {rerender, onComplete} = await renderAtStepTwo();
    await fireEvent.press(screen.getByText('COMPLETE PROFILE'));

    await rerender(
      <CreateProfilePage
        onComplete={onComplete}
        submitting="idle"
        signupError={{target: 'email', message: 'Email already in use'}}
      />,
    );

    expect(screen.getByText('Email already in use')).toBeTruthy();
    expect(screen.getByDisplayValue('a@b.com')).toBeTruthy();
    expect(screen.queryByPlaceholderText(NAME)).toBeNull();
  });

  test('a general error (e.g. no connection) shows on step two', async () => {
    const {rerender, onComplete} = await renderAtStepTwo();
    await rerender(
      <CreateProfilePage
        onComplete={onComplete}
        submitting="idle"
        signupError={{target: 'general', message: 'No internet connection.'}}
      />,
    );

    expect(screen.getByText('No internet connection.')).toBeTruthy();
    expect(screen.getByPlaceholderText(NAME)).toBeTruthy();
  });
});

describe('show/hide password', () => {
  test('the eye button toggles whether the password is hidden', async () => {
    await renderPage();
    const field = () => screen.getByPlaceholderText(PASSWORD);
    expect(field().props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText('Show password'));
    expect(field().props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByLabelText('Hide password'));
    expect(field().props.secureTextEntry).toBe(true);
  });
});
