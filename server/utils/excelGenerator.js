import * as XLSX from 'xlsx';
import { buildGroupReportData } from './groupReportData.js';

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

/**
 * Generates an Excel buffer for a given group
 * @param {number} groupId 
 * @returns {Promise<Buffer>}
 */
export const generateGroupExcelBuffer = async (groupId) => {
    const reportData = await buildGroupReportData(groupId);
    if (!reportData) {
        throw new Error('Group not found');
    }

    const groupName = safeText(reportData.groupName, 'Untitled Group');
    const currency = safeText(reportData.currency, '$');

    const tripRows = reportData.trips.map((trip, index) => [
        index + 1,
        formatDate(trip.updatedAt || trip.createDate),
        safeText(trip.name, 'Untitled Expense'),
        formatAmount(trip.total),
        currency,
        safeText(trip.payerName, '—'),
        trip.participantCount,
        trip.participants.join(', ') || '—',
        formatAmount(trip.perPerson),
        safeText(trip.description, '—'),
    ]);

    const memberRows = reportData.members.map((member, index) => [
        index + 1,
        safeText(member.name, 'Unknown Member'),
        formatAmount(member.paid),
        formatAmount(member.spent),
        formatAmount(member.remain),
        formatAmount(member.unpaid),
        member.joinedTrips.map((trip) => `${safeText(trip.name)} (${currency}${formatAmount(trip.cost)})`).join(' | ') || '—',
    ]);

    const reportTitle = `TinyNotie Expense Report - ${groupName}`;
    const generatedAt = new Date().toLocaleString();

    const sheetData = [
        [reportTitle],
        ['Generated At', generatedAt],
        ['Total Records', tripRows.length],
        [],
        ['No.', 'Updated', 'Expense', 'Amount', 'Currency', 'Payer', 'Participants Count', 'Participants', 'Per Person', 'Description'],
        ...tripRows,
    ];

    const memberSheetData = [
        [`TinyNotie Member Settlement - ${groupName}`],
        ['Generated At', generatedAt],
        ['Total Members', memberRows.length],
        [],
        ['No.', 'Member', 'Paid', 'Spent', 'Remain', 'Unpaid', 'Joined Trips (Cost Split)'],
        ...memberRows,
    ];

    // Create Workbook
    const tripWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const memberWorksheet = XLSX.utils.aoa_to_sheet(memberSheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, tripWorksheet, 'Trip Details');
    XLSX.utils.book_append_sheet(workbook, memberWorksheet, 'Member Details');

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
    tripWorksheet['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 30 },
        { wch: 14 },
        { wch: 10 },
        { wch: 20 },
        { wch: 18 },
        { wch: 42 },
        { wch: 14 },
        { wch: 38 },
    ];
    tripWorksheet['!autofilter'] = { ref: `A5:J${Math.max(sheetData.length, 5)}` };

    memberWorksheet['!cols'] = [
        { wch: 6 },
        { wch: 24 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 60 },
    ];
    memberWorksheet['!autofilter'] = { ref: `A5:G${Math.max(memberSheetData.length, 5)}` };

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};
