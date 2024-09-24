// //to verify that the user is authenticated before allowing them to access certain routes (like adding, editing, or bookmarking stories)

// const jwt = require("jsonwebtoken");
// const User = require("../Database/Models/User");

// module.exports = async (req, res, next) => {
// 	try {
// 		const token = req.headers.token;

// 		//check if the token exists
// 		if (!token) {
// 			return res.status(400).send("Token not found");
// 		}
// 		//verify the token
// 		const decode = jwt.verify(token, process.env.JWT_SECRET);
// 		if (!decode || !decode.userID) {
// 			return res.status(401).json({ message: "Token not valid" });
// 		}

// 		//check if the user exists
// 		const user = await User.findById(decode.userID);
// 		if (!user) {
// 			return res.status(404).json({
// 				message: "Unauthorized",
// 			});
// 		}
// 		//if the user exists, assign the userID and userName to the request object
// 		req.userID = decode.userID;
// 		req.userName = user.username;
// 		next();
// 	} catch (error) {
// 		console.log(error);
// 		return res.status(500).send("Authentication failed");
// 	}
// };



const jwt = require("jsonwebtoken");
const User = require("../Database/Models/User");

module.exports = async (req, res, next) => {
	try {
		// Retrieve token from the Authorization header (Bearer <token>)
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ message: "Authorization token missing or malformed" });
		}

		// Extract the token
		const token = authHeader.split(" ")[1];

		// Verify the token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded || !decoded.userID) {
			return res.status(401).json({ message: "Token not valid" });
		}

		// Check if the user exists in the database
		const user = await User.findById(decoded.userID);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Assign user information to the request object
		req.userID = decoded.userID;
		req.userName = user.username;
		next();
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Authentication failed" });
	}
};


