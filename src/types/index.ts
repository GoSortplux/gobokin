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
  referralCode?: string;
  referralSource?: string | ReferralSource;
  referralSourceOther?: string;
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
  referralCode?: string;
  referralSource?: string | ReferralSource;
  referralSourceOther?: string;
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

export type UserRole = 'user' | 'hall-owner' | 'super-admin' | 'staff' | 'organizer' | 'organizer-staff';

export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  avatar?: string;
  role: UserRole[];
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
  commissionRate?: number;
  outstandingReferralCommission?: number;
}

export interface PlatformContact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  whatsappNumber?: string;
  role?: string;
}

export interface ReferralSource {
  _id: string;
  name: string;
  triggersCommission?: boolean;
  isDefault?: boolean;
}

export interface ReferralCode {
  _id: string;
  code: string;
  hall: string | Venue;
  generatedBy?: string | UserProfile;
  fullName: string;
  phone: string;
  email: string;
  discountPercentage: number;
  isUsed: boolean;
  createdAt: string;
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
    blockRate?: number;
    blockDurationHours?: number;
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
  bookingMode?: 'online' | 'enquiry-only' | 'platform-managed';
  bookingMessage?: string;
  platformContact?: PlatformContact;
  commissionRate?: number;
  isPartnership?: boolean;
  referralDiscountPercentage?: number;
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
  isPartnershipTier?: boolean;
  defaultCommissionRate?: number;
}

export interface ManualAssignmentPayload {
  userId: string;
  tierId: string;
  adminNote: string;
  externalReference: string;
}

export interface OutstandingBalance {
  owner: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  outstandingBalance: number;
  recentBookings: {
    _id: string;
    bookingId: string;
    totalPrice: number;
    commissionAmount: number;
    createdAt: string;
  }[];
}

export interface AuditLog {
  _id: string;
  action: string;
  actor: {
    _id: string;
    fullName: string;
    email: string;
  };
  actorName: string;
  actorEmail: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'failure';
  details: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    delta?: Record<string, unknown>;
    [key: string]: unknown;
  };
  createdAt: string;
}

export type EventType = 'PHYSICAL' | 'ONLINE' | 'HYBRID';
export type TicketType = 'FREE' | 'PAID';
export type RegistrationMode = 'FULL_DETAILS' | 'BASIC_QUANTITY';

export interface Speaker {
  id?: string;
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
}

export interface AgendaItem {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speakerName: string;
}

export interface Session {
  id: string;
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  room?: string;
  stage?: string;
  sessionType?: string;
  speakerIds?: string[];
  speakerNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  isPerAttendee: boolean;
  options?: string[];
}

export interface OrganizerApplication {
  id: string;
  organizerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  data: {
    portfolio: string;
    experience: string;
    references: string[];
    [key: string]: unknown;
  };
}

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
  status: string;
  slug: string;
  isVerified: boolean;
  bio: string | null;
  website: string | null;
  commissionRate: number;
  maxStaff: number;
  defaultRefundType: string;
  defaultRefundPercentage: number;
  defaultRefundCutoffDays: number;
  wallet: Wallet;
}

export interface Organizer {
  id: string;
  mongoUserId: string;
  slug: string;
  status: string;
  isVerified: boolean;
  bio?: string | null;
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  commissionRate: string;
  payoutPolicy: string;
  autoPromotionEligible: boolean;
  maxStaff: number;
  defaultRefundType: string;
  defaultRefundPercentage: string;
  defaultRefundCutoffDays: number;
  defaultRefundPolicy?: string | null;
  createdAt: string;
  updatedAt: string;
  userProfile?: {
    _id: string;
    fullName: string;
    email: string;
  };
  wallet?: Wallet;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: 'STAFF' | 'MANAGER';
  canRegisterGuests?: boolean;
}

export interface GlobalDiscount {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: string;
  maxUsagePerGuest: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuantityDiscount {
  minQuantity: number;
  discountPercentage: number;
  price?: number;
}

export interface Ticket {
  id?: string;
  name: string;
  description?: string;
  price: number;
  type: TicketType;
  allocationType: 'GENERAL' | 'RESERVED';
  totalQuantity: number;
  availableQuantity?: number;
  remainingTickets?: number;
  soldQuantity?: number;
  isSoldOut?: boolean;
  isSalesSuspended?: boolean;
  salesStatus?: string;
  salesPauseScope?: string;
  salesSuspendedAt?: string;
  salesSuspendedBy?: string;
  salesSuspensionReason?: string;
  salesResumeAt?: string;
  salesMessage?: string;
  salesSuspensionDetails?: {
    reason: string;
    pauseScope: string;
    resumeAt?: string;
    suspendedAt?: string;
  };
  availabilityStatus?: string;
  maxPerOrder: number;
  salesStart?: string;
  salesEnd?: string;
  earlyBirdPrice?: number;
  earlyBirdLimit?: number;
  earlyBirdExpiry?: string;
  groupSize: number;
  isOffline: boolean;
  quantityDiscounts?: QuantityDiscount[];
}

export interface Event {
  id: string;
  _id: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  type: EventType;
  status: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  bannerUrl?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  mapLink?: string;
  virtualLink?: string | null;
  capacity: number;
  registrationCount?: number;
  remainingTickets?: number;
  soldQuantity?: number;
  isSoldOut?: boolean;
  availabilityStatus?: string;
  tags?: string[];
  mediaUrls?: string[];
  speakers?: Speaker[];
  agenda?: AgendaItem[];
  registrationFields?: RegistrationField[];
  isRegistrationSuspended?: boolean;
  registrationStatus?: string;
  registrationPauseScope?: string;
  registrationSuspendedAt?: string;
  registrationSuspendedBy?: string;
  registrationSuspensionReason?: string;
  registrationResumeAt?: string;
  registrationSuspensionDetails?: {
    reason: string;
    pauseScope: string;
    resumeAt?: string;
    suspendedAt?: string;
  };
  slug: string;
  isPublished: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  isPromoted: boolean;
  featuredUntil?: string | null;
  refundPolicy?: string | null;
  refundType?: string;
  refundPercentage?: string;
  refundCutoffDays?: number;
  isDeleted: boolean;
  agendaEnabled?: boolean;
  registrationMode: RegistrationMode;
  isGroupingEnabled: boolean;
  enforceUniqueGroupNames: boolean;
  createdAt: string;
  updatedAt: string;
  organizer?: Organizer;
  tickets?: Ticket[];
  sessions?: Session[];
  staff?: StaffMember[];
  totalRevenue?: number;
}

export interface Transaction {
  id?: string;
  type: 'TICKET_SALE' | 'WITHDRAWAL' | 'REFUND' | string;
  amount: number;
  status: string;
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
  recentTransactions: Transaction[];
}

export interface EventSummary {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  paidRegistrations: number;
  checkedInGuests: number;
  attendanceRate: number;
  totalViews: number;
  totalOrders: number;
  conversionRate: number;
  grossRevenue: number;
  netRevenue: number;
  totalCommission: number;
  totalRefunded: number;
  pendingBalance: number;
  availableBalance: number;
  withdrawnBalance: number;
}

export interface EventTrend {
  date: string;
  registrations: number;
  revenue: number;
  views: number;
}

export interface TopEvent {
  eventId: string;
  title: string;
  status: string;
  views: number;
  orders: number;
  registrations: number;
  paidRegistrations: number;
  checkedInGuests: number;
  grossRevenue: number;
  netRevenue: number;
  attendanceRate: number;
  conversionRate: number;
}

export interface Analytics {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  scope: string;
  summary: EventSummary;
  trends: EventTrend[];
  topEvents: TopEvent[];
  // Legacy fields for backward compatibility if any
  views?: number;
  orders?: number;
  registrations?: number;
  checkInRate?: number;
  conversionRate?: number;
  totalRevenue?: number;
  avgOrderValue?: number;
  groupRegistrations?: number;
  ticketBreakdown?: { name: string; value: number; color: string }[];
}

export interface Registration {
  id: string;
  orderId: string;
  isLeader: boolean;
  groupId: string;
  ticketNumber: string;
  attendeeData: {
    fullName: string;
    email: string;
    phone?: string;
    [key: string]: unknown;
  };
  pricePaid: number;
  paymentStatus: string;
  qrCodeUrl: string;
  checkInStatus: boolean;
  checkedInAt: string | null;
  checkedInBy?: {
    fullName: string;
    email: string;
    role: string;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    bannerUrl: string;
    category?: string;
  };
  ticket: {
    id: string;
    name: string;
    type: string;
    price: number;
  };
  createdAt: string;
}

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface RefundRequest {
  id: string;
  registrationId: string;
  reason: string;
  status: RefundStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  registration: Registration;
}
