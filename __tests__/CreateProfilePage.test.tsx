/**
 * Ticket 2.3: the `submitting` prop drives the step-2 submit button only. Everything else on
 * this screen (the step machine, validation, the interests picker) is 1.4's and untouched here.
 */

import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react-native';
import CreateProfilePage from '../components/CreateProfilePage';

const noop = () => {};

// Drives the form to step 2 (name/role/COMPLETE PROFILE), where the submitting prop applies.
const renderAtStep2 = async (submitting: 'idle' | 'submitting' | 'failed' = 'idle') => {
  await render(<CreateProfilePage isDarkMode={false} onComplete={noop} submitting={submitting} />);
  await fireEvent.changeText(screen.getByPlaceholderText('username@example.com'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('correcthorsebatterystaple'), 'password123');
  await fireEvent.press(screen.getByText('NEXT'));
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Alex Rivera'), 'Alex Rivera');
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Digital Nomad • SF'), 'Digital Nomad');
};

test('idle: shows COMPLETE PROFILE, enabled once name and role are filled', async () => {
  await renderAtStep2('idle');

  const button = screen.getByText('COMPLETE PROFILE');
  expect(button).toBeTruthy();
  expect(button.parent?.props.accessibilityState?.disabled).toBe(false);
});

test('idle: disabled when name or role is empty, regardless of submitting', async () => {
  await render(<CreateProfilePage isDarkMode={false} onComplete={noop} submitting="idle" />);
  await fireEvent.changeText(screen.getByPlaceholderText('username@example.com'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('correcthorsebatterystaple'), 'password123');
  await fireEvent.press(screen.getByText('NEXT'));

  const button = screen.getByText('COMPLETE PROFILE');
  expect(button.parent?.props.accessibilityState?.disabled).toBe(true);
});

test('submitting: label swaps and the button disables even with a valid name and role', async () => {
  await renderAtStep2('submitting');

  const button = screen.getByText('SAVING PROFILE...');
  expect(button.parent?.props.accessibilityState?.disabled).toBe(true);
  expect(screen.queryByText('COMPLETE PROFILE')).toBeNull();
});

test('failed: shows TRY AGAIN and stays tappable, with nothing the user typed cleared', async () => {
  await renderAtStep2('failed');

  const button = screen.getByText('TRY AGAIN');
  expect(button.parent?.props.accessibilityState?.disabled).toBe(false);
  expect(screen.getByDisplayValue('Alex Rivera')).toBeTruthy();
  expect(screen.getByDisplayValue('Digital Nomad')).toBeTruthy();
});

test('failed: tapping the button still calls onComplete with the current form values', async () => {
  const onComplete = jest.fn();
  await render(<CreateProfilePage isDarkMode={false} onComplete={onComplete} submitting="failed" />);
  await fireEvent.changeText(screen.getByPlaceholderText('username@example.com'), 'a@b.com');
  await fireEvent.changeText(screen.getByPlaceholderText('correcthorsebatterystaple'), 'password123');
  await fireEvent.press(screen.getByText('NEXT'));
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Alex Rivera'), 'Alex Rivera');
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. Digital Nomad • SF'), 'Digital Nomad');

  await fireEvent.press(screen.getByText('TRY AGAIN'));

  expect(onComplete).toHaveBeenCalledWith(
    expect.objectContaining({name: 'Alex Rivera', role: 'Digital Nomad', email: 'a@b.com'}),
  );
});
