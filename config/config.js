const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "12345",
  database: "student_db",
  multipleStatements: true,
});

module.exports = pool.promise();