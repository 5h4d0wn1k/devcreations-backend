import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createActivity = async (data) => {
  return await prisma.activity.create({
    data,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

export const getActivities = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    type,
    userId,
    startDate,
    endDate,
    userRole,
  } = filters;

  const where = {};

  if (type) {
    where.type = type;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = new Date(startDate);
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate);
    }
  }

  // Role-based filtering
  if (userRole) {
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        // See all activities
        break;
      case 'admin':
        // See activities related to user management and permissions
        where.type = {
          in: ['user_created', 'user_updated', 'user_deleted', 'module_assigned', 'permission_changed', 'login', 'logout'],
        };
        break;
      case 'manager':
        // See user activities and basic actions
        where.type = {
          in: ['user_created', 'user_updated', 'login', 'logout'],
        };
        break;
      case 'user':
        // Only see own activities
        where.userId = userId;
        where.type = {
          in: ['login', 'logout'],
        };
        break;
      default:
        // Default to minimal access
        where.type = {
          in: ['login', 'logout'],
        };
    }
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getActivityById = async (id) => {
  return await prisma.activity.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

export const deleteActivity = async (id) => {
  return await prisma.activity.delete({
    where: { id },
  });
};

export default prisma.activity;