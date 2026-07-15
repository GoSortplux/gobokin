// Mock Database Service for Staff and Organizer Management

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

export interface Wallet {
  id: string;
  pendingBalance: number;
  availableBalance: number;
  withdrawnBalance: number;
  currency: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PackageRule {
  ruleKey: string;
  ruleValue: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isPublic: boolean;
  durationDays: number;
  type: string;
  rules: PackageRule[];
  discountPercentage?: number;
}

export interface Organizer {
  id: string;
  mongoUserId: string;
  status: string;
  isVerified: boolean;
  bio: string | null;
  website: string | null;
  commissionRate: number;
  maxStaff: number;
  payoutPolicy?: string;
  autoPromotionEligible?: boolean;
  defaultRefundType: 'FULL' | 'PARTIAL' | 'NONE';
  defaultRefundPercentage: number;
  defaultRefundCutoffDays: number;
  wallet: Wallet;
  bankAccount?: BankAccount;
  activeSubscription?: {
    packageId: string;
    packageName: string;
    assignedAt: string;
  } | null;
  adminNotes?: string;
}

export interface ConfigKey {
  key: string;
  value: string;
  description: string;
}

// Initial mock data
const mockUsers: User[] = [
  { _id: '60d5ecb8b391640015f32e56', fullName: 'Tech Events Ltd', email: 'organizer1@tech.com', role: ['organizer'], phone: '+2348012345678' },
  { _id: '60d5ecb8b391640015f32e57', fullName: 'FESTAC Music Group', email: 'music@festac.com', role: ['organizer'], phone: '+2348098765432' },
  { _id: '6789abcdef1234567890abcd', fullName: 'John Staff', email: 'john@example.com', role: ['staff'], phone: '+2348011111111' },
  { _id: 'owner-123', fullName: 'Alice Owner', email: 'alice@example.com', role: ['hall-owner'] },
];

let assignments: StaffAssignment[] = [
  { staffId: '6789abcdef1234567890abcd', ownerId: 'owner-123', hallId: 'venue-101' }
];

const mockWallets: Wallet[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
    pendingBalance: 150000.5,
    availableBalance: 75200,
    withdrawnBalance: 200000,
    currency: 'NGN'
  },
  {
    id: 'w2-b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
    pendingBalance: 0,
    availableBalance: 45000,
    withdrawnBalance: 120000,
    currency: 'NGN'
  }
];

const mockBankAccounts: BankAccount[] = [
  {
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Tech Events Ltd',
    status: 'APPROVED'
  },
  {
    bankName: 'Guaranty Trust Bank',
    accountNumber: '0987654321',
    accountName: 'FESTAC Music Group',
    status: 'PENDING'
  }
];

const mockOrganizers: Organizer[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    mongoUserId: '60d5ecb8b391640015f32e56',
    status: 'ESTABLISHED',
    isVerified: true,
    bio: 'Leading tech event organizer in West Africa.',
    website: 'https://techorganizer.com',
    commissionRate: 5,
    maxStaff: 10,
    payoutPolicy: 'Weekly',
    autoPromotionEligible: true,
    defaultRefundType: 'PARTIAL',
    defaultRefundPercentage: 80,
    defaultRefundCutoffDays: 7,
    wallet: mockWallets[0],
    bankAccount: mockBankAccounts[0],
    activeSubscription: {
      packageId: 'pkg-pro-123',
      packageName: 'Pro Event Package',
      assignedAt: '2025-01-10T12:00:00Z'
    },
    adminNotes: 'Verified via email thread #123.'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    mongoUserId: '60d5ecb8b391640015f32e57',
    status: 'NEW',
    isVerified: false,
    bio: 'Bringing you the finest traditional and modern live music events.',
    website: 'https://festacmusic.org',
    commissionRate: 7.5,
    maxStaff: 5,
    payoutPolicy: 'Bi-weekly',
    autoPromotionEligible: false,
    defaultRefundType: 'FULL',
    defaultRefundPercentage: 100,
    defaultRefundCutoffDays: 5,
    wallet: mockWallets[1],
    bankAccount: mockBankAccounts[1],
    activeSubscription: null,
    adminNotes: ''
  }
];

