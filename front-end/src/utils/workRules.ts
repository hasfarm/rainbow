// Shared department-specific working rules
// Warehouse ("Kho Vận"): lunch 11:30-13:00 (1.5h), 7.5h workday, start 07:30, end 16:30
// Other departments: lunch 12:00-13:00 (1h), 8h workday, start 08:00, end 17:00

export const WAREHOUSE_DEPT = 'Kho Vận';

export function getLunchBreakStart(department: string): number {
  return department === WAREHOUSE_DEPT ? 11 * 60 + 30 : 12 * 60;
}

export function getLunchBreakEnd(_department: string): number {
  return 13 * 60;
}

export function getLunchBreakMinutes(department: string): number {
  return department === WAREHOUSE_DEPT ? 90 : 60;
}

export function getLunchBreakLabel(department: string): string {
  return department === WAREHOUSE_DEPT ? '1.5h nghỉ trưa (11:30–13:00)' : '1h nghỉ trưa (12:00–13:00)';
}

export function getDailyWorkMinutes(department: string): number {
  return department === WAREHOUSE_DEPT ? 450 : 480;
}

export function getDailyWorkHours(department: string): number {
  return department === WAREHOUSE_DEPT ? 7.5 : 8;
}

export function getWorkStartTime(department: string): string {
  return department === WAREHOUSE_DEPT ? '07:30' : '08:00';
}

export function getWorkEndTime(department: string): string {
  return department === WAREHOUSE_DEPT ? '16:30' : '17:00';
}

export function getWorkHoursLabel(department: string): string {
  return `${getWorkStartTime(department)} – ${getWorkEndTime(department)} (${getDailyWorkHours(department)}h)${department === WAREHOUSE_DEPT ? ', nghỉ trưa 11:30–13:00' : ', nghỉ trưa 12:00–13:00'}`;
}

export function getLunchDeductMinutes(department: string, startTotalMin: number, endTotalMin: number): number {
  const lunchStart = getLunchBreakStart(department);
  const lunchEnd = getLunchBreakEnd(department);
  if (startTotalMin < lunchEnd && endTotalMin > lunchStart) {
    return getLunchBreakMinutes(department);
  }
  return 0;
}

export function formatDaysEquivalent(department: string, weightedHours: number): string {
  const days = weightedHours / getDailyWorkHours(department);
  return parseFloat(days.toFixed(3)).toString();
}

export function formatDaysFromMinutes(department: string, totalMinutes: number): string {
  const days = totalMinutes / getDailyWorkMinutes(department);
  return parseFloat(days.toFixed(3)).toString();
}