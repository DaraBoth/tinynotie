import { pool } from './db.js';

const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseTripMemberIds = (memId) => {
  try {
    if (Array.isArray(memId)) return memId.map((id) => Number(id)).filter(Number.isFinite);
    if (typeof memId === 'string') {
      const trimmed = memId.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
      }
      return trimmed.split(',').map((id) => Number(id.trim())).filter(Number.isFinite);
    }
    const asNum = Number(memId);
    return Number.isFinite(asNum) ? [asNum] : [];
  } catch {
    return [];
  }
};

export const buildGroupReportData = async (groupId, options = {}) => {
  const normalizedGroupId = Number(groupId);
  const memberIdFilter = Array.isArray(options.memberIds)
    ? options.memberIds.map((id) => Number(id)).filter(Number.isFinite)
    : null;
  const tripIdFilter = Array.isArray(options.tripIds)
    ? options.tripIds.map((id) => Number(id)).filter(Number.isFinite)
    : null;

  const [groupRes, membersRes, tripsRes] = await Promise.all([
    pool.query('SELECT grp_name, currency FROM grp_infm WHERE id = $1', [normalizedGroupId]),
    pool.query('SELECT id, mem_name, paid FROM member_infm WHERE group_id = $1 ORDER BY id ASC', [normalizedGroupId]),
    pool.query(
      `SELECT id, trp_name, spend, description, mem_id, payer_id, create_date, update_dttm
       FROM trp_infm
       WHERE group_id = $1
       ORDER BY id DESC`,
      [normalizedGroupId]
    ),
  ]);

  if (groupRes.rows.length === 0) {
    return null;
  }

  const groupName = safeText(groupRes.rows[0].grp_name, `Group ${normalizedGroupId}`);
  const currency = safeText(groupRes.rows[0].currency, '$');

  const members = membersRes.rows
    .map((m) => ({
      id: Number(m.id),
      name: safeText(m.mem_name, `Member ${m.id}`),
      paid: safeNumber(m.paid),
    }))
    .filter((m) => Number.isFinite(m.id));

  const filteredMembers = memberIdFilter && memberIdFilter.length > 0
    ? members.filter((m) => memberIdFilter.includes(m.id))
    : members;

  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const trips = tripsRes.rows
    .filter((trip) => {
      const id = Number(trip.id);
      if (!Number.isFinite(id)) return false;
      if (tripIdFilter && tripIdFilter.length > 0 && !tripIdFilter.includes(id)) return false;
      return true;
    })
    .map((trip) => {
      const participantIds = parseTripMemberIds(trip.mem_id);
      const participantNames = participantIds.map((id) => memberMap.get(id) || `Member ${id}`);
      const participantCount = participantNames.length;
      const total = safeNumber(trip.spend);
      const perPerson = participantCount > 0 ? total / participantCount : total;
      const payerId = Number(trip.payer_id);

      return {
        id: Number(trip.id),
        name: safeText(trip.trp_name, 'Untitled Expense'),
        total,
        description: safeText(trip.description),
        participantIds,
        participants: participantNames,
        participantCount,
        perPerson,
        payerId: Number.isFinite(payerId) ? payerId : null,
        payerName: Number.isFinite(payerId) ? (memberMap.get(payerId) || `Member ${payerId}`) : 'N/A',
        createDate: trip.create_date || null,
        updatedAt: trip.update_dttm || trip.create_date || null,
      };
    });

  const memberDetails = filteredMembers.map((member) => {
    const joinedTrips = trips
      .filter((trip) => trip.participantIds.includes(member.id))
      .map((trip) => ({
        id: trip.id,
        name: trip.name,
        cost: trip.participantCount > 0 ? trip.total / trip.participantCount : trip.total,
      }));

    const spent = joinedTrips.reduce((sum, trip) => sum + safeNumber(trip.cost), 0);
    const balance = safeNumber(member.paid) - spent;

    return {
      id: member.id,
      name: member.name,
      paid: safeNumber(member.paid),
      spent,
      remain: balance > 0 ? balance : 0,
      unpaid: balance < 0 ? Math.abs(balance) : 0,
      joinedTrips,
    };
  });

  return {
    groupId: normalizedGroupId,
    groupName,
    currency,
    members: memberDetails,
    trips,
  };
};
