import React, { useEffect, useState } from 'react';
import { useSubscriptions } from '../../stores/authStore';
// import { useAuthStore } from '../../stores/authStore'; // Unused for now
import { SearchableDropdown } from './SearchableDropdown';
import { useTenantAwareServices } from '../../hooks/useTenantAwareServices';
import { useMsal } from '@azure/msal-react';
import type { AzureLocation } from '../../types';

interface LocationSelectorProps {
  className?: string;
  disabled?: boolean;
}

// Fallback locations in case API fails
const FALLBACK_LOCATIONS: AzureLocation[] = [
  {
    name: 'eastus',
    displayName: 'East US',
    regionalDisplayName: 'Virginia, USA',
  },
  {
    name: 'eastus2',
    displayName: 'East US 2',
    regionalDisplayName: 'Virginia, USA',
  },
  {
    name: 'westus',
    displayName: 'West US',
    regionalDisplayName: 'California, USA',
  },
  {
    name: 'westus2',
    displayName: 'West US 2',
    regionalDisplayName: 'Washington, USA',
  },
  {
    name: 'centralus',
    displayName: 'Central US',
    regionalDisplayName: 'Iowa, USA',
  },
  {
    name: 'northeurope',
    displayName: 'North Europe',
    regionalDisplayName: 'Ireland',
  },
  {
    name: 'westeurope',
    displayName: 'West Europe',
    regionalDisplayName: 'Netherlands',
  },
  {
    name: 'uksouth',
    displayName: 'UK South',
    regionalDisplayName: 'London, UK',
  },
  {
    name: 'francecentral',
    displayName: 'France Central',
    regionalDisplayName: 'Paris, France',
  },
  {
    name: 'germanywestcentral',
    displayName: 'Germany West Central',
    regionalDisplayName: 'Frankfurt, Germany',
  },
  {
    name: 'eastasia',
    displayName: 'East Asia',
    regionalDisplayName: 'Hong Kong',
  },
  {
    name: 'southeastasia',
    displayName: 'Southeast Asia',
    regionalDisplayName: 'Singapore',
  },
  {
    name: 'japaneast',
    displayName: 'Japan East',
    regionalDisplayName: 'Tokyo, Japan',
  },
  {
    name: 'australiaeast',
    displayName: 'Australia East',
    regionalDisplayName: 'New South Wales, Australia',
  },
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  className = '',
  disabled = false,
}) => {
  const {
    locations,
    selectedLocation,
    setLocations,
    selectLocation,
    selectedSubscription,
  } = useSubscriptions();
  const tenantAwareServices = useTenantAwareServices();
  const [, setLoadingLocations] = useState(false);

  // Fetch Azure locations dynamically
  const fetchAzureLocations = async () => {
    if (!selectedSubscription || !tenantAwareServices) {
      // Use fallback locations if no subscription or services
      setLocations(FALLBACK_LOCATIONS);
      return;
    }

    setLoadingLocations(true);
    try {
      // Use tenant-aware subscription service to get locations
      const locations = await tenantAwareServices.subscriptionService.getLocations(selectedSubscription);
      setLocations(locations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      // Fallback to default locations on error
      setLocations(FALLBACK_LOCATIONS);
      }

      const data = await response.json();
      const locationsArray = data.value || [];

      // Filter to only include physical regions (type = "Region" AND metadata.regionType = "Physical")
      // This ensures only actual Azure regions are shown, excluding edge zones and geographical groupings
      const regions = locationsArray
        .filter(
          (loc: any) =>
            loc.type === 'Region' && loc.metadata?.regionType === 'Physical'
    } finally {
      setLoadingLocations(false);
    }
  };

  // Initialize locations when component mounts or subscription changes
  useEffect(() => {
    if (locations.length === 0 || selectedSubscription) {
      fetchAzureLocations();
    }

    // Validate the current selected location
    const validLocationNames = locations.map((loc) => loc.name);
    if (
      locations.length > 0 &&
      !validLocationNames.includes(selectedLocation)
    ) {
      console.warn(
        `Invalid location "${selectedLocation}" detected, switching to eastus`
      );
      selectLocation('eastus');
    }
  }, [selectedSubscription, locations.length, tenantAwareServices]);

  // Convert locations to dropdown options
  const locationOptions = locations.map((location) => ({
    value: location.name,
    label: location.displayName,
    description: location.regionalDisplayName,
  }));

  const handleLocationSelect = (locationName: string) => {
    selectLocation(locationName);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor="location-select"
        className="block text-sm font-medium text-gray-700"
      >
        Azure Region
      </label>
      <SearchableDropdown
        options={locationOptions}
        value={selectedLocation}
        placeholder="Select a region..."
        onSelect={handleLocationSelect}
        disabled={disabled}
        searchPlaceholder="Search regions..."
        emptyMessage="No regions found"
        className="w-full"
      />

    </div>
  );
};

export default LocationSelector;
