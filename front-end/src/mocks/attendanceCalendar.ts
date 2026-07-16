import { mockUsers } from './users';
import type { AttendanceRecord, PunchRecord } from './attendance';

// Generate deterministic pseudo-random number from string seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addMinutes(time: string, mins: number): string {
  return formatTime(parseTime(time) + mins);
}

function generateDayAttendance(
  userId: string,
  date: string,
  isWeekend: boolean,
): AttendanceRecord | null {
  const seed = `${userId}-${date}`;
  const rand = seededRandom(seed);

  // Weekend: 30% chance to work, 70% off
  if (isWeekend) {
    if (rand > 0.3) return null;
  }

  // Weekday patterns
  // 0-0.75: normal work day
  // 0.75-0.88: late
  // 0.88-0.95: early leave
  // 0.95-1.0: absent
  const dayRand = seededRandom(`${seed}-day`);

  if (dayRand > 0.95) {
    return {
      id: `ATT-07-${userId}-${date}`,
      userId,
      date,
      punches: [],
      status: 'absent',
      ipAddress: null,
    };
  }

  const hasLunchBreak = seededRandom(`${seed}-lunch`) > 0.4;
  let status: AttendanceRecord['status'] = 'on_time';

  let checkIn = '07:45';
  if (dayRand > 0.75 && dayRand <= 0.88) {
    checkIn = formatTime(480 + Math.floor(seededRandom(`${seed}-late`) * 35)); // 08:00 - 08:34
    status = 'late';
  } else {
    checkIn = formatTime(465 + Math.floor(seededRandom(`${seed}-in`) * 20)); // 07:45 - 08:04
  }

  let punches: PunchRecord[] = [{ time: checkIn, photo: null }];

  if (hasLunchBreak) {
    const lunchOut = formatTime(690 + Math.floor(seededRandom(`${seed}-lout`) * 15)); // 11:30 - 11:44
    const lunchIn = formatTime(780 + Math.floor(seededRandom(`${seed}-lin`) * 15)); // 13:00 - 13:14
    punches.push({ time: lunchOut, photo: null });
    punches.push({ time: lunchIn, photo: null });
  }

  let checkOut = '17:00';
  if (dayRand > 0.88 && dayRand <= 0.95) {
    checkOut = formatTime(990 + Math.floor(seededRandom(`${seed}-early`) * 25)); // 16:30 - 16:54
    status = 'early_leave';
  } else {
    checkOut = formatTime(1020 + Math.floor(seededRandom(`${seed}-out`) * 20)); // 17:00 - 17:19
  }
  punches.push({ time: checkOut, photo: null });

  return {
    id: `ATT-07-${userId}-${date}`,
    userId,
    date,
    punches,
    status,
    ipAddress: `192.168.${Math.floor(seededRandom(`${seed}-ip`) * 5) + 1}.${Math.floor(seededRandom(`${seed}-ip2`) * 255)}`,
  };
}

export function generateJuly2026Attendance(): AttendanceRecord[] {
  const year = 2026;
  const month = 6; // July is 6 (0-indexed)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const records: AttendanceRecord[] = [];

  for (const user of mockUsers) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `2026-07-${day.toString().padStart(2, '0')}`;
      const dow = new Date(year, month, day).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const record = generateDayAttendance(user.id, date, isWeekend);
      if (record) records.push(record);
    }
  }

  return records;
}

export function getWorkingHours(record: AttendanceRecord): number {
  if (record.punches.length < 2) return 0;
  let total = 0;
  for (let i = 0; i + 1 < record.punches.length; i += 2) {
    const inTime = parseTime(record.punches[i].time);
    const outTime = parseTime(record.punches[i + 1].time);
    total += Math.max(0, outTime - inTime);
  }
  // Subtract lunch if 4 punches (in-lunchOut-lunchIn-out)
  if (record.punches.length === 4) {
    const lunchOut = parseTime(record.punches[1].time);
    const lunchIn = parseTime(record.punches[2].time);
    total -= Math.max(0, lunchIn - lunchOut);
  }
  return total / 60;
}

export const vietnameseDayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const vietnameseDayFull = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];