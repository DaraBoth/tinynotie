import { sql } from '@vercel/postgres';

// Create a new trip
export async function createTrip(trp_name: string, spend: number, group_id: number, status: number, description?: string) {
  const { rows } = await sql`
    INSERT INTO trp_infm (trp_name, spend, group_id, status, description, create_date)
    VALUES (${trp_name}, ${spend}, ${group_id}, ${status}, ${description}, NOW())
    RETURNING *;
  `;
  return rows[0];
}

// Fetch a trip by ID
export async function getTripById(tripId: number) {
  const { rows } = await sql`SELECT * FROM trp_infm WHERE id = ${tripId};`;
  return rows[0];
}

// Update trip information
export async function updateTrip(tripId: number, spend: number, status: number, description: string) {
  const { rows } = await sql`
    UPDATE trp_infm
    SET spend = ${spend}, status = ${status}, description = ${description}, update_dttm = NOW()
    WHERE id = ${tripId}
    RETURNING *;
  `;
  return rows[0];
}

// Delete a trip by ID
export async function deleteTrip(tripId: number) {
  const { rows } = await sql`DELETE FROM trp_infm WHERE id = ${tripId} RETURNING *;`;
  return rows[0];
}
