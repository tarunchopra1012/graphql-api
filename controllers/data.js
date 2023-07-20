const mysql = require("../config/database");
const csv = require("fast-csv");
const csv2 = require("csv-parser")
const fs = require('fs');
const path = require('path');

module.exports = {
    update_csv: function (req, res, next) {

        const filePath = path.join(__dirname, '../public/data', 'test.csv');

        // Read the file
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            // Parse the CSV data
            const rows = data.split('\n').slice(1);
            rows.forEach(row => {
                var record = row.split(',');
                
                if(typeof record[1] != 'undefined') {
                    var evt_id = record[0];
                    var phone = record[1];

                    mysql.query(
                        "UPDATE events SET telephone = ? WHERE evt_id = ?",
                        [phone, evt_id],
                        (err, result) => {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Phone number updated successfully!");
                          }
                        }
                      );
                }
            });
        }); 

        res.send({
            status: 200,
            message: "All the phone numbers have been updated successfully."
        })
    },
    read_csv: function (req, res, next) {
      const filePath = path.join(__dirname, '../public/data', 'events.csv');

      fs.createReadStream(filePath)
        .pipe(csv2())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          const values = headers.map(header => data[header]);
          const columns = headers.join(', ');

          const sql = `INSERT INTO event_locs (${columns}) VALUES (?)`;
          mysql.query(sql, [values], function (error, results, fields) {
            if (error) throw error;
            console.log('Data has been inserted into the database');
          });

          res.send({
            data: "Data inserted successfully."
          })

        })
        .on('end', () => {
          console.log('CSV file successfully processed');
        });
    }
}
