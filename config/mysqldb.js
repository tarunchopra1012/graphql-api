var config = require('./config');
const mysqlLib = require('serverless-mysql');
const issets = (s) => {
    return typeof s !== typeof undefined ? true : false;
};
if(!issets(conn)) {
    var conn = mysqlLib({
        config: {
            host: config.DB_HOST,
            database: config.DB_DATABASE,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            port: config.DB_PORT
        }
    });
}
conn.connect();
conn.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
  if (err) throw err
console.log("Connected!");
})
conn.end();
module.exports = conn;