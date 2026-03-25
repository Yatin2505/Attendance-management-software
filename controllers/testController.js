const testRouteHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test route is working perfectly!',
  });
};

module.exports = {
  testRouteHandler,
};
