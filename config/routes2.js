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

  /*-------------------END---------------*/

  app.get("/location_eve_market", islogined_superAdmin, islogined_Admin, require("../controllers/home").location_eve_market
  );

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
