import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../tenants/entities/user.entity';
import { TutorSession } from '../ai-tutor/entities/tutor-session.entity';
import { Enrollment, EnrollmentStatus } from '../academics/entities/enrollment.entity';

export interface Goal {
  title: string;
  target: number;
  progress: number;
  unit: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export interface ProfileAnalytics {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    studentId: string | null;
    avatarUrl: string | null;
    program: string | null;
    faculty: string | null;
    department: string | null;
    yearOfStudy: number | null;
  };
  stats: {
    sessions: number;
    messages: number;
    tokens: number;
    activeSessions: number;
    enrolledCourses: number;
    averageGrade: number | null;
    gradedCourses: number;
    daysActive: number;
    currentStreak: number;
    lastActive: string | null;
  };
  goals: Goal[];
  achievements: Achievement[];
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(TutorSession) private readonly sessionRepo: Repository<TutorSession>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async getAnalytics(universityId: string, userId: string): Promise<ProfileAnalytics> {
    const user = await this.userRepo.findOne({ where: { id: userId, universityId } });

    const sessions = await this.sessionRepo.find({ where: { universityId, userId } });

    let enrollments: Enrollment[] = [];
    try {
      enrollments = await this.enrollmentRepo.find({
        where: { universityId, userId },
        relations: ['course'],
      });
    } catch {
      enrollments = [];
    }

    const activeEnrollments = enrollments.filter(
      (e) => e.status !== EnrollmentStatus.DROPPED,
    );

    const gradeOf = (e: any): number | null => {
      if (e.grade === null || e.grade === undefined || e.grade === '') return null;
      const n = Number(e.grade);
      return Number.isFinite(n) ? n : null;
    };
    const graded = activeEnrollments.filter((e) => gradeOf(e) !== null);
    const averageGrade =
      graded.length > 0
        ? graded.reduce((sum, e) => sum + (gradeOf(e) as number), 0) / graded.length
        : null;

    const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount ?? 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0);
    const activeSessions = sessions.filter((s) => s.isActive).length;

    // Activity: distinct calendar days on which the student used the tutor.
    const dayKeys = new Set<string>();
    for (const s of sessions) {
      const d = s.createdAt ? new Date(s.createdAt) : null;
      if (d && !isNaN(d.getTime())) dayKeys.add(d.toISOString().slice(0, 10));
    }
    if (user?.lastLoginAt) {
      const d = new Date(user.lastLoginAt);
      if (!isNaN(d.getTime())) dayKeys.add(d.toISOString().slice(0, 10));
    }
    const days = Array.from(dayKeys).sort();
    const daysActive = days.length;

    // Current streak of consecutive days ending today or yesterday.
    let currentStreak = 0;
    if (days.length) {
      const dayMs = 86_400_000;
      const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
      const dayTimes = days.map((d) => new Date(d).getTime()).sort((a, b) => b - a);
      const gapFromToday = (today - dayTimes[0]) / dayMs;
      if (gapFromToday <= 1) {
        currentStreak = 1;
        for (let i = 1; i < dayTimes.length; i++) {
          if ((dayTimes[i - 1] - dayTimes[i]) / dayMs === 1) currentStreak++;
          else break;
        }
      }
    }

    const lastActive = user?.lastLoginAt
      ? new Date(user.lastLoginAt).toISOString()
      : days.length
        ? new Date(days[days.length - 1]).toISOString()
        : null;

    const sessionsThisWeek = sessions.filter((s) => {
      if (!s.createdAt) return false;
      return Date.now() - new Date(s.createdAt).getTime() < 7 * 86_400_000;
    }).length;

    const goals: Goal[] = [
      { title: 'Keep a 7-day activity streak', target: 7, progress: currentStreak, unit: 'days' },
      {
        title: 'Maintain an average of 65%',
        target: 65,
        progress: Math.round(averageGrade ?? 0),
        unit: '%',
      },
      { title: 'Use the AI tutor 5 times this week', target: 5, progress: sessionsThisWeek, unit: 'chats' },
    ];

    const achievements: Achievement[] = [
      { id: 'first_chat', title: 'First Steps', description: 'Started your first tutor session', earned: sessions.length >= 1 },
      { id: 'curious_mind', title: 'Curious Mind', description: 'Sent 10+ tutor messages', earned: totalMessages >= 10 },
      { id: 'deep_diver', title: 'Deep Diver', description: 'Sent 50+ tutor messages', earned: totalMessages >= 50 },
      { id: 'streak_3', title: 'On a Roll', description: 'Active 3 days in a row', earned: currentStreak >= 3 },
      { id: 'streak_7', title: 'Consistent', description: 'Active 7 days in a row', earned: currentStreak >= 7 },
      { id: 'high_achiever', title: 'High Achiever', description: 'Average grade of 75%+', earned: (averageGrade ?? 0) >= 75 },
    ];

    return {
      profile: {
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        role: user?.role ?? 'student',
        studentId: user?.studentId ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        program: user?.academicProfile?.program ?? null,
        faculty: user?.academicProfile?.faculty ?? null,
        department: user?.academicProfile?.department ?? null,
        yearOfStudy: user?.academicProfile?.yearOfStudy ?? null,
      },
      stats: {
        sessions: sessions.length,
        messages: totalMessages,
        tokens: totalTokens,
        activeSessions,
        enrolledCourses: activeEnrollments.length,
        averageGrade: averageGrade !== null ? Math.round(averageGrade * 10) / 10 : null,
        gradedCourses: graded.length,
        daysActive,
        currentStreak,
        lastActive,
      },
      goals,
      achievements,
    };
  }
}
