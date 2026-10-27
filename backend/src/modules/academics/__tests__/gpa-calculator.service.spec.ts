import { GpaCalculatorService } from '../services/gpa-calculator.service';
import { Enrollment } from '../entities/enrollment.entity';

function enrollment(overrides: Partial<Enrollment> & { course?: any }): Enrollment {
  return {
    id: 'e1',
    courseId: 'c1',
    userId: 'u1',
    grade: null,
    letterGrade: null,
    ...overrides,
  } as unknown as Enrollment;
}

describe('GpaCalculatorService', () => {
  let service: GpaCalculatorService;

  beforeEach(() => {
    service = new GpaCalculatorService();
  });

  it('maps letter grades to grade points', () => {
    expect(service.letterToPoints('A')).toBe(4.0);
    expect(service.letterToPoints('B+')).toBe(3.3);
    expect(service.letterToPoints('C')).toBe(2.0);
    expect(service.letterToPoints('F')).toBe(0.0);
    expect(service.letterToPoints(null)).toBeNull();
  });

  it('derives a letter grade from a percentage', () => {
    expect(service.percentageToLetter(92)).toBe('A+');
    expect(service.percentageToLetter(85)).toBe('A');
    expect(service.percentageToLetter(72)).toBe('B');
    expect(service.percentageToLetter(39)).toBe('F');
  });

  it('computes a credit-weighted cumulative GPA', () => {
    const summary = service.calculate([
      enrollment({
        grade: 90 as any,
        course: { code: 'CS101', name: 'Intro', credits: 4 },
      }),
      enrollment({
        grade: 70 as any,
        course: { code: 'CS102', name: 'Data', credits: 2 },
      }),
    ]);

    // A (4.0)*4 + B (3.0)*2 = 22 / 6 = 3.67
    expect(summary.totalCreditsAttempted).toBe(6);
    expect(summary.totalCreditsEarned).toBe(6);
    expect(summary.cumulativeGpa).toBe(3.67);
    expect(summary.gpaScale).toBe(4.0);
  });

  it('ignores ungraded courses in the GPA but counts credits attempted', () => {
    const summary = service.calculate([
      enrollment({
        grade: 85 as any,
        course: { code: 'CS101', name: 'Intro', credits: 3 },
      }),
      enrollment({
        grade: null,
        course: { code: 'CS102', name: 'Data', credits: 3 },
      }),
    ]);

    expect(summary.totalCreditsAttempted).toBe(6);
    expect(summary.cumulativeGpa).toBe(4.0);
  });

  it('returns zero GPA when nothing is graded', () => {
    const summary = service.calculate([
      enrollment({ course: { code: 'X', name: 'X', credits: 3 } }),
    ]);
    expect(summary.cumulativeGpa).toBe(0);
    expect(summary.totalCreditsEarned).toBe(0);
  });
});
