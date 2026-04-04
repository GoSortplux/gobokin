export interface Facility {
  _id: string;
  available: boolean;
  chargeable: boolean;
  chargeMethod: 'free' | 'flat' | 'per_day' | 'per_hour';
  cost: number;
  quantity: number;
  chargePerUnit: boolean;
  variantName?: string;
  description?: string;
  facility?: {
    _id: string;
    name: string;
  };
  name?: string;
}

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  avatar?: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  hall: string | Venue;
  user: string | UserProfile;
  bookingDates: {
    startTime: string;
    endTime: string;
  }[];
  totalPrice: number;
  paymentStatus: string;
  paidAmount?: number;
  balanceAmount?: number;
  reservationFee?: number;
  bookingStatus?: 'pending' | 'confirmed' | 'cancelled' | string;
  status?: 'pending' | 'confirmed' | 'cancelled' | string;
  eventDetails?: string;
  createdAt: string;
  review?: Review;
  isRecurring?: boolean;
  recurringBookingId?: string;
  paymentMethod?: string;
  bookingType?: string;
  walkInUserDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  cancellationRequest?: {
    status: 'not-requested' | 'pending' | 'approved' | 'rejected';
  };
  hallPrice?: number;
  facilitiesPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  discountType?: string;
  selectedFacilities?: {
    name: string;
    cost: number;
    chargeMethod: string;
    facility: string;
    quantity: number;
  }[];
  refundDetails?: {
    totalRefundableAmount: number;
    totalRefundedAmount: number;
    refundHistory: {
      amount: number;
      note: string;
      date: string | { $date: string };
      recordedBy: string | { _id: string; fullName: string };
    }[];
  };
  payout?: {
    amount: number;
    status: string;
    payoutDate: string;
    subAccountCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Reservation {
  _id: string;
  reservationId: string;
  hall: string | Venue;
  user: string | UserProfile;
  bookingDates: {
    startTime: string;
    endTime: string;
  }[];
  totalPrice: number;
  paidAmount?: number;
  balanceAmount?: number;
  reservationFee?: number;
  status: string;
  createdAt: string;
  paymentStatus?: string;
  walkInUserDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  cancellationRequest?: {
    status: 'not-requested' | 'pending' | 'approved' | 'rejected';
  };
  hallPrice?: number;
  facilitiesPrice?: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  discountType?: string;
  selectedFacilities?: {
    name: string;
    cost: number;
    chargeMethod: string;
    facility: string;
    quantity: number;
  }[];
  refundDetails?: {
    totalRefundableAmount: number;
    totalRefundedAmount: number;
    refundHistory: {
      amount: number;
      note: string;
      date: string | { $date: string };
      recordedBy: string | { _id: string; fullName: string };
    }[];
  };
  payout?: {
    amount: number;
    status: string;
    payoutDate: string;
    subAccountCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Suitability {
  _id: string;
  name: string;
  id: string;
}

export interface Policy {
  _id: string;
  title: string;
  slug: string;
  content: string;
  version: number;
  effectiveDate: string;
}

export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  avatar?: string;
  role: string[];
  activeRole: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  bvn?: string;
  nin?: string;
  hasAcceptedLatestPolicies: boolean;
  hasAcceptedHallOwnerPolicy: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  hallOwnerApplication?: {
    status: string;
  };
  assignedHalls?: (string | { _id: string })[];
  hallIds?: string[];
  organizerProfile?: OrganizerProfile;
}

export interface Venue {
  id: string;
  _id: string;
  slug: string;
  name: string;
  location: string;
  capacity: number;
  description: string;
  images: string[];
  videos?: string[];
  averageRating: number;
  numReviews: number;
  facilities: Facility[];
  blockedDates?: string[];
  country?: string;
  state?: string;
  localGovernment?: string;
  owner?: {
    _id: string;
    fullName: string;
  };
  pricing: {
    dailyRate?: number;
    hourlyRate?: number;
  };
  recurringBookingDiscount?: {
    percentage: number;
    minBookings: number;
  };
  discountSettings?: {
    enabled: boolean;
    hourly: {
      minHours: number;
      percentage: number;
    };
    daily: {
      minDays: number;
      percentage: number;
    };
  };
  maxStaffManualDiscount?: number;
  reservationFeePercentage?: number;
  openingHour?: number;
  closingHour?: number;
  bookingBufferInHours?: number;
  shortBookingBufferInHours?: number;
  reservationCutoffHours?: number;
  isListed?: boolean;
  isOnlineBookingEnabled?: boolean;
  allowRecurringBookings?: boolean;
  geoLocation?: {
    type: string;
    coordinates: number[];
    address?: string;
  };
  suitableFor?: (Suitability | string)[];
  rules?: string[] | string;
  views?: number;
  directionUrl?: string;
  createdAt?: string;
  distance?: number;
  isTaxEnabled?: boolean;
  serviceChargePercentage?: number;
  vatPercentage?: number;
}

export interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  hallId?: string;
  hallSlug?: string;
}

export interface Review {
  _id?: string;
  hall?: string;
  booking?: string;
  user?: {
    _id: string;
    fullName: string;
  };
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface UnavailableDate {
  reason?: string;
  eventTime?: {
    startTime: string;
    endTime: string;
  };
  bufferTime: {
    startTime: string;
    endTime: string;
  };
}

export interface SubscriptionRule {
  _id: string;
  name: string;
  key: string;
  type: string;
  description: string;
  display_text?: string;
  displayText?: string;
  singular_text?: string;
  plural_text?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LicenseTier {
  _id: string;
  name: string;
  price: number;
  durationInDays: number;
  minHalls: number;
  maxHalls: number;
  features: string[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
    expiryDate: string;
  };
  rules: {
    rule: string | SubscriptionRule;
    value: number | string | boolean;
    displayText?: string;
  }[];
  discountedPrice?: number;
  isPublic?: boolean;
}

export interface ManualAssignmentPayload {
  userId: string;
  tierId: string;
  adminNote: string;
  externalReference: string;
}

// Event Module Types
export type OrganizerStatus = 'NEW' | 'ESTABLISHED' | 'VERIFIED';
export type EventType = 'PHYSICAL' | 'ONLINE' | 'HYBRID';
export type RefundType = 'FULL' | 'PARTIAL' | 'NONE';
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type RegistrationMode = 'FULL_DETAILS' | 'BASIC_QUANTITY';
export type TicketType = 'FREE' | 'PAID';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Wallet {
  id: string;
  pendingBalance: number;
  availableBalance: number;
  withdrawnBalance: number;
  currency: string;
}

export interface OrganizerProfile {
  id: string;
  mongoUserId: string;
  status: OrganizerStatus;
  isVerified: boolean;
  bio?: string;
  website?: string;
  commissionRate: number;
  maxStaff: number;
  defaultRefundType: RefundType;
  defaultRefundPercentage: number;
  defaultRefundCutoffDays: number;
  wallet: Wallet;
}

export interface Event {
  id: string;
  _id?: string;
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  virtualLink?: string;
  capacity: number;
  category: string;
  tags?: string[];
  bannerUrl?: string;
  status: EventStatus;
  isFeatured: boolean;
  registrationMode: RegistrationMode;
  isGroupingEnabled: boolean;
  enforceUniqueGroupNames: boolean;
  registrationFields: RegistrationField[];
  organizer: OrganizerProfile;
  tickets: Ticket[];
  sessions: Session[];
}

export interface RegistrationField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required: boolean;
  isPerAttendee: boolean;
  options?: string[]; // Added for select type
}

export interface Ticket {
  id: string;
  name: string;
  price: number;
  type: TicketType;
  totalQuantity: number;
  availableQuantity: number;
  groupSize: number;
  isFixedGroup: boolean;
  earlyBirdPrice?: number;
  earlyBirdLimit?: number;
  earlyBirdExpiry?: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Registration {
  id: string;
  orderId: string;
  isLeader: boolean;
  groupId?: string;
  ticketNumber: string;
  attendeeData: Record<string, any>;
  pricePaid: number;
  paymentStatus: PaymentStatus;
  qrCodeUrl?: string;
  checkInStatus: boolean;
  checkedInAt?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  reference?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  discountPercentage: number;
  durationDays: number;
  type: 'SUBSCRIPTION' | 'ONE_TIME_PASS';
  rules: {
    ruleKey: string;
    ruleValue: string;
  }[];
}

export interface OrganizerApplication {
  id: string;
  organizerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data: Record<string, any>;
  adminNotes?: string;
  createdAt: string;
}

export interface Analytics {
  views: number;
  orders: number;
  registrations: number;
  checkInRate: number;
  conversionRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  groupRegistrations: number;
  ticketBreakdown: any[];
}

export interface Attendee {
  fullName: string;
  email: string;
  phone?: string;
  [key: string]: any; // For dynamic custom fields
}

export interface LocationData {
  name: string;
  code: string;
  lgas: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  subcategories: string[];
  count: number;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: 'STAFF' | 'MANAGER';
  canRegisterGuests: boolean;
  createdAt: string;
}

export interface FinanceSummary {
  wallet: Wallet;
  totals: {
    amount: number;
    commission: number;
    netAmount: number;
  };
  transactionCount: number;
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface Group {
  id: string;
  name: string;
  leaderId?: string;
  groupData: Record<string, any>;
}

export interface Order {
  id: string;
  amountPaid: number;
  discountCode?: string;
  sharedData: Record<string, any>;
  createdAt: string;
}

export interface GuestCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}
