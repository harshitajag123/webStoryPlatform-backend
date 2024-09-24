//importing dependencies, express, cors,routes,middlewares and errHandler

//importing dependencies
const express = require("express");
const cors = require("cors");
const app = express();
const userRoutes = require("./Routes/UserRoutes");
const storyRoutes = require("./Routes/StoryRoutes");

// Use CORS
app.use(
	cors({
		origin: ["http://localhost:5173", "https://quizze-app-sand.vercel.app"], // Frontend URL
		//origin: ["http://localhost:5173", "https://quizze-app-sand.vercel.app"], // Frontend URL
		methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
		credentials: true, // Enable this if you're dealing with cookies
	})
);

//using middlewares
app.use(express.json());

//using routes
app.use("/api/auth", userRoutes); //user routes
app.use("/api/stories", storyRoutes); //story routes

// app.use(errHandler);

module.exports = app;
