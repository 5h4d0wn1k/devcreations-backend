import express from "express";
import { CheckAuth, isAdminOrManager } from "../middlewares/authMiddleware.js";
import { getActivitiesController, getDashboardActivities } from "../controllers/activityController.js";

const router = express.Router();

// Get activities with filtering and pagination (admin/manager access)
router.get("/activities", CheckAuth, isAdminOrManager, getActivitiesController);

// Get dashboard activities (authenticated users)
router.get("/dashboard/activities", CheckAuth, getDashboardActivities);

export default router;