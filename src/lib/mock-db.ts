// Mock Database Service for Staff Management

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string[];
}

export interface StaffAssignment {
  staffId: string;
  ownerId: string;
  hallId: string;
}

export interface Resource {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  guestCategoryIds: string[];
  notifiedAt?: string;
  createdAt: string;
}

// Initial mock data
const users: User[] = [
  { _id: '6789abcdef1234567890abcd', fullName: 'John Staff', email: 'john@example.com', role: ['staff'], phone: '+2348011111111' },
  { _id: 'owner-123', fullName: 'Alice Owner', email: 'alice@example.com', role: ['hall-owner'] },
];

let assignments: StaffAssignment[] = [
  { staffId: '6789abcdef1234567890abcd', ownerId: 'owner-123', hallId: 'venue-101' }
];

const resources: Resource[] = [];

export const db = {
  users: {
    findUnique: async (id: string) => {
      return users.find(u => u._id === id) || null;
    },
    update: async (id: string, data: Partial<User>) => {
      const index = users.findIndex(u => u._id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        return users[index];
      }
      return null;
    }
  },
  assignments: {
    findMany: async (filter: { staffId?: string; ownerId?: string }) => {
      return assignments.filter(a =>
        (!filter.staffId || a.staffId === filter.staffId) &&
        (!filter.ownerId || a.ownerId === filter.ownerId)
      );
    },
    deleteMany: async (filter: { staffId?: string; ownerId?: string }) => {
      assignments = assignments.filter(a =>
        !((!filter.staffId || a.staffId === filter.staffId) &&
          (!filter.ownerId || a.ownerId === filter.ownerId))
      );
      return { count: assignments.length }; // Simplified
    },
    createMany: async (data: StaffAssignment[]) => {
      assignments.push(...data);
      return { count: data.length };
    }
  },
  resources: {
    findMany: async (filter: { eventId?: string }) => {
      return resources.filter(r => !filter.eventId || r.eventId === filter.eventId);
    },
    findUnique: async (id: string) => {
      return resources.find(r => r.id === id) || null;
    },
    create: async (data: Resource) => {
      resources.push(data);
      return data;
    },
    update: async (id: string, data: Partial<Resource>) => {
      const index = resources.findIndex(r => r.id === id);
      if (index !== -1) {
        resources[index] = { ...resources[index], ...data };
        return resources[index];
      }
      return null;
    },
    delete: async (id: string) => {
      const index = resources.findIndex(r => r.id === id);
      if (index !== -1) {
        const deleted = resources.splice(index, 1);
        return deleted[0];
      }
      return null;
    }
  }
};
