const mongoose = require("mongoose"),
	  passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	googleId: String,
	facebookId: String,
	isAdmin: {type: Boolean, default: false },
	cart: []
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);