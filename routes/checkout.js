const express  = require("express"),
	  middleware = require("../middleware"),
	  Product = require("../models/product"),
	  Cart = require("../models/cart"),
	  paypal = require("paypal-rest-sdk"),
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

router.post("/cart/add/:id", function(req, res){
	var cart = new Cart(req.session.cart ? req.session.cart : {});
	Product.findById(req.params.id, function(err, foundProduct){
		if(err){
			req.flash("error", "Non siamo riusciti ad aggiungere il prodotto al carrello, riprovi tra qualche secondo");
			res.redirect("back");
		} else {
			cart.add(foundProduct, foundProduct._id);
			console.log(req.session.cart);
			req.session.cart = cart;
			res.redirect("/products");
		}
	});
});

// =========================================
//PAYPAL
// =========================================
router.post("/checkout/paypal", function(req, res){
	if(req.session.cart){
		var cart = new Cart(req.session.cart);
		var create_payment_json = paymentJson(cart);
			console.log("payment after json outside middleware file" + create_payment_json);
    
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
			console.log(JSON.stringify(payment));
			req.session.cart = {};
			req.flash("success", "Il pagamento è stato effettuato correttamente. Riceverai una email appena l'ordine sarà evaso");
			res.redirect("/products");
		}
	});
});

router.get('/checkout/paypal/cancel', function(req, res){
	req.flash("success", "Il pagamento è stato annullato correttamente.");
	res.redirect("/products");
});

function paymentJson(cart){
	const payment = {
		intent: "sale",
		payer: {
			payment_method: "paypal"
		},
		redirect_urls: {
			return_url: "https://rheaspice.com/checkout/paypal/success",
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
