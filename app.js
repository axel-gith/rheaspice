	  require('dotenv').config();
const express	   = require("express"),
	  environment  = process.env.NODE_ENV || "development",
	  expressSanitizer = require("express-sanitizer"),
	  app 	   = express(),
      bodyParser = require("body-parser"),
	  mongoose   = require("mongoose"),
	  Product	   = require("./models/product"),
	  Comment    = require("./models/comment"),
	  User       = require("./models/user"),
	  passport   = require("passport"),
	  methodOverride = require("method-override"),
	  flash		 = require("connect-flash"),
	  facebookStrategy = require("passport-facebook").Strategy,
	  localStrategy = require("passport-local");

//ROUTE cosntants
const commentRoutes = require("./routes/comments"),
      productRoutes = require("./routes/products"),
	  indexRoutes = require("./routes/index");

mongoose.connect("mongodb+srv://AxelAdmin:" + process.env.PASSWORD + "@rheaspicetest-rwz5h.mongodb.net/test?retryWrites=true", {useNewUrlParser: true});
// app.enable('trust proxy');
// app.use(function(req, res, next){ console.log(i + req.protocol ); i++; if(req.protocol === "https")console.log("  true");
// 	if(req.protocol === "https"){
// 		next();
// 	} else {
// 		res.redirect("https://" + req.hostname + req.url);
// 	}
// });
app.use(function(req, res, next){
	if(req.protocol !== "https" && environment == "production"){
		var secureUrl = "https://" + req.hostname + req.url;
		res.writeHead(301,{"Location" : secureUrl});
		return;
	} else
	next();
});

app.set("view engine", "ejs"); //So i don't need to specify all the .ejs files
app.use(flash());
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended : "true"}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//===============
//PASSPORT CONFIGURATION
//===============
app.use(require("express-session")({
	secret: process.env.SESSIONSECRET,
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res, next){ //Global middleware so i can access the user everywere
	res.locals.currentUser = req.user;
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
	clientID: 1100246720160183,
	clientSecret: process.env.FBAPPSECRET,
	callbackURL: "https://rheaspice.com/return"
},
	function(accessToken, refreshToken, profile, cb) {
		return cb(null, profile);
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//========================================
//ROUTES CONFIG
//========================================
app.use(indexRoutes);
app.use("/products/:id/comments", commentRoutes);
app.use("/products", productRoutes);



if(environment === 'production'){
	app.listen(process.env.PORT, process.env.IP, function(){
		console.log("Rhes's servers are up and running");
	}); return;
} else {
	app.listen(3000, process.env.IP, function(){
		console.log("Rhes's servers are up and running");
	}); return;
}
