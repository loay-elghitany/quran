const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  validateBody,
  validateParams,
} = require("../middlewares/validation.middleware");
const {
  ticketCreateSchema,
  ticketUpdateStatusSchema,
} = require("../validation/schemas/ticket.schema");
const { idParamsSchema } = require("../validation/schemas/admin.schema");
const {
  createTicket,
  listTickets,
  getMyTickets,
  updateTicketStatus,
} = require("../controllers/ticket.controller");

const router = express.Router();

// Anyone authenticated can create a ticket
router.post(
  "/",
  authMiddleware,
  validateBody(ticketCreateSchema),
  createTicket,
);

router.get("/my-tickets", authMiddleware, getMyTickets);

// Only SuperAdmin (or roles with access) can list or update status
router.get("/", authMiddleware, roleMiddleware("SuperAdmin"), listTickets);
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("SuperAdmin"),
  validateParams(idParamsSchema),
  validateBody(ticketUpdateStatusSchema),
  updateTicketStatus,
);

module.exports = router;
