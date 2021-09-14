import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

//initialise env config
dotenv.config();

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
});

userSchema.plugin(passportLocalMongoose);

//User Model
const User = new mongoose.model("Users", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
	res.render("home.ejs");
});

app.get("/secrets", (req, res) => {
	if (req.isAuthenticated()) res.render("secrets.ejs");
	else res.redirect("/login");
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
