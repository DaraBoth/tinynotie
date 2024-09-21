// helpers/errorHandler.js
export const handleError = (error, res) => {
    console.error("Error:", error);

    // Customize error response based on environment
    if (process.env.NODE_ENV === "production") {
        res.status(500).json({ status: false, message: "Internal Server Error." });
    } else {
        res.status(500).json({ status: false, message: error.message });
    }
};