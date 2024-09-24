//importing dependencies , mongoose connection, testing route and server connection

//importing dependencies
const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const port = process.env.PORT || 10000;

//mongoose connection
async function connectDB() {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
		});
		console.log("Connected to Web Story MongoDB");
	} catch (err) {
		console.error("Error connecting to MongoDB", err.message);
	}
}
connectDB();

app.get("/test", (req, res) => {
	res.send("Hello World");
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
