import * as XLSX from 'xlsx';
import { pool } from './dbUtils.js';

const safeText = (value, fallback = '—') => {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text || fallback;
};

const safeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const formatAmount = (value) => safeNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
};

const parseParticipantIds = (memId) => {
    if (!memId) return [];
    try {
        if (typeof memId === 'string') {
            if (memId.trim().startsWith('[')) {
                const parsed = JSON.parse(memId);
                return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
            }
            return memId.split(',').map((id) => id.trim()).filter(Boolean);
        }

        if (Array.isArray(memId)) return memId.map((id) => String(id));
        return [String(memId)];
    } catch {
        return [];
    }
};

/**
 * Generates an Excel buffer for a given group
 * @param {number} groupId 
 * @returns {Promise<Buffer>}
 */
export const generateGroupExcelBuffer = async (groupId) => {
    const { rows: groupRows } = await pool.query(
        'SELECT grp_name, currency FROM grp_infm WHERE id = $1',
        [groupId]
    );
    const groupInfo = groupRows[0] || {};
    const groupName = safeText(groupInfo.grp_name, 'Untitled Group');
    const currency = safeText(groupInfo.currency, '$');

    // Fetch trips
    const { rows: trips } = await pool.query(
        `SELECT t.*, m.mem_name as payer_name 
     FROM trp_infm t 
     LEFT JOIN member_infm m ON t.payer_id = m.id 
     WHERE t.group_id = $1 
     ORDER BY t.create_date DESC`,
        [groupId]
    );

    // Fetch all members for participant mapping
    const { rows: members } = await pool.query(
        'SELECT id, mem_name FROM member_infm WHERE group_id = $1',
        [groupId]
    );
    const memberMap = Object.fromEntries(members.map(m => [m.id, m.mem_name]));

    const rows = trips.map((trip, index) => {
        const participantNames = parseParticipantIds(trip.mem_id)
            .map((id) => safeText(memberMap[id], 'Unknown'))
            .join(', ');

        return [
            index + 1,
            formatDate(trip.create_date),
            safeText(trip.trp_name, 'Untitled Expense'),
            formatAmount(trip.spend),
            currency,
            safeText(trip.payer_name, '—'),
            participantNames || '—',
            safeText(trip.description, '—'),
        ];
    });

    const reportTitle = `TinyNotie Expense Report - ${groupName}`;
    const generatedAt = new Date().toLocaleString();

    const sheetData = [
        [reportTitle],
        ['Generated At', generatedAt],
        ['Total Records', rows.length],
        [],
        ['No.', 'Date', 'Expense', 'Amount', 'Currency', 'Payer', 'Participants', 'Description'],
        ...rows,
    ];

    // Create Workbook
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expense Report');

    // Set column widths
    const wscols = [
        { wch: 6 },
        { wch: 14 },
        { wch: 28 },
        { wch: 14 },
        { wch: 10 },
        { wch: 20 },
        { wch: 40 },
        { wch: 36 },
    ];
    worksheet['!cols'] = wscols;
    worksheet['!autofilter'] = { ref: `A5:H${Math.max(sheetData.length, 5)}` };

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};
