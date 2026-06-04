const SSLMODE_ALIAS_MAP = {
  prefer: "verify-full",
  require: "verify-full",
  "verify-ca": "verify-full",
};

export const getPostgresConnectionString = (rawConnectionString = process.env.POSTGRES_URL) => {
  const raw = String(rawConnectionString || "").trim();
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const currentSslMode = String(url.searchParams.get("sslmode") || "").toLowerCase();
    const normalizedSslMode = SSLMODE_ALIAS_MAP[currentSslMode];

    if (normalizedSslMode) {
      url.searchParams.set("sslmode", normalizedSslMode);
      return url.toString();
    }

    return raw;
  } catch {
    // Keep original value when parsing fails so startup behavior remains unchanged.
    return raw;
  }
};
