export type Collection = "baru" | "batik" | "kebaya";

export type ProductType = "single" | "couple";

/** FASHN decides how to read the garment photo from this hint. */
export type TryOnPhotoType = "model" | "flat-lay";

export type Product = {
  id: string;
  slug: string;
  name: string;
  collections: Collection[];
  productType: ProductType;
  bestSeller: boolean;
  isNew: boolean;
  price: number;
  tone: number;
  image: string | null;
  imageAlt: string | null;
  description: string;
  material: string;
  sizes: string[];
  stockBySize: Record<string, number>;
  tryOnCategory: string;
  tryOnPhotoType: TryOnPhotoType | null;
  active: boolean;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  mapUrl: string | null;
  addressNote: string | null;
  hasPassword: boolean;
};

export type SiteImage = {
  key: string;
  label: string;
  description: string;
  image: string;
  imageAlt: string | null;
};

export type FinanceType = "INCOME" | "EXPENSE";

export type FinanceEntryView = {
  id: string;
  type: FinanceType;
  category: string;
  description: string;
  amount: number;
  occurredAt: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSummary = {
  income: number;
  expense: number;
  balance: number;
  orderRevenue: number;
  orderCount: number;
  entryCount: number;
};

export type CartLine = {
  slug: string;
  size: string;
  qty: number;
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_VERIFICATION"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod = "QRIS" | "BANK_TRANSFER" | "COD";

export type BankName = "BCA" | "MANDIRI" | "BNI" | "BRI";

export type FulfillmentType = "PICKUP" | "COURIER";

export type PaymentStatus = "UNPAID" | "PROOF_UPLOADED" | "VERIFIED" | "REJECTED";

export type OrderItemView = {
  id: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  lineTotal: number;
};

export type OrderSummary = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  bankName: BankName | null;
  fulfillmentType: FulfillmentType;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  itemCount: number;
  firstItemName: string;
  customerName?: string;
  customerEmail?: string;
};

export type OrderDetail = OrderSummary & {
  subtotal: number;
  shippingCost: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  note: string | null;
  paymentReference: string;
  proofName: string | null;
  proofUploadedAt: string | null;
  adminNote: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItemView[];
  canUploadProof: boolean;
  canCancel: boolean;
};

export type ReviewPhotoView = {
  id: string;
  url: string;
  name: string;
};

export type ReviewView = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
  photos: ReviewPhotoView[];
  isMine: boolean;
};

export type ReviewSummary = {
  average: number;
  count: number;
};

export type ChatMessage = {
  id: string;
  from: "user" | "admin";
  text?: string;
  imageLabel?: string;
};

export type ChatThread = {
  id: string;
  name: string;
  preview: string;
  unread: number;
};
