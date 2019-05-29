const mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
	name: String,
	image: String,
	description: String,
	price: String,
	comments:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}],
	reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    rating: {
        type: Number,
        default: 0
    }

});

module.exports = mongoose.model("Product", productSchema);