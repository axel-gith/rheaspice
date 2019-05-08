const mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text : String,
    author : {
        id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        username : String
    },
	created: {
		day: Number,
		month: Number,
		year: Number
	}
});

module.exports = mongoose.model("Comment", commentSchema);