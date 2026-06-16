import type { StudentClass } from '../types/result';

export function formatStudentNumber(studentNumber: number) {
  return String(studentNumber).padStart(2, '0');
}

export function formatStudentId(
  studentClass: StudentClass,
  studentNumber: number,
) {
  return `${studentClass}-${formatStudentNumber(studentNumber)}번`;
}
