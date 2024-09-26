const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const tokenValidator = require("../Middlewares/authMiddleware");
const { handleErr } = require("../utils/errHandler");
const Story = require("../Database/Models/Story");
const User = require("../Database/Models/User");

const router = express.Router(); //story router

// List of allowed categories (same as the frontend)
// const allowedCategories = [
// 	"Diet",
// 	"TechEdu",
// 	"Fitness",
// 	"Travel",
// 	"Movies",
// 	"All Stories",
// ];

//validation schema for a story
const storySchemavalidate = Joi.object({
	createdAt: Joi.date(),
	lastUpdatedAt: Joi.date().default(null),
	slides: Joi.array()
		.min(3)
		.items(
			Joi.object({
				category: Joi.string().required(),
				image: Joi.string().required(),
				title: Joi.string().required(),
				description: Joi.string().required(),
			})
		),
});

//routes

//get story by categories --done
router.get("/story-by-category", async (req, res) => {
	try {
		const { category, page } = req.query;
		const categoryRegex = new RegExp(category, "i");
		const query = {
			"slides.category": categoryRegex,
		};

		const totalstories = await Story.countDocuments(query);
		const stories = await Story.find(query).limit(page * 4);
		const storiesRemaining = totalstories - page * 4;

		let storiesWithEditAccess = stories.map((story) => ({
			...story.toObject(),
		}));

		// Use the 'authorization' header instead of 'token'
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1]; // Extract the token from the header
			const decode = jwt.verify(token, process.env.JWT_SECRET);

			if (!decode || !decode.userID) {
				return res.status(401).json({ message: "Token not valid" });
			}

			const user = await User.findById(decode.userID);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			storiesWithEditAccess = stories.map((story) => {
				const editable = story.ownedBy.toString() === user._id.toString();
				const bookmark = story.bookmarks.includes(user._id.toString());
				const liked = story.likes.includes(user._id.toString());
				return {
					...story.toObject(),
					editable: editable,
					bookmark: bookmark,
					liked: liked,
				};
			});
		}

		res.json({
			stories: storiesWithEditAccess,
			remainingStories: Math.max(storiesRemaining, 0),
		});
	} catch (error) {
		handleErr(res, error);
	}
});

//add a story --done
router.post("/add", tokenValidator, async (req, res) => {
	try {
		const story = await storySchemavalidate.validateAsync(req.body);
		const newStory = new Story({ ...story, ownedBy: req.userID });
		await newStory.save();
		return res.status(201).json({
			message: "success",
		});
	} catch (error) {
		handleErr(res, error);
	}
});

//update a story -- done
router.patch("/update/:id", tokenValidator, async (req, res) => {
	try {
		const { id } = req.params;
		const { userID } = req;
		const storyData = await storySchemavalidate.validateAsync(req.body);
		const updatedStory = await Story.findById(id);

		if (!updatedStory) {
			return res.status(404).json({
				message: "Story not found",
			});
		}

		if (updatedStory.ownedBy.toString() !== userID) {
			return res
				.status(403)
				.json({ message: "Unauthorized to update this story" });
		}

		updatedStory.slides = storyData.slides;
		updatedStory.lastUpdatedAt = new Date();
		await updatedStory.save();
		res.status(200).json({
			message: "Story updated successfully",
			story: updatedStory,
		});
	} catch (error) {
		handleErr(res, error);
	}
});

//share a story
router.get("/share-story/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const story = await Story.findById(id);
		if (!story) {
			return res.status(404).json({ message: "Story not found" });
		}
		res
			.status(200)
			.json({ message: "Story shared successfully", story: story });
	} catch (error) {
		handleErr(res, error);
	}
});

// Get a story by ID
router.get("/get-story/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const authHeader = req.headers.authorization;

		// Find the story by ID
		const story = await Story.findById(id);
		if (!story) {
			return res.status(404).json({ message: "Story not found" });
		}

		// If no token is provided, return the public version of the story
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			const storyDataWithoutToken = {
				...story.toObject(),
				liked: false,
				bookmark: false,
			};
			return res.status(200).json({ storyDataWithoutToken });
		}

		// Extract the token from the Authorization header
		const token = authHeader.split(" ")[1];

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded || !decoded.userID) {
			return res.status(401).json({ message: "Token not valid" });
		}

		// Find the user and check if they have liked/bookmarked the story
		const user = await User.findById(decoded.userID);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const bookmark = story.bookmarks.includes(user._id.toString());
		const liked = story.likes.includes(user._id.toString());

		const storyDataWithToken = {
			...story.toObject(),
			bookmark: bookmark,
			liked: liked,
		};
		res.status(200).json(storyDataWithToken);
	} catch (error) {
		return res.status(500).json({ message: "An error occurred", error });
	}
});

