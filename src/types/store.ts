export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  categoryId: number | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  price: number;
  discountPrice: number | null;
  resellerPrice?: number | null;
  shortDescription: string;
  description: string;
  benefits: string;
  howToUse: string;
  ingredients: string;
  sizeVariant: string;
  stock: number;
  status: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  sortOrder: number;
  whatsappMessage: string | null;
  tiktokUrl: string | null;
  shopeeUrl: string | null;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  imageUrl: string | null;
  placement: string;
  countdownEndAt: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Testimonial {
  id: number;
  customerName: string;
  customerRole: string | null;
  avatarUrl: string | null;
  rating: number;
  review: string;
  productName: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt?: string;
}

export interface Inquiry {
  id: number;
  customerName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  productName: string | null;
  status: string;
  createdAt: string;
}

export interface StoreSettings {
  id: number;
  storeName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  shopeeStoreUrl: string | null;
  email: string | null;
  storeAddress: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  heroBannerUrl: string | null;
  resellerDefaultDiscountPct?: number;
}

export interface AdminUser {
  id: number;
  uid: string | null;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ResellerAccount {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  tierCode: string;
  role: string;
  isActive: boolean;
  notes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StorefrontData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  banners: Banner[];
  testimonials: Testimonial[];
  pages: CmsPage[];
}

export interface DashboardOverview {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  outOfStockProducts: number;
  bestSellerProducts: number;
  newInquiriesCount: number;
  recentProducts: Product[];
  recentInquiries: Inquiry[];
}

export interface CustomerAccount {
  id: number;
  name: string;
  address: string;
  whatsappNumber: string;
  email: string;
  role: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string | null;
  shippingAddress: string;
  productSummary: string;
  totalAmount: number;
  orderChannel: string;
  status: string;
  courier: string | null;
  trackingNumber: string | null;
  trackingNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CekResiManifestItem {
  time: string;
  position: string;
  status: string;
}

export interface CekResiResponse {
  result?: {
    awb_no?: string;
    service?: string;
    date_of_shipment?: string;
    origin?: string;
    destination?: string;
    shipper?: string;
    consignee?: string;
    shipment_status?: {
      outbond?: CekResiManifestItem[];
      pod_detail?: CekResiManifestItem[];
    };
  };
  summary?: {
    last_time?: string;
    last_position?: string;
    last_status?: string;
    status?: string;
    resi_status?: number;
  };
  info?: {
    http_status?: number;
    error_txt?: string;
    search_code?: string;
  };
  needsApiKey?: boolean;
  error?: string;
}
