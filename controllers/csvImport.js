const mysql = require("../config/database");
const csv2 = require("csv-parser");
const fs = require("fs");
const path = require("path");

module.exports = {
  read_csv: function (req, res, next) {
    const filePath = path.join(__dirname, '../public/data', 'vendors.csv');
    const batchSize = 1000;
    let headers;
    let batchData = [];

    const defaultValues = {
      social_profiles: 'a:6:{s:8:"facebook";s:0:"";s:7:"twitter";s:0:"";s:9:"instagram";s:0:"";s:10:"googleplus";s:0:"";s:4:"yelp";s:0:"";s:11:"tripadvisor";s:0:"";}',
      options: 'a:0:{}',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    fs.createReadStream(filePath)
      .pipe(csv2())
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', (data) => {
        if(data.location_name != '') {
          try {
            
            const values = headers.map(header => {
              if (defaultValues[header] !== undefined) {
                return data[header] || defaultValues[header];
              }

              return data[header];
            });

            const email = values[headers.indexOf('email')];
            if (!email) {
              console.log(`Skipping record with empty email: ${JSON.stringify(values)}`);
              return;
            }

            const sql = `SELECT COUNT(*) as count FROM event_locations WHERE email = ?`;
            mysql.query(sql, [email], function (error, results, fields) {
              if (error) {
                console.error(`Error while checking for existing email: ${email}`);
                console.error(error);
                return;
              }
              const count = results[0].count;
              if (count > 0) {
                console.log(`Skipping record with existing email: ${email}`);
                return;
              }

              batchData.push(values);

              if (batchData.length === batchSize) {
                insertBatchData(headers, batchData);
                batchData = [];
              }
            });
          } catch (error) {
            console.error(`Error while processing data row: ${JSON.stringify(data)}`);
            console.error(error);
          }
        }
      })
      .on('end', () => {
        if (batchData.length > 0) {
          insertBatchData(headers, batchData);
        }
        console.log('CSV file successfully processed');
        res.send({
          data: "Data inserted successfully."
        });
      });
  }
};

function insertBatchData(headers, batchData) {
  const columns = headers.join(', ');
  const sql = `INSERT INTO event_locations (${columns}) VALUES ?`;
  mysql.query(sql, [batchData], function (error, results, fields) {
    if (error) throw error;
    console.log('Data has been inserted into the database');
  });
}
