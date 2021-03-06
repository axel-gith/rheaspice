const middlewareObject = {},
	  Cart = require("../models/cart"),
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


module.exports = middlewareObject;