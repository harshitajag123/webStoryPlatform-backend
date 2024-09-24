const { string, required } = require("joi");
const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
	ownedBy: {
		type: mongoose.Types.ObjectId,
		required: true,
	},
	likes: [
		{
			type: mongoose.Types.ObjectId,
		},
	],
	bookmarks: [
		{
			type: mongoose.Types.ObjectId,
		},
	],
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	lastUpdatedAt: {
		type: Date,
	},
	slides: [
		{
			category: String,
			title: String,
			description: String,
			image: String,
		},
	],
});

module.exports = mongoose.model("Story", storySchema, "stories");