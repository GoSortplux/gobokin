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

// Initial mock data
const users: User[] = [
  { _id: '6789abcdef1234567890abcd', fullName: 'John Staff', email: 'john@example.com', role: ['staff'], phone: '+2348011111111' },
  { _id: 'owner-123', fullName: 'Alice Owner', email: 'alice@example.com', role: ['hall-owner'] },
];

let assignments: StaffAssignment[] = [
  { staffId: '6789abcdef1234567890abcd', ownerId: 'owner-123', hallId: 'hall-101' }
];

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
  }
};
