require("dotenv").config();
var mysql = require("../config/database");
const request = require("request");
var each = require("sync-each");
const nodemailer = require("nodemailer");
var Main = require("../helpers/main");
var moment = require("moment");
const { base64encode, base64decode } = require("nodejs-base64");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
    send_vendor_email: async function (req, res, next) {
      let ts = Date.now() - 86400000;
  
      let date_ob = new Date(ts);
      let date = ("0" + date_ob.getDate()).slice(-2);
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let year = date_ob.getFullYear();
  
      let today_date = year + "-" + month + "-" + date;
     
      let eve_sql = `SELECT
                          wgl.id,
                          latitude,
                          longitude,
                          wg.created,
                          wgl.name as eve_location_name
                      FROM
                          eves_locations as wgl
                          LEFT JOIN eve_details as wgd ON wgl.id = wgd.id
                          LEFT JOIN eves as wg ON wgd.id = wg.gdId
                      WHERE
                          DATE(CONVERT_TZ(wg.created, '+00:00', (select universal_time FROM time_zones where name = wgl.location_timezone ))) = curdate() - INTERVAL 9 DAY
                          AND wg.status = 'active'
                          AND wg.isDeleted = 0
                      GROUP BY
                          wgl.id
                      ORDER BY
                          wgl.id DESC`;
  
      console.log(eve_sql);
  
      let eves_result = await mysql.query(eve_sql);
      let vendors_arr = [];
  
      for (var i = 0; i < eves_result.length; i++) {
        let location_name = eves_result[i]["eve_location_name"];
  
        let v_sql = `SELECT id, email, owner_name, location_name as foodtruck_name, (6371 * acos( 
                                  cos( radians(${eves_result[i]["latitude"]}) ) 
                              * cos( radians( location_lat ) ) 
                              * cos( radians( location_lng ) - radians(${eves_result[i]["longitude"]}) ) 
                              + sin( radians(${eves_result[i]["latitude"]}) ) 
                              * sin( radians( location_lat ) )
                                  ) ) as distance  from locations
                          HAVING distance < '50'
                          `;
  
        let all_vendors = await mysql.query(v_sql);
  
        let obj = {
          [location_name]: {
            total_vendors: all_vendors.length,
            vendors: all_vendors,
          },
        };
  
        vendors_arr.push(obj);
      }
  
      var all_vendors = await Main.getUniqueVendorsByLocation(vendors_arr);
      Main.prepareUsers(all_vendors, today_date);
  
      res.json({
        vendors: all_vendors,
        total_vendors: all_vendors.length,
      });
    },
}