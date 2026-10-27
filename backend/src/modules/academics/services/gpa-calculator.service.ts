import { Injectable } from '@nestjs/common';
import { Enrollment } from '../entities/enrollment.entity';

export interface GradeScale {
  scale: number;
  letterToPoints: Record<string, number>;
}

export interface CourseGradeBreakdown {
  code: string;
  name: string;
  credits: number;
  percentage: number | null;
  letterGrade: string | null;
  gradePoints: number | null;
}

export interface GpaSummary {
  gpaScale: number;
  cumulativeGpa: number;
  totalCreditsAttempted: number;
  totalCreditsEarned: number;
  courses: CourseGradeBreakdown[];
}

const DEFAULT_SCALE: GradeScale = {
  scale: 4.0,
  letterToPoints: {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0,
  },
};

@Injectable()
export class GpaCalculatorService {
  private readonly scale: GradeScale = DEFAULT_SCALE;

  letterToPoints(letterGrade?: string | null): number | null {
    if (!letterGrade) return null;
    const key = letterGrade.trim().toUpperCase();
    return this.scale.letterToPoints[key] ?? null;
  }

  percentageToLetter(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  private resolvePoints(enrollment: Enrollment): {
    percentage: number | null;
    letter: string | null;
    points: number | null;
  } {
    const rawGrade = enrollment.grade;
    const percentage =
      rawGrade === null || rawGrade === undefined ? null : Number(rawGrade);

    let letter = enrollment.letterGrade?.trim().toUpperCase() || null;
    if (!letter && percentage !== null && !Number.isNaN(percentage)) {
      letter = this.percentageToLetter(percentage);
    }

    const points = this.letterToPoints(letter);
    return { percentage, letter, points };
  }

  calculate(enrollments: Enrollment[]): GpaSummary {
    let totalCreditsAttempted = 0;
    let totalCreditsEarned = 0;
    let weightedPoints = 0;

    const courses: CourseGradeBreakdown[] = enrollments.map((enrollment) => {
      const course = (enrollment as any).course || {};
      const credits = Number(course.credits ?? 0);
      const { percentage, letter, points } = this.resolvePoints(enrollment);

      totalCreditsAttempted += credits;
      if (points !== null && points > 0) {
        totalCreditsEarned += credits;
      }
      if (points !== null) {
        weightedPoints += points * credits;
      }

      return {
        code: course.code ?? '',
        name: course.name ?? '',
        credits,
        percentage: percentage !== null && !Number.isNaN(percentage) ? percentage : null,
        letterGrade: letter,
        gradePoints: points,
      };
    });

    const gradedCredits = courses
      .filter((c) => c.gradePoints !== null)
      .reduce((sum, c) => sum + c.credits, 0);

    const cumulativeGpa =
      gradedCredits > 0
        ? Math.round((weightedPoints / gradedCredits) * 100) / 100
        : 0;

    return {
      gpaScale: this.scale.scale,
      cumulativeGpa,
      totalCreditsAttempted,
      totalCreditsEarned,
      courses,
    };
  }
}
