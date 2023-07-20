require("dotenv").config();
const request = require("request");
const nodemailer = require("nodemailer");
const mysql = require("../config/database");
const { base64encode, base64decode } = require("nodejs-base64");

const branchKey = process.env.BRANCH_KEY;
const branchTestKey = process.env.BRANCH_TEST_KEY;
const branchSecret = process.env.BRANCH_SECRET;

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const createLink = async function (data) {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: "https://api2.branch.io/v1/url",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      (error, response, body) => {
        if (error) {
          return reject(error);
        }
        if (response.statusCode !== 200) {
          return reject(body);
        }
        resolve(JSON.parse(body));
      }
    );
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sql = `SELECT
                ev.id,
                ev.date,
                ev.startTime,
                ev.endTime,
                owner_name,
                location_name,
                email,
                device_type,
                evl.name as evg_location_name
            FROM event_locations as wl
            LEFT JOIN event_requests as evr ON wl.location_id = evr.vendorId
            LEFT JOIN events as ev ON evr.evgId = ev.id
            LEFT JOIN event_details as evd ON ev.gdId = evd.id
            LEFT JOIN events_locations as evl ON evd.location_id = evl.id
            WHERE
                evr.status = 3 
                AND (email like '%test%' OR email like '%eventapp%')
                AND (DATEDIFF(DATE_FORMAT(CONCAT(ev.date, ' ', ev.startTime), '%Y-%m-%d %H:%i:%s'), NOW()) = 7 
                AND DATEDIFF(DATE_FORMAT(CONCAT(ev.date, ' ', ev.endTime), '%Y-%m-%d %H:%i:%s'), NOW()) = 7) AND (
                SELECT COUNT(*) FROM event_unsubscribed_users WHERE user_type = 'vendor' and email = wl.email) <> 1`;

const mail_template_sql = `SELECT subject, body FROM event_mail_templates_data WHERE code = 'evg_reminder'`;

const getUsersWithevgId = () => {
  return new Promise((resolve, reject) => {
    mysql.query(sql, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

const getMailTemplate = () => {
  return new Promise((resolve, reject) => {
    mysql.query(mail_template_sql, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

module.exports = {
  send_deep_link: async function (req, res, next) {
    try {
      const users = await getUsersWithevgId();
      const fetch_mail_template = await getMailTemplate();
      const email_html = fetch_mail_template[0].body;
      const email_subject = fetch_mail_template[0].subject;

      if (users.length === 0) {
        return res.send({
          status: 200,
          message: "No users found to send emails.",
        });
      }

      // Loop through the users
      for (const user of users) {
        // Generate a unique deep link for each user
        const data = {
          branch_key: branchTestKey,
          data: {
            evg_id: user.evg_id,
          },
        };
        const link = await createLink(data);

        // Send an email to the user with the generated link
        const encoded_email = base64encode(user.email);

        const unsubscribe_link = `${process.env.dash_link}/${encoded_email}`;

        if (user.device_type == "ios") {
          var main_text = link.url;
        } else {
          var main_text = process.env.app_link;
        }

        const mail_body = email_html.replace(/{evg_details}/g, main_text);
        const str1 = mail_body.replace("{owner_name}", user.owner_name);
        const str2 = str1.replace("{evg_location}", user.evg_location_name);
        const f_str = str2.replace("{unsubscribe_link}", unsubscribe_link);
        const h_str = f_str.replace("{foodtruck_name}", user.location_name);
        const mail_subject = email_subject.replace(
          "{evg_location}",
          user.evg_location_name
        );

        let mailOptions = {
          from: "Test Event <" + process.env.MAIL_USER + ">",
          to: user.email,
          subject: mail_subject,
          html: "",
          tracking_settings: {
            subscription_tracking: {
              enable: false,
            },
          },
        };

        mailOptions.html += h_str;

        /*
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log(`Email sent to ${user.email}`);
          }
        });
        */

        sgMail
          .send(mailOptions)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      }

      res.send({
        status: 200,
        users_count: users.length,
        all_users: users,
        message: "All the emails have been sent.",
      });
    } catch (error) {
      console.error(error);
    }
  },

  test_email_bulk: function (req, res, next) {
    const emails = ["test123@test.com"];

    const msg = {
      to: emails,
      from: "Test Event <" + process.env.MAIL_USER + ">",
      subject: "Hello world",
      text: "Hello plain world!",
      html: "<p>Hello HTML world!</p>",
      tracking_settings: {
        subscription_tracking: {
          enable: false,
        },
      },
    };

    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    res.send({
      status: 200,
      users_count: emails.length,
      all_users: emails,
      message: "All the emails have been sent.",
    });
  },
};
