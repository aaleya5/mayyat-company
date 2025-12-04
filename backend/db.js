const { Client } = require('pg');
const db = new Client({
    user: 'postgres',     // Replace with your PostgreSQL username
    host: 'localhost',                  // Replace with your PostgreSQL host
    password: 'aaleya', // Replace with your PostgreSQL password
    database: 'mayyat',      // Replace with the name of your database
    port: 5432,                         // Replace with your PostgreSQL port if different
});

db.connect()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch(err => {
    console.error('Database connection error', err.stack);
  });

module.exports = db;