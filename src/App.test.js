import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme, THEME_KEY } from './theme/ThemeProvider';
function Toggle() {
  const { mode, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{mode}</button>;
}
beforeEach(() => {
  localStorage.clear();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});
test('defaults to light and persists a switch to dark', () => {
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'light' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem(THEME_KEY)).toBe('dark');
});
test('restores the saved preference over the system preference', () => {
  localStorage.setItem(THEME_KEY, 'dark');
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
});
test('uses the system theme when no preference is saved', () => {
  window.matchMedia.mockReturnValue({ matches: true });
  render(<ThemeProvider><Toggle /></ThemeProvider>);
  expect(document.documentElement.dataset.theme).toBe('dark');
});
