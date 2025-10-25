import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { ProgressBar, CircularProgress, Badge } from '../components/ui/Progress';
import { KpiTile } from '../components/ui/KpiTile';
import { BookOpen } from 'lucide-react';

it('Card renders header, content, and footer', () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Foot</CardFooter>
    </Card>
  );
  expect(screen.getByText('Title')).toBeInTheDocument();
  expect(screen.getByText('Body')).toBeInTheDocument();
  expect(screen.getByText('Foot')).toBeInTheDocument();
});

it('ProgressBar and CircularProgress render labels', () => {
  const { rerender } = render(<ProgressBar value={50} showLabel label="Half" />);
  expect(screen.getByText('Half')).toBeInTheDocument();
  rerender(<CircularProgress value={75} showLabel label="75%" />);
  expect(screen.getByText('75%')).toBeInTheDocument();
});

it('Badge renders text', () => {
  render(<Badge variant="success">Done</Badge>);
  expect(screen.getByText('Done')).toBeInTheDocument();
});

it('KpiTile renders title and value', () => {
  render(<KpiTile label="Courses" value={3} icon={<BookOpen />} />);
  expect(screen.getByText('Courses')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});
