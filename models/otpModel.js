import prisma from "../config/db.js";

class OTPModel {
  static async create(data) {
    return prisma.OTP.create({ data });
  }

  static async findByEmail(email) {
    return prisma.OTP.findUnique({ where: { email } });
  }

  static async findOne(filter) {
    return prisma.OTP.findFirst({
      where: {
        ...filter,
        expiry: {
          gt: new Date()
        }
      }
    });
  }

  static async updateByEmail(email, data) {
    return prisma.OTP.update({ where: { email }, data });
  }

  static async deleteByEmail(email) {
    return prisma.OTP.delete({ where: { email } });
  }

  static async upsert(email, data) {
    return prisma.OTP.upsert({
      where: { email },
      update: data,
      create: { ...data, email }
    });
  }

  // static async findOneAndUpdate(filter, update, options = {}) {
  //   const { upsert = false } = options;

  //   if (upsert) {
  //     return prisma.OTP.upsert({
  //       where: filter,
  //       update: update,
  //       create: { ...update, ...filter }
  //     });
  //   } else {
  //     return prisma.OTP.updateMany({
  //       where: filter,
  //       data: update
  //     });
  //   }
  // }
}

export default OTPModel;
