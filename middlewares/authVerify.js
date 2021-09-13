const jwt = require("jsonwebtoken");

const authVerify = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log({ token });
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log({ decoded });
    return next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access. please add the token",
    });
  }
};

module.exports = { authVerify };
