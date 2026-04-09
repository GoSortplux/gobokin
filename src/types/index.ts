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
