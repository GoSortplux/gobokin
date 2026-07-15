import fs from 'fs';
import path from 'path';

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

// Persisted JSON DB helper
const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'db.json');

function readDb(): Record<string, unknown> {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return {};
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON DB file:', error);
    return {};
  }
}

function writeDb(data: Record<string, unknown>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing JSON DB file:', error);
  }
}

// Fallbacks if not initialized
const initialDb = {
  users: [
    { _id: '60d5ecb8b391640015f32e56', fullName: 'Tech Events Ltd', email: 'organizer1@tech.com', role: ['organizer'], phone: '+2348012345678' },
    { _id: '60d5ecb8b391640015f32e57', fullName: 'FESTAC Music Group', email: 'music@festac.com', role: ['organizer'], phone: '+2348098765432' },
    { _id: '6789abcdef1234567890abcd', fullName: 'John Staff', email: 'john@example.com', role: ['staff'], phone: '+2348011111111' },
    { _id: 'owner-123', fullName: 'Alice Owner', email: 'alice@example.com', role: ['hall-owner'] },
  ],
  assignments: [
    { staffId: '6789abcdef1234567890abcd', ownerId: 'owner-123', hallId: 'venue-101' }
  ],
  wallets: [
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
  ],
  bankAccounts: [
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
  ],
  organizers: [
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
      wallet: {
        id: 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
        pendingBalance: 150000.5,
        availableBalance: 75200,
        withdrawnBalance: 200000,
        currency: 'NGN'
      },
      bankAccount: {
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'Tech Events Ltd',
        status: 'APPROVED'
      },
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
      wallet: {
        id: 'w2-b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
        pendingBalance: 0,
        availableBalance: 45000,
        withdrawnBalance: 120000,
        currency: 'NGN'
      },
      bankAccount: {
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0987654321',
        accountName: 'FESTAC Music Group',
        status: 'PENDING'
      },
      activeSubscription: null,
      adminNotes: ''
    }
  ],
  packages: [
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
  ],
  config: [
    { key: 'MAX_ACTIVE_EVENTS', value: '5', description: 'Maximum active events allowed per organizer by default.' },
    { key: 'MAX_GUESTS', value: '1000', description: 'Maximum guests allowed per event by default.' },
    { key: 'COMMISSION_RATE', value: '5', description: 'Default platform commission rate percentage on ticket sales.' },
    { key: 'BULK_IMPORT_ALLOWED', value: 'false', description: 'Whether bulk import of attendees is enabled by default.' }
  ]
};

// Ensure JSON DB exists with full structure
if (!fs.existsSync(DB_PATH)) {
  writeDb(initialDb);
}

export const db = {
  users: {
    findUnique: async (id: string) => {
      const data = readDb();
      const users = (data.users as User[]) || initialDb.users;
      return users.find(u => u._id === id) || null;
    },
    update: async (id: string, updateData: Partial<User>) => {
      const data = readDb();
      const users = (data.users as User[]) || initialDb.users;
      const index = users.findIndex(u => u._id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updateData };
        data.users = users;
        writeDb(data);
        return users[index];
      }
      return null;
    }
  },
  assignments: {
    findMany: async (filter: { staffId?: string; ownerId?: string }) => {
      const data = readDb();
      const assignmentsList = (data.assignments as StaffAssignment[]) || initialDb.assignments;
      return assignmentsList.filter(a =>
        (!filter.staffId || a.staffId === filter.staffId) &&
        (!filter.ownerId || a.ownerId === filter.ownerId)
      );
    },
    deleteMany: async (filter: { staffId?: string; ownerId?: string }) => {
      const data = readDb();
      let assignmentsList = (data.assignments as StaffAssignment[]) || initialDb.assignments;
      assignmentsList = assignmentsList.filter(a =>
        !((!filter.staffId || a.staffId === filter.staffId) &&
          (!filter.ownerId || a.ownerId === filter.ownerId))
      );
      data.assignments = assignmentsList;
      writeDb(data);
      return { count: assignmentsList.length };
    },
    createMany: async (newData: StaffAssignment[]) => {
      const data = readDb();
      const assignmentsList = (data.assignments as StaffAssignment[]) || initialDb.assignments;
      assignmentsList.push(...newData);
      data.assignments = assignmentsList;
      writeDb(data);
      return { count: newData.length };
    }
  },
  organizers: {
    findMany: async (filter?: { status?: string; isVerified?: boolean; search?: string }) => {
      const data = readDb();
      const organizersList = (data.organizers as Organizer[]) || initialDb.organizers;
      const users = (data.users as User[]) || initialDb.users;
      let results = [...organizersList];

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
            const user = users.find(u => u._id === o.mongoUserId);
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
      const data = readDb();
      const organizersList = (data.organizers as Organizer[]) || initialDb.organizers;
      return organizersList.find(o => o.id === id) || null;
    },
    update: async (id: string, updateData: Partial<Organizer>) => {
      const data = readDb();
      const organizersList = (data.organizers as Organizer[]) || initialDb.organizers;
      const index = organizersList.findIndex(o => o.id === id);
      if (index !== -1) {
        organizersList[index] = { ...organizersList[index], ...updateData };
        data.organizers = organizersList;
        writeDb(data);
        return organizersList[index];
      }
      return null;
    }
  },
  packages: {
    findMany: async () => {
      const data = readDb();
      return (data.packages as SubscriptionPackage[]) || initialDb.packages;
    },
    findUnique: async (id: string) => {
      const data = readDb();
      const packagesList = (data.packages as SubscriptionPackage[]) || initialDb.packages;
      return packagesList.find(p => p.id === id) || null;
    },
    create: async (newData: Omit<SubscriptionPackage, 'id'>) => {
      const data = readDb();
      const packagesList = (data.packages as SubscriptionPackage[]) || initialDb.packages;
      const newPackage = {
        ...newData,
        id: `pkg-${Date.now()}`
      };
      packagesList.push(newPackage);
      data.packages = packagesList;
      writeDb(data);
      return newPackage;
    },
    update: async (id: string, updateData: Partial<SubscriptionPackage>) => {
      const data = readDb();
      const packagesList = (data.packages as SubscriptionPackage[]) || initialDb.packages;
      const index = packagesList.findIndex(p => p.id === id);
      if (index !== -1) {
        packagesList[index] = { ...packagesList[index], ...updateData };
        data.packages = packagesList;
        writeDb(data);
        return packagesList[index];
      }
      return null;
    },
    delete: async (id: string) => {
      const data = readDb();
      const organizersList = (data.organizers as Organizer[]) || initialDb.organizers;
      let packagesList = (data.packages as SubscriptionPackage[]) || initialDb.packages;

      // Check if any organizer is subscribed
      const hasSubscribers = organizersList.some(o => o.activeSubscription?.packageId === id);
      if (hasSubscribers) {
        // If subscribed, soft delete (mark inactive)
        const pkgIndex = packagesList.findIndex(p => p.id === id);
        if (pkgIndex !== -1) {
          packagesList[pkgIndex].isActive = false;
          data.packages = packagesList;
          writeDb(data);
          return { deleted: false, message: 'Package marked as inactive because organizers are subscribed.' };
        }
        return null;
      }
      packagesList = packagesList.filter(p => p.id !== id);
      data.packages = packagesList;
      writeDb(data);
      return { deleted: true, message: 'Package deleted successfully.' };
    }
  },
  config: {
    findMany: async () => {
      const data = readDb();
      return (data.config as ConfigKey[]) || initialDb.config;
    },
    update: async (key: string, value: string, description?: string) => {
      const data = readDb();
      const configList = (data.config as ConfigKey[]) || initialDb.config;
      const index = configList.findIndex(c => c.key === key);
      if (index !== -1) {
        configList[index].value = value;
        if (description !== undefined) {
          configList[index].description = description;
        }
        data.config = configList;
        writeDb(data);
        return configList[index];
      } else {
        const newConf = { key, value, description: description || '' };
        configList.push(newConf);
        data.config = configList;
        writeDb(data);
        return newConf;
      }
    }
  }
};
