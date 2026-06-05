const express = require("express");
const {
  getParentDashboard,
  getChildren,
  getChildAssignments,
  createLeaveRequest,
} = require("../controllers/parent.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  validateBody,
  validateParams,
} = require("../middlewares/validation.middleware");
const {
  childAssignmentsParamsSchema,
  leaveRequestCreateSchema,
} = require("../validation/schemas/parent.schema");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("Parent"));

router.get("/dashboard", getParentDashboard);
router.get("/children", getChildren);
router.get(
  "/children/:studentId/assignments",
  validateParams(childAssignmentsParamsSchema),
  getChildAssignments,
);
router.post(
  "/leave-requests",
  validateBody(leaveRequestCreateSchema),
  createLeaveRequest,
);

module.exports = router;
