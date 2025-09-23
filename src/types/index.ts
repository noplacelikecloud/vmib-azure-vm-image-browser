// Core Azure types
export interface Subscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId?: string;
}

export interface AzureLocation {
  name: string;
  displayName: string;
  regionalDisplayName?: string;
}

export interface Publisher {
  name: string;
  displayName: string;
  location: string;
}

export interface Offer {
  name: string;
  displayName: string;
  publisher: string;
  location: string;
}

export interface SKU {
  name: string;
  displayName: string;
  publisher: string;
  offer: string;
  location: string;
  versions: string[];
}

export interface VMImageReference {
  publisher: string;
  offer: string;
  sku: string;
  version: string;
}

// IaC format types
export interface IaCFormats {
  arm: string;
  terraform: string;
  bicep: string;
  ansible: string;
}

export interface CopyableImageData {
  imageReference: VMImageReference;
  formats: IaCFormats;
}

// Navigation types
export type NavigationLevel = 'publishers' | 'offers' | 'skus';

export interface BreadcrumbItem {
  label: string;
  level: NavigationLevel;
  onClick?: () => void;
}

// State types
export interface AuthState {
  isAuthenticated: boolean;
  user: unknown | null;
  subscriptions: Subscription[];
  selectedSubscription: string | null;
}

export interface VMImagesState {
  publishers: Publisher[];
  offers: Offer[];
  skus: SKU[];
  loading: boolean;
  error: string | null;
}

export interface NavigationState {
  currentLevel: NavigationLevel;
  selectedPublisher: string | null;
  selectedOffer: string | null;
  breadcrumb: BreadcrumbItem[];
}
