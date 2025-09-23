import type {
  Subscription,
  Publisher,
  Offer,
  SKU,
  VMImageReference,
  IaCFormats,
} from '../types';

// Validation error class
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Helper function to check if value is a non-empty string
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Helper function to check if value is an array of strings
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

/**
 * Validates a Subscription object
 */
export function validateSubscription(data: unknown): Subscription {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Subscription data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.subscriptionId)) {
    throw new ValidationError('subscriptionId must be a non-empty string', 'subscriptionId');
  }

  if (!isNonEmptyString(obj.displayName)) {
    throw new ValidationError('displayName must be a non-empty string', 'displayName');
  }

  if (!isNonEmptyString(obj.state)) {
    throw new ValidationError('state must be a non-empty string', 'state');
  }

  return {
    subscriptionId: obj.subscriptionId,
    displayName: obj.displayName,
    state: obj.state,
  };
}

/**
 * Validates a Publisher object
 */
export function validatePublisher(data: unknown): Publisher {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Publisher data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.name)) {
    throw new ValidationError('name must be a non-empty string', 'name');
  }

  if (!isNonEmptyString(obj.displayName)) {
    throw new ValidationError('displayName must be a non-empty string', 'displayName');
  }

  if (!isNonEmptyString(obj.location)) {
    throw new ValidationError('location must be a non-empty string', 'location');
  }

  return {
    name: obj.name,
    displayName: obj.displayName,
    location: obj.location,
  };
}

/**
 * Validates an Offer object
 */
export function validateOffer(data: unknown): Offer {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Offer data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.name)) {
    throw new ValidationError('name must be a non-empty string', 'name');
  }

  if (!isNonEmptyString(obj.displayName)) {
    throw new ValidationError('displayName must be a non-empty string', 'displayName');
  }

  if (!isNonEmptyString(obj.publisher)) {
    throw new ValidationError('publisher must be a non-empty string', 'publisher');
  }

  if (!isNonEmptyString(obj.location)) {
    throw new ValidationError('location must be a non-empty string', 'location');
  }

  return {
    name: obj.name,
    displayName: obj.displayName,
    publisher: obj.publisher,
    location: obj.location,
  };
}

/**
 * Validates a SKU object
 */
export function validateSKU(data: unknown): SKU {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('SKU data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.name)) {
    throw new ValidationError('name must be a non-empty string', 'name');
  }

  if (!isNonEmptyString(obj.displayName)) {
    throw new ValidationError('displayName must be a non-empty string', 'displayName');
  }

  if (!isNonEmptyString(obj.publisher)) {
    throw new ValidationError('publisher must be a non-empty string', 'publisher');
  }

  if (!isNonEmptyString(obj.offer)) {
    throw new ValidationError('offer must be a non-empty string', 'offer');
  }

  if (!isNonEmptyString(obj.location)) {
    throw new ValidationError('location must be a non-empty string', 'location');
  }

  if (!isStringArray(obj.versions)) {
    throw new ValidationError('versions must be an array of strings', 'versions');
  }

  return {
    name: obj.name,
    displayName: obj.displayName,
    publisher: obj.publisher,
    offer: obj.offer,
    location: obj.location,
    versions: obj.versions,
  };
}

/**
 * Validates a VMImageReference object
 */
export function validateVMImageReference(data: unknown): VMImageReference {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('VMImageReference data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.publisher)) {
    throw new ValidationError('publisher must be a non-empty string', 'publisher');
  }

  if (!isNonEmptyString(obj.offer)) {
    throw new ValidationError('offer must be a non-empty string', 'offer');
  }

  if (!isNonEmptyString(obj.sku)) {
    throw new ValidationError('sku must be a non-empty string', 'sku');
  }

  if (!isNonEmptyString(obj.version)) {
    throw new ValidationError('version must be a non-empty string', 'version');
  }

  return {
    publisher: obj.publisher,
    offer: obj.offer,
    sku: obj.sku,
    version: obj.version,
  };
}

/**
 * Validates an IaCFormats object
 */
export function validateIaCFormats(data: unknown): IaCFormats {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('IaCFormats data must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.arm)) {
    throw new ValidationError('arm must be a non-empty string', 'arm');
  }

  if (!isNonEmptyString(obj.terraform)) {
    throw new ValidationError('terraform must be a non-empty string', 'terraform');
  }

  if (!isNonEmptyString(obj.bicep)) {
    throw new ValidationError('bicep must be a non-empty string', 'bicep');
  }

  if (!isNonEmptyString(obj.ansible)) {
    throw new ValidationError('ansible must be a non-empty string', 'ansible');
  }

  return {
    arm: obj.arm,
    terraform: obj.terraform,
    bicep: obj.bicep,
    ansible: obj.ansible,
  };
}

/**
 * Validates an array of Subscriptions
 */
export function validateSubscriptions(data: unknown): Subscription[] {
  if (!Array.isArray(data)) {
    throw new ValidationError('Subscriptions data must be an array');
  }

  return data.map((item, index) => {
    try {
      return validateSubscription(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid subscription at index ${index}: ${error.message}`,
          `subscriptions[${index}].${error.field || 'unknown'}`
        );
      }
      throw error;
    }
  });
}

/**
 * Validates an array of Publishers
 */
export function validatePublishers(data: unknown): Publisher[] {
  if (!Array.isArray(data)) {
    throw new ValidationError('Publishers data must be an array');
  }

  return data.map((item, index) => {
    try {
      return validatePublisher(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid publisher at index ${index}: ${error.message}`,
          `publishers[${index}].${error.field || 'unknown'}`
        );
      }
      throw error;
    }
  });
}

/**
 * Validates an array of Offers
 */
export function validateOffers(data: unknown): Offer[] {
  if (!Array.isArray(data)) {
    throw new ValidationError('Offers data must be an array');
  }

  return data.map((item, index) => {
    try {
      return validateOffer(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid offer at index ${index}: ${error.message}`,
          `offers[${index}].${error.field || 'unknown'}`
        );
      }
      throw error;
    }
  });
}

/**
 * Validates an array of SKUs
 */
export function validateSKUs(data: unknown): SKU[] {
  if (!Array.isArray(data)) {
    throw new ValidationError('SKUs data must be an array');
  }

  return data.map((item, index) => {
    try {
      return validateSKU(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid SKU at index ${index}: ${error.message}`,
          `skus[${index}].${error.field || 'unknown'}`
        );
      }
      throw error;
    }
  });
}