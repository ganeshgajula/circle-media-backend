require("dotenv").config();
const express = require("express");
const cors = require("cors");
const initializeDbConnection = require("./db/db.connect");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
initializeDbConnection();

app.get("/", (req, res) => {
  res.send("Welcome to the world of Express!!");
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
