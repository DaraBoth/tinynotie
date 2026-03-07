import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:9000';

function safeParseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function decodeTokenPayload(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function getServerAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value || null;
  const payload = decodeTokenPayload(token);
  const userId = Number(payload?._id || payload?.id);

  return {
    token,
    userId: Number.isFinite(userId) ? userId : null,
  };
}

export async function serverApiGet(path, { token, params } = {}) {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const raw = await response.text();
  const json = safeParseJson(raw);

  if (!response.ok) {
    const message = json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json;
}