let mockPackages: SubscriptionPackage[] = [
  {
    id: 'pkg-basic-123',
    name: 'Basic Event Package',
    price: 15000,
    isActive: true,
    isPublic: true,
    durationDays: 30,
    type: 'SUBSCRIPTION',
    discountPercentage: 0,
    rules: [
      { ruleKey: 'MAX_GUESTS', ruleValue: '500' },
      { ruleKey: 'MAX_ACTIVE_EVENTS', ruleValue: '2' },
      { ruleKey: 'BULK_IMPORT_ALLOWED', ruleValue: 'false' }
    ]
  },
  {
    id: 'pkg-pro-123',
    name: 'Pro Event Package',
    price: 45000,
    isActive: true,
    isPublic: true,
    durationDays: 30,
    type: 'SUBSCRIPTION',
    discountPercentage: 10,
    rules: [
      { ruleKey: 'MAX_GUESTS', ruleValue: '5000' },
      { ruleKey: 'MAX_ACTIVE_EVENTS', ruleValue: '10' },
      { ruleKey: 'BULK_IMPORT_ALLOWED', ruleValue: 'true' }
    ]
  },
  {
    id: 'pkg-unlimited-123',
    name: 'Enterprise/Unlimited',
    price: 120000,
    isActive: true,
    isPublic: true,
    durationDays: 365,
    type: 'SUBSCRIPTION',
    discountPercentage: 15,
    rules: [
      { ruleKey: 'MAX_GUESTS', ruleValue: '-1' },
      { ruleKey: 'MAX_ACTIVE_EVENTS', ruleValue: '-1' },
      { ruleKey: 'BULK_IMPORT_ALLOWED', ruleValue: 'true' }
    ]
  }
];

const mockConfig: ConfigKey[] = [
  { key: 'MAX_ACTIVE_EVENTS', value: '5', description: 'Maximum active events allowed per organizer by default.' },
  { key: 'MAX_GUESTS', value: '1000', description: 'Maximum guests allowed per event by default.' },
  { key: 'COMMISSION_RATE', value: '5', description: 'Default platform commission rate percentage on ticket sales.' },
  { key: 'BULK_IMPORT_ALLOWED', value: 'false', description: 'Whether bulk import of attendees is enabled by default.' }
];

export const db = {
  users: {
    findUnique: async (id: string) => {
      return mockUsers.find(u => u._id === id) || null;
    },
    update: async (id: string, data: Partial<User>) => {
      const index = mockUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...data };
        return mockUsers[index];
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
      return { count: assignments.length };
    },
    createMany: async (data: StaffAssignment[]) => {
      assignments.push(...data);
      return { count: data.length };
    }
  },
  organizers: {
    findMany: async (filter?: { status?: string; isVerified?: boolean; search?: string }) => {
      let results = [...mockOrganizers];

      if (filter) {
        if (filter.status && filter.status !== 'ALL') {
          results = results.filter(o => o.status === filter.status);
        }
        if (filter.isVerified !== undefined) {
          results = results.filter(o => o.isVerified === filter.isVerified);
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          results = results.filter(o => {
            const user = mockUsers.find(u => u._id === o.mongoUserId);
            return (
              o.id.toLowerCase().includes(searchLower) ||
              (o.bio || '').toLowerCase().includes(searchLower) ||
              (o.website || '').toLowerCase().includes(searchLower) ||
              (user?.fullName || '').toLowerCase().includes(searchLower) ||
              (user?.email || '').toLowerCase().includes(searchLower)
            );
          });
        }
      }

      return results;
    },
    findUnique: async (id: string) => {
      return mockOrganizers.find(o => o.id === id) || null;
    },
    update: async (id: string, data: Partial<Organizer>) => {
      const index = mockOrganizers.findIndex(o => o.id === id);
      if (index !== -1) {
        mockOrganizers[index] = { ...mockOrganizers[index], ...data };
        return mockOrganizers[index];
      }
      return null;
    }
  },
  packages: {
    findMany: async () => {
      return mockPackages;
    },
    findUnique: async (id: string) => {
      return mockPackages.find(p => p.id === id) || null;
    },
    create: async (data: Omit<SubscriptionPackage, 'id'>) => {
      const newPackage = {
        ...data,
        id: `pkg-${Date.now()}`
      };
      mockPackages.push(newPackage);
      return newPackage;
    },
    update: async (id: string, data: Partial<SubscriptionPackage>) => {
      const index = mockPackages.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPackages[index] = { ...mockPackages[index], ...data };
        return mockPackages[index];
      }
      return null;
    },
    delete: async (id: string) => {
      // Check if any organizer is subscribed
      const hasSubscribers = mockOrganizers.some(o => o.activeSubscription?.packageId === id);
      if (hasSubscribers) {
        // If subscribed, soft delete (mark inactive)
        const pkgIndex = mockPackages.findIndex(p => p.id === id);
        if (pkgIndex !== -1) {
          mockPackages[pkgIndex].isActive = false;
          return { deleted: false, message: 'Package marked as inactive because organizers are subscribed.' };
        }
        return null;
      }
      mockPackages = mockPackages.filter(p => p.id !== id);
      return { deleted: true, message: 'Package deleted successfully.' };
    }
  },
  config: {
    findMany: async () => {
      return mockConfig;
    },
    update: async (key: string, value: string, description?: string) => {
      const index = mockConfig.findIndex(c => c.key === key);
      if (index !== -1) {
        mockConfig[index].value = value;
        if (description !== undefined) {
          mockConfig[index].description = description;
        }
        return mockConfig[index];
      } else {
        const newConf = { key, value, description: description || '' };
        mockConfig.push(newConf);
        return newConf;
      }
    }
  }
};
