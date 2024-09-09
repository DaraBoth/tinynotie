import { sql } from '@vercel/postgres';

export async function fetchUsers() {
  try {
    const { rows } = await sql`SELECT * FROM user_infm;`;
    return rows;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed.');
  }
}


// Create a new user
export async function createUser(usernm: string, passwd: string, phone_number?: string, email?: string, profile_url?: string) {
  const { rows } = await sql`
    INSERT INTO user_infm (usernm, passwd, phone_number, email, profile_url, create_date)
    VALUES (${usernm}, ${passwd}, ${phone_number}, ${email}, ${profile_url}, NOW())
    RETURNING *;
  `;
  return rows[0];
}

// Fetch a user by username
export async function getUserByUsername(usernm: string) {
  const { rows } = await sql`SELECT * FROM user_infm WHERE usernm = ${usernm};`;
  return rows[0];
}

// Update user information
export async function updateUser(userId: number, phone_number: string, email: string) {
  const { rows } = await sql`
    UPDATE user_infm
    SET phone_number = ${phone_number}, email = ${email}, update_dttm = NOW()
    WHERE id = ${userId}
    RETURNING *;
  `;
  return rows[0];
}

// Delete a user by ID
export async function deleteUser(userId: number) {
  const { rows } = await sql`DELETE FROM user_infm WHERE id = ${userId} RETURNING *;`;
  return rows[0];
}
