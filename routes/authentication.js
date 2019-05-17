const express  = require("express"),
	  router   = express.Router(),
	  User 	   = require("../models/user"),
	  passport = require("passport");	

//==================================================
//LOCAL AUTHENTICATION ROUTES
//==================================================
//Register form ROUTE
router.get("/register", function(req, res){
	res.render("register");
});

//Register post ROUTE
router.post("/register", function(req,res){
	if((User.findOne({email: req.body.email}))){
		var newUser = new User({email: req.body.email, username: req.body.username});
		if(req.body.adminCode === process.env.ADMINCODE){
			newUser.isAdmin = true;
		}
		User.register(newUser, req.body.password, function(err, user){
			if(err){
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				passport.authenticate("local")(req, res, function(){
					req.flash("success", "Welcome " + user.username);
					res.redirect("/products");
				});
			}
		});
	} else {
		req.flash("error", "L'email utilizzato è già associato ad un altro account. Prova a fare il login oppure registrati con un altro email");
		res.redirect("/register");
	}
});

//Login form ROUTE
router.get("/login", function(req, res){
	res.render("login");
});

//Login post ROUTE
router.post("/login", passport.authenticate("local",{
	successRedirect: "/products",
	successFlash: "Welcome to Rhea's ",
	failureRedirect: "/login", 
	failureFlash: "Invalid username or password"
}), function(req, res){
	});

//==================================================
//FACEBOOK AUTHENTICATION ROUTES
//==================================================
router.get('/login/facebook',
  passport.authenticate('facebook'));

router.get('/auth/facebook/return', passport.authenticate('facebook', {
	failureRedirect: '/login',
	failureFlash: "Unable to login with Facebook, please try again or use another method",
}), function(req, res) {
		res.redirect('/products');
  	}
);

//==================================================
//GOOGLE AUTHENTICATION ROUTES
//==================================================
router.get("/login/google", passport.authenticate("google", { scope: ['profile'] }));

router.get("/auth/google/return", passport.authenticate('google', { 
		failureRedirect: '/login',
		failureFlash: "Unable to login with Google, please try again or use another method"
}), function(req, res) {
		// Successful authentication, redirect home.
		res.redirect('/products');
  	}	
);



//Logout ROUTE
router.get("/logout", function(req, res){
	var name = req.user.username;
	req.logout();
	req.flash("success", "Log Out successfull. We hope to see you soon " + name);
	res.redirect("/products");
});

module.exports = router;
