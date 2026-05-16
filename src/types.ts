export type OrderStatus = 'IN_PROGRESS' | 'PENDING' | 'CRITICAL' | 'COMPLETED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ServiceOrder {
  id: string;
  equipment: string;
  technician: string;
  status: OrderStatus;
  priority: Priority;
  location?: string;
  description?: string;
  date?: string;
  timeLog?: string;
  hours?: string;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  technician: string;
  equipment: string;
  location: string;
  task: string;
  timeRange: string;
  hours: string;
  materials: { name: string; sku: string; qty: string }[];
  notes: string;
}
