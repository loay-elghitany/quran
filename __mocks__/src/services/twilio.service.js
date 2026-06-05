exports.sendWhatsApp = (to, message) => {
  // no-op
  return Promise.resolve(true);
};

exports.sendSms = (to, message) => {
  return Promise.resolve(true);
};
