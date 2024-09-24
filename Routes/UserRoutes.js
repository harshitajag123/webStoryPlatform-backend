// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const Joi = require("joi");

// const User = require("../Database/Models/User");
// const tokenValidator = require("../Middlewares/authMiddleware");
// const { handleErr } = require("../utils/errHandler");

// const router = express.Router(); //authRouter

// //validation schema for register route
// const userValidate = Joi.object({
// 	username: Joi.string().required().label("Username"),
// 	password: Joi.string().required().label("Password"),
// });

// //register route
// router.post("/register", async (req, res) => {
// 	try {
// 		const { username, password } = await userValidate.validateAsync(req.body);
// 		const existUser = await User.findOne({ username: username });

// 		//check if the user already exists
// 		if (existUser) {
// 			return res.status(200).json({
// 				message:
// 					"Username already exists. Please try with a different username.",
// 			});
// 		}

// 		//hash the password using bcrypt
// 		const hashedPassword = await bcrypt.hash(password, 10);

// 		const newUser = new User({
// 			username: username,
// 			password: hashedPassword,
// 		});

// 		//save the user to the database
// 		const savedUser = await newUser.save();

// 		//generate a token
// 		const token = jwt.sign({ userID: savedUser._id }, process.env.JWT_SECRET);

// 		 res.status(200).json({
// 				message: "success", // Updated message to "success"
// 				token: token,
// 			});
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

// //login route
// router.post("/login", async (req, res) => {
// 	try {
// 		const { username, password } = await userValidate.validateAsync(req.body);
// 		const existUser = await User.findOne({ username: username });

// 		//check if the user exists
// 		if (!existUser) {
// 			return res.status(404).json({
// 				message: "Username not found. Please register first.",
// 			});
// 		}

// 		//check if the password matches
// 		const passwordMatch = await bcrypt.compare(password, existUser.password);
// 		if (!passwordMatch) {
// 			return res.status(400).json({
// 				message: "Password does not match. Please try again.",
// 			});
// 		}

// 		//if the password matches, generate a token
// 		const token = jwt.sign({ userID: existUser._id }, process.env.JWT_SECRET);

// 		 res.status(200).json({
// 				message: "success", // Updated message to "success"
// 				token: token,
// 			});
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

// //get user data route
// router.get("/userData", tokenValidator, async (req, res) => {
// 	try {
// 		//get the userID from the token
// 		const id = req?.userID;
// 		const currentUser = await User.findById(id);

// 		//check if the user exists
// 		if (!currentUser) {
// 			return res.status(404).json({
// 				message: "User not found",
// 			});
// 		}

// 		//if the user exists, return the user data
// 		return res.status(200).json({
// 			message: "Logged in successfully",
// 			username: currentUser.username,
// 		});
// 	} catch (error) {
// 		handleErr(res, error);
// 	}
// });

// module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const User = require("../Database/Models/User");
const tokenValidator = require("../Middlewares/authMiddleware");
const { handleErr } = require("../utils/errHandler");

const router = express.Router(); //authRouter

// Validation schema for register and login routes
const userValidate = Joi.object({
	username: Joi.string().required().label("Username"),
	password: Joi.string().required().label("Password"),
});

// Register route
router.post("/register", async (req, res) => {
	try {
		const { username, password } = await userValidate.validateAsync(req.body);
		const existUser = await User.findOne({ username });

		// Check if the user already exists
		if (existUser) {
			return res.status(400).json({
				message:
					"Username already exists. Please try with a different username.",
			});
		}

		// Hash the password using bcrypt
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({
			username,
			password: hashedPassword,
		});

		// Save the user to the database
		const savedUser = await newUser.save();

		// Generate a token
		const token = jwt.sign({ userID: savedUser._id }, process.env.JWT_SECRET);

		return res.status(200).json({
			message: "success",
			token,
		});
	} catch (error) {
		handleErr(res, error);
	}
});

// Login route
router.post("/login", async (req, res) => {
	try {
		const { username, password } = await userValidate.validateAsync(req.body);
		const existUser = await User.findOne({ username });

		// Check if the user exists
		if (!existUser) {
			return res.status(404).json({
				message: "Username not found. Please register first.",
			});
		}

		// Check if the password matches
		const passwordMatch = await bcrypt.compare(password, existUser.password);
		if (!passwordMatch) {
			return res.status(400).json({
				message: "Password does not match. Please try again.",
			});
		}

		// If the password matches, generate a token
		const token = jwt.sign({ userID: existUser._id }, process.env.JWT_SECRET);

		return res.status(200).json({
			message: "success",
			token,
		});
	} catch (error) {
		handleErr(res, error);
	}
});

// Get user data route
router.get("/userData", tokenValidator, async (req, res) => {
	try {
		const id = req?.userID;
		const currentUser = await User.findById(id);

		// Check if the user exists
		if (!currentUser) {
			return res.status(404).json({
				message: "User not found",
			});
		}

		// Return user data
		return res.status(200).json({
			message: "Logged in successfully",
			username: currentUser.username,
		});
	} catch (error) {
		handleErr(res, error);
	}
});

module.exports = router;
