export enum WorkforceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum WorkforcePersonType {
  AGENCY = 'agency',
  INTERNAL = 'internal',
}

export enum ShiftType {
  MORNING = 'morning',
  EVENING = 'evening',
  NIGHT = 'night',
  CUSTOM = 'custom',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  INCOMPLETE = 'incomplete',
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  EMERGENCY = 'emergency',
  UNPAID = 'unpaid',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}
