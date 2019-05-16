const express  = require("express"),
	  Faq 	   = require("../models/faq.js"),
	  middleware = require("../middleware"),
	  Blog 	   = require("../models/blog.js"),
	  Recipe 	   = require("../models/recipe.js"),	
	  router   = express.Router();	

//==================================================
//LANDING PAGE
//==================================================
router.get("/", function(req,res){
	res.render("landing.ejs");
});

//==================================================
//PRIVACY PAGE
//==================================================
router.get("/privacy", function(req,res){
	res.render("privacy");
});

//==================================================
//FAQ ROUTES
//==================================================
router.get("/faq", function(req, res) {
    Faq.find({},function(err, allFaqs){
        if(err){
            req.flash("error", err.message);
			res.redirect("back");
        } else {
            res.render("faq/index", {faqs: allFaqs});
        }
    });
});

//==================================================
//BLOG ROUTES
//==================================================
router.get("/blog", function(req, res) {
    Blog.find({}, function(err, allBlogs){
        if(err){
            console.log(err);
        } else {
            res.render("blogs/index",{blogs: allBlogs});
        }
    });
});

//==================================================
//RECIPE ROUTES
//==================================================
router.get("/recipes", function(req, res){
    Recipe.find({}, function(err, allRecipes){
       if(err){
           console.log(err);
       } else {
           res.render("recipes/index", {recipes: allRecipes});
       }
    });
});

//============ NEW RECIPE FORM ============
router.get("/recipes/new",middleware.isAdmin, function(req, res){
    res.render("recipes/new");
});

//============ POST RECIPE ============
router.post("/recipes",middleware.isAdmin, function(req, res){
    console.log(req.body);
    Recipe.create(req.body.recipe, function(err, newRecipe){
        if(err){
            console.log(err); 
        }   else {
            console.log("new recipe added");
        }
        res.redirect("/recipes");    
    }); 
});


module.exports = router;

