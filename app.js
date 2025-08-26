const express = require("express");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Routes
app.use("/students", studentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
