const sendWhatsAppMessage = (to, message) => {
  console.log(`Mock WhatsApp message to ${to}: ${message}`);
  return true;
};

module.exports = {
  sendWhatsAppMessage,
};
