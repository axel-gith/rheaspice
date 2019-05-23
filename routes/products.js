const express = require("express"),
	  router  = express.Router(),
	  Product = require("../models/product"),
	  Comment = require("../models/comment"),
	  csrf = require('csurf'),
	  middleware = require("../middleware");

const csrfProtection = csrf();
router.use(csrfProtection);

//==================================================
//PRODUCT ROUTES
//==================================================

//Products page ROUTE
router.get("/", function(req, res){
	Product.find({}, function(err, allProducts){
		if(err){
			console.log("will eventualy handle the error1");
		} else {
			res.render("products/index", {products: allProducts});
		}
	});
});

//New product form ROUTE
router.get("/new", csrfProtection, middleware.isAdmin, function(req, res){
	res.render("products/new", { csrfToken: req.csrfToken() });
});

//Product show page ROUTE
router.get("/:id", function(req, res){
	Product.findById(req.params.id).populate("comments").exec(function(err, foundProduct){
		if(err){
			console.log("will eventualy handle the error2");
		} else {
			res.render("products/show", {product: foundProduct});
		}
	});
});

//New product Post ROUTE
router.post("/", csrfProtection, middleware.isAdmin, function(req, res){
	Product.create(req.body.product, function(err, product){
		if(err){
			req.flash("error", "We weren't able to post the new product, please try again");
		} else {
			req.flash("success","New product added correctly!");
		}
	});
	res.redirect("/products");
});

//Edit product form ROUTE
router.get("/:id/edit",middleware.isAdmin, function(req, res){
	Product.findById(req.params.id, function(err, foundProduct){
		if(err){
			console.log("will eventualy handle the error10");
		}
			res.render("products/edit", {product: foundProduct, csrfToken: req.csrfToken()});
	});
});

//Edit product put ROUTE
router.put("/:id",middleware.isAdmin, function(req, res){
	Product.findByIdAndUpdate(req.params.id, req.body.product, function(err, updatedProduct){
		if(err){
			req.flash("error", "We weren't able to edit the product, please try again");
			res.redirect("/products");
		} else {
			req.flash("success","Product edited correctly!");
			res.redirect("/products/" + req.params.id);
		}
	});
});

//Destroy product ROUTE
router.delete("/:id", middleware.isAdmin, function(req,res){
	Product.findByIdAndRemove(req.params.id, function(err, removedProduct){
		if(err){
			req.flash("error", "Something went wrong while deleting the product, please try again");
			res.redirect("/products");
		} else {
			Comment.deleteMany({_id: { $in: removedProduct.comments}}, function(err){
				if(err){
					res.redirect("/prodcuts");				
				} else {
					req.flash("success", "Products removed");
					res.redirect("/products");
				}
			});
		  }	
	});
});

module.exports = router;