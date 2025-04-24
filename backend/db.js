const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "gallisal_rojina",
  password: "a!Yjn5CWO^s_",
  database: "gallisal_eventApp",
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
