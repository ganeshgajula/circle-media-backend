const mongoose = require("mongoose");

const initializeDbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("successfully connected");
  } catch (error) {
    console.error(
      "Mongoose connection failed, kindly check the connectivity",
      error
    );
  }
};

module.exports = initializeDbConnection;
