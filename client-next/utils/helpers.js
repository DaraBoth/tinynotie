// Helper functions for calculations and formatting
// Backend field names: trips.spend, trips.mem_id (JSON array), members.paid, members.id

/**
 * Parse mem_id which may be stored as:
 * - JSON string: "[1,2,3]"
 * - Single number: 1
 * - Single string: "1"
 * - Array: [1, 2, 3]
 */
export function parseMemIds(memId) {
  if (Array.isArray(memId)) return memId.map(Number);
  if (typeof memId === 'number') return [memId];
  if (typeof memId === 'string') {
    try {
      const parsed = JSON.parse(memId);
      if (Array.isArray(parsed)) return parsed.map(Number);
      return [Number(parsed)];
    } catch {
      const n = Number(memId);
      return isNaN(n) ? [] : [n];
    }
  }
  return [];
}

/**
 * Main calculation function matching the old project's calculateMoney().
 * Returns:
 *   info: { totalMember, totalPaid, totalRemain, totalSpend, totalUnPaid }
 *   newData: [{ id, name, paid, [tripName], ..., remain, unpaid }]
 * Each trip becomes a dynamic column showing that member's share.
 */
export function calculateMoney(allMembers = [], trips = [], currencySymbol = '') {
  const fmt = (amount) => formatCurrency(amount, currencySymbol);

  // Pre-parse each trip's member IDs
  const parsedTrips = trips.map((trip) => ({
    ...trip,
    parsedMemIds: parseMemIds(trip.mem_id),
  }));

  // Track each member's total share across all trips
  const memberShares = {};
  allMembers.forEach((m) => { memberShares[m.id] = 0; });

  parsedTrips.forEach((trip) => {
    const spend = parseFloat(trip.spend) || 0;
    const participantIds = trip.parsedMemIds.filter(
      (id) => memberShares[id] !== undefined
    );
    if (participantIds.length > 0) {
      const share = spend / participantIds.length;
      participantIds.forEach((id) => { memberShares[id] += share; });
    }
  });

  // Build the data rows with dynamic trip expense columns
  const newData = allMembers.map((member, idx) => {
    const paid = parseFloat(member.paid) || 0;
    const share = memberShares[member.id] || 0;
    const balance = paid - share;
    const remain = balance > 0 ? balance : 0;
    const unpaid = balance < 0 ? Math.abs(balance) : 0;

    // One column per trip
    const tripExpenses = {};
    parsedTrips.forEach((trip) => {
      const spend = parseFloat(trip.spend) || 0;
      const participantIds = trip.parsedMemIds.filter(
        (id) => memberShares[id] !== undefined
      );
      const participated = trip.parsedMemIds.includes(member.id);
      const memberShare =
        participated && participantIds.length > 0
          ? spend / participantIds.length
          : 0;
      tripExpenses[trip.trp_name] = participated
        ? `-${fmt(memberShare)}`
        : '-/-';
    });

    return {
      id: idx + 1,
      name: member.mem_name,
      paid: fmt(paid),
      ...tripExpenses,
      remain: fmt(remain),
      unpaid: fmt(unpaid),
      _memberId: member.id,
    };
  });

  // Totals
  const totalPaid = allMembers.reduce((s, m) => s + (parseFloat(m.paid) || 0), 0);
  const totalRemain = allMembers.reduce((s, m) => {
    const paid = parseFloat(m.paid) || 0;
    const share = memberShares[m.id] || 0;
    const balance = paid - share;
    return s + (balance > 0 ? balance : 0);
  }, 0);
  const totalUnPaid = allMembers.reduce((s, m) => {
    const paid = parseFloat(m.paid) || 0;
    const share = memberShares[m.id] || 0;
    const balance = paid - share;
    return s + (balance < 0 ? Math.abs(balance) : 0);
  }, 0);
  const totalSpend = parsedTrips.reduce((s, t) => s + (parseFloat(t.spend) || 0), 0);

  return {
    info: {
      totalMember: allMembers.length,
      totalPaid: fmt(totalPaid),
      totalRemain: fmt(totalRemain),
      totalSpend: fmt(totalSpend),
      totalUnPaid: fmt(totalUnPaid),
    },
    newData,
  };
}

export function calculateTotalExpenses(trips = []) {
  return trips.reduce((total, trip) => {
    const amount = parseFloat(trip.spend) || 0;
    return total + amount;
  }, 0);
}

export function calculateMemberBalance(member, trips = []) {
  // Handle both JSON array mem_id and single value
  const totalPaid = parseFloat(member.paid) || 0;
  let totalShare = 0;
  trips.forEach((trip) => {
    const ids = parseMemIds(trip.mem_id);
    if (ids.includes(Number(member.id))) {
      const spend = parseFloat(trip.spend) || 0;
      const participantCount = ids.length || 1;
      totalShare += spend / participantCount;
    }
  });
  return totalPaid - totalShare;
}

export function calculateGroupBalance(members = [], trips = []) {
  const totalPaid = members.reduce((sum, member) => {
    return sum + (parseFloat(member.paid) || 0);
  }, 0);

  const totalSpent = calculateTotalExpenses(trips);

  return totalPaid - totalSpent;
}

export function formatNumber(num, decimals = 2) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }
  return num.toFixed(decimals);
}

export function formatCurrency(amount, currency = '') {
  const num = parseFloat(amount) || 0;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency}${formatted}` : formatted;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  // At least 6 characters
  return password && password.length >= 6;
}

export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateRandomColor() {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#6366f1', // indigo
    '#ef4444', // red
    '#14b8a6', // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function formatTimeDifference(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

export const CURRENCY_NAMES = {
  '$': 'US Dollar',
  'W': 'Korean Won',
  'R': 'Khmer Riel',
  'AUD': 'Australian Dollar',
  '€': 'Euro',
  '£': 'British Pound',
  '¥': 'Japanese Yen',
  '฿': 'Thai Baht',
};

export const CURRENCY_OPTIONS = [
  { value: '$', label: '$ – US Dollar' },
  { value: 'W', label: 'W – Korean Won' },
  { value: 'R', label: 'R – Khmer Riel' },
  { value: 'AUD', label: 'AUD – Australian Dollar' },
  { value: '€', label: '€ – Euro' },
  { value: '£', label: '£ – British Pound' },
  { value: '¥', label: '¥ – Japanese Yen' },
  { value: '฿', label: '฿ – Thai Baht' },
];
