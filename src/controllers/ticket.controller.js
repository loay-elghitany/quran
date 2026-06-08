const Ticket = require("../models/ticket.model");

exports.createTicket = async (req, res, next) => {
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
    next(err);
  }
};

exports.listTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ complaints: tickets });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const userTickets = await Ticket.find({ senderId: req.user?._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, tickets: userTickets });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({
        success: false,
        message: "عذراً، التذكرة المطلوبة غير موجودة.",
      });
    res.json({ ticket: updated });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
