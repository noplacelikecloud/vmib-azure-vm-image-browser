import { describe, it, expect } from 'vitest';
import {
  generateARMTemplate,
  generateTerraformTemplate,
  generateBicepTemplate,
  generateAnsibleTemplate,
  generateAllFormats,
  validateImageReference,
  AVAILABLE_FORMATS
} from '../iacFormats';
import { VMImageReference } from '../../types';

describe('IaC Format Templates', () => {
  const mockImageRef: VMImageReference = {
    publisher: 'Canonical',
    offer: '0001-com-ubuntu-server-focal',
    sku: '20_04-lts-gen2',
    version: 'latest'
  };

  describe('generateARMTemplate', () => {
    it('should generate valid ARM template JSON', () => {
      const result = generateARMTemplate(mockImageRef);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({
        imageReference: {
          publisher: 'Canonical',
          offer: '0001-com-ubuntu-server-focal',
          sku: '20_04-lts-gen2',
          version: 'latest'
        }
      });
    });

    it('should format JSON with proper indentation', () => {
      const result = generateARMTemplate(mockImageRef);
      expect(result).toContain('  "imageReference": {');
      expect(result).toContain('    "publisher": "Canonical"');
    });
  });

  describe('generateTerraformTemplate', () => {
    it('should generate valid Terraform configuration', () => {
      const result = generateTerraformTemplate(mockImageRef);
      
      expect(result).toContain('source_image_reference {');
      expect(result).toContain('publisher = "Canonical"');
      expect(result).toContain('offer     = "0001-com-ubuntu-server-focal"');
      expect(result).toContain('sku       = "20_04-lts-gen2"');
      expect(result).toContain('version   = "latest"');
      expect(result).toContain('}');
    });

    it('should handle special characters in values', () => {
      const specialImageRef: VMImageReference = {
        publisher: 'Test-Publisher',
        offer: 'test_offer-2023',
        sku: 'sku.with.dots',
        version: '1.0.0'
      };
      
      const result = generateTerraformTemplate(specialImageRef);
      expect(result).toContain('publisher = "Test-Publisher"');
      expect(result).toContain('offer     = "test_offer-2023"');
      expect(result).toContain('sku       = "sku.with.dots"');
    });
  });

  describe('generateBicepTemplate', () => {
    it('should generate valid Bicep configuration', () => {
      const result = generateBicepTemplate(mockImageRef);
      
      expect(result).toContain('imageReference: {');
      expect(result).toContain("publisher: 'Canonical'");
      expect(result).toContain("offer: '0001-com-ubuntu-server-focal'");
      expect(result).toContain("sku: '20_04-lts-gen2'");
      expect(result).toContain("version: 'latest'");
      expect(result).toContain('}');
    });

    it('should use single quotes for string values', () => {
      const result = generateBicepTemplate(mockImageRef);
      expect(result).not.toContain('"');
      expect(result).toContain("'Canonical'");
    });
  });

  describe('generateAnsibleTemplate', () => {
    it('should generate valid Ansible YAML configuration', () => {
      const result = generateAnsibleTemplate(mockImageRef);
      
      expect(result).toContain('image:');
      expect(result).toContain('publisher: "Canonical"');
      expect(result).toContain('offer: "0001-com-ubuntu-server-focal"');
      expect(result).toContain('sku: "20_04-lts-gen2"');
      expect(result).toContain('version: "latest"');
    });

    it('should use proper YAML indentation', () => {
      const result = generateAnsibleTemplate(mockImageRef);
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('image:');
      expect(lines[1]).toMatch(/^  publisher:/);
      expect(lines[2]).toMatch(/^  offer:/);
      expect(lines[3]).toMatch(/^  sku:/);
      expect(lines[4]).toMatch(/^  version:/);
    });
  });

  describe('generateAllFormats', () => {
    it('should generate all four IaC formats', () => {
      const result = generateAllFormats(mockImageRef);
      
      expect(result).toHaveProperty('arm');
      expect(result).toHaveProperty('terraform');
      expect(result).toHaveProperty('bicep');
      expect(result).toHaveProperty('ansible');
    });

    it('should generate consistent data across all formats', () => {
      const result = generateAllFormats(mockImageRef);
      
      // Check that all formats contain the same data
      expect(result.arm).toContain('Canonical');
      expect(result.terraform).toContain('Canonical');
      expect(result.bicep).toContain('Canonical');
      expect(result.ansible).toContain('Canonical');
      
      expect(result.arm).toContain('0001-com-ubuntu-server-focal');
      expect(result.terraform).toContain('0001-com-ubuntu-server-focal');
      expect(result.bicep).toContain('0001-com-ubuntu-server-focal');
      expect(result.ansible).toContain('0001-com-ubuntu-server-focal');
    });
  });

  describe('validateImageReference', () => {
    it('should return true for valid image reference', () => {
      const result = validateImageReference(mockImageRef);
      expect(result).toBe(true);
    });

    it('should return false for missing publisher', () => {
      const invalidRef = { ...mockImageRef, publisher: '' };
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });

    it('should return false for missing offer', () => {
      const invalidRef = { ...mockImageRef, offer: '' };
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });

    it('should return false for missing sku', () => {
      const invalidRef = { ...mockImageRef, sku: '' };
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });

    it('should return false for missing version', () => {
      const invalidRef = { ...mockImageRef, version: '' };
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });

    it('should return false for non-string values', () => {
      const invalidRef = { ...mockImageRef, publisher: null as any };
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });

    it('should return false for undefined properties', () => {
      const invalidRef = { ...mockImageRef };
      delete (invalidRef as any).publisher;
      const result = validateImageReference(invalidRef);
      expect(result).toBe(false);
    });
  });

  describe('AVAILABLE_FORMATS', () => {
    it('should contain all expected format options', () => {
      expect(AVAILABLE_FORMATS).toHaveLength(4);
      
      const formatKeys = AVAILABLE_FORMATS.map(f => f.key);
      expect(formatKeys).toContain('arm');
      expect(formatKeys).toContain('terraform');
      expect(formatKeys).toContain('bicep');
      expect(formatKeys).toContain('ansible');
    });

    it('should have proper labels for each format', () => {
      const armFormat = AVAILABLE_FORMATS.find(f => f.key === 'arm');
      expect(armFormat?.label).toBe('ARM Template');
      
      const terraformFormat = AVAILABLE_FORMATS.find(f => f.key === 'terraform');
      expect(terraformFormat?.label).toBe('Terraform');
      
      const bicepFormat = AVAILABLE_FORMATS.find(f => f.key === 'bicep');
      expect(bicepFormat?.label).toBe('Bicep');
      
      const ansibleFormat = AVAILABLE_FORMATS.find(f => f.key === 'ansible');
      expect(ansibleFormat?.label).toBe('Ansible');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty strings in image reference', () => {
      const emptyRef: VMImageReference = {
        publisher: '',
        offer: '',
        sku: '',
        version: ''
      };
      
      expect(validateImageReference(emptyRef)).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      const whitespaceRef: VMImageReference = {
        publisher: '   ',
        offer: '\t',
        sku: '\n',
        version: ' '
      };
      
      // Should still generate templates but validation should fail
      expect(validateImageReference(whitespaceRef)).toBe(false);
      
      const armResult = generateARMTemplate(whitespaceRef);
      expect(armResult).toContain('   '); // Whitespace preserved
    });

    it('should handle special characters correctly', () => {
      const specialRef: VMImageReference = {
        publisher: 'Test & Co.',
        offer: 'offer-with-"quotes"',
        sku: "sku'with'apostrophes",
        version: 'version/with/slashes'
      };
      
      expect(validateImageReference(specialRef)).toBe(true);
      
      const armResult = generateARMTemplate(specialRef);
      expect(JSON.parse(armResult)).toBeDefined(); // Should be valid JSON
      
      const terraformResult = generateTerraformTemplate(specialRef);
      expect(terraformResult).toContain('Test & Co.');
    });
  });
});