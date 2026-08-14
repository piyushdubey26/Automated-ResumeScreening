import prisma from '../config/db';

export class DashboardService {
  static async getAdminDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Core KPIs
    const totalPatients = await prisma.patient.count({ where: { status: 'ACTIVE' } });
    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    const totalDoctors = await prisma.doctor.count({ where: { status: 'ACTIVE' } });
    const activeStaff = await prisma.staff.count({ where: { status: 'ACTIVE' } });

    // Revenue: sum of all completed payments
    const payments = await prisma.payment.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = payments._sum.amount || 0.0;

    // Bed Occupancy
    const totalBeds = await prisma.bed.count();
    const occupiedBeds = await prisma.bed.count({ where: { status: 'OCCUPIED' } });
    const bedOccupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0.0;

    // Pending lab tests
    const pendingLabs = await prisma.labOrder.count({
      where: {
        status: { in: ['ORDERED', 'RECEIVED', 'SAMPLE_COLLECTED', 'PROCESSING'] },
      },
    });

    // Pharmacy Alerts
    const lowStockMeds = await prisma.inventory.count({
      where: { quantity: { lte: 10 }, status: { not: 'EXPIRED' } },
    });
    const expiredMeds = await prisma.inventory.count({
      where: { expiryDate: { lte: new Date() } },
    });

    // Emergency cases (admissions in EMERGENCY ward, or medical records of type EMERGENCY)
    const emergencyCases = await prisma.admission.count({
      where: {
        status: 'ADMITTED',
        bed: {
          room: {
            ward: { type: 'EMERGENCY' },
          },
        },
      },
    });

    // 2. Charts Data
    // Patient registrations over the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const patientsList = await prisma.patient.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const patientRegistrationsByMonth = this.aggregateByMonth(patientsList, 'createdAt');

    // Appointment Trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const appointmentsList = await prisma.appointment.findMany({
      where: { date: { gte: sevenDaysAgo } },
      select: { date: true, status: true },
    });
    const appointmentTrends = this.aggregateAppointmentsByDay(appointmentsList);

    // Revenue Trends (last 6 months)
    const paymentsList = await prisma.payment.findMany({
      where: { paidAt: { gte: sixMonthsAgo }, paymentStatus: 'COMPLETED' },
      select: { paidAt: true, amount: true },
    });
    const revenueTrends = this.aggregateRevenueByMonth(paymentsList);

    // Department Performance (Appointment volume per department)
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });
    const departmentPerformance = departments.map((d) => ({
      department: d.name,
      appointments: d._count.appointments,
    }));

    return {
      kpis: {
        totalPatients,
        todayAppointments,
        totalDoctors,
        activeStaff,
        totalRevenue,
        bedOccupancy: {
          total: totalBeds,
          occupied: occupiedBeds,
          rate: bedOccupancyRate,
        },
        pendingLabs,
        pharmacyAlerts: {
          lowStock: lowStockMeds,
          expired: expiredMeds,
        },
        emergencyCases,
      },
      charts: {
        patientRegistrations: patientRegistrationsByMonth,
        appointmentTrends,
        revenueTrends,
        departmentPerformance,
      },
    };
  }

  private static aggregateByMonth(items: any[], dateField: string) {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      counts[monthYear] = (counts[monthYear] || 0) + 1;
    });

    return Object.keys(counts).map((key) => ({
      month: key,
      count: counts[key],
    }));
  }

  private static aggregateAppointmentsByDay(appointments: any[]) {
    const counts: Record<string, { total: number; completed: number; cancelled: number }> = {};
    appointments.forEach((a) => {
      const dateStr = new Date(a.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
      if (!counts[dateStr]) {
        counts[dateStr] = { total: 0, completed: 0, cancelled: 0 };
      }
      counts[dateStr].total += 1;
      if (a.status === 'COMPLETED') counts[dateStr].completed += 1;
      if (a.status === 'CANCELLED') counts[dateStr].cancelled += 1;
    });

    return Object.keys(counts).map((key) => ({
      date: key,
      total: counts[key].total,
      completed: counts[key].completed,
      cancelled: counts[key].cancelled,
    }));
  }

  private static aggregateRevenueByMonth(payments: any[]) {
    const sums: Record<string, number> = {};
    payments.forEach((p) => {
      const date = new Date(p.paidAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      sums[monthYear] = (sums[monthYear] || 0) + p.amount;
    });

    return Object.keys(sums).map((key) => ({
      month: key,
      amount: parseFloat(sums[key].toFixed(2)),
    }));
  }
}
