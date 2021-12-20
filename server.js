var express = require("express");
var app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var validUrl = require("valid-url");
const dns = require("dns");
require("url").URL;
var ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId();

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(
  "mongodb+srv://freecodecamp:"+process.env.PASSWORD+"@freecodecampcluster1.4yod1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  { useNewUrlParser: true },
  () => console.log("connected to database")
);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const Url = mongoose.model("URL", urlSchema);

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

//--------------------------------------------------------------------------------
//Request header parser microservice
app.get("/api/whoami", function (req, res) {
  // console.log(req.headers)
  res.json({
    ipaddress: req.ip,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});
//--------------------------------------------------------------------------------
// timestamp microservice
app.get("/api/timestamp/:timestamp", function (req, res) {
  let timestamp = req.params.timestamp;
  let date = new Date(timestamp);
  if (date.toUTCString() == "Invalid Date") {
    let date = new Date(+timestamp);
    if (date.toUTCString() == "Invalid Date") {
      res.json({ error: date.toUTCString() });
    }
    res.json({ unix: date.valueOf(), utc: date.toUTCString() });
  }
  res.json({ unix: date.valueOf(), utc: date.toUTCString() });
});

app.get("/api/timestamp/", function (req, res) {
  let date = new Date();
  res.json({ unix: date.valueOf(), utc: date.toUTCString() });
});
//--------------------------------------------------------------------------------
// url shortner microservice
//--------------------------------------------------------------------------------
app.post("/api/shorturl", async function (req, res) {
  let originalurl = req.body.url;

  if (validUrl.isWebUri(originalurl)) {
    try {
      Url.findOne({ original_url: originalurl }, (err, data) => {
        if (!data) {
          const uidWithTimestamp = uid.stamp(11);
          let doc = new Url({
            original_url: originalurl,
            short_url: uidWithTimestamp,
          });
          doc.save((err, saved_data) => {
            res.json({
              original_url: saved_data.original_url,
              short_url: saved_data.short_url,
            });
          });
        } else {
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:shorturl", function (req, res) {
  let shorturl = req.params.shorturl;
  Url.findOne({ short_url: shorturl }, (err, data) => {
    if (!data) {
      res.json({ error: "URL not found" });
    } else {
      res.redirect(data.original_url);
    }
  });
});
//--------------------------------------------------------------------------------

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
