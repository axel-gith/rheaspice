const express  = require("express"),
	  router   = express.Router(),
	  User 	   = require("../models/user"),
	  validator = require("express-validator"),
	  csrf = require('csurf'),
	  async = require("async"),
	  nodemailer = require("nodemailer"),
	  crypto = require("crypto"),
	  passport = require("passport");

const csrfProtection = csrf();
	  router.use(csrfProtection);
//==================================================
//LOCAL AUTHENTICATION ROUTES
//==================================================
//Register form ROUTE
router.get("/register", function(req, res){
	res.render("auth/register", {csrfToken: req.csrfToken()});
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
	res.render("auth/login", {csrfToken: req.csrfToken()});
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

//==================================================
//PASSWORD RESET ROUTES
//==================================================
//Forgot password input route
router.get("/forgot", function(req, res){
	res.render("auth/forgot", {csrfToken: req.csrfToken()});
});

//Forgot password post route
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', "L'email inserito non è stato trovato.");
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nerdius2000@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nerdius2000@enterprise.com',
        subject: 'RheaSpice Password Reset',
        text: 'Ciao ' + user.username + ',\n' +
		  'RheaSpice ha ricevuto una richiesta per reimpostare la password del tuo account.\n Per procedere, clicca sul seguente link:\n'  +
          'https://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Se non sei stato tu a fare tale richiesta, perfavore ignora questa email e la tua password non verrà cambiata \n\n grazie, \n Assistenza Clienti'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'Abbiamo inviato una e-mail a ' + user.email + '. Per procedere controlla la tua posta elettronica');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

//Reset passoword form route
router.get('/reset/:token', function(req, res){
	  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Il token per reimpostare la passoword è errato o scaduto.');
      return res.redirect('/forgot');
    }
    res.render('auth/reset', {token: req.params.token, csrfToken: req.csrfToken()});
  });
});

//Reset password post route
router.post('/reset/:token', function(req, res) {
	async.waterfall([
    	function(done) {
      		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        		if (!user) {
          			req.flash('error', 'Il token per reimpostare la passoword è errato o scaduto.');
          			return res.redirect('back');
        		}
        		if(req.body.password === req.body.confirm) {
          			user.setPassword(req.body.password, function(err) {
            			user.resetPasswordToken = undefined;
            			user.resetPasswordExpires = undefined;
						user.save(function(err) {
              				req.logIn(user, function(err) {
                			done(err, user);
              				});
            			});
          			});
       			} else {
            		req.flash("error", "Passwords do not match.");
            		return res.redirect('back');
        		}
      		});
    	},
    	function(user, done) {
			var smtpTransport = nodemailer.createTransport({
        		service: 'Gmail', 
        		auth: {
          		user: 'nerdius2000@gmail.com',
          		pass: process.env.GMAILPW
        		}
      		});
      		var mailOptions = {
				to: user.email,
				from: 'nerdius2000@enterprise.com',
				subject: 'La tua password è stata modificata',
				text: 'Ciao '+ user.username+',\n\n' +
				  'ti confermiamo che la password dell\'account ' + user.email + ' è stata modificata.\n Grazie, Assistenza Clienti'
      		};
      		smtpTransport.sendMail(mailOptions, function(err) {
        		req.flash('success', 'Success! Your password has been changed.');
        		done(err);
      		});
    	}
  	], function(err) {
    		res.redirect('/products');
 		 });
});

module.exports = router;
