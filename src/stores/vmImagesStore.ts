import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Publisher, Offer, SKU } from '../types';

// Helper function to filter items based on search query
const filterItems = <T extends { name: string; displayName: string }>(
  items: T[],
  query: string
): T[] => {
  if (!query.trim()) {
    return items;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.displayName.toLowerCase().includes(lowerQuery)
  );
};

interface VMImagesState {
  publishers: Publisher[];
  offers: Offer[];
  skus: SKU[];
  loading: boolean;
  error: string | null;
  // Track what data is currently loaded
  loadedPublishers: boolean;
  loadedOffers: { publisher: string } | null;
  loadedSkus: { publisher: string; offer: string } | null;
  // Search functionality
  searchQuery: string;
  filteredPublishers: Publisher[];
  filteredOffers: Offer[];
  filteredSkus: SKU[];
  // Pagination
  pagination: {
    publishers: { currentPage: number; itemsPerPage: number };
    offers: { currentPage: number; itemsPerPage: number };
    skus: { currentPage: number; itemsPerPage: number };
  };
}

interface VMImagesActions {
  // Publishers
  setPublishers: (publishers: Publisher[]) => void;
  clearPublishers: () => void;
  
  // Offers
  setOffers: (offers: Offer[], publisher: string) => void;
  clearOffers: () => void;
  
  // SKUs
  setSkus: (skus: SKU[], publisher: string, offer: string) => void;
  clearSkus: () => void;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Search functionality
  setSearchQuery: (query: string) => void;
  setPublishersSearch: (query: string) => void;
  setOffersSearch: (query: string) => void;
  setSkusSearch: (query: string) => void;
  clearSearch: () => void;
  
  // Pagination
  setPublishersPage: (page: number) => void;
  setOffersPage: (page: number) => void;
  setSkusPage: (page: number) => void;
  setItemsPerPage: (type: 'publishers' | 'offers' | 'skus', itemsPerPage: number) => void;
  
  // Utility actions
  reset: () => void;
  clearAll: () => void;
}

type VMImagesStore = VMImagesState & VMImagesActions;

const initialState: VMImagesState = {
  publishers: [],
  offers: [],
  skus: [],
  loading: false,
  error: null,
  loadedPublishers: false,
  loadedOffers: null,
  loadedSkus: null,
  searchQuery: '',
  filteredPublishers: [],
  filteredOffers: [],
  filteredSkus: [],
  pagination: {
    publishers: { currentPage: 1, itemsPerPage: 12 },
    offers: { currentPage: 1, itemsPerPage: 10 },
    skus: { currentPage: 1, itemsPerPage: 8 },
  },
};

export const useVMImagesStore = create<VMImagesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setPublishers: (publishers: Publisher[]) => {
        const { searchQuery } = get();
        const filteredPublishers = filterItems(publishers, searchQuery);
        set(
          {
            publishers,
            filteredPublishers,
            loadedPublishers: true,
            error: null,
          },
          false,
          'vmImages/setPublishers'
        );
      },

      clearPublishers: () => {
        set(
          {
            publishers: [],
            filteredPublishers: [],
            loadedPublishers: false,
          },
          false,
          'vmImages/clearPublishers'
        );
      },

      setOffers: (offers: Offer[], publisher: string) => {
        const { searchQuery } = get();
        const filteredOffers = filterItems(offers, searchQuery);
        set(
          {
            offers,
            filteredOffers,
            loadedOffers: { publisher },
            // Clear SKUs when offers change
            skus: [],
            filteredSkus: [],
            loadedSkus: null,
            error: null,
          },
          false,
          'vmImages/setOffers'
        );
      },

      clearOffers: () => {
        set(
          {
            offers: [],
            filteredOffers: [],
            loadedOffers: null,
            // Also clear SKUs
            skus: [],
            filteredSkus: [],
            loadedSkus: null,
          },
          false,
          'vmImages/clearOffers'
        );
      },

      setSkus: (skus: SKU[], publisher: string, offer: string) => {
        const { searchQuery } = get();
        const filteredSkus = filterItems(skus, searchQuery);
        set(
          {
            skus,
            filteredSkus,
            loadedSkus: { publisher, offer },
            error: null,
          },
          false,
          'vmImages/setSkus'
        );
      },

      clearSkus: () => {
        set(
          {
            skus: [],
            filteredSkus: [],
            loadedSkus: null,
          },
          false,
          'vmImages/clearSkus'
        );
      },

      setLoading: (loading: boolean) => {
        set(
          {
            loading,
          },
          false,
          'vmImages/setLoading'
        );
      },

      setError: (error: string | null) => {
        set(
          {
            error,
            loading: false, // Stop loading on error
          },
          false,
          'vmImages/setError'
        );
      },

      clearError: () => {
        set(
          {
            error: null,
          },
          false,
          'vmImages/clearError'
        );
      },

      setSearchQuery: (query: string) => {
        const { publishers, offers, skus } = get();
        set(
          {
            searchQuery: query,
            filteredPublishers: filterItems(publishers, query),
            filteredOffers: filterItems(offers, query),
            filteredSkus: filterItems(skus, query),
          },
          false,
          'vmImages/setSearchQuery'
        );
      },

      // Optimized search methods for specific types
      setPublishersSearch: (query: string) => {
        const { publishers } = get();
        set(
          {
            searchQuery: query,
            filteredPublishers: filterItems(publishers, query),
          },
          false,
          'vmImages/setPublishersSearch'
        );
      },

      setOffersSearch: (query: string) => {
        const { offers } = get();
        set(
          {
            searchQuery: query,
            filteredOffers: filterItems(offers, query),
          },
          false,
          'vmImages/setOffersSearch'
        );
      },

      setSkusSearch: (query: string) => {
        const { skus } = get();
        set(
          {
            searchQuery: query,
            filteredSkus: filterItems(skus, query),
          },
          false,
          'vmImages/setSkusSearch'
        );
      },

      clearSearch: () => {
        const { publishers, offers, skus } = get();
        set(
          {
            searchQuery: '',
            filteredPublishers: publishers,
            filteredOffers: offers,
            filteredSkus: skus,
          },
          false,
          'vmImages/clearSearch'
        );
      },

      setPublishersPage: (page: number) => {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              publishers: { ...state.pagination.publishers, currentPage: page },
            },
          }),
          false,
          'vmImages/setPublishersPage'
        );
      },

      setOffersPage: (page: number) => {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              offers: { ...state.pagination.offers, currentPage: page },
            },
          }),
          false,
          'vmImages/setOffersPage'
        );
      },

      setSkusPage: (page: number) => {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              skus: { ...state.pagination.skus, currentPage: page },
            },
          }),
          false,
          'vmImages/setSkusPage'
        );
      },

      setItemsPerPage: (type: 'publishers' | 'offers' | 'skus', itemsPerPage: number) => {
        set(
          (state) => ({
            pagination: {
              ...state.pagination,
              [type]: { currentPage: 1, itemsPerPage },
            },
          }),
          false,
          'vmImages/setItemsPerPage'
        );
      },

      reset: () => {
        set(
          {
            ...initialState,
          },
          false,
          'vmImages/reset'
        );
      },

      clearAll: () => {
        const { loading } = get();
        set(
          {
            publishers: [],
            offers: [],
            skus: [],
            filteredPublishers: [],
            filteredOffers: [],
            filteredSkus: [],
            loadedPublishers: false,
            loadedOffers: null,
            loadedSkus: null,
            error: null,
            loading, // Preserve current loading state
          },
          false,
          'vmImages/clearAll'
        );
      },
    }),
    {
      name: 'vm-images-store',
    }
  )
);

// Helper function to paginate items
const paginateItems = <T>(items: T[], currentPage: number, itemsPerPage: number) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
};

// Selectors for common use cases
export const usePublishers = () => {
  const publishers = useVMImagesStore((state) => state.publishers);
  const filteredPublishers = useVMImagesStore((state) => state.filteredPublishers);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loaded = useVMImagesStore((state) => state.loadedPublishers);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.publishers);
  
  const { currentPage, itemsPerPage } = paginationState;
  const paginatedPublishers = paginateItems(filteredPublishers, currentPage, itemsPerPage);
  
  return {
    publishers: paginatedPublishers,
    allPublishers: publishers,
    filteredPublishers,
    loading,
    error,
    loaded,
    searchQuery,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: filteredPublishers.length,
      totalPages: Math.ceil(filteredPublishers.length / itemsPerPage),
    },
  };
};

export const useOffers = () => {
  const offers = useVMImagesStore((state) => state.offers);
  const filteredOffers = useVMImagesStore((state) => state.filteredOffers);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loadedFor = useVMImagesStore((state) => state.loadedOffers);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.offers);
  
  const { currentPage, itemsPerPage } = paginationState;
  const paginatedOffers = paginateItems(filteredOffers, currentPage, itemsPerPage);
  
  return {
    offers: paginatedOffers,
    allOffers: offers,
    filteredOffers,
    loading,
    error,
    loadedFor,
    searchQuery,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: filteredOffers.length,
      totalPages: Math.ceil(filteredOffers.length / itemsPerPage),
    },
  };
};

export const useSkus = () => {
  const skus = useVMImagesStore((state) => state.skus);
  const filteredSkus = useVMImagesStore((state) => state.filteredSkus);
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  const loadedFor = useVMImagesStore((state) => state.loadedSkus);
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const paginationState = useVMImagesStore((state) => state.pagination.skus);
  
  const { currentPage, itemsPerPage } = paginationState;
  const paginatedSkus = paginateItems(filteredSkus, currentPage, itemsPerPage);
  
  return {
    skus: paginatedSkus,
    allSkus: skus,
    filteredSkus,
    loading,
    error,
    loadedFor,
    searchQuery,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: filteredSkus.length,
      totalPages: Math.ceil(filteredSkus.length / itemsPerPage),
    },
  };
};

export const useVMImagesLoading = () => {
  const loading = useVMImagesStore((state) => state.loading);
  const error = useVMImagesStore((state) => state.error);
  
  return { loading, error };
};

export const useVMImagesSearch = () => {
  const searchQuery = useVMImagesStore((state) => state.searchQuery);
  const setSearchQuery = useVMImagesStore((state) => state.setSearchQuery);
  const clearSearch = useVMImagesStore((state) => state.clearSearch);
  
  return { searchQuery, setSearchQuery, clearSearch };
};

export const useVMImagesPagination = () => {
  const setPublishersPage = useVMImagesStore((state) => state.setPublishersPage);
  const setOffersPage = useVMImagesStore((state) => state.setOffersPage);
  const setSkusPage = useVMImagesStore((state) => state.setSkusPage);
  const setItemsPerPage = useVMImagesStore((state) => state.setItemsPerPage);
  
  return { setPublishersPage, setOffersPage, setSkusPage, setItemsPerPage };
};