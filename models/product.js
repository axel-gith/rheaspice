const mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
	name: String,
	image: String,
	description: String,
	price: String,
	comments:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}]
});

module.exports = mongoose.model("Product", productSchema);