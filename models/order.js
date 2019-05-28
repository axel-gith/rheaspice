const mongoose = require("mongoose");
	
var orderSchema = new mongoose.Schema({
	itemList: [{
		name: String,
		sku: String,
		price: String,
		currency: String,
		quantity: Number
	}],
	shippingAddress: {
		recipient_name: String,
		line1: String,
		city: String,
		state: String,
		postal_code: String,
		country_code: String,
	},
	paypalEmail: String,
	orderDate: String,
	totalAmount: String,
	jsonString: String
});

module.exports = mongoose.model("Order",orderSchema);