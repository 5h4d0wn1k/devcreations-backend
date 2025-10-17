import prisma from "../config/db.js";

class UserTypeModel {
  static async create(data) {
    return prisma.userType.create({ data });
  }

  static async findById(id) {
    return prisma.userType.findUnique({ where: { id } });
  }

  static async findByName(name) {
    return prisma.userType.find({ where: { name } });
  }

  static async findOne(filter) {
    return prisma.userType.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.userType.findMany({ where: filter });
  }

  static async updateById(id, data) {
  
    return prisma.userType.update({ where: { id }, data });
  }

  static async deleteById(id) {
    return prisma.userType.delete({ where: { id } });
  }
}

export default UserTypeModel;
