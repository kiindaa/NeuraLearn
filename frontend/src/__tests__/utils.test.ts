import {
  cn,
  formatDate,
  formatDateTime,
  formatDuration,
  calculateProgress,
  getInitials,
  truncateText,
  generateRandomId,
  debounce,
  throttle,
  validateEmail,
  validatePassword,
  getDifficultyColor,
  getProgressColor,
} from '../utils';

jest.useFakeTimers();

test('format utilities', () => {
  expect(formatDate('2024-01-02')).toMatch(/January|Jan/);
  expect(formatDateTime('2024-01-02')).toContain('2024');
  expect(formatDuration(125)).toBe('2h 5m');
  expect(formatDuration(35)).toBe('35m');
  expect(calculateProgress(3, 5)).toBe(60);
  expect(getInitials('John', 'Doe')).toBe('JD');
  expect(truncateText('hello world', 5)).toBe('hello...');
  expect(getDifficultyColor('easy')).toContain('green');
  expect(getProgressColor(75)).toContain('blue');
});

test('random id and email/password validation', () => {
  expect(validateEmail('a@b.com')).toBe(true);
  const id1 = generateRandomId();
  const id2 = generateRandomId();
  expect(id1).not.toBe(id2);
  const pw = validatePassword('Aa1aaaaa');
  expect(pw.isValid).toBe(true);
});

test('debounce and throttle', () => {
  const fn = jest.fn();
  const deb = debounce(fn, 300);
  deb('x');
  jest.advanceTimersByTime(299);
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);

  const fn2 = jest.fn();
  const thr = throttle(fn2, 500);
  thr('a');
  thr('b');
  expect(fn2).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(500);
  thr('c');
  expect(fn2).toHaveBeenCalledTimes(2);
});
