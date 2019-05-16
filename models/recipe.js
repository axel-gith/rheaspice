var mongoose = require("mongoose");

var recipeSchema = new mongoose.Schema({
    name: String,
    image: String,
    guide: String
    });
    
module.exports = mongoose.model("Recipe", recipeSchema);