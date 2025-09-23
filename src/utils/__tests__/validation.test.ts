import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  validateSubscription,
  validatePublisher,
  validateOffer,
  validateSKU,
  validateVMImageReference,
  validateIaCFormats,
  validateSubscriptions,
  validatePublishers,
  validateOffers,
  validateSKUs,
} from '../validation';

describe('ValidationError', () => {
  it('should create error with message and field', () => {
    const error = new ValidationError('Test error', 'testField');
    expect(error.message).toBe('Test error');
    expect(error.field).toBe('testField');
    expect(error.name).toBe('ValidationError');
  });

  it('should create error with message only', () => {
    const error = new ValidationError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.field).toBeUndefined();
  });
});

describe('validateSubscription', () => {
  const validSubscription = {
    subscriptionId: 'sub-123',
    displayName: 'Test Subscription',
    state: 'Enabled',
  };

  it('should validate a valid subscription', () => {
    const result = validateSubscription(validSubscription);
    expect(result).toEqual(validSubscription);
  });

  it('should throw error for non-object input', () => {
    expect(() => validateSubscription(null)).toThrow('Subscription data must be an object');
    expect(() => validateSubscription('string')).toThrow('Subscription data must be an object');
    expect(() => validateSubscription(123)).toThrow('Subscription data must be an object');
  });

  it('should throw error for missing subscriptionId', () => {
    const invalid = { ...validSubscription };
    delete (invalid as any).subscriptionId;
    expect(() => validateSubscription(invalid)).toThrow('subscriptionId must be a non-empty string');
  });

  it('should throw error for empty subscriptionId', () => {
    const invalid = { ...validSubscription, subscriptionId: '' };
    expect(() => validateSubscription(invalid)).toThrow('subscriptionId must be a non-empty string');
  });

  it('should throw error for missing displayName', () => {
    const invalid = { ...validSubscription };
    delete (invalid as any).displayName;
    expect(() => validateSubscription(invalid)).toThrow('displayName must be a non-empty string');
  });

  it('should throw error for missing state', () => {
    const invalid = { ...validSubscription };
    delete (invalid as any).state;
    expect(() => validateSubscription(invalid)).toThrow('state must be a non-empty string');
  });
});

describe('validatePublisher', () => {
  const validPublisher = {
    name: 'microsoft',
    displayName: 'Microsoft',
    location: 'eastus',
  };

  it('should validate a valid publisher', () => {
    const result = validatePublisher(validPublisher);
    expect(result).toEqual(validPublisher);
  });

  it('should throw error for non-object input', () => {
    expect(() => validatePublisher(null)).toThrow('Publisher data must be an object');
  });

  it('should throw error for missing name', () => {
    const invalid = { ...validPublisher };
    delete (invalid as any).name;
    expect(() => validatePublisher(invalid)).toThrow('name must be a non-empty string');
  });

  it('should throw error for missing displayName', () => {
    const invalid = { ...validPublisher };
    delete (invalid as any).displayName;
    expect(() => validatePublisher(invalid)).toThrow('displayName must be a non-empty string');
  });

  it('should throw error for missing location', () => {
    const invalid = { ...validPublisher };
    delete (invalid as any).location;
    expect(() => validatePublisher(invalid)).toThrow('location must be a non-empty string');
  });
});

describe('validateOffer', () => {
  const validOffer = {
    name: 'windows-server',
    displayName: 'Windows Server',
    publisher: 'microsoft',
    location: 'eastus',
  };

  it('should validate a valid offer', () => {
    const result = validateOffer(validOffer);
    expect(result).toEqual(validOffer);
  });

  it('should throw error for non-object input', () => {
    expect(() => validateOffer(null)).toThrow('Offer data must be an object');
  });

  it('should throw error for missing publisher', () => {
    const invalid = { ...validOffer };
    delete (invalid as any).publisher;
    expect(() => validateOffer(invalid)).toThrow('publisher must be a non-empty string');
  });
});

describe('validateSKU', () => {
  const validSKU = {
    name: '2022-datacenter',
    displayName: '2022 Datacenter',
    publisher: 'microsoft',
    offer: 'windows-server',
    location: 'eastus',
    versions: ['latest', '2022.01.01'],
  };

  it('should validate a valid SKU', () => {
    const result = validateSKU(validSKU);
    expect(result).toEqual(validSKU);
  });

  it('should throw error for non-object input', () => {
    expect(() => validateSKU(null)).toThrow('SKU data must be an object');
  });

  it('should throw error for missing offer', () => {
    const invalid = { ...validSKU };
    delete (invalid as any).offer;
    expect(() => validateSKU(invalid)).toThrow('offer must be a non-empty string');
  });

  it('should throw error for invalid versions array', () => {
    const invalid = { ...validSKU, versions: 'not-array' };
    expect(() => validateSKU(invalid)).toThrow('versions must be an array of strings');
  });

  it('should throw error for versions array with non-strings', () => {
    const invalid = { ...validSKU, versions: ['valid', 123, 'also-valid'] };
    expect(() => validateSKU(invalid)).toThrow('versions must be an array of strings');
  });
});

describe('validateVMImageReference', () => {
  const validImageRef = {
    publisher: 'microsoft',
    offer: 'windows-server',
    sku: '2022-datacenter',
    version: 'latest',
  };

  it('should validate a valid VM image reference', () => {
    const result = validateVMImageReference(validImageRef);
    expect(result).toEqual(validImageRef);
  });

  it('should throw error for non-object input', () => {
    expect(() => validateVMImageReference(null)).toThrow('VMImageReference data must be an object');
  });

  it('should throw error for missing version', () => {
    const invalid = { ...validImageRef };
    delete (invalid as any).version;
    expect(() => validateVMImageReference(invalid)).toThrow('version must be a non-empty string');
  });
});

describe('validateIaCFormats', () => {
  const validFormats = {
    arm: '{"imageReference": {"publisher": "microsoft"}}',
    terraform: 'source_image_reference { publisher = "microsoft" }',
    bicep: 'imageReference: { publisher: "microsoft" }',
    ansible: 'image: { publisher: "microsoft" }',
  };

  it('should validate valid IaC formats', () => {
    const result = validateIaCFormats(validFormats);
    expect(result).toEqual(validFormats);
  });

  it('should throw error for non-object input', () => {
    expect(() => validateIaCFormats(null)).toThrow('IaCFormats data must be an object');
  });

  it('should throw error for missing arm format', () => {
    const invalid = { ...validFormats };
    delete (invalid as any).arm;
    expect(() => validateIaCFormats(invalid)).toThrow('arm must be a non-empty string');
  });

  it('should throw error for missing terraform format', () => {
    const invalid = { ...validFormats };
    delete (invalid as any).terraform;
    expect(() => validateIaCFormats(invalid)).toThrow('terraform must be a non-empty string');
  });

  it('should throw error for missing bicep format', () => {
    const invalid = { ...validFormats };
    delete (invalid as any).bicep;
    expect(() => validateIaCFormats(invalid)).toThrow('bicep must be a non-empty string');
  });

  it('should throw error for missing ansible format', () => {
    const invalid = { ...validFormats };
    delete (invalid as any).ansible;
    expect(() => validateIaCFormats(invalid)).toThrow('ansible must be a non-empty string');
  });
});

describe('validateSubscriptions', () => {
  const validSubscriptions = [
    {
      subscriptionId: 'sub-123',
      displayName: 'Test Subscription 1',
      state: 'Enabled',
    },
    {
      subscriptionId: 'sub-456',
      displayName: 'Test Subscription 2',
      state: 'Enabled',
    },
  ];

  it('should validate an array of valid subscriptions', () => {
    const result = validateSubscriptions(validSubscriptions);
    expect(result).toEqual(validSubscriptions);
  });

  it('should throw error for non-array input', () => {
    expect(() => validateSubscriptions({})).toThrow('Subscriptions data must be an array');
  });

  it('should throw error with index for invalid subscription in array', () => {
    const invalid = [...validSubscriptions];
    invalid[1] = { ...invalid[1], subscriptionId: '' };
    expect(() => validateSubscriptions(invalid)).toThrow('Invalid subscription at index 1');
  });

  it('should validate empty array', () => {
    const result = validateSubscriptions([]);
    expect(result).toEqual([]);
  });
});

describe('validatePublishers', () => {
  const validPublishers = [
    {
      name: 'microsoft',
      displayName: 'Microsoft',
      location: 'eastus',
    },
    {
      name: 'canonical',
      displayName: 'Canonical',
      location: 'eastus',
    },
  ];

  it('should validate an array of valid publishers', () => {
    const result = validatePublishers(validPublishers);
    expect(result).toEqual(validPublishers);
  });

  it('should throw error for non-array input', () => {
    expect(() => validatePublishers({})).toThrow('Publishers data must be an array');
  });

  it('should throw error with index for invalid publisher in array', () => {
    const invalid = [...validPublishers];
    invalid[0] = { ...invalid[0], name: '' };
    expect(() => validatePublishers(invalid)).toThrow('Invalid publisher at index 0');
  });
});

describe('validateOffers', () => {
  const validOffers = [
    {
      name: 'windows-server',
      displayName: 'Windows Server',
      publisher: 'microsoft',
      location: 'eastus',
    },
    {
      name: 'ubuntu-server',
      displayName: 'Ubuntu Server',
      publisher: 'canonical',
      location: 'eastus',
    },
  ];

  it('should validate an array of valid offers', () => {
    const result = validateOffers(validOffers);
    expect(result).toEqual(validOffers);
  });

  it('should throw error for non-array input', () => {
    expect(() => validateOffers({})).toThrow('Offers data must be an array');
  });

  it('should throw error with index for invalid offer in array', () => {
    const invalid = [...validOffers];
    invalid[1] = { ...invalid[1], publisher: '' };
    expect(() => validateOffers(invalid)).toThrow('Invalid offer at index 1');
  });
});

describe('validateSKUs', () => {
  const validSKUs = [
    {
      name: '2022-datacenter',
      displayName: '2022 Datacenter',
      publisher: 'microsoft',
      offer: 'windows-server',
      location: 'eastus',
      versions: ['latest', '2022.01.01'],
    },
    {
      name: '20_04-lts',
      displayName: '20.04 LTS',
      publisher: 'canonical',
      offer: 'ubuntu-server',
      location: 'eastus',
      versions: ['latest', '20.04.202301010'],
    },
  ];

  it('should validate an array of valid SKUs', () => {
    const result = validateSKUs(validSKUs);
    expect(result).toEqual(validSKUs);
  });

  it('should throw error for non-array input', () => {
    expect(() => validateSKUs({})).toThrow('SKUs data must be an array');
  });

  it('should throw error with index for invalid SKU in array', () => {
    const invalid = [...validSKUs];
    invalid[0] = { ...invalid[0], versions: 'not-array' };
    expect(() => validateSKUs(invalid)).toThrow('Invalid SKU at index 0');
  });
});