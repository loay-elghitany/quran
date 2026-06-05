exports.sendWhatsAppMessage = (to, message) => {
  // No-op mock for tests — never send real messages
  // Keep an easily-spyable function signature
  return true;
};

exports.sendTelegramMessage = (chatId, message) => {
  return true;
};

exports.sendSms = (to, message) => {
  return true;
};
