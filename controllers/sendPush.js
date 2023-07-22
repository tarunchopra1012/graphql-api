const apn = require('apn')
const fs = require('fs')
var mysql = require('../config/database')

module.exports = {
    send_bulk_push_vendor: function (req, res, next) {
        let body_params = req.body
    
        let tokens = body_params.body.tokens
        let data = body_params.body.data
        let aps = body_params.body.aps
    
        let note_data = {
          // alert: data.data,
          aps: aps,
          payload: {
            data: data,
          },
        }
    
        let service = new apn.Provider({
          pfx: fs.readFileSync('./vendor.pfx'),
          passphrase: '567890',
          production: true,
        })
    
        let note = new apn.Notification(note_data)
    
        note.topic = 'com.Event.Organizer'
    
        service.send(note, tokens).then((result) => {
          let success_count = result.sent.length
          let failed_count = result.failed.length
          let failed_tokens = []
          let success_tokens = []
    
          let failed_resp = result.failed
          let success_resp = result.sent
    
          failed_resp.forEach((fresp) => {
            let failed_token = fresp.device
            let up_sql =
              "UPDATE drivers SET device_token = '' WHERE device_token = '" +
              failed_token +
              "'"
            mysql.query(up_sql, function (err1, results1, fields1) {
              if (err1) {
                console.log(err1)
              } else {
                console.log(results1)
                failed_tokens.push(failed_token)
              }
            })
          })
    
          success_resp.forEach((sresp) => {
            let s_token = sresp.device
            success_tokens.push(s_token)
          })
    
          console.log('Failed Tokens', failed_tokens)
          console.log('Success Tokens', success_tokens)
    
          var b_data = {
            // type_id: data.truck_id,
            type: data.type,
            success_count: success_count,
            failed_count: failed_count,
            failed_tokens: failed_tokens.toString(),
          }
    
          res.json({
            sucess: success_count,
            failed: failed_count,
            failed_tokens: failed_tokens,
          })
        })
    
        service.shutdown()
    }, // End of function
    send_bulk_push: function (req, res, next) {
        let body_params = req.body
        let tokens = body_params.body.tokens
        let data = body_params.body.data
        let aps = body_params.body.aps
    
        let note_data = {
          // alert: data.data,
          aps: aps,
          payload: {
            data: data,
          },
        }
    
        let service = new apn.Provider({
          pfx: fs.readFileSync('./customer.pfx'),
          passphrase: '123456',
          production: true,
        })
    
        let note = new apn.Notification(note_data)
    
        note.topic = 'com.App.Customer'
    
        service.send(note, tokens).then((result) => {
          let success_count = result.sent.length
          let failed_count = result.failed.length
          let failed_tokens = []
          let success_tokens = []
    
          let failed_resp = result.failed
          let success_resp = result.sent
    
          failed_resp.forEach((fresp) => {
            var f_token = fresp.device
    
            let up_sql =
              "UPDATE customers SET device_token = '' WHERE device_token = '" +
              f_token +
              "'"
            let n_sql =
              "SELECT customer_id, first_name, last_name, email, account_type, app_login_date_time, date_added FROM customers WHERE device_token = '" +
              f_token +
              "'"
    
            failed_tokens.push(f_token)
    
            mysql.query(n_sql, function (err, results, fields) {
              if (err) {
                console.log(err)
              } else {
                var f_t_data = {
                  customer_id: results[0]['customer_id'],
                  first_name: results[0]['first_name'],
                  last_name: results[0]['last_name'],
                  email: results[0]['email'],
                  token: f_token,
                  account_type: results[0]['account_type'],
                  app_login_date_time: results[0]['app_login_date_time'],
                  date_added: results[0]['date_added'],
                }
    
                var insertSql = 'insert into failed_token_customers set ? '
                let insResult = mysql.query(insertSql, f_t_data)
    
                mysql.query(up_sql, function (err1, results1, fields1) {
                  if (err1) {
                    console.log(err1)
                  } else {
                    console.log(results1)
                  }
                })
              }
            })
          })
    
        success_resp.forEach((sresp) => {
            let s_token = sresp.device
            success_tokens.push(s_token)
        })
    
        var b_data = {
            type_id: data.truck_id,
            type: data.type,
            success_count: success_count,
            failed_count: failed_count,
            //success_tokens: success_tokens.toString(),
            failed_tokens: failed_tokens.toString(),
        }
    
        res.json({
            sucess: success_count,
            failed: failed_count,
            failed_tokens: failed_tokens,
          })
        })
    
        service.shutdown()
    },
}