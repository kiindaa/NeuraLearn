import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';

it('Button renders and clicks', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Click</Button>);
  fireEvent.click(screen.getByText('Click'));
  expect(onClick).toHaveBeenCalled();
});

it('Input renders with label and error', () => {
  render(<Input label="Email" error="Invalid" />);
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Invalid')).toBeInTheDocument();
});

it('Logo renders', () => {
  render(<Logo />);
  expect(screen.getByText(/NeuraLearn/i)).toBeInTheDocument();
});
