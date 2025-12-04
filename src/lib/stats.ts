/**
 * Calculates statistical measures for an array of numeric values.
 * Returns mean, standard deviation (sample), median, Q1 (25th percentile), and Q3 (75th percentile).
 */
export function computeStats(values: number[]): {
  mean: number;
  stdev: number;
  median: number;
  q1: number;
  q3: number;
} {
  // Edge case: empty array
  if (values.length === 0) {
    return { mean: 0, stdev: 0, median: 0, q1: 0, q3: 0 };
  }

  // Edge case: single element
  if (values.length === 1) {
    const val = values[0];
    return { mean: val, stdev: 0, median: val, q1: val, q3: val };
  }

  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Calculate sample standard deviation (divide by n-1)
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);
  const variance = values.length > 1 ? sumSquaredDiffs / (values.length - 1) : 0;
  const stdev = Math.sqrt(variance);

  // Sort array ascending (don't mutate original)
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate median
  const medianValue = median(sorted);

  // Calculate Q1 and Q3 using median-of-halves approach
  let q1: number;
  let q3: number;

  if (n === 2) {
    // Two elements: Q1 = min, Q3 = max
    q1 = sorted[0];
    q3 = sorted[1];
  } else if (n === 3) {
    // Three elements: Q1 = min, Q3 = max
    q1 = sorted[0];
    q3 = sorted[2];
  } else {
    // Four or more elements: use median-of-halves
    const mid = Math.floor(n / 2);
    const isOdd = n % 2 === 1;

    // Lower half (for Q1)
    const lowerHalf = isOdd ? sorted.slice(0, mid) : sorted.slice(0, mid);
    q1 = median(lowerHalf);

    // Upper half (for Q3)
    const upperHalf = isOdd ? sorted.slice(mid + 1) : sorted.slice(mid);
    q3 = median(upperHalf);
  }

  return { mean, stdev, median: medianValue, q1, q3 };
}

/**
 * Calculates the median of a sorted array.
 */
function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    // Even length: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd length: middle value
    return sorted[mid];
  }
}

