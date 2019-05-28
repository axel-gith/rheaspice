const mongoose = require("mongoose"),
	  passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	resetPasswordExpires: Date,
	resetPasswordToken: String,
	password: String,
	googleId: String,
	facebookId: String,
	isAdmin: {type: Boolean, default: false },
	orders: [{
        id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Order"
        }
	}]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);