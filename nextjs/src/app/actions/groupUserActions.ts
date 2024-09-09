import { sql } from '@vercel/postgres';

// Add a user to a group with viewing rights
export async function addUserToGroup(group_id: number, user_id: number, can_view: boolean) {
  const { rows } = await sql`
    INSERT INTO grp_users (group_id, user_id, can_view)
    VALUES (${group_id}, ${user_id}, ${can_view})
    RETURNING *;
  `;
  return rows[0];
}

// Fetch group users by group ID
export async function getGroupUsers(group_id: number) {
  const { rows } = await sql`SELECT * FROM grp_users WHERE group_id = ${group_id};`;
  return rows;
}

// Update user's view rights in a group
export async function updateUserGroupViewRights(recordId: number, can_view: boolean) {
  const { rows } = await sql`
    UPDATE grp_users
    SET can_view = ${can_view}
    WHERE id = ${recordId}
    RETURNING *;
  `;
  return rows[0];
}

// Remove a user from a group
export async function removeUserFromGroup(recordId: number) {
  const { rows } = await sql`DELETE FROM grp_users WHERE id = ${recordId} RETURNING *;`;
  return rows[0];
}
