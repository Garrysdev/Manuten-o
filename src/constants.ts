import { ServiceOrder, MaintenanceLog } from './types';

export const RECENT_ORDERS: ServiceOrder[] = [
  { id: 'SO-8892', equipment: 'Hydraulic Press P-04', technician: 'J. Kowalski', status: 'IN_PROGRESS', priority: 'HIGH' },
  { id: 'SO-8891', equipment: 'Conveyor Belt C-12', technician: 'M. Chen', status: 'PENDING', priority: 'MEDIUM' },
  { id: 'SO-8890', equipment: 'HVAC Unit Roof-A', technician: 'Unassigned', status: 'CRITICAL', priority: 'HIGH' },
  { id: 'SO-8889', equipment: 'Robotic Arm R-02', technician: 'S. Patel', status: 'COMPLETED', priority: 'LOW' },
  { id: 'SO-8888', equipment: 'Generators Main', technician: 'A. Torres', status: 'COMPLETED', priority: 'MEDIUM' },
];

export const MAINTENANCE_HISTORY: MaintenanceLog[] = [
  {
    id: 'WR-8492-BX',
    date: 'Oct 24, 2023',
    technician: 'J. Miller',
    equipment: 'Compressor Unit A-12',
    location: 'Sector 4, Level B',
    task: 'Routine 500hr Bearing Check & Lube',
    timeRange: '08:00 AM - 10:30 AM',
    hours: '2.5 hrs',
    materials: [
      { name: 'Lubricant Gr-B', sku: 'SP-992-A', qty: '2L' },
      { name: 'Filter Element', sku: 'FE-101', qty: 'x1' },
    ],
    notes: 'Bearings show normal wear. Scheduled next check for +500hrs.',
  },
  {
    id: 'WR-8491-AX',
    date: 'Oct 23, 2023',
    technician: 'S. Carter',
    equipment: 'Conveyor Motor M-04',
    location: 'Assembly Line 1',
    task: 'Emergency Heat Sensor Replacement',
    timeRange: '14:15 PM - 15:45 PM',
    hours: '1.5 hrs',
    materials: [
      { name: 'Sensor PT100', sku: 'PT-100', qty: 'x1' },
      { name: 'Wiring Harness', sku: 'WH-04', qty: 'x1' },
    ],
    notes: 'Old sensor failed due to wire fraying. Replaced and secured.',
  },
];
