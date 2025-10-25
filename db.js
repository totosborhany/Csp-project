// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres", // your PostgreSQL username
  host: "localhost", // host
  database: "postgres", // your database name
  password: "postgres", // your PostgreSQL password
  port: 5432, // default PostgreSQL port
});

export default pool;
