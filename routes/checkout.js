const express  = require("express"),
	  middleware = require("../middleware"),
	  Product = require("../models/product"),
	  Cart = require("../models/cart"),
	  Order = require("../models/order"),
	  User = require("../models/user"),
	  paypal = require("paypal-rest-sdk"),
	  nodemailer = require("nodemailer"),
	  router   = express.Router();

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AR-MgJHnYYCpb-tjCd16FdZDijTmC6bnUrvZ1tkQeW-NttEcayzbhdXTxaA5Re9VCObLRj7J4Iz1WJXe',
  'client_secret': 'EOxiS0fTT6FMso0RVkvUkGm-_zrGgJkY5qn-3r5euWfxOSuJBklVa3yl_h-havC427ZuhjyT3rZDd40b'
});

router.get("/cart", function(req,res){
	if(!req.session.cart){
		return res.render("checkout/cart",{products : null, totalPrice: 0});
	}
	var cart = new Cart(req.session.cart);
	return res.render("checkout/cart",{products : cart.generateArray(), totalPrice: cart.totalPrice});
});

//ADD ITEM TO CART
router.post("/cart/add/:id", function(req, res){
	var cart = new Cart(req.session.cart ? req.session.cart : {});
	Product.findById(req.params.id, function(err, foundProduct){
		if(err){
			req.flash("error", "Non siamo riusciti ad aggiungere il prodotto al carrello, riprovi tra qualche secondo");
			res.redirect("back");
		} else {
			cart.add(foundProduct, foundProduct._id);
			req.session.cart = cart;
			res.redirect("/products");
		}
	});
});

//REDUCE ITEM IN CART
router.get("/cart/reduce/:id", function(req, res){
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart : {});
	
	cart.reduceByOne(productId);
	if (cart.totalQty === 0)
		req.session.cart = null;
	else
		req.session.cart = cart;
	res.redirect("back");
});

//REMOVE ITEM IN CART
router.get("/cart/remove/:id", function(req, res){
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart : {});
	
	cart.removeItem(productId);
	if (cart.totalQty === 0)
		req.session.cart = null;
	else
		req.session.cart = cart;
	res.redirect("back");
});

// =========================================
//PAYPAL
// =========================================
router.post("/checkout/paypal", function(req, res){
	if(req.session.cart){
		var cart = new Cart(req.session.cart);
		var create_payment_json = paymentJson(cart);
		
		paypal.payment.create(create_payment_json, function (error, payment) {
			if (error) {
				throw error;
			} else {
				payment.links.forEach(function(link){
					if(link.rel === "approval_url"){
						res.redirect(link.href);
					}
				});
			}
		});
	} else {
		req.flash("error", "Non ci sono elementi nel carrello");
		res.redirect("back");
	  }	
});

//SUCCESSFUL PAYPAL PAYMENT ROUTE
router.get("/checkout/paypal/success", function(req, res){
	const paymentId = req.query.paymentId;
	const payerId = req.query.PayerID;
	
	const execute_payment_json = {
		"payer_id": payerId,
		"transactions": [{
			"amount": {
				"currency": "EUR",
				"total": (req.session.cart.totalPrice).toFixed(2)
			}
		}]
	};
	
	paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    	if (error) {
			console.log(error.response);
			throw error;
		} else {
			Order.create({
				itemList: payment.transactions[0].item_list.items,
				shippingAddress: payment.payer.payer_info.shipping_address,
				totalAmount: payment.transactions[0].amount.total,
				orderDate: payment.create_time,
				paypalEmail: payment.payer.payer_info.email,
				jsonString: JSON.stringify(payment)
			}, function(err, newOrder){
					if(err){
						console.log(err);
					} else {
						var email = newOrder.email;
						if(req.isAuthenticated()){
							req.user.orders.push(newOrder);
							req.user.save();
							email = req.user.email;
						}
						var smtpTransport = nodemailer.createTransport({
							service: 'Gmail', 
							auth: {
							user: 'nerdius2000@gmail.com',
							pass: process.env.GMAILPW
							}
						});
						var mailOptions = {
							to: 'axel_sk8@hotmail.it',  //Hard codded just for testing purposes!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
							from: 'nerdius2000@enterprise.com',
							subject: 'RheaSpice Password Reset',
							text: 'Ciao,\n' +
							  'RheaSpice ti conferma che ha ricevuto il tuo ordine.\n' + newOrder.itemList + ' Ti invieremo un\'altra email appena l\'ordine sarà evaso \n'  +
							  'Grazie di aver scelto Rhea Spice\n\n' 							  
						  };
						smtpTransport.sendMail(mailOptions, function(err) {
							if(err){
								console.log("Error while sending the email");
							}
							console.log('mail sent');
						 });
						console.log("Payment added successfully to the DB");
						req.flash("success", "Il pagamento è stato effettuato correttamente. A breve riceverai una email di conferma a " + email);
				  	}
				req.session.cart = null;
				res.redirect("/products");
				});
			}
		
	});
});

//CANCEL PAYPAL PAYMENT ROUTE
router.get('/checkout/paypal/cancel', function(req, res){
	req.flash("success", "Il pagamento è stato annullato correttamente.");
	res.redirect("/products");
});




//========================
//LOGGED IN ORDERS VIEW
//========================
router.get("/orders/:id", middleware.isLoggedIn, function(req, res){
	Promise.all(req.user.orders.map(order => {
    	return Order.findOne({_id: order}).exec().catch(err => {
        	// convert error to null result in resolved array
        	return null;
    	});
	})).then(foundOrders => {
   		res.render("checkout/orders",{orders: foundOrders});
	}).catch(err => {
    // handle error here
	});	
});








//============================
//Creates payment JSON 
//============================
function paymentJson(cart){
	const payment = {
		intent: "sale",
		payer: {
			payment_method: "paypal"
		},
		redirect_urls: {
			return_url: "https://rhea-test.run.goorm.io/checkout/paypal/success",
			cancel_url: "https://rheaspice.com/checkout/paypal/cancel"
		},
		transactions: [{
			item_list: {
				items: []
			},
			amount: {},
			description: "Acquisto su RheaSpice.com"
		}]
	};
	

	var products = cart.generateArray();
	products.forEach(function(product){
		payment.transactions[0].item_list.items.push({
			name: product.item.name,
			sku: "001",
			price: product.item.price,
			currency: "EUR",
			quantity: product.qty
		});
	});

	payment.transactions[0].amount = {
		currency: "EUR",
		total: parseFloat(cart.totalPrice).toFixed(2)
	};
	return JSON.stringify(payment);
}


module.exports = router;
