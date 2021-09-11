import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

//initialise env config
dotenv.config();
//initialise bcrypt salt rounds
const salt = bcryptjs.genSaltSync(10);

// ==================== SERVER connection ======================= //
const app = express();
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

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

//User Model
const User = new mongoose.model("Users", userSchema);

app.get("/", (req, res) => {
	res.render("home.ejs");
});

app
	.route("/login")
	.get((req, res) => {
		res.render("login.ejs");
	})
	.post((req, res) => {
		User.findOne({ username: req.body.username }, (err, result) => {
			if (err) console.log(err);
			else if (!result) console.log("User not found");
			else {
				const isMatch = bcryptjs.compareSync(
					req.body.password,
					result.password
				);
				if (!isMatch) console.log("Incorrect password");
				else {
					console.log("Login successful");
					res.render("secrets.ejs");
				}
			}
		});
	});

app
	.route("/register")
	.get((req, res) => {
		res.render("register.ejs");
	})
	.post((req, res) => {
		var hash = bcryptjs.hashSync(req.body.password, salt);
		const newUser = new User({
			username: req.body.username,
			password: hash,
		});
		newUser.save((err) => {
			if (err) console.log(err);
			else {
				console.log("User successfully added");
				res.render("secrets.ejs");
			}
		});
	});

app.listen(3000, () => console.log("Server started on port 3000"));
