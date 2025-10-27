
import { getActivities } from "../models/activityModel.js";
import prisma from "../config/db.js";

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { role = 'user' } = req.query;

    // Get basic counts
    const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
    const totalModules = await prisma.module.count({ where: { isActive: true } });
    const totalUserTypes = await prisma.userType.count();

    // Get active users (users with active sessions or recent activity)
    const activeUsers = await prisma.user.count({
      where: {
        isDeleted: false,
        isActive: true
      }
    });

    // Get role-based metrics
    let metrics = {
      totalUsers,
      totalModules,
      totalUserTypes,
      activeUsers
    };

    // Add role-specific metrics
    if (role === 'superadmin' || role === 'admin') {
      // Superadmin/Admin specific metrics
      const deletedUsers = await prisma.user.count({ where: { isDeleted: true } });
      const inactiveModules = await prisma.module.count({ where: { isActive: false } });

      metrics = {
        ...metrics,
        deletedUsers,
        inactiveModules,
        totalUserAccess: await prisma.userAccess.count({ where: { isActive: true } })
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    next(error);
  }
};

export const getDashboardActivities = async (req, res, next) => {
  try {
    const { limit = 10, userRole = 'user' } = req.query;

    // Get activities based on user role using the activityModel functions
    const filters = {
      limit: parseInt(limit),
      userRole,
      userId: req.user?.id // Only for regular users
    };

    const result = await getActivities(filters);

    return res.status(200).json({
      success: true,
      message: 'Dashboard activities retrieved successfully',
      data: result.activities
    });
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const { period = 'month', userRole = 'user' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let stats = {};

    if (userRole === 'superadmin') {
      // Superadmin sees comprehensive stats
      const userRegistrations = await prisma.activity.count({
        where: {
          type: 'user_created',
          timestamp: { gte: startDate }
        }
      });

      const permissionChanges = await prisma.activity.count({
        where: {
          type: 'permission_changed',
          timestamp: { gte: startDate }
        }
      });

      const moduleAssignments = await prisma.activity.count({
        where: {
          type: 'module_assigned',
          timestamp: { gte: startDate }
        }
      });

      stats = {
        userRegistrations,
        permissionChanges,
        moduleAssignments,
        period
      };
    } else if (userRole === 'admin' || userRole === 'manager') {
      // Admin/Manager see management stats
      const userActivities = await prisma.activity.count({
        where: {
          type: { in: ['user_created', 'user_updated', 'user_deleted'] },
          timestamp: { gte: startDate }
        }
      });

      const permissionActivities = await prisma.activity.count({
        where: {
          type: { in: ['permission_changed', 'module_assigned', 'module_unassigned'] },
          timestamp: { gte: startDate }
        }
      });

      stats = {
        userActivities,
        permissionActivities,
        period
      };
    } else {
      // Regular users see personal activity stats
      const personalActivities = await prisma.activity.count({
        where: {
          userId: req.user?.id,
          timestamp: { gte: startDate }
        }
      });

      const loginActivities = await prisma.activity.count({
        where: {
          userId: req.user?.id,
          type: 'login',
          timestamp: { gte: startDate }
        }
      });

      stats = {
        personalActivities,
        loginActivities,
        period
      };
    }

    return res.status(200).json({
      success: true,
      message: 'User stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    next(error);
  }
};