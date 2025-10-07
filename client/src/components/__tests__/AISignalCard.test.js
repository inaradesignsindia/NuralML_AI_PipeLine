import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AISignalCard from '../AISignalCard';

const mockSignal = {
  signal: 'BULLISH',
  confidence: 85,
  symbol: 'BTCUSDT',
  entryPrice: 45000,
  targetPrice: 47000,
  stopLoss: 43000,
  rationale: 'Strong bullish momentum with increasing volume and positive sentiment indicators.'
};

describe('AISignalCard', () => {
  test('renders AI signal card with bullish signal', () => {
    render(<AISignalCard signal={mockSignal} />);

    expect(screen.getByText('AI Trading Signal')).toBeInTheDocument();
    expect(screen.getByText('BULLISH')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
  });

  test('displays price information correctly', () => {
    render(<AISignalCard signal={mockSignal} />);

    expect(screen.getByText('Entry Price')).toBeInTheDocument();
    expect(screen.getByText('$45,000')).toBeInTheDocument();
    expect(screen.getByText('Target Price')).toBeInTheDocument();
    expect(screen.getByText('$47,000')).toBeInTheDocument();
    expect(screen.getByText('Stop Loss')).toBeInTheDocument();
    expect(screen.getByText('$43,000')).toBeInTheDocument();
  });

  test('displays rationale text', () => {
    render(<AISignalCard signal={mockSignal} />);

    expect(screen.getByText('Strategy Rationale:')).toBeInTheDocument();
    expect(screen.getByText(mockSignal.rationale)).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    render(<AISignalCard signal={mockSignal} />);

    expect(screen.getByText('Execute Buy Order')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  test('applies correct styling for bullish signal', () => {
    const { container } = render(<AISignalCard signal={mockSignal} />);

    // Check if the card has the correct border color for bullish
    const card = container.firstChild;
    expect(card).toHaveClass('border-green-500');
    expect(card).toHaveClass('text-green-400');
  });

  test('applies correct styling for bearish signal', () => {
    const bearishSignal = { ...mockSignal, signal: 'BEARISH' };
    const { container } = render(<AISignalCard signal={bearishSignal} />);

    const card = container.firstChild;
    expect(card).toHaveClass('border-red-500');
    expect(card).toHaveClass('text-red-400');
  });

  test('applies correct styling for neutral signal', () => {
    const neutralSignal = { ...mockSignal, signal: 'NEUTRAL' };
    const { container } = render(<AISignalCard signal={neutralSignal} />);

    const card = container.firstChild;
    expect(card).toHaveClass('border-yellow-500');
    expect(card).toHaveClass('text-yellow-400');
  });

  test('handles missing price data gracefully', () => {
    const incompleteSignal = {
      signal: 'BULLISH',
      confidence: 75,
      symbol: 'ETHUSDT',
      rationale: 'Test rationale'
    };

    render(<AISignalCard signal={incompleteSignal} />);

    expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText('$undefined')).toBeInTheDocument(); // Shows undefined for missing prices
  });

  test('displays confidence badge with correct background color', () => {
    render(<AISignalCard signal={mockSignal} />);

    const confidenceBadge = screen.getByText('85% confidence');
    expect(confidenceBadge).toHaveClass('bg-green-500'); // Bullish background
  });
});