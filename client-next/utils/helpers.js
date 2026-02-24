// Helper functions for calculations and formatting

export function calculateTotalExpenses(trips = []) {
  return trips.reduce((total, trip) => {
    const amount = parseFloat(trip.trip_price) || 0;
    return total + amount;
  }, 0);
}

export function calculateMemberBalance(member, trips = []) {
  const memberTrips = trips.filter(
    (trip) => trip.member_id === member.member_id
  );
  
  const totalPaid = parseFloat(member.member_paid) || 0;
  const totalSpent = calculateTotalExpenses(memberTrips);
  
  return totalPaid - totalSpent;
}

export function calculateGroupBalance(members = [], trips = []) {
  const totalPaid = members.reduce((sum, member) => {
    return sum + (parseFloat(member.member_paid) || 0);
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
