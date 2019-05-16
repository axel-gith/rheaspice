const express = require("express"),
	  router  = express.Router({mergeParams: true}),
	  Product = require("../models/product"),
	  Comment = require("../models/comment"),
	  middleware = require("../middleware");
var   timeOfCreation = new Date();


//==================================================
//COMMENT ROUTES
//==================================================
router.post("/",middleware.isLoggedIn, function(req, res){
	
	Product.findById(req.params.id, function(err, foundProduct){
		if(err || !foundProduct){
			req.flash("error", "Product not found");
			res.redirect("/");
		} else {
			req.body.comment.text  = req.sanitize(req.body.comment.text);
			Comment.create(req.body.comment, function(err, newComment){
				if(err){
					req.flash("error", "We are sorry, we weren't able to add your comment, please try again");
					res.redirect("/products/" + foundProduct._id);
				} else {
					newComment.created = {
						day: timeOfCreation.getDate(),
						month: timeOfCreation.getMonth(),
						year: timeOfCreation.getFullYear()
					};
					//Save currentUsers name and id as author of comment
					newComment.author.id = req.user._id;
					newComment.author.username = req.user.username;
					newComment.save();
					//Push and Save newly created comment to the product
					foundProduct.comments.push(newComment);
					foundProduct.save();
					req.flash("success","You have successfully added a comment");
					res.redirect("/products/" + foundProduct._id);
				}
			});
		}
	});
});

//Edit form ROUTE
router.get("/:comment_id/edit",middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			console.log("will eventualy handle the error20");
			res.redirect("/products");
		} 
		res.render("comments/edit", {product_id: req.params.id ,comment: foundComment});
	});
});

router.put("/:comment_id",middleware.checkCommentOwnership, function(req, res){
	req.body.comment.text  = req.sanitize(req.body.comment.text);
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			req.flash("error", "We are sorry, we weren't able to edit the comment, please try again");
			res.redirect("/products/" + foundProduct._id);
		} else {
			req.flash("success","You have successfully edited a comment");
			res.redirect("/products/" + req.params.id);
		}
	});
});

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			req.flash("error", "We are sorry, we weren't able to delete the comment, please try again");
			res.redirect("/products/" + foundProduct._id);
		} else {
			req.flash("success","You have successfully deleted a comment");
			res.redirect("/products/" + req.params.id);
		}
	});
});

module.exports = router;