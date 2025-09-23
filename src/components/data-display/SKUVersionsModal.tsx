import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { CopyButton } from '../ui/CopyButton';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Stack } from '../layout';
import type { SKU, VMImageReference } from '../../types';

interface SKUVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: SKU | null;
  onLoadVersions: (sku: SKU) => Promise<string[]>;
}

export const SKUVersionsModal: React.FC<SKUVersionsModalProps> = ({
  isOpen,
  onClose,
  sku,
  onLoadVersions,
}) => {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sku) {
      // Reset state when modal opens
      setVersions([]);
      setError(null);
      
      // If SKU already has versions, use them
      if (sku.versions && sku.versions.length > 0) {
        setVersions(sku.versions);
      } else {
        // Load versions dynamically
        loadVersions();
      }
    }
  }, [isOpen, sku]);

  const loadVersions = async () => {
    if (!sku) return;

    console.log('Loading versions for SKU:', sku);
    setLoading(true);
    setError(null);

    try {
      const loadedVersions = await onLoadVersions(sku);
      console.log('Loaded versions:', loadedVersions);
      
      if (loadedVersions.length === 0) {
        console.warn('No versions returned for SKU:', sku);
        setError('No versions found for this SKU in the selected region. This SKU may not be available in this location or may not have published versions.');
      } else {
        setVersions(loadedVersions);
      }
    } catch (err) {
      console.error('Error loading versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadVersions();
  };

  if (!sku) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Available Versions - ${sku.displayName}`}
      size="lg"
      className="max-w-3xl"
    >
      <div className="p-6">
        <Stack direction="vertical" spacing="lg">
          {/* SKU Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Stack direction="vertical" spacing="sm">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {sku.displayName}
                </h3>
                <Stack direction="vertical" spacing="xs">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">SKU Name:</span> {sku.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Publisher:</span> {sku.publisher}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Offer:</span> {sku.offer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {sku.location}
                  </p>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Versions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Available Versions
              </h4>
              {error && (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
                >
                  Retry
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-gray-500 mt-4">Loading versions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-orange-600 mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-orange-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Versions Available
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{error}</p>
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md text-left">
                    <p className="font-medium mb-2">Possible reasons:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>This SKU may not be available in the selected region ({sku.location})</li>
                      <li>The SKU may not have any published versions yet</li>
                      <li>Your subscription may not have access to this SKU</li>
                      <li>The SKU may have been deprecated</li>
                    </ul>
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 font-medium text-xs mb-1">💡 Suggestion:</p>
                      <p className="text-blue-700 text-xs">
                        Try switching to <strong>East US</strong> or <strong>East US 2</strong> regions, 
                        as they typically have the most comprehensive SKU availability.
                      </p>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer font-medium">Debug Information</summary>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                        <p><strong>Publisher:</strong> {sku.publisher}</p>
                        <p><strong>Offer:</strong> {sku.offer}</p>
                        <p><strong>SKU:</strong> {sku.name}</p>
                        <p><strong>Location:</strong> {sku.location}</p>
                        <p className="mt-2 text-gray-600">Check browser console for detailed API logs</p>
                        <button
                          onClick={() => {
                            // Test with a known working SKU
                            const testSku = {
                              ...sku,
                              publisher: 'MicrosoftWindowsServer',
                              offer: 'WindowsServer',
                              name: '2022-datacenter-g2'
                            };
                            console.log('Testing with known working SKU:', testSku);
                            onLoadVersions(testSku).then(versions => {
                              console.log('Test SKU versions:', versions);
                              if (versions.length > 0) {
                                alert(`Test successful! Found ${versions.length} versions for the test SKU. The issue is that your selected SKU doesn't have versions in this region.`);
                              } else {
                                alert('Test also returned no versions. There may be an authentication or API issue.');
                              }
                            }).catch(err => {
                              console.error('Test SKU error:', err);
                              alert('Test failed: ' + err.message);
                            });
                          }}
                          className="mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                        >
                          Test with Known Working SKU
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            ) : versions.length > 0 ? (
              <div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {versions.map((version, index) => {
                    const imageRef: VMImageReference = {
                      publisher: sku.publisher,
                      offer: sku.offer,
                      sku: sku.name,
                      version: version
                    };

                    return (
                      <div
                        key={`${sku.name}-${version}-${index}`}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-150"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-mono text-gray-900 truncate">
                              {version}
                            </span>
                            {version === 'latest' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {version === 'latest' ? 'Most recent version' : 'Specific version'}
                          </p>
                        </div>
                        <CopyButton 
                          imageReference={imageRef}
                          className="ml-4 flex-shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {versions.length} version{versions.length !== 1 ? 's' : ''} available
                    </span>
                    <span className="text-xs">
                      Ready for Infrastructure as Code deployment
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Versions Available
                  </h3>
                  <p className="text-sm text-gray-600">
                    This SKU may not have published versions yet, or they may not be available in the selected location.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Stack>
      </div>
    </Modal>
  );
};

export default SKUVersionsModal;