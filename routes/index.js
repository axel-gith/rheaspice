const express  = require("express"),
	  router   = express.Router(),
	  User 	   = require("../models/user"),
	  passport = require("passport"),
	  middleware = require("../middleware");

//==================================================
//LANDING PAGE
//==================================================
router.get("/", middleware.isHttps, function(req,res){
	res.render("landing.ejs");
});

//==================================================
//PRIVACY PAGE
//==================================================
router.get("/privacy",middleware.isHttps, function(req,res){
	res.render("privacy");
});


//==================================================
//LOCAL AUTHENTICATION ROUTES
//==================================================
//Register form ROUTE
router.get("/register",middleware.isHttps, function(req, res){
	res.render("register");
});

//Register post ROUTE
router.post("/register",middleware.isHttps, function(req,res){
	var newUser = new User({username: req.body.username});
	if(req.body.adminCode === process.env.ADMINCODE){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log("will eventualy handle the error6");
		} else {
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome back " + user.username);
				res.redirect("/products");
			});
		}
	});
});

//Login form ROUTE
router.get("/login",middleware.isHttps, function(req, res){
	res.render("login");
});

//Login post ROUTE
router.post("/login",middleware.isHttps, passport.authenticate("local",{
	successRedirect: "/products",
	successFlash: "Welcome to Rhea's ",
	failureRedirect: "/login", 
	failureFlash: "Invalid username or password"
}), function(req, res){
});

//==================================================
//FACEBOOK AUTHENTICATION ROUTES
//==================================================
router.get("/facebook",middleware.isHttps, passport.authenticate("facebook"));

router.get("/facebook/return", passport.authenticate("facebook",{ failureRedirect: "/login"}), function(req, res){
	res.redirect("/products");
});

//Logout ROUTE
router.get("/logout",middleware.isHttps, function(req, res){
	var name = req.user.username;
	req.logout();
	req.flash("success", "Log Out successfull. We hope to see you soon " + name);
	res.redirect("/products");
});

module.exports = router;

