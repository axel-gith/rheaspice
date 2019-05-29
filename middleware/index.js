const middlewareObject = {},
	  Cart = require("../models/cart"),
	  Product = require("../models/product"),
	  Review = require("../models/review"),
	  Comment = require("../models/comment");

middlewareObject.isLoggedIn = function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","You need to be logged in to do that!");
	res.redirect("/login");
};

middlewareObject.isAdmin = function isAdmin(req, res, next){
	if(req.isAuthenticated()){
		if (req.user.isAdmin === true){
			return next();
		} 
	}		req.flash("error", "Please log in to do that");
			console.log("should redirect now");
			res.redirect("/login");
};

middlewareObject.checkCommentOwnership = function checkCommentOwnership(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err || !foundComment){
				req.flash("error", "Comment not found");
				res.redirect("back");
			} else {
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin === true){
					next();
				} else {
					req.flash("error","You are not authorized to edit or delete this comment");
                    res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
	}
};

middlewareObject.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObject.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Product.findById(req.params.id).populate("reviews").exec(function (err, foundProduct) {
            if (err || !foundProduct) {
                req.flash("error", "Product not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundProduct.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/products/" + foundProduct._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};



module.exports = middlewareObject;