require("dotenv").config();
var nodemailer = require("nodemailer");
var mysql = require("../config/database");
const { base64encode, base64decode } = require("nodejs-base64");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Main = {
  groupBy(objectArray, property) {
    return objectArray.reduce((acc, obj) => {
      const key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      // Add object to list for given key's value
      acc[key].push(obj["event_detail_id"]);
      return acc;
    }, {});
  },

  sendParticipantEmail(participants) {
    console.log(participants);
    let emails = Object.keys(participants);
    let fetch_template_sql = `SELECT subject, body FROM mailTemplates_data WHERE code = 'catering_events'`;

    mysql.query(fetch_template_sql, function (err2, temp_res, fields2) {
      var email_html = temp_res[0].body;
      var email_subject = temp_res[0].subject;

      emails.forEach((email, index) => {
        let events = participants[email];

        console.log("*****", events);

        let locationString = events
          .filter(
            (event, index, self) =>
              self.findIndex((g) => g.location_name === event.location_name) ===
              index
          )
          .map((event) => event.location_name)
          .join(", ");

        let owner_name = events[0].name;
        let loc_name = locationString.trim();

        let encode_email = base64encode(email);
        let email_link = `${process.env.events_url}/${encode_email}`;

        // let mail_body = email_html.replace('{link}', email_link)
        let mail_body = email_html.replace(/{link}/g, email_link);
        let b1 = mail_body.replace("{poc_name}", owner_name);
        let b2 = b1.replace("{event_location}", loc_name);

        Main.sendMail({
          from: "Where's The Foodtruck <" + process.env.MAIL_USER + ">",
          to: email,
          subject: email_subject,
          html: b2,
          tracking_settings: {
            subscription_tracking: {
              enable: false,
            },
          },
        });
      });
    });
  },

  getCommonVendorsInEvents(events) {
    var multiple = [];
    var all_vendors = [];

    events.forEach((event, mindex) => {
      var event_id = event.id;
      var event_vendors = event.vendors;

      event_vendors.forEach((vendor, index) => {
        var vendor_id = vendor.location_id;
      });
    });

    return multiple;
  },

  getUniqueVendors(events) {
    var all_vendors = [];
    events.forEach((event, mindex) => {
      var event_vendors = event.vendors;
      event_vendors.forEach((vendor, index) => {
        var obj = {
          id: vendor.location_id,
          email: vendor.email,
          owner_name: vendor.owner_name,
          locationm_name: vendor.location_name,
        };

        all_vendors.push(obj);
      });
    });

    return this.getUnique(all_vendors);
  },

  getUniqueVendorsByLocation(vendors_arr) {
    // console.log('1111111', vendors_arr);
    var vendors_bag = [];

    vendors_arr.map((vendor, index) => {
      var location_name = Object.keys(vendor)[0];

      var vendors_count = vendor[location_name].total_vendors;
      var all_vendors = vendor[location_name].vendors;

      all_vendors.map((a_vendor, index) => {
        const found = vendors_bag.some(
          (el) => el.location_id === a_vendor.location_id
        );
        if (!found) {
          vendors_bag.push({
            ...a_vendor,
            location_name: location_name,
          });
        } else {
          vendors_bag.forEach((v_bag, indx) => {
            var l_obj = [];
            if (v_bag.location_id === a_vendor.location_id) {
              l_obj = [v_bag.location_name, location_name];
              vendors_bag[indx] = {
                ...v_bag,
                location_name: l_obj.flat(),
              };
            }
          });
        }
      });
    });

    return vendors_bag;
  },

  getUnique(obj) {
    const uniqueIds = [];

    const unique = obj.filter((element) => {
      const isDuplicate = uniqueIds.includes(element.id);
      if (!isDuplicate) {
        uniqueIds.push(element.id);
        return true;
      }
      return false;
    });

    return this.sortArrObjects(unique);
  },

  sortArrObjects(obj) {
    obj.sort(function (a, b) {
      return a.id - b.id;
    });

    return obj;
  },

  prepareUsers(givenArr, date) {
    let emailPromiseArray = [];
    let success_count = 0;
    let fail_count = 0;

    let fetch_template_sql = `SELECT subject, body FROM event_mail_templates_data WHERE code = 'new_events_posted'`;

    mysql.query(fetch_template_sql, function (err2, temp_res, fields2) {
      var email_html = temp_res[0].body;
      var email_subject = temp_res[0].subject;

      givenArr.forEach((vendor, id) => {
        var string1 = email_html.replace("{owner_name}", vendor.owner_name);
        var string3 = string1.replace(
          "{foodtruck_name}",
          vendor.foodtruck_name
        );

        if (typeof vendor.location_name === "string") {
          var string2 = string3.replace("{event_location}", vendor.location_name);
        } else {
          var location_str = vendor.location_name.join(", ");
          var string2 = string3.replace("{event_location}", location_str);
        }

        const encoded_email = base64encode(vendor.email);

        const unsubscribe_link = `${process.env.dashboard_url}/${encoded_email}`;

        var string3 = string2.replace("{unsubscribe_link}", unsubscribe_link);

        emailPromiseArray.push(
          Main.sendMail({
            from:
              "Where's The Foodtruck <" + process.env.MAIL_USER + ">",
            to: vendor.email,
            subject: email_subject,
            html: string3,
            tracking_settings: {
              subscription_tracking: {
                enable: false,
              },
            },
          }).then((res) => {
            success_count++;
          }).catch((err) => {
            fail_count++;
            console.error("Error sending email:", err);
          })
        );
      }); // End of foreach

      Promise.all(emailPromiseArray).then(() => {
        var sql = `INSERT INTO event_bulk_email_status(today_date, total_vendors, success_count, failed_count) VALUES('${date}', '${givenArr.length}', '${success_count}', '${fail_count}')`;

        mysql.query(sql, function (err2, results2, fields2) {
            success_count = 0;
            fail_count = 0;
            console.log(results2);
          });

        var sql2 = "INSERT INTO event_crons(cron_url, created_at) VALUES('new_events_email', now())"; 
        
        mysql.query(sql2, function (err3, results3, fields3) {});  

      })
      .catch((error) => {
        console.log(error);
      });
    });
  },

  sendMail(mail) {
    return new Promise((resolve, reject) => {
      sgMail
        .send(mail)
        .then((res) => {
          console.log("Email sent");
          resolve(res);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  },
};

module.exports = Main;
