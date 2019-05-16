const express  = require("express"),
	  middleware = require("../middleware"),
	  Product = require("../models/product"),
	  router   = express.Router();

router.get("/cart", middleware.isLoggedIn, function(req,res){
	res.render("checkout/cart", {currentUser: req.user});
});

router.post("/cart/add/:id",middleware.isLoggedIn, function(req, res){
	Product.findById(req.params.id, function(err, foundProduct){
		if(err){
			req.flash("error", "Non siamo riusciti ad aggiungere il prodotto al carrello, riporovi tra qualche secondo");
			res.redirect("back");
		} else {
			req.user.cart.push(foundProduct);
			req.user.save();
			req.flash("success", "Il prodotto è stato aggiunto al carrello");
			console.log(req.user);
			res.redirect("back");
		}
	});
});

module.exports = router;
