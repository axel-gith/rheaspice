const express = require("express"),
	  router  = express.Router(),
	  Product = require("../models/product"),
	  Comment = require("../models/comment"),
	  Review = require("../models/review"),
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
			res.render("products/index", {products: allProducts,  csrfToken: req.csrfToken()});
		}
	});
});

//New product form ROUTE
router.get("/new", csrfProtection, middleware.isAdmin, function(req, res){
	res.render("products/new", { csrfToken: req.csrfToken() });
});

//Product show page ROUTE
router.get("/:id", function(req, res){
	Product.findById(req.params.id).populate("comments").populate({path: "reviews",options:{sort:{createdAt:-1}}}).exec(function(err, foundProduct){
		if(err){
			console.log("will eventualy handle the error2");
		} else {
			res.render("products/show", {product: foundProduct, csrfToken: req.csrfToken()});
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
	delete req.body.campground.rating;
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

// DESTROY PRODUCT ROUTE
router.delete("/:id", middleware.isAdmin, function (req, res) {
    Product.findById(req.params.id, function (err, foundProduct) {
        if (err) {
            res.redirect("/products");
        } else {
            // deletes all comments associated with the product
            Comment.remove({"_id": {$in: foundProduct.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/products");
                }
                // deletes all reviews associated with the product
                Review.remove({"_id": {$in: foundProduct.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/products");
                    }
                    //  delete the product
                    foundProduct.remove();
                    req.flash("success", "Product deleted successfully!");
                    res.redirect("/products");
                });
            });
        }
    });
});

module.exports = router;