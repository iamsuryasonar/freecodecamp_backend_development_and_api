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


//--------------------------------------------------------------------------------
// exercise tracker
//--------------------------------------------------------------------------------





// const exerciseSchema = new mongoose.Schema(
//   {
//     description: { type: String, required: true },
//     duration: { type: Number, required: true },
//     date: { type: String, required: true }
//   },
//   {
//     timestamps: false,
//     _id: false
//   }
// );

// const Exercise = mongoose.model("Exercise", exerciseSchema);

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: 3
//     },
//     log: { type: [exerciseSchema], required: false }
//   },
//   {
//     timestamps: false,
//     versionKey: false
//   }
// );

// const User = mongoose.model("User", userSchema);

// app.get("/api/users", (req, res) => {
//   return User.find().then(users => res.json(users));
// });

// app.post("/api/users", (req, res) => {
//   const { username } = req.body;

//   User.findOne({ username }).then(user => {
//     if (user) return res.json(user);
//     else {
//       const newUser = new User({ username });

//       newUser.save().then(() => res.json(newUser));
//     }
//   });
// });

// app.post("/api/users/:_id/exercises", async (req, res) => {
//   let { description, duration, date } = req.body;
//   const id = req.params._id;

//   duration = parseInt(duration);

//   if (!date) {
//     date = new Date();
//   }
//   date = new Date(date);
//   date = date.toDateString();

//   if (id.match(/^[0-9a-fA-F]{24}$/)) {
//     let updated = await User.findOneAndUpdate(
//       { _id: id },
//       {
//         $push: {
//           log: {
//             date,
//             duration,
//             description
//           }
//         }
//       }
//     ).exec();

//     let user = await User.findById(id).exec();

//     return res.json({
//       _id: user._id,
//       username: user.username,
//       date: date,
//       duration: duration,
//       description: description
//     });
//   }
// });

// app.get("/api/users/:_id/logs", async (req, res) => {
//   const id = req.params._id;
//   let flag = 0
//   const user = await User.findById(id).exec();
//   let { _id, username, log } = user;
//   const count = log.length;

//   let { from, to, limit } = req.query;

//   if (from) {
//     flag = 1
//     from = new Date(from);
//     log = log.filter((exercise) => new Date(exercise.date) >= from);
//   }

//   if (to) {
//     to = new Date(to);
//     log = log.filter((exercise) => new Date(exercise.date) <= to);
//   }

//   if (limit) {
//     log = log.slice(0, limit);
//   }

//   if (flag === 1) {
//     console.log({
//       _id,
//       username,
//       from: new Date(from).toDateString(),
//       to: new Date(to).toDateString(),
//       log,
//       count
//     })
//     return res.json({
//       _id,
//       username,
//       from: new Date(from).toDateString(),
//       to: new Date(to).toDateString(),
//       log,
//       count
//     })
//   } else {
//     console.log({
//       _id,
//       username,
//       log,
//       count
//     })
//     return res.json({
//       _id,
//       username,
//       log,
//       count
//     });
//   }


// });


// app.get("/api/users/:_id/exercises", (req, res) => {
//   return User.findById(Object.values(req.body)[0]).then(user => res.json(user));
// });
