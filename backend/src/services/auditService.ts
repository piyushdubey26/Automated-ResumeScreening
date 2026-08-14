import prisma from '../config/db';

export class AuditService {
  static async getAuditLogs(query: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { userId, action, entity, startDate, endDate } = query;
    const whereClause: any = {};

    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = action;
    if (entity) whereClause.entity = entity;

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate);
      }
    }

    return prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 200, // Limit to prevent memory exhaustion
    });
  }
}
