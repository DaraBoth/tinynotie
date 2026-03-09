import { pool } from "./db.js";
import moment from "moment";

const sanitizeIntegerField = (value) => {
    return value === "" || value === undefined ? null : value;
};

/**
 * AI Tool: Get all data for a group (members and trips)
 */
export async function get_group_data({ groupId }) {
    try {
        // 1. Get group basic info
        const groupSql = `SELECT id, grp_name, currency, description, visibility FROM grp_infm WHERE id = $1;`;
        const groupRes = await pool.query(groupSql, [groupId]);
        if (groupRes.rows.length === 0) return { error: "Group not found" };
        const group = groupRes.rows[0];

        // 2. Get members
        const membersSql = `SELECT id, mem_name, paid FROM member_infm WHERE group_id = $1 ORDER BY id;`;
        const membersRes = await pool.query(membersSql, [groupId]);
        const members = membersRes.rows;

        // 3. Get trips
        const tripsSql = `SELECT id, trp_name, spend, mem_id, description, create_date, update_dttm, payer_id FROM trp_infm WHERE group_id = $1 ORDER BY create_date DESC;`;
        const tripsRes = await pool.query(tripsSql, [groupId]);
        const trips = tripsRes.rows;

        return {
            group,
            members,
            trips,
            summary: `Found ${members.length} members and ${trips.length} trips in group "${group.grp_name}".`
        };
    } catch (error) {
        console.error("get_group_data error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Add a new trip/expense
 */
export async function add_trip({ trp_name, spend, mem_id, group_id, description, payer_id }) {
    try {
        const create_date = moment().format("YYYY-MM-DD HH:mm:ss");
        const sql = `
      INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date, payer_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
        const result = await pool.query(sql, [
            trp_name,
            spend,
            mem_id, // This should be a JSON string like "[1, 2]"
            description || "",
            group_id,
            create_date,
            payer_id || null
        ]);
        return {
            success: true,
            id: result.rows[0].id,
            message: `Trip "${trp_name}" added successfully with amount ${spend}.`
        };
    } catch (error) {
        console.error("add_trip error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Update an existing trip
 */
export async function update_trip({ id, group_id, trp_name, spend, mem_id, description, payer_id }) {
    try {
        const update_dttm = moment().format("YYYY-MM-DD HH:mm:ss");
        // Verify trip belongs to group
        const checkSql = `SELECT id FROM trp_infm WHERE id = $1 AND group_id = $2;`;
        const checkRes = await pool.query(checkSql, [id, group_id]);
        if (checkRes.rows.length === 0) return { error: "Trip not found or unauthorized" };

        const sql = `
      UPDATE trp_infm 
      SET trp_name = COALESCE($1, trp_name),
          spend = COALESCE($2, spend),
          mem_id = COALESCE($3, mem_id),
          description = COALESCE($4, description),
          payer_id = COALESCE($5, payer_id),
          update_dttm = $6
      WHERE id = $7 AND group_id = $8;
    `;
        await pool.query(sql, [trp_name, spend, mem_id, description, payer_id, update_dttm, id, group_id]);
        return { success: true, message: `Trip ${id} updated successfully.` };
    } catch (error) {
        console.error("update_trip error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Add a new member to the group
 */
export async function add_member({ mem_name, group_id, paid = 0 }) {
    try {
        // Check if exists
        const checkSql = `SELECT id FROM member_infm WHERE mem_name = $1 AND group_id = $2;`;
        const checkRes = await pool.query(checkSql, [mem_name, group_id]);
        if (checkRes.rows.length > 0) return { error: `Member "${mem_name}" already exists in this group.` };

        const sql = `
      INSERT INTO member_infm (mem_name, paid, group_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
        const result = await pool.query(sql, [mem_name, paid, group_id]);
        return {
            success: true,
            id: result.rows[0].id,
            message: `Member "${mem_name}" added to group.`
        };
    } catch (error) {
        console.error("add_member error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Update member information (e.g., payment)
 */
export async function update_member({ id, group_id, mem_name, paid }) {
    try {
        // Verify member belongs to group
        const checkSql = `SELECT id FROM member_infm WHERE id = $1 AND group_id = $2;`;
        const checkRes = await pool.query(checkSql, [id, group_id]);
        if (checkRes.rows.length === 0) return { error: "Member not found or unauthorized" };

        const sql = `
      UPDATE member_infm 
      SET mem_name = COALESCE($1, mem_name),
          paid = COALESCE($2, paid)
      WHERE id = $3 AND group_id = $4;
    `;
        await pool.query(sql, [mem_name, paid, id, group_id]);
        return { success: true, message: `Member ${id} updated successfully.` };
    } catch (error) {
        console.error("update_member error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Bulk update member information in one call
 */
export async function bulk_update_members_info({ group_id, members }) {
    try {
        if (!Array.isArray(members) || members.length === 0) {
            return { error: "members must be a non-empty array" };
        }

        const groupRes = await pool.query(`SELECT id FROM grp_infm WHERE id = $1;`, [group_id]);
        if (groupRes.rows.length === 0) {
            return { error: "Group not found" };
        }

        const results = [];

        for (const member of members) {
            const { id, mem_name, paid } = member || {};
            if (!Number.isFinite(Number(id))) {
                results.push({ id, status: "error", message: "Invalid member id" });
                continue;
            }

            const checkRes = await pool.query(
                `SELECT id FROM member_infm WHERE id = $1 AND group_id = $2;`,
                [Number(id), group_id]
            );

            if (checkRes.rows.length === 0) {
                results.push({ id: Number(id), status: "not_found", message: "Member not found" });
                continue;
            }

            await pool.query(
                `
                UPDATE member_infm
                SET mem_name = COALESCE($1, mem_name),
                    paid = COALESCE($2, paid)
                WHERE id = $3 AND group_id = $4;
                `,
                [mem_name ?? null, paid ?? null, Number(id), group_id]
            );

            results.push({ id: Number(id), status: "updated" });
        }

        const updated = results.filter((r) => r.status === "updated").length;
        const notFound = results.filter((r) => r.status === "not_found").length;
        const errors = results.filter((r) => r.status === "error").length;

        return {
            success: true,
            summary: `Bulk member update complete: ${updated} updated, ${notFound} not found, ${errors} errors.`,
            results,
        };
    } catch (error) {
        console.error("bulk_update_members_info error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Set the same paid amount for all members in a group
 */
export async function set_all_members_paid({ group_id, paid }) {
    try {
        const parsedPaid = Number(paid);
        if (!Number.isFinite(parsedPaid)) {
            return { error: "paid must be a valid number" };
        }

        const groupRes = await pool.query(`SELECT id, grp_name FROM grp_infm WHERE id = $1;`, [group_id]);
        if (groupRes.rows.length === 0) {
            return { error: "Group not found" };
        }

        const membersRes = await pool.query(
            `SELECT id, mem_name FROM member_infm WHERE group_id = $1 ORDER BY id;`,
            [group_id]
        );

        if (membersRes.rows.length === 0) {
            return { error: "No members found in this group" };
        }

        await pool.query(`UPDATE member_infm SET paid = $1 WHERE group_id = $2;`, [parsedPaid, group_id]);

        return {
            success: true,
            updated_count: membersRes.rows.length,
            paid: parsedPaid,
            member_ids: membersRes.rows.map((m) => m.id),
            summary: `Updated ${membersRes.rows.length} members in group ${group_id} to paid=${parsedPaid}.`,
        };
    } catch (error) {
        console.error("set_all_members_paid error:", error);
        return { error: error.message };
    }
}

/**
 * AI Tool: Bulk update trip information in one call
 */
export async function bulk_update_trips_info({ group_id, trips }) {
    try {
        if (!Array.isArray(trips) || trips.length === 0) {
            return { error: "trips must be a non-empty array" };
        }

        const groupRes = await pool.query(`SELECT id FROM grp_infm WHERE id = $1;`, [group_id]);
        if (groupRes.rows.length === 0) {
            return { error: "Group not found" };
        }

        const update_dttm = moment().format("YYYY-MM-DD HH:mm:ss");
        const results = [];

        for (const trip of trips) {
            const {
                id,
                trp_name,
                spend,
                mem_id,
                description,
                payer_id,
            } = trip || {};

            if (!Number.isFinite(Number(id))) {
                results.push({ id, status: "error", message: "Invalid trip id" });
                continue;
            }

            const checkRes = await pool.query(
                `SELECT id FROM trp_infm WHERE id = $1 AND group_id = $2;`,
                [Number(id), group_id]
            );

            if (checkRes.rows.length === 0) {
                results.push({ id: Number(id), status: "not_found", message: "Trip not found" });
                continue;
            }

            await pool.query(
                `
                UPDATE trp_infm
                SET trp_name = COALESCE($1, trp_name),
                    spend = COALESCE($2, spend),
                    mem_id = COALESCE($3, mem_id),
                    description = COALESCE($4, description),
                    payer_id = COALESCE($5, payer_id),
                    update_dttm = $6
                WHERE id = $7 AND group_id = $8;
                `,
                [
                    trp_name ?? null,
                    spend ?? null,
                    mem_id ?? null,
                    description ?? null,
                    sanitizeIntegerField(payer_id),
                    update_dttm,
                    Number(id),
                    group_id,
                ]
            );

            results.push({ id: Number(id), status: "updated" });
        }

        const updated = results.filter((r) => r.status === "updated").length;
        const notFound = results.filter((r) => r.status === "not_found").length;
        const errors = results.filter((r) => r.status === "error").length;

        return {
            success: true,
            summary: `Bulk trip update complete: ${updated} updated, ${notFound} not found, ${errors} errors.`,
            results,
        };
    } catch (error) {
        console.error("bulk_update_trips_info error:", error);
        return { error: error.message };
    }
}

/**
 * Tool definitions for OpenAI
 */
export const tools = [
    {
        type: "function",
        function: {
            name: "get_group_data",
            description: "Get all members and trips for the current group to analyze spending or balances.",
            parameters: {
                type: "object",
                properties: {
                    groupId: { type: "integer", description: "The ID of the group to fetch data for." }
                },
                required: ["groupId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_trip",
            description: "Add a new trip or expense item to the group.",
            parameters: {
                type: "object",
                properties: {
                    group_id: { type: "integer" },
                    trp_name: { type: "string", description: "Name of the trip/item (e.g., Dinner, Gas, Tickets)" },
                    spend: { type: "number", description: "Amount spent" },
                    mem_id: { type: "string", description: "JSON array of member IDs who joined (e.g., '[1, 2, 3]')" },
                    payer_id: { type: "integer", description: "ID of the member who paid for this trip" },
                    description: { type: "string" }
                },
                required: ["group_id", "trp_name", "spend", "mem_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_trip",
            description: "Update an existing trip's details.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "integer", description: "The trip ID to update" },
                    group_id: { type: "integer" },
                    trp_name: { type: "string" },
                    spend: { type: "number" },
                    mem_id: { type: "string", description: "JSON array of member IDs" },
                    payer_id: { type: "integer" },
                    description: { type: "string" }
                },
                required: ["id", "group_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_member",
            description: "Add a new member to the group.",
            parameters: {
                type: "object",
                properties: {
                    group_id: { type: "integer" },
                    mem_name: { type: "string", description: "Name of the new member" },
                    paid: { type: "number", description: "Initial amount paid if any" }
                },
                required: ["group_id", "mem_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_member",
            description: "Update a member's name or total paid amount.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "integer", description: "The member ID to update" },
                    group_id: { type: "integer" },
                    mem_name: { type: "string" },
                    paid: { type: "number" }
                },
                required: ["id", "group_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "bulk_update_members_info",
            description: "Update multiple members at once when they share common changes.",
            parameters: {
                type: "object",
                properties: {
                    group_id: { type: "integer", description: "Group ID" },
                    members: {
                        type: "array",
                        description: "List of members to update",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "integer", description: "Member ID" },
                                mem_name: { type: "string" },
                                paid: { type: "number" }
                            },
                            required: ["id"]
                        }
                    }
                },
                required: ["group_id", "members"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "set_all_members_paid",
            description: "Set one paid amount for every member in the group (use this for commands like 'set all members to $30').",
            parameters: {
                type: "object",
                properties: {
                    group_id: { type: "integer", description: "Group ID" },
                    paid: { type: "number", description: "The paid amount to apply to all members" }
                },
                required: ["group_id", "paid"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "bulk_update_trips_info",
            description: "Update multiple trips at once when they share common changes.",
            parameters: {
                type: "object",
                properties: {
                    group_id: { type: "integer", description: "Group ID" },
                    trips: {
                        type: "array",
                        description: "List of trips to update",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "integer", description: "Trip ID" },
                                trp_name: { type: "string" },
                                spend: { type: "number" },
                                mem_id: { type: "string", description: "JSON array string of member IDs" },
                                payer_id: { type: "integer" },
                                description: { type: "string" }
                            },
                            required: ["id"]
                        }
                    }
                },
                required: ["group_id", "trips"]
            }
        }
    }
];

export const handlers = {
    get_group_data,
    add_trip,
    update_trip,
    add_member,
    update_member,
    bulk_update_members_info,
    set_all_members_paid,
    bulk_update_trips_info
};
