export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  
  if (parts.length === 2) {
    const [mins, secs] = parts.map(parseFloat);
    return mins * 60 + secs;
  }
  
  if (parts.length === 3) {
    const [hours, mins, secs] = parts.map(parseFloat);
    return hours * 3600 + mins * 60 + secs;
  }
  
  return parseFloat(timeStr) || 0;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
