import * as XLSX from 'xlsx';
import { pool } from './dbUtils.js';

/**
 * Generates an Excel buffer for a given group
 * @param {number} groupId 
 * @returns {Promise<Buffer>}
 */
export const generateGroupExcelBuffer = async (groupId) => {
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

    // Process data for Excel
    const data = trips.map((t, index) => {
        let participants = [];
        try {
            if (typeof t.mem_id === 'string') {
                if (t.mem_id.startsWith('[')) {
                    participants = JSON.parse(t.mem_id);
                } else {
                    participants = t.mem_id.split(',').map(id => id.trim());
                }
            } else if (Array.isArray(t.mem_id)) {
                participants = t.mem_id;
            } else if (t.mem_id) {
                participants = [String(t.mem_id)];
            }
        } catch (e) {
            participants = [];
        }

        const participantNames = participants
            .map(id => memberMap[id] || 'Unknown')
            .join(', ');

        return {
            '#': index + 1,
            'Date': t.create_date ? new Date(t.create_date).toLocaleDateString() : 'N/A',
            'Trip Name': t.trp_name,
            'Amount': t.spend,
            'Payer': t.payer_name || 'N/A',
            'Members Joined': participantNames,
            'Description': t.description || ''
        };
    });

    // Create Workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');

    // Set column widths
    const wscols = [
        { wch: 5 },  // #
        { wch: 12 }, // Date
        { wch: 25 }, // Name
        { wch: 20 }, // Location
        { wch: 10 }, // Amount
        { wch: 15 }, // Payer
        { wch: 40 }, // Members
        { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = wscols;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};
