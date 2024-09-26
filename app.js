//importing dependencies, express, cors,routes,middlewares and errHandler

//importing dependencies
const express = require("express");
const cors = require("cors");
const app = express();
const userRoutes = require("./Routes/UserRoutes");
const storyRoutes = require("./Routes/StoryRoutes");


app.use(express.json());

// Use CORS
app.use(
	cors({
		origin: ["http://localhost:5173"], // Frontend URL
		//origin: ["http://localhost:5173", "https://quizze-app-sand.vercel.app"], // Frontend URL
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed HTTP methods
		credentials: true, // Enable this if you're dealing with cookies
	})
);

//using middlewares
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", origin);
	res.header("Access-Control-Allow-Methods", "GET, POST,PATCH,DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	res.header("Access-Control-Allow-Credentials", "true");
	next();
});




//using routes
app.use("/api/auth", userRoutes); //user routes
app.use("/api/stories", storyRoutes); //story routes

// app.use(errHandler);

module.exports = app;
