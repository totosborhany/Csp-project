// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user:process.env.DATABASE_USERNAME , // your PostgreSQL username
  host: "localhost", // host
  database: process.env.DATABASE_NAME, // your database name
  password: "postgres", // your PostgreSQL password
  port: 5432, // default PostgreSQL port
});

export default pool;
