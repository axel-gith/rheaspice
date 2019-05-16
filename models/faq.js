var mongoose = require("mongoose");

var faqSchema = new mongoose.Schema({
    question: String,
    answer: String
});

module.exports = mongoose.model("Faq" ,faqSchema);