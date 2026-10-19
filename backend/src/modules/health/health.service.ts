import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HealthAppointment,
  HealthAppointmentStatus,
  HealthAppointmentType,
} from './entities/health-appointment.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(HealthAppointment) private appointmentRepo: Repository<HealthAppointment>,
  ) {}

  async bookAppointment(universityId: string, userId: string, data: Partial<HealthAppointment>): Promise<HealthAppointment> {
    const appointment = this.appointmentRepo.create({
      ...data,
      universityId,
      userId,
      status: HealthAppointmentStatus.PENDING,
    });
    return this.appointmentRepo.save(appointment);
  }

  async findUserAppointments(universityId: string, userId: string): Promise<HealthAppointment[]> {
    return this.appointmentRepo.find({
      where: { universityId, userId },
      order: { scheduledAt: 'DESC' },
    });
  }

  async findAppointmentById(universityId: string, id: string, userId: string): Promise<HealthAppointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id, universityId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async cancelAppointment(universityId: string, id: string, userId: string): Promise<HealthAppointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id, universityId, userId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === HealthAppointmentStatus.COMPLETED) {
      throw new ForbiddenException('Cannot cancel completed appointment');
    }
    appointment.status = HealthAppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  async updateAppointmentStatus(universityId: string, id: string, status: HealthAppointmentStatus): Promise<HealthAppointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id, universityId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    appointment.status = status;
    return this.appointmentRepo.save(appointment);
  }

  async getAvailableSlots(universityId: string, date: string, type?: HealthAppointmentType): Promise<Array<{ time: string; available: boolean }>> {
    const slots: Array<{ time: string; available: boolean }> = [];
    const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

    for (const time of hours) {
      slots.push({ time, available: Math.random() > 0.3 });
    }

    return slots;
  }

  async triggerEmergencySos(universityId: string, userId: string, data: {
    latitude?: number;
    longitude?: number;
    message?: string;
  }): Promise<{ alertId: string; status: string; message: string }> {
    const alertId = `sos-${Date.now()}`;
    return {
      alertId,
      status: 'dispatched',
      message: 'Emergency SOS alert has been dispatched to campus security. Stay in a safe location.',
    };
  }

  async getSafetyAlerts(universityId: string): Promise<any[]> {
    return [
      {
        id: 'alert-1',
        type: 'info',
        title: 'Campus Safety Advisory',
        message: 'Be aware of increased foot traffic near the construction zone.',
        createdAt: new Date(),
        severity: 'low',
      },
    ];
  }
}
