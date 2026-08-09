export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'Rp 0';
  }
  const num = Number(value);
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export const formatTime = formatTimeOnly;

export function formatElapsedTime(startIso: string | undefined | null): string {
  if (!startIso) return '0m';
  try {
    const start = new Date(startIso).getTime();
    const now = Date.now();
    const diffMins = Math.floor((now - start) / (1000 * 60));
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}j ${mins}m`;
  } catch {
    return '0m';
  }
}
