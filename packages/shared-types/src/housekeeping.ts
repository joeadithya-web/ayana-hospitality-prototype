export type HousekeepingTaskStatus = 'pending' | 'in_progress' | 'done';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  hotelId: string;
  assignedStaffId: string | null;
  status: HousekeepingTaskStatus;
  createdAt: string;
  completedAt: string | null;
}
