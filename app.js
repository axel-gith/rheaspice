	  require('dotenv').config();
const express	   = require("express"),
	  environment  = process.env.NODE_ENV || "development",
	  expressSanitizer = require("express-sanitizer"),
	  session	= require("express-session"),
	  app 	   = express(),
      bodyParser = require("body-parser"),
	  mongoose   = require("mongoose"),
	  mongoStore = require("connect-mongo")(session),
	  Product	   = require("./models/product"),
	  Comment    = require("./models/comment"),
	  User       = require("./models/user"),
	  passport   = require("passport"),
	  methodOverride = require("method-override"),
	  validator = require("express-validator"),
	  flash		 = require("connect-flash"),
	  googleStrategy = require("passport-google-oauth20").Strategy,
	  facebookStrategy = require("passport-facebook").Strategy,
	  localStrategy = require("passport-local");

//ROUTE cosntants
const commentRoutes = require("./routes/comments"),
      productRoutes = require("./routes/products"),
	  authenticationRoutes = require("./routes/authentication"),
	  checkoutRoutes = require("./routes/checkout"),
	  blogRoutes = require("./routes/blog"),
	  indexRoutes = require("./routes/index");

mongoose.connect("mongodb+srv://AxelAdmin:" + process.env.PASSWORD + "@rheaspicetest-rwz5h.mongodb.net/test?retryWrites=true", {useNewUrlParser: true, useFindAndModify: false});
if(environment === "production"){
	app.enable('trust proxy');
	app.use(function(req, res, next){ 
		if(req.protocol === "https"){
			next();
		} else {
			res.redirect("https://" + req.hostname + req.url);
		}
	});
}

app.set("view engine", "ejs"); //So i don't need to specify all the .ejs files
app.use(flash());
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended : "true"}));
app.use(validator());
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//===============
//PASSPORT CONFIGURATION
//===============
app.use(session({
	secret: process.env.SESSIONSECRET,
	resave: false,
	saveUninitialized: false,
	store: new mongoStore({
		mongooseConnection: mongoose.connection,
	}),
	cookie: {maxAge: 240 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res, next){ //Global middleware so i can access the user everywere
	res.locals.currentUser = req.user;
	res.locals.session = req.session;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});
//========================================
//PASSPORT CONFIG
//========================================
//local
passport.use(new localStrategy(User.authenticate()));

//facebook
passport.use(new facebookStrategy({
	clientID: process.env.FB_CLIENT_ID,
	clientSecret: process.env.FB_APP_SECRET,
	callbackURL: "https://rheaspice.com/auth/facebook/return",
	profileFields: ['id', 'email']
  },
	function(accessToken, refreshToken, profile, done) {
		console.log(profile);
		process.nextTick(function(){
			User.findOne({facebookId: profile.id, email: profile.email}).then((currentUser)=>{
				if(currentUser){
					console.log("user is " + currentUser.username);
					done(null, currentUser);
				} else {
					new User ({
						facebookId: profile.id,
						username: profile.displayName
					}).save().then((newUser)=>{
					console.log("new user created " + newUser);
						done(null, newUser);
					});
				}
			});
		});	
	}
));

//google
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://www.rheaspice.com/auth/google/return"
  },
  	function(accessToken, refreshToken, profile, done) {
	console.log(profile);
		User.findOne({googleId: profile.id, email: profile.email}).then((currentUser)=>{
			if(currentUser){
				console.log("user is " + currentUser.username);
				done(null, currentUser);
			} else {
				new User ({
					googleId: profile.id,
					username: profile.displayName
				}).save().then((newUser)=>{
				console.log("new user created " + newUser);
					done(null, newUser);
				});
			}
		});	
	}
));

passport.serializeUser(function(user, done){
	done(null,user._id);
});
passport.deserializeUser(function(id, done){
	User.findById(id).then(function(user){
		done(null, user);
	});
});


//========================================
//ROUTES CONFIG
//========================================
app.use(indexRoutes);
app.use("/products/:id/comments", commentRoutes);
app.use("/products", productRoutes);
app.use(checkoutRoutes);
app.use(authenticationRoutes);
app.use("/blog", blogRoutes);


//========================================
//SERVER START
//========================================
if(environment === 'production'){
	app.listen(process.env.PORT, process.env.IP, function(){
		console.log("Rhes's servers are up and running");
	}); return;
} else {
	app.listen(3000, process.env.IP, function(){
		console.log("Rhes's servers are up and running");
	}); return;
}
