import { sql } from '@vercel/postgres';

// Create a new group
export async function createGroup(grp_name: string, admin_id: number, description?: string, status?: number, currency: string = '$', visibility: string = 'private') {
  const { rows } = await sql`
    INSERT INTO grp_infm (grp_name, admin_id, description, status, create_date, currency, visibility)
    VALUES (${grp_name}, ${admin_id}, ${description}, ${status}, NOW(), ${currency}, ${visibility})
    RETURNING *;
  `;
  return rows[0];
}

// Fetch a group by ID
export async function getGroupById(groupId: number) {
  const { rows } = await sql`SELECT * FROM grp_infm WHERE id = ${groupId};`;
  return rows[0];
}

// Update group information
export async function updateGroup(groupId: number, description: string, status: number) {
  const { rows } = await sql`
    UPDATE grp_infm
    SET description = ${description}, status = ${status}, update_dttm = NOW()
    WHERE id = ${groupId}
    RETURNING *;
  `;
  return rows[0];
}

// Delete a group by ID
export async function deleteGroup(groupId: number) {
  const { rows } = await sql`DELETE FROM grp_infm WHERE id = ${groupId} RETURNING *;`;
  return rows[0];
}
