import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import googleOAuth from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

//initialise env config
dotenv.config();
//initialise google strategy for passport
const GoogleStrategy = googleOAuth.Strategy;

// ==================== SERVER connection ======================= //
const app = express();
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
// setup session
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
	})
);
//initialise passport
app.use(passport.initialize());
app.use(passport.session());

// ==================== MongoDB connection ====================== //
const mongoDBUrl = "mongodb://localhost:27017/userDB";
mongoose.connect(
	mongoDBUrl,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	(err) => {
		if (err) console.log("CONNECTION ERROR:", err);
		else console.log("MongoDB connected on port 27017");
	}
);

//User Schema
const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	googleId: String,
	secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//User Model
const User = new mongoose.model("Users", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
		},
		function (accessToken, refreshToken, profile, cb) {
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

app.get("/", (req, res) => {
	res.render("home.ejs");
});

app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get(
	"/auth/google/secrets",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect to secrets.
		res.redirect("/secrets");
	}
);

app.get("/secrets", (req, res) => {
	User.find({ secret: { $ne: null } }, (err, foundUsers) => {
		if (err) console.log(err);
		else res.render("secrets.ejs", { usersWSecrets: foundUsers });
	});
});

app
	.route("/submit")
	.get((req, res) => {
		if (req.isAuthenticated) {
			res.render("submit.ejs");
		} else {
			res.redirect("/login");
		}
	})
	.post((req, res) => {
		const submittedSecret = req.body.secret;
		User.findById(req.user.id, (err, foundUser) => {
			if (err) console.log(err);
			else if (foundUser) {
				foundUser.secret = submittedSecret;
				foundUser.save(() => {
					res.redirect("/secrets");
				});
			}
		});
	});

app
	.route("/login")
	.get((req, res) => {
		res.render("login.ejs");
	})
	.post((req, res) => {
		const user = new User({
			username: req.body.username,
			password: req.body.password,
		});

		req.login(user, (err) => {
			if (err) console.log(err);
			else {
				passport.authenticate("local")(req, res, () => {
					res.redirect("/secrets");
				});
			}
		});
	});

app
	.route("/register")
	.get((req, res) => {
		res.render("register.ejs");
	})
	.post((req, res) => {
		User.register(
			{ username: req.body.username },
			req.body.password,
			(err, user) => {
				if (err) {
					console.log(err);
					res.redirect("/register");
				} else {
					passport.authenticate("local")(req, res, () => {
						res.redirect("/secrets");
					});
				}
			}
		);
	});

app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
});

app.listen(3000, () => console.log("Server started on port 3000"));
