import { useState, useEffect } from 'react';

/**
 * Calculate live uptime based on initial uptime from server
 * Updates every second without needing to poll the API
 */
export function useLiveUptime(initialUptime: number | undefined): number | undefined {
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [currentUptime, setCurrentUptime] = useState(initialUptime);

  // Update start time when initialUptime changes
  useEffect(() => {
    if (!initialUptime) {
      setStartTime(undefined);
      setCurrentUptime(undefined);
      return;
    }

    setStartTime(Date.now() - initialUptime * 1000);
    setCurrentUptime(initialUptime);
  }, [initialUptime]);

  // Update uptime every second
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCurrentUptime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return currentUptime;
}
