require("dotenv").config();
const express = require("express");
const cors = require("cors");
const users = require("./routes/users.router");
const initializeDbConnection = require("./db/db.connect");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
initializeDbConnection();

app.use("/users", users);

app.get("/", (req, res) => {
  res.send("Welcome to Circle Media");
});

/**
 * 404 Route Handler
 * Note: Do not move this should be the last route
 */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "route not found" });
});

/**
 * Error Handler
 * Note: Do not move
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "error occurred, kindly check the error message for more details",
    errorMessage: err.message,
  });
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
