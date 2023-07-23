require("dotenv").config();
var nodemailer = require("nodemailer");
var mysql = require("../config/database");
const { base64encode, base64decode } = require("nodejs-base64");
const req_sql = ``;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
});

const User = {
    getAcceptedUsers() {
        return new Promise((resolve, reject) => {
            mysql.query(req_sql, (error, results) => {
              if (error) {
                return reject(error);
              }
              resolve(results);
            });
        });
    }
}

module.exports = User;