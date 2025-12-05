module.exports = function responseSend(res, status, message, data = {}) {
  const payload = { message, ...data };
  res.status(status).json(payload);
};
