const handleErr = (res, err) => {
	if (err.details) {
		return res.status(400).json(err.details);
	} else {
		console.error(err);
		return res.status(400).json({
			message: err.message,
			message: "Internal server error",
		});
	}
};

module.exports = { handleErr };
