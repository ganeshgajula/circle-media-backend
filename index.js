require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const users = require("./routes/users.router");
const posts = require("./routes/posts.router");
const initializeDbConnection = require("./db/db.connect");
const { errorHandler } = require("./middlewares/errorHandler");
const { routeHandler } = require("./middlewares/routeHandler");
const { authVerify } = require("./middlewares/authVerify");

const app = express();
app.use(express.json());
app.use(fileUpload({ useTempFiles: true }));
app.use(cors());

const PORT = 4000;
initializeDbConnection();

app.use("/users", users);
app.use("/posts", authVerify, posts);

app.get("/", (req, res) => {
  res.send("Welcome to Circle Media");
});

/**
 * 404 Route Handler
 * Note: Do not move this should be the last route
 */
app.use(routeHandler);

/**
 * Error Handler
 * Note: Do not move
 */
app.use(errorHandler);

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