// Like a story
router.put("/like/:id", tokenValidator, async (req, res) => {
	try {
		const { id } = req.params; // Extract the story ID from the request parameters
		const userId = req.userID; // Get the user ID from the request object

		// Find the story by ID
		const story = await Story.findById(id);

		// Check if the story exists
		if (!story) {
			return res.status(404).json({ message: "Story not found" });
		}

		// Toggle like status
		if (story.likes.includes(userId)) {
			// If the user already liked the story, unlike it
			story.likes = story.likes.filter((like) => like.toString() !== userId);
			await story.save();
			return res.status(200).json({ message: "Story unliked successfully" });
		} else {
			// If the user has not liked the story yet, like it
			story.likes.push(userId);
			await story.save();
			return res.status(200).json({ message: "Story liked successfully" });
		}
	} catch (error) {
		console.error(error); // Log the error for debugging
		return res.status(500).json({ message: "Internal server error" });
	}
});

// Bookmark a story
router.put("/bookmark/:id", tokenValidator, async (req, res) => {
	try {
		const { id } = req.params; // Extract the story ID
		const userId = req.userID; // Get the user ID from the request object

		// Find the story by ID
		const story = await Story.findById(id);

		// Check if the story exists
		if (!story) {
			return res.status(404).json({ message: "Story not found" });
		}

		// Check if the user exists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Toggle bookmark status
		if (story.bookmarks.includes(userId)) {
			// If the user already bookmarked the story, remove the bookmark
			story.bookmarks = story.bookmarks.filter(
				(bookmark) => bookmark.toString() !== userId
			);
			await story.save();

			// Remove from user's bookmarks as well
			user.bookmarks = user.bookmarks.filter(
				(bookmark) => bookmark.toString() !== id
			);
			await user.save();

			return res
				.status(200)
				.json({ message: "Story unbookmarked successfully" });
		} else {
			// If the user has not bookmarked the story yet, add the bookmark
			story.bookmarks.push(userId);
			await story.save();

			// Add to user's bookmarks as well
			user.bookmarks.push(id); // Use the story ID here
			await user.save();

			return res.status(200).json({ message: "Story bookmarked successfully" });
		}
	} catch (error) {
		console.error("Error in bookmark route:", error); // Log the error for debugging
		return res
			.status(500)
			.json({ message: "Internal server error", error: error.message }); // Include error message for more insight
	}
});

//get all bookmarks
router.get("/my-bookmarks", tokenValidator, async (req, res) => {
	try {
		const user = await User.findById(req.userID);
		const bookmarkIds = user.bookmarks;
		const bookmarkStory = await Promise.all(
			bookmarkIds.map(async (id) => {
				return await Story.findById(id);
			})
		);
		res.status(200).json({ stories: bookmarkStory });
	} catch (error) {
		handleErr(res, error);
	}
});

//get all stories of the user
router.get("/my-story", tokenValidator, async (req, res) => {
	try {
		const page = req.query.page || 1;
		const query = {
			ownedBy: req.userID,
		};

		const myStories = await Story.find(query).limit(page * 4);
		const totalStories = await Story.countDocuments(query);
		const storiesRemain = totalStories - page * 4;
		const storiesWithEditAccess = myStories.map((story) => {
			return {
				...story.toObject(),
				editable: true,
			};
		});
		return res.status(200).json({
			stories: storiesWithEditAccess,
			remainingStories: Math.max(storiesRemain, 0),
		});
	} catch (error) {
		handleErr(res, error);
	}
});

module.exports = router;

// router.get("/story-by-category", async (req, res) => {
// 	try {
// 		const { category, page } = req.query;
// 		const categoryRegex = new RegExp(category, "i");
// 		const query = {
// 			"slides.category": categoryRegex,
// 		};

// 		const totalstories = await Story.countDocuments(query);
// 		const stories = await Story.find(query).limit(page * 4);
// 		const storiesRemaining = totalstories - page * 4;

// 		let storiesWithEditAccess = stories.map((story) => ({
// 			...story.toObject(),
// 		}));

// 		const token = req.headers.token;
// 		if (token) {
// 			const decode = jwt.verify(token, process.env.JWT_SECRET);
// 			if (!decode || !decode.userID) {
// 				return res.status(401).json({ message: "Token not valid" });
// 			}
// 			const user = await User.findById(decode.userID);
// 			storiesWithEditAccess = stories.map((story) => {
// 				const editable = story.ownedBy.toString() === user._id.toString();
// 				const bookmark = story.bookmarks.includes(user._id.toString());
// 				const liked = story.likes.includes(user._id.toString());
// 				return {
// 					...story.toObject(),
// 					editable: editable,
// 					bookmark: bookmark,
// 					liked: liked,
// 				};
// 			});
// 		}
// 		res.json({
// 			stories: storiesWithEditAccess,
// 			remainingStories: Math.max(storiesRemaining, 0),
// 		});
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

//get a story with id
// router.get("/get-story/:id", async (req, res) => {
// 	try {
// 		const { id } = req.params;
// 		const token = req.headers.token;
// 		const story = await Story.findById(id);

// 		if (!story) {
// 			return res.status(404).json({ message: "Story not found" });
// 		}

// 		if (!token) {
// 			const storyDataWithoutToken = {
// 				...story.toObject(),
// 				liked: false,
// 				bookmark: false,
// 			};
// 			return res.status(200).json({ storyDataWithoutToken });
// 		}

// 		//check if the token is valid
// 		const decode = jwt.verify(token, process.env.JWT_SECRET);
// 		if (!decode || !decode.userID) {
// 			return res.status(401).json({ message: "Token not valid" });
// 		}

// 		const user = await User.findById(decode.userID);
// 		if (!user) {
// 			return res.status(401).json({ message: "User not found" });
// 		}

// 		const bookmark = story.bookmarks.includes(user._id.toString());
// 		const liked = story.likes.includes(user._id.toString());

// 		const storyDataWithToken = {
// 			...story.toObject(),
// 			bookmark: bookmark,
// 			liked: liked,
// 		};
// 		res.status(200).json(storyDataWithToken);
// 	} catch (error) {
//     handleErr(res, error);
//   }
// });

//like a story
// router.put("/like/:id", tokenValidator, async (req, res) => {
// 	try {
// 		const idStory = req.params;
// 		const userId = req.userID;
// 		const story = await Story.findById(idStory);

// 		if (!story) {
// 			return res.status(404).json({ message: "Story not found" });
// 		}

// 		if (story.likes.includes(userId)) {
// 			const userIndex = story.likes.indexOf(userId);
// 			story.likes.splice(userIndex, 1);
// 			await story.save();
// 			res.status(200).json({ message: "Story unliked successfully" });
// 		} else {
// 			story.likes.push(userId);
// 			await story.save();
// 			res.status(200).json({ message: "Story liked successfully" });
// 		}
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

//bookmark a story
// router.put("/bookmark/:id", tokenValidator, async (req, res) => {
// 	try {
// 		const idStory = req.params;
// 		const userId = req.userID;
// 		const story = await Story.findById(idStory);

// 		if (!story) {
// 			return res.status(404).json({ message: "Story not found" });
// 		}

// 		const user = await User.findById(userId);
// 		if (!user) {
// 			return res.status(404).json({ message: "User not found" });
// 		}

// 		if (story.bookmarks.includes(userId)) {
// 			const indexStory = story.bookmarks.indexOf(userId);
// 			story.bookmarks.splice(indexStory, 1);
// 			await story.save();
// 			res.status(200).json({ message: "Story unbookmarked successfully" });
// 		} else {
// 			story.bookmarks.push(userId);
// 			await story.save();

// 			user.bookmarks.push(idStory);
// 			await user.save();

// 			res.status(200).json({ message: "Story bookmarked successfully" });
// 		}
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

// router.get("/story-by-category", async (req, res) => {
// 	try {
// 		const { category, page } = req.query;

// 		// Validate category
// 		if (!allowedCategories.includes(category)) {
// 			return res.status(400).json({ message: "Invalid category" });
// 		}

// 		const categoryRegex = new RegExp(category, "i");
// 		const query = {
// 			"slides.category": categoryRegex,
// 		};

// 		const totalstories = await Story.countDocuments(query);
// 		const stories = await Story.find(query).limit(page * 4);
// 		const storiesRemaining = totalstories - page * 4;

// 		let storiesWithEditAccess = stories.map((story) => ({
// 			...story.toObject(),
// 		}));

// 		// Use the 'authorization' header instead of 'token'
// 		const authHeader = req.headers.authorization;
// 		if (authHeader && authHeader.startsWith("Bearer ")) {
// 			const token = authHeader.split(" ")[1]; // Extract the token from the header
// 			const decode = jwt.verify(token, process.env.JWT_SECRET);

// 			if (!decode || !decode.userID) {
// 				return res.status(401).json({ message: "Token not valid" });
// 			}

// 			const user = await User.findById(decode.userID);
// 			if (!user) {
// 				return res.status(404).json({ message: "User not found" });
// 			}

// 			storiesWithEditAccess = stories.map((story) => {
// 				const editable = story.ownedBy.toString() === user._id.toString();
// 				const bookmark = story.bookmarks.includes(user._id.toString());
// 				const liked = story.likes.includes(user._id.toString());
// 				return {
// 					...story.toObject(),
// 					editable: editable,
// 					bookmark: bookmark,
// 					liked: liked,
// 				};
// 			});
// 		}

// 		res.json({
// 			stories: storiesWithEditAccess,
// 			remainingStories: Math.max(storiesRemaining, 0),
// 		});
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });
