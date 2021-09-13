const routeHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found on server, please check",
  });
};

module.exports = { routeHandler };
