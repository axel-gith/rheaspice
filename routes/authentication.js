const express  = require("express"),
	  router   = express.Router(),
	  User 	   = require("../models/user"),
	  validator = require("express-validator"),
	  csrf = require('csurf'),
	  passport = require("passport");

const csrfProtection = csrf();
	  router.use(csrfProtection);
//==================================================
//LOCAL AUTHENTICATION ROUTES
//==================================================
//Register form ROUTE
router.get("/register", function(req, res){
	res.render("register", {csrfToken: req.csrfToken()});
});

//Register post ROUTE
router.post("/register",csrfProtection, function(req,res){
	req.check("email", " l'email utilizzato non è valido").notEmpty().isEmail();
	req.check('password', " la password deve contenere almeno 6 caratteri").notEmpty().isLength({ min: 6 });
	var errors = req.validationErrors();
	if(errors){
		var messages = [];
		errors.forEach(function(error){
			messages.push(error.msg);
		});
		req.flash ("error", messages);
		return res.redirect("back");
	}
	User.findOne({email: req.body.email}, function(foundEmail){
		if(foundEmail){
			req.flash("error", "L'email utilizzato è già associato ad un altro account. Prova a fare il login oppure registrati con un altro email");
			res.redirect("back");
		} else {
			var newUser = new User({email: req.body.email, username: req.body.username});
			if(req.body.adminCode === process.env.ADMINCODE){
				newUser.isAdmin = true;
			}
			User.register(newUser, req.body.password, function(err, user){
				if(err){
					req.flash("error", "Esiste già un utente con lo stesso username, prova a usare un altro");
					res.redirect("back");
				} else {
					passport.authenticate("local")(req, res, function(){
						req.flash("success", "Benvenuto " + user.username);
						res.redirect("/products");
					});
				}
			});
		}
	});
		

		
});

//Login form ROUTE
router.get("/login", function(req, res){
	res.render("login", {csrfToken: req.csrfToken()});
});

//Login post ROUTE
router.post("/login",csrfProtection, passport.authenticate("local",{
	successRedirect: "/products",
	failureRedirect: "/login", 
	failureFlash: "Username o password non valido"
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
