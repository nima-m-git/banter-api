const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
// const FacebookTokenStrategy = require("passport-facebook-token");
// const jwt = require("jsonwebtoken");

const User = require("./models/user");

// Serialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Invalid email" });
          }

          bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
              // passwords match, log in user
              return done(null, user.toJSON(), { message: "Successful login" });
            } else {
              // passwords dont match
              return done(null, false, { message: "Incorrect password" });
            }
          });
        })
        .catch((err) => done(err));
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET_KEY,
    },
    (jwtPayload, done) => {
      User.findById(jwtPayload._id)
        .then((user) => done(null, user))
        .catch((err) => {
          done(err, false, { message: "invalid token" });
        });
    }
  )
);

// passport.use(
//   new FacebookTokenStrategy(
//     {
//       clientID: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//       fbGraphVersion: "v3.0",
//       // callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//       // profileFields: ["email", "name", "id"],
//     },
//     (accessToken, refreshToken, profile, done) => {
//       const { email, first_name, last_name } = profile._json;

//       User.findOne({facebookID: profile.id})

//       // User.findOne({ email })
//       //   .then((user) => {
//       //     if (!user) {
//       //       // create new user
//       //       new User({
//       //         email: email,
//       //         firstName: first_name,
//       //         lastName: last_name,
//       //       })
//       //         .save()
//       //         .then((newUser) => {
//       //           const token = jwt.sign(user.toJSON(), process.env.SECRET_KEY, {
//       //             expiresIn: "1d",
//       //           });
//       //           newUser.jwtoken = token;
//       //           console.log(token + " up");

//       //           return done(null, newUser);
//       //         })
//       //         .catch((err) => done(err));
//       //     } else {
//       //       const token = jwt.sign(user.toJSON(), process.env.SECRET_KEY, {
//       //         expiresIn: "1d",
//       //       });
//       //       user.token = token;
//       //       console.log(token + " down");

//       //       return done(null, user);
//       //     }
//       //   })
//       //   .catch((err) => done(err));
//     }
//   )
// );
