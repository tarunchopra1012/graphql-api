var CryptoJS = require("crypto-js");
var path = require("path");
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename: function (req, file, callback) {
    var imgExt = path.extname(file.originalname);
    if (file.mimetype.split("/", 1)[0] == "image" && imgExt != ".heic") {
      callback(null, Date.now() + ".jpg");
    }
    if (file.mimetype.split("/", 1)[0] == "image" && imgExt == ".heic") {
      callback(null, Date.now() + imgExt);
    }
    if (file.mimetype.split("/", 1)[0] == "video") {
      callback(null, Date.now() + ".mp4");
    }
  },
});
var upload = multer({ storage: storage });

module.exports = function (app) {
  /*-----------LOGIN FORM VIEW---------------*/

  app.use(function (req, res, next) {
    if (req.session.event_user_id && req.originalUrl === "/home") {
      return res.redirect("/events_listing");
    }
    next();
  });

  app.get("/", function (req, res, next) {
    console.log("asdas");
    res.redirect("/home");
  });

  app.use(function (req, res, next) {
    if (req.session.event_user_id) {
      res.locals.session = req.session;
    } else {
      res.locals.session = "";
    }
    next();
  });

  app.use(function (req, res, next) {
    res.setTimeout(900000, function () {
      console.log("Request has timed out.");
      res.send(408);
    });
    next();
  });

  /*-----------SESSION LOGOUT---------------*/

  app.get("/logout", function (req, res) {
    delete req.session.event_user_usersmac;
    delete req.session.event_user_id;
    delete req.session.event_user_name;
    res.redirect("/home");
  });

  /*-----------ROUTES FOR SECTION---------------*/

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  app.get("/send-email", require("../controllers/mail-cron").send_vendor_email);
  app.get("/send-email-check", require("../controllers/mail-cron").send_vendor_email_check);

  app.get(
    "/send-email-inactive",
    require("../controllers/mail-cron").send_vendor_email_inactive
  );

  app.get(
    "/send-email-test",
    require("../controllers/mail-cron").send_vendor_email_test
  );

  app.get(
    "/fetch_categoring_events",
    require("../controllers/mail-cron").fetch_categoring_events
  );

  app.get(
    "/fetch_categoring_events_test",
    require("../controllers/mail-cron").fetch_categoring_events_test
  );

  app.get(
    "/send-accepted-email",
    require("../controllers/mail-cron").send_accepted_email
  );

  /*-------------------HOME ROUTES SECTION---------------*/

  app.get("/home", require("../controllers/home").index);

  app.post("/login", require("../controllers/home").login);

  app.get("/location/:id", require("../controllers/home").publicLocationPage);

  app.get("/getlocation/:id", require("../controllers/home").fetchLocationInfo);

  app.get(
    "/change_password",
    islogined_Admin,
    require("../controllers/home").change_password
  );

  app.post(
    "/change_password/save",
    islogined_Admin,
    require("../controllers/home").save_change_password
  );

  /*-------------------event SECTION---------------*/
  app.get(
    "/add_events",
    islogined_Admin,
    require("../controllers/home").add_events
  );

  app.post(
    "/ajaxevents_logo_photo",
    islogined_Admin,
    upload.single("events_logo_photo"),
    require("../controllers/home").ajaxevents_logo_photo
  );

  app.post(
    "/ajaxload_in_photo",
    islogined_Admin,
    upload.single("load_in_photo"),
    require("../controllers/home").ajaxevents_logo_photo
  );

  app.post(
    "/get_eventsInfo",
    islogined_Admin,
    require("../controllers/home").get_eventsInfo
  );

  app.post(
    "/save_events",
    islogined_Admin,
    require("../controllers/home").save_events
  );

  app.post("/accept_wait_event", require("../controllers/home").accept_wait_event);

  app.get(
    "/events_listing",
    islogined_Admin,
    require("../controllers/events").events_listing_view
  );

  app.get("/events_listing_new", islogined_Admin, require("../controllers/events").events_listing_new);

  app.post("/expand_event", islogined_Admin, require("../controllers/events").expand_event);

  app.post("/expand_event_new", islogined_Admin, require("../controllers/events").expand_event_new);

  app.get(
    "/events_listing_demo",
    islogined_Admin,
    require("../controllers/events").events_listing_demo
  );

  app.post(
    "/getPaginatedevents/:status",
    islogined_Admin,
    require("../controllers/events").getPaginatedevents
  );

  app.get(
    "/event_details/:id",
    islogined_Admin,
    require("../controllers/events").eventDetails
  );

  app.get(
    "/event_details_catering/:id",
    islogined_Admin,
    require("../controllers/events").eventDetailsCatering
  );

  app.get(
    "/catering_events/:token",
    require("../controllers/events").eventCateringevents
  );

  app.get("/catering_events", (req, res, next) => {
    res.json({
      status: 401,
      message: "Unauthorized Access!",
    });
  });

  app.get(
    "/events/:token",
    require("../controllers/events").eventNormalevents
  );

  app.get("/events", (req, res, next) => {
    res.json({
      status: 401,
      message: "Unauthorized Access!",
    });
  });

  app.get(
    "/event_requests/:id/:eventId",
    islogined_Admin,
    require("../controllers/events").eventRequests
  );

  app.get('/event/:id', require("../controllers/events").eventPage);

  app.get(
    "/edit_event/:id",
    islogined_Admin,
    require("../controllers/events").editevent
  );

  app.post(
    "/updateevent",
    islogined_Admin,
    require("../controllers/events").updateevent
  );

  /*-------------------LOCATION & GET LIST SECTION---------------*/

  app.get(
    "/locations",
    islogined_Admin,
    require("../controllers/home").locations
  );

  app.get(
    "/locations/:id",
    islogined_Admin,
    require("../controllers/home").locations_form
  );

  app.post(
    "/locations/Add",
    islogined_Admin,
    require("../controllers/home").locations_save
  );

  app.post(
    "/getLocation/:status",
    islogined_Admin,
    require("../controllers/home").getLocation
  );

  app.post(
    "/get_location",
    islogined_Admin,
    require("../controllers/home").get_location
  );

  app.post(
    "/get_locationType",
    islogined_Admin,
    require("../controllers/home").get_locationType
  );

  app.post(
    "/get_locationeventmarket",
    islogined_Admin,
    require("../controllers/home").get_locationeventmarket
  );

  app.post(
    "/get_locationHometown",
    islogined_Admin,
    require("../controllers/home").get_locationHometown
  );

  app.post(
    "/get_locationInfo",
    require("../controllers/home").get_locationInfo
  );

  /*-------------------LOCATION TYPE SECTION---------------*/

  app.get(
    "/location_type",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_type
  );

  app.post(
    "/getLocation_type/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").getLocation_type
  );

  app.get(
    "/location_type/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_type_form
  );

  app.post(
    "/location_type/Add",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_type_save
  );

  /*-------------------event MARKET SECTION---------------*/

  app.get(
    "/location_event_market",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_event_market
  );

  app.get(
    "/location_event_market/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_event_market_form
  );

  app.post(
    "/getLocation_event_market/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").getLocation_event_market
  );

  app.post(
    "/location_event_market/Add",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_event_market_save
  );

  /*-------------------HOME TOWN SECTION---------------*/

  app.get(
    "/location_home_town",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_home_town
  );

  app.get(
    "/location_home_town/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_home_town_form
  );

  app.post(
    "/getlocation_home_town/:id",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").getlocation_home_town
  );

  app.post(
    "/location_home_town/Add",
    islogined_superAdmin,
    islogined_Admin,
    require("../controllers/home").location_home_town_save
  );

  /*-------------------LOGIN USER PROFILE---------------*/

  app.get(
    "/settings",
    islogined_Admin,
    require("../controllers/home").settings
  );

  app.post(
    "/setting/Add",
    islogined_Admin,
    require("../controllers/home").update_settings
  );

  /*-------------------INVITE SECTION---------------*/

  app.get(
    "/invite/:id/:email/:n/:c",
    require("../controllers/home").invite_schedulers
  );

  app.post("/set_invite", require("../controllers/home").set_invite);

  app.post(
    "/delete_common",
    islogined_Admin,
    require("../controllers/home").delete_common
  );

  app.post(
    "/delete_events_home",
    islogined_Admin,
    require("../controllers/home").delete_events_home
  );

  app.post(
    "/copy_event",
    islogined_Admin,
    require("../controllers/home").copy_event
  );

  app.post(
    "/post_common",
    islogined_Admin,
    require("../controllers/home").post_common
  );

  /*-------------------Financial Routes---------------*/
  //app.get('/financial_listing', islogined_Admin, require('../controllers/home').finanacial_listing_view);

  app.post(
    "/getPaginatedFinances/:status",
    islogined_Admin,
    require("../controllers/home").getPaginatedFinance
  );

  app.post(
    "/finance_requests",
    islogined_Admin,
    require("../controllers/home").financeRequest
  );

  // New on 7th July
  app.get(
    "/financial_listing",
    islogined_Admin,
    require("../controllers/home").finanacial_listing_new_view
  );

  app.post(
    "/getNewFinances",
    islogined_Admin,
    require("../controllers/home").getNewFinances
  );

  app.post(
    "/getNewFinancesCancel",
    islogined_Admin,
    require("../controllers/home").getNewFinancesCancel
  );

  app.post(
    "/financial_detail",
    islogined_Admin,
    require("../controllers/home").financial_detail
  );

  app.get(
    "/report_sales",
    islogined_Admin,
    require("../controllers/home").report_sales_view
  );

  app.post(
    "/getReportSales",
    islogined_Admin,
    require("../controllers/home").getReportSales
  );

  app.get(
    "/calendar",
    islogined_Admin,
    require("../controllers/calender").calander_data
  );

  app.post(
    "/calendar",
    islogined_Admin,
    require("../controllers/calender").calender_data
  );

  app.post(
    "/calendar_location_vendor",
    islogined_Admin,
    require("../controllers/calender").calendar_location_vendor
  );

  app.post(
    "/sqaure_disconnect",
    islogined_Admin,
    require("../controllers/home").disconnect_with_square
  );

  app.post("/refund_initate", require("../controllers/home").refund_initate);

  app.get(
    "/payment_setting",
    islogined_Admin,
    require("../controllers/home").payment_setting
  );

  app.post(
    "/payment_setting/save",
    islogined_Admin,
    require("../controllers/home").squarepaymentupdate
  );

  app.post(
    "/new_refund_initate",
    require("../controllers/home").new_refund_initate
  );

  app.post(
    "/get_location_data",
    islogined_Admin,
    require("../controllers/home").getLocationData
  );

  app.get("/sendPush", require("../controllers/push").send_push);

  app.post("/sendBulkPush", require("../controllers/push").send_bulk_push);

  app.post(
    "/sendBulkPushCustomerStaging",
    require("../controllers/push").send_bulk_push_customer_staging
  );

  app.post(
    "/sendBulkPushVendor",
    require("../controllers/push").send_bulk_push_vendor
  );

  app.post(
    "/sendBulkPushVendorStaging",
    require("../controllers/push").send_bulk_push_vendor_staging
  );

  app.post(
    "/post_all_events",
    islogined_Admin,
    require("../controllers/home").post_all_events
  );

  app.get("/captcha", require("../controllers/home").captcha);

  app.get("/update_csv", require("../controllers/data").update_csv);

  app.get("/read_csv", require("../controllers/data").read_csv);

  app.get("/read_csv_large", require("../controllers/data8").read_csv);

  app.get(
    "/send_deep_link",
    require("../controllers/link").send_deep_link
  );

  app.get(
    "/test_email_bulk",
    require("../controllers/link").test_email_bulk
  );

  /*-------------------END---------------*/

  /*-------------------IS ADMIN LOGIN---------------*/

  function islogined_Admin(req, res, next) {
    var userId = req.session.event_user_id;
    if (typeof userId == "undefined" || userId == "") {
      res.redirect("/home");
    } else {
      var usersmac = CryptoJS.HmacMD5(
        req.session.event_user_id,
        "iloveEvent"
      ).toString();
      if (usersmac !== req.session.event_user_usersmac) {
        res.redirect("/logout");
      } else {
        next();
      }
    }
  }

  /*-------------------IS SUPER ADMIN ACCESS---------------*/

  function islogined_superAdmin(req, res, next) {
    var superRole = req.session.event_role;
    if (typeof superRole == "undefined" || superRole == "") {
      res.redirect("/home");
    } else {
      if (superRole != 1) {
        res.redirect("/logout");
      } else {
        next();
      }
    }
  }
};
