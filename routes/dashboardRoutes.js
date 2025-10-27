import express from "express";
import { CheckAuth, isAdminOrManager } from "../middlewares/authMiddleware.js";
import { getDashboardMetrics, getDashboardActivities, getUserStats } from "../controllers/dashboardController.js";

const router = express.Router();

// Dashboard metrics endpoint (authenticated users)
router.get("/dashboard/metrics", CheckAuth, getDashboardMetrics);

// Dashboard activities endpoint (authenticated users)
router.get("/dashboard/activities", CheckAuth, getDashboardActivities);

// User stats endpoint (authenticated users)
router.get("/dashboard/user-stats", CheckAuth, getUserStats);

export default router;