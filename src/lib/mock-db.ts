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
  },
  policies: {
    findMany: async () => {
      // Returns all published policies without content field or with,
      // but in the request we map policies.
      return mockPolicies.map(({ content: _, ...p }) => p);
    },
    findBySlug: async (slug: string) => {
      return mockPolicies.find(p => p.slug === slug) || null;
    }
  },
  withdrawals: {
    findMany: async (filter?: { organizerId?: string; status?: string }) => {
      let results = [...mockWithdrawals];
      if (filter) {
        if (filter.organizerId) {
          results = results.filter(w => w.organizerId === filter.organizerId);
        }
        if (filter.status && filter.status !== 'ALL') {
          results = results.filter(w => w.status === filter.status);
        }
      }
      return results;
    },
    findUnique: async (id: string) => {
      return mockWithdrawals.find(w => w.id === id) || null;
    },
    create: async (data: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newWithdrawal: WithdrawalRequest = {
        ...data,
        id: `wdr-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockWithdrawals.push(newWithdrawal);
      return newWithdrawal;
    },
    update: async (id: string, data: Partial<WithdrawalRequest>) => {
      const idx = mockWithdrawals.findIndex(w => w.id === id);
      if (idx !== -1) {
        mockWithdrawals[idx] = {
          ...mockWithdrawals[idx],
          ...data,
          updatedAt: new Date().toISOString()
        };
        return mockWithdrawals[idx];
      }
      return null;
    }
  },
  transactions: {
    findMany: async (filter?: { walletId?: string; type?: string; status?: string }) => {
      let results = [...mockTransactions];
      if (filter) {
        if (filter.walletId) {
          results = results.filter(t => t.walletId === filter.walletId);
        }
        if (filter.type) {
          results = results.filter(t => t.type === filter.type);
        }
        if (filter.status) {
          results = results.filter(t => t.status === filter.status);
        }
      }
      return results;
    },
    findUnique: async (id: string) => {
      return mockTransactions.find(t => t.id === id) || null;
    },
    create: async (data: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
      const newTx: WalletTransaction = {
        ...data,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      mockTransactions.push(newTx);
      return newTx;
    }
  },
  ledger: {
    findMany: async (filter?: { organizerId?: string; source?: string; transactionId?: string; reference?: string; startDate?: string; endDate?: string }) => {
      let results = [...mockLedgers];
      if (filter) {
        if (filter.organizerId) {
          results = results.filter(b => b.entries.some(e => e.account.organizerId === filter.organizerId));
        }
        if (filter.source) {
          results = results.filter(b => b.source === filter.source);
        }
        if (filter.transactionId) {
          results = results.filter(b => b.transactionId === filter.transactionId);
        }
        if (filter.reference) {
          results = results.filter(b => b.reference === filter.reference);
        }
        if (filter.startDate) {
          results = results.filter(b => new Date(b.createdAt) >= new Date(filter.startDate!));
        }
        if (filter.endDate) {
          results = results.filter(b => new Date(b.createdAt) <= new Date(filter.endDate!));
        }
      }
      return results;
    },
    findUnique: async (id: string) => {
      return mockLedgers.find(b => b.id === id) || null;
    },
    create: async (data: Omit<LedgerBatch, 'id' | 'createdAt'>) => {
      const newBatch: LedgerBatch = {
        ...data,
        id: `batch-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      mockLedgers.push(newBatch);
      return newBatch;
    }
  }
};

export interface WithdrawalRequest {
  id: string;
  organizerId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'TICKET_PURCHASE' | 'COMMISSION' | 'REFUND' | 'WITHDRAWAL';
  amount: number;
  commission: number;
  netAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reference: string;
  description: string;
  metadata?: Record<string, unknown>;
  isSettled: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  batchId: string;
  accountId: string;
  debit: number;
  credit: number;
  memo: string;
  account: {
    id: string;
    organizerId: string;
    accountScope: string;
    code: string;
    name: string;
    type: string;
    currency: string;
    isActive: boolean;
  };
  createdAt: string;
}

export interface LedgerBatch {
  id: string;
  transactionId: string;
  source: 'TICKET_PURCHASE' | 'REFUND' | 'WALLET_TOPUP' | 'WITHDRAWAL_REQUEST' | 'SETTLEMENT';
  sourceId: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  entries: LedgerEntry[];
  transaction?: WalletTransaction;
  createdAt: string;
}

export interface Policy {
  _id: string;
  title: string;
  slug: string;
  content: string;
  version: number;
  effectiveDate: string;
}

const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: 'wdr-1',
    organizerId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 50000,
    status: 'PENDING',
    bankAccount: {
      bankName: 'Access Bank',
      accountNumber: '0123456789',
      accountName: 'Tech Events Ltd'
    },
    createdAt: '2026-07-20T06:58:54.994Z',
    updatedAt: '2026-07-20T06:58:54.994Z',
    adminNotes: ''
  },
  {
    id: 'wdr-2',
    organizerId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 150000,
    status: 'APPROVED',
    bankAccount: {
      bankName: 'Access Bank',
      accountNumber: '0123456789',
      accountName: 'Tech Events Ltd'
    },
    createdAt: '2026-07-15T06:58:54.994Z',
    updatedAt: '2026-07-15T08:00:00.000Z',
    adminNotes: 'Transfer reference: TXN-998811'
  },
  {
    id: 'wdr-3',
    organizerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 30000,
    status: 'REJECTED',
    bankAccount: {
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0987654321',
      accountName: 'FESTAC Music Group'
    },
    createdAt: '2026-07-10T06:58:54.994Z',
    updatedAt: '2026-07-10T12:00:00.000Z',
    adminNotes: 'Account name mismatch on verified portal.'
  }
];

const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    walletId: 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
    type: 'TICKET_PURCHASE',
    amount: 20000,
    commission: 1000,
    netAmount: 19000,
    balanceBefore: 50000,
    balanceAfter: 69000,
    status: 'SUCCESSFUL',
    reference: 'PAY-1760000000000-123456',
    description: 'Batch Ticket sale: 2 tickets',
    isSettled: false,
    createdAt: '2026-07-24T06:58:54.994Z'
  },
  {
    id: 'tx-2',
    walletId: 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
    type: 'WITHDRAWAL',
    amount: 50000,
    commission: 0,
    netAmount: -50000,
    balanceBefore: 125200,
    balanceAfter: 75200,
    status: 'SUCCESSFUL',
    reference: 'WD-1760000000000-999999',
    description: 'Withdrawal to Access Bank',
    isSettled: true,
    createdAt: '2026-07-23T10:00:00.000Z'
  }
];

const mockLedgers: LedgerBatch[] = [
  {
    id: 'batch-1',
    transactionId: 'tx-1',
    source: 'TICKET_PURCHASE',
    sourceId: 'tx-1',
    reference: 'PAY-1760000000000-123456',
    description: 'Ticket purchase double entry posting',
    totalDebit: 20000,
    totalCredit: 20000,
    currency: 'NGN',
    createdAt: '2026-07-24T07:02:00.133Z',
    entries: [
      {
        id: 'entry-1',
        batchId: 'batch-1',
        accountId: 'acc-1',
        debit: 19000,
        credit: 0,
        memo: 'Reduce pending payable',
        createdAt: '2026-07-24T07:02:00.133Z',
        account: {
          id: 'acc-1',
          organizerId: '550e8400-e29b-41d4-a716-446655440000',
          accountScope: '550e8400-e29b-41d4-a716-446655440000',
          code: 'ORGANIZER_PENDING_PAYABLE',
          name: 'Organizer pending payable',
          type: 'LIABILITY',
          currency: 'NGN',
          isActive: true
        }
      },
      {
        id: 'entry-2',
        batchId: 'batch-1',
        accountId: 'acc-2',
        debit: 0,
        credit: 19000,
        memo: 'Available balance credit',
        createdAt: '2026-07-24T07:02:00.133Z',
        account: {
          id: 'acc-2',
          organizerId: '550e8400-e29b-41d4-a716-446655440000',
          accountScope: '550e8400-e29b-41d4-a716-446655440000',
          code: 'ORGANIZER_AVAILABLE_BALANCE',
          name: 'Organizer available balance',
          type: 'ASSET',
          currency: 'NGN',
          isActive: true
        }
      },
      {
        id: 'entry-3',
        batchId: 'batch-1',
        accountId: 'acc-3',
        debit: 1000,
        credit: 0,
        memo: 'Platform commission debit',
        createdAt: '2026-07-24T07:02:00.133Z',
        account: {
          id: 'acc-3',
          organizerId: '550e8400-e29b-41d4-a716-446655440000',
          accountScope: '550e8400-e29b-41d4-a716-446655440000',
          code: 'PLATFORM_COMMISSION_RECEIVABLE',
          name: 'Platform commission receivable',
          type: 'ASSET',
          currency: 'NGN',
          isActive: true
        }
      },
      {
        id: 'entry-4',
        batchId: 'batch-1',
        accountId: 'acc-4',
        debit: 0,
        credit: 1000,
        memo: 'Platform revenue credit',
        createdAt: '2026-07-24T07:02:00.133Z',
        account: {
          id: 'acc-4',
          organizerId: '550e8400-e29b-41d4-a716-446655440000',
          accountScope: '550e8400-e29b-41d4-a716-446655440000',
          code: 'PLATFORM_REVENUE',
          name: 'Platform revenue',
          type: 'REVENUE',
          currency: 'NGN',
          isActive: true
        }
      }
    ]
  }
];

const mockPolicies: Policy[] = [
  {
    _id: "697dddc908cccb7ff57c9d82",
    title: "Gobokin Platform Policies",
    slug: "ancillary-policies",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Platform Policies

## 1. Introduction
Welcome to the Gobokin Platform. This Ancillary Policies document governs specific services, activities, and additional features on our platform.

## 2. Platform Usage
 **Account Integrity**: Users must provide accurate, current, and complete registration information.
 **Acceptable Conduct**: You agree not to misuse the platform or assist anyone else in doing so.
 **Data Protection**: We protect your personal data in accordance with our Privacy Policy.

## 3. Amendments
We reserves the right to modify these policies at any time. Changes become effective on the designated date.
`
  },
  {
    _id: "697dddc808cccb7ff57c9d7c",
    title: "Gobokin Venue Usage & Booking Policy",
    slug: "default-hall-policy",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Venue Usage & Booking Policy

## 1. Booking Guidelines
This policy sets forth the standard conditions of booking and using venues listed on the Gobokin platform.

## 2. Host and Guest Obligations
 **Venue Standards**: Hosts must ensure that venues are safe, clean, and match the listed description.
 **Respectful Use**: Guests must respect the venue rules, noise limits, and leave the property in good condition.
 **Damages**: Guests are fully responsible for any damage caused to the venue during their booking.

## 3. Dispute Resolution
Any disagreements regarding venue conditions or booking times should be mediated through Gobokin Customer Support.
`
  },
  {
    _id: "697dddc808cccb7ff57c9d7f",
    title: "Gobokin Venue Partner Master Agreement",
    slug: "hall-owner-agreement",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Venue Partner Master Agreement

## 1. Partnership Overview
This Master Agreement regulates the relationship between Gobokin and Venue Owners / Hall Partners listing their spaces on the platform.

## 2. Listing and Payouts
 **Accurate Representation**: Venue owners must list actual prices, capacities, and facilities.
 **Service Commission**: Gobokin charges a standard commission on successful bookings.
 **Payout Schedule**: Verified venue owners receive payouts in accordance with the bank verification guidelines.

## 3. Compliance and Termination
Failure to adhere to the platform standards can result in immediate listing suspension or account termination.
`
  },
  {
    _id: "6a5e2baaebc42b10b9c23efa",
    slug: "organizer-agreement",
    effectiveDate: "2026-01-28T00:00:00.000Z",
    title: "Gobokin Organizer Master Agreement",
    version: 1,
    content: `# Gobokin Organizer Master Agreement

## 1. Agreement Scope
This agreement applies to all Event Organizers using Gobokin to host events, issue tickets, or handle event registration.

## 2. Organizer Responsibilities
 **Accurate Ticketing**: Organizers are solely responsible for setting ticket quantities and pricing details correctly.
 **Fulfillment**: You must host the event as described. Any cancellation or relocation must be communicated to attendees immediately.
 **Compliance**: Event activities must comply with all local laws and regulations.

## 3. Financial Terms
Payouts of ticket sales proceeds will be processed to the organizer's linked and verified bank account.
`
  },
  {
    _id: "697dddc708cccb7ff57c9d79",
    title: "Gobokin Privacy Policy",
    slug: "privacy-policy",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Privacy Policy

## 1. Information Collection
We collect personal information that you provide when creating an account, buying tickets, or listing a venue.

## 2. Information Usage
 **Service Provision**: To handle ticket registration, payments, and notifications.
 **Analytics**: To improve platform performance and user experience.
 **Security**: To protect against fraud and ensure account security.

## 3. Third-Party Sharing
We do not sell your personal information. We only share data with payment processors and venue/event organizers as necessary to complete transactions.
`
  },
  {
    _id: "697dddc708cccb7ff57c9d76",
    title: "Gobokin Refund, Cancellation & Rescheduling Policy",
    slug: "refund-policy",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Refund, Cancellation & Rescheduling Policy

## 1. Standard Refund Terms
Refund policies are defined by the Event Organizer or Venue Owner during setup.

## 2. Cancellation Process
 **Request Submissions**: Attendees may request refunds through their dashboard within the allowed timeline.
 **Platform Commissions**: Platform booking/ticketing fees are non-refundable.
 **Event Cancellations**: If an event is canceled by the host, full refunds are issued to attendees.

## 3. Process Timelines
Approved refunds are credited to the user's original payment method within 5-10 business days.
`
  },
  {
    _id: "6a5e2bacebc42b10b9c23efb",
    slug: "trust-safety-standards",
    effectiveDate: "2026-01-28T00:00:00.000Z",
    title: "Gobokin Trust & Safety Standards",
    version: 1,
    content: `# Gobokin Trust & Safety Standards

## 1. Core Principles
Gobokin is committed to maintaining a safe, transparent, and trustworthy marketplace.

## 2. Platform Policies
 **Zero Tolerance**: We have zero tolerance for hate speech, harassment, or illegal activities.
 **Honesty**: Users, organizers, and hosts must act with complete integrity.
 **Identity Verification**: We may request identity verification to maintain community standards.

## 3. Reporting Misconduct
You can report any suspicious activity or violations directly to safety@gobokin.com.
`
  },
  {
    _id: "697dddc608cccb7ff57c9d73",
    title: "Gobokin Platform Terms of Service",
    slug: "user-agreement",
    version: 1,
    effectiveDate: "2026-01-28T00:00:00.000Z",
    content: `# Gobokin Platform Terms of Service

## 1. Introduction
By using the Gobokin platform, you agree to comply with and be bound by these Terms of Service.

## 2. General Use
 **Account Custody**: You are responsible for keeping your account details and password secure.
 **Permitted Use**: You may only use Gobokin for legal ticket purchases, venue bookings, and listings.
 **Intellectual Property**: All platform content and software are owned by Gobokin.

## 3. Limitation of Liability
Gobokin is a service platform and is not liable for issues arising directly from event organizer or venue operations.
`
  }
];
