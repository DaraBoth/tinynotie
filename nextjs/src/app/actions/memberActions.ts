import { sql } from '@vercel/postgres';

// Create a new member
export async function createMember(mem_name: string, paid: number, group_id: number) {
  const { rows } = await sql`
    INSERT INTO member_infm (mem_name, paid, group_id)
    VALUES (${mem_name}, ${paid}, ${group_id})
    RETURNING *;
  `;
  return rows[0];
}

// Fetch a member by ID
export async function getMemberById(memberId: number) {
  const { rows } = await sql`SELECT * FROM member_infm WHERE id = ${memberId};`;
  return rows[0];
}

// Update member information
export async function updateMember(memberId: number, paid: number) {
  const { rows } = await sql`
    UPDATE member_infm
    SET paid = ${paid}
    WHERE id = ${memberId}
    RETURNING *;
  `;
  return rows[0];
}

// Delete a member by ID
export async function deleteMember(memberId: number) {
  const { rows } = await sql`DELETE FROM member_infm WHERE id = ${memberId} RETURNING *;`;
  return rows[0];
}
