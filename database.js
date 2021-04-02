//เอามาจาก mysql database แปลงมา
//database is on heroku db postgreSQL
const Pool = require('pg-pool');
const config = {
    user: 'umxlhxsdyxfqey',
    host: 'ec2-54-164-22-242.compute-1.amazonaws.com',
    database: 'dasp15074p0ijm',
    password: '5215e71edca94c30abd07280b4cfa86ad0a1ae1992eee9782070d1f2d658cfee',
    port: 5432,
    ssl : { rejectUnauthorized: false }
};
const pool = new Pool(config);

module.exports = pool;
