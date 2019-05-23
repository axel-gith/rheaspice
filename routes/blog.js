const express  = require("express"),
	  Faq 	   = require("../models/faq.js"),
	  middleware = require("../middleware"),
	  Blog 	   = require("../models/blog.js"),
	  csrf = require('csurf'),
	  router   = express.Router();

const csrfProtection = csrf();

router.get("/", function(req, res) {
    Blog.find({}, function(err, allBlogs){
        if(err){
            console.log(err);
        } else {
            res.render("blogs/index",{blogs: allBlogs});
        }
    });
});

router.get("/new", function(req, res){
	res.render("blogs/new", {csrfToken: req.csrfToken()});
});

router.post("/", csrfProtection, middleware.isAdmin, function(req, res){
	Blog.create(req.body.blog, function(err, newBlog){
	if(err){
			req.flash("error", "We weren't able to post the new blog, please try again");
		} else {
			req.flash("success","New blog added correctly!");
		}
	});
	res.redirect("/blog");
});

module.exports = router;