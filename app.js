require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session    = require('cookie-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var sql = require('./config/database');
var app = express();
const Swal = require('sweetalert2');
var moment = require('moment');

// set up our express application
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

// get information from html forms
app.use(bodyParser.json({limit: "50mb"}));  

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
global.SITE_NAME = process.env.SITE_NAME;
global.SITE_URL = process.env.SITE_URL; 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.secret, cookie: { maxAge: 24 * 60 * 60 * 1000 }, resave: true, saveUninitialized: true }))
app.use(flash());
require('./config/routes.js')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
app.locals.moment = require('moment');
module.exports = app;
