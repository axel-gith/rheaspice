const mongoose = require("mongoose"),
	  passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	email: String,
	username: String,
	password: String,
	googleId: String,
	facebookId: String,
	isAdmin: {type: Boolean, default: false },
	orders: [{
        id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Order"
        },
	}]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);