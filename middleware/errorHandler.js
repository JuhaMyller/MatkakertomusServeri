//päätyy tähä catch blockista jossa errori on päästetty eteenpäin funtiolla =>  next(error)
//vastaa clientille error statukset ja viestin

const errorHandler = (error, req, res, next) => {
  const { statusCode } = error;
  console.error('Server Error: ', error);
  res.status(statusCode || 500).json({ message: error.message });
};

module.exports = errorHandler;
