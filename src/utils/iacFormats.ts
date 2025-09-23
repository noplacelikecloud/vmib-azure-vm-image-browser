import type { VMImageReference, IaCFormats } from '../types';

/**
 * Generates ARM template format for VM image reference
 */
export function generateARMTemplate(imageRef: VMImageReference): string {
  return JSON.stringify({
    imageReference: {
      publisher: imageRef.publisher,
      offer: imageRef.offer,
      sku: imageRef.sku,
      version: imageRef.version
    }
  }, null, 2);
}

/**
 * Generates Terraform format for VM image reference
 */
export function generateTerraformTemplate(imageRef: VMImageReference): string {
  return `source_image_reference {
  publisher = "${imageRef.publisher}"
  offer     = "${imageRef.offer}"
  sku       = "${imageRef.sku}"
  version   = "${imageRef.version}"
}`;
}

/**
 * Generates Bicep format for VM image reference
 */
export function generateBicepTemplate(imageRef: VMImageReference): string {
  return `imageReference: {
  publisher: '${imageRef.publisher}'
  offer: '${imageRef.offer}'
  sku: '${imageRef.sku}'
  version: '${imageRef.version}'
}`;
}

/**
 * Generates Ansible format for VM image reference
 */
export function generateAnsibleTemplate(imageRef: VMImageReference): string {
  return `image:
  publisher: "${imageRef.publisher}"
  offer: "${imageRef.offer}"
  sku: "${imageRef.sku}"
  version: "${imageRef.version}"`;
}

/**
 * Generates all IaC formats for a VM image reference
 */
export function generateAllFormats(imageRef: VMImageReference): IaCFormats {
  return {
    arm: generateARMTemplate(imageRef),
    terraform: generateTerraformTemplate(imageRef),
    bicep: generateBicepTemplate(imageRef),
    ansible: generateAnsibleTemplate(imageRef)
  };
}

/**
 * Validates VM image reference before formatting
 */
export function validateImageReference(imageRef: VMImageReference): boolean {
  return !!(
    imageRef.publisher &&
    imageRef.offer &&
    imageRef.sku &&
    imageRef.version &&
    typeof imageRef.publisher === 'string' &&
    typeof imageRef.offer === 'string' &&
    typeof imageRef.sku === 'string' &&
    typeof imageRef.version === 'string' &&
    imageRef.publisher.trim() &&
    imageRef.offer.trim() &&
    imageRef.sku.trim() &&
    imageRef.version.trim()
  );
}

/**
 * Format types available for copying
 */
export const AVAILABLE_FORMATS = [
  { key: 'arm', label: 'ARM Template' },
  { key: 'terraform', label: 'Terraform' },
  { key: 'bicep', label: 'Bicep' },
  { key: 'ansible', label: 'Ansible' }
] as const;

export type FormatKey = typeof AVAILABLE_FORMATS[number]['key'];