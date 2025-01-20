const handleRequestAndServerErrors = (
  error,
  res,
  statusCode,
  statusString,
  customMessage
) => {
  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    status: statusString,
    message: customMessage,
  });
};

module.exports = handleRequestAndServerErrors;
