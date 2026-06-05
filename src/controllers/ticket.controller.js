const Ticket = require("../models/ticket.model");

exports.createTicket = async (req, res) => {
  try {
    const payload = req.body || {};
    const ticket = new Ticket({
      subject: payload.subject,
      description: payload.description,
      senderId: req.user?._id,
      senderRole: req.user?.role || payload.senderRole,
      senderName: payload.senderName,
      senderEmail: payload.senderEmail,
      isAnonymous: payload.isAnonymous || false,
      type: payload.type || "Complaint",
      priority: payload.priority || "Low",
    });
    await ticket.save();
    res.status(201).json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create ticket" });
  }
};

exports.listTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ complaints: tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list tickets" });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ ticket: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};
