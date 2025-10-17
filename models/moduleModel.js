import prisma from "../config/db.js";

class ModuleModel {
  static async create(data) {
    return prisma.module.create({ data });
  }

  static async findById(id) {
    return prisma.module.findUnique({ where: { id } });
  }

  static async findByUrlSlug(urlSlug) {
    return prisma.module.findUnique({ where: { urlSlug } });
  }

  static async findOne(filter) {
    return prisma.module.findFirst({ where: filter });
  }

  static async find(filter = {}) {
    return prisma.module.findMany({ where: filter });
  }

  static async updateById(id, data) {
    return prisma.module.update({ where: { id }, data });
  }

  static async deleteById(id) {
    return prisma.module.delete({ where: { id } });
  }
}

export default ModuleModel;