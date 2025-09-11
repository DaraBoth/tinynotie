import pkg from "pg";
const { Pool } = pkg;

// Create a new pool instance for PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Use environment variable for connection string
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

// Utility function to handle database errors
const handleError = (error, res) => {
  console.error("Database error:", error);
  res.status(500).json({ status: false, error: error.message });
};

// Utility function to sanitize integer fields - converts empty strings to null
const sanitizeIntegerField = (value) => {
  return value === "" || value === undefined ? null : value;
};

export { pool, handleError, sanitizeIntegerField };
