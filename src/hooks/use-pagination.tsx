import { useState, useMemo, useEffect, useCallback } from 'react';

interface UsePaginationOptionsObject<T> {
  items: T[];
  itemsPerPage?: number;
}

interface UsePaginationOptionsSimple {
  itemsPerPage?: number;
}

// Overload for object-style call
export function usePagination<T>(options: UsePaginationOptionsObject<T>): {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
};

// Overload for array-style call (legacy)
export function usePagination<T>(items: T[], options?: UsePaginationOptionsSimple): {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
};

export function usePagination<T>(
  itemsOrOptions: T[] | UsePaginationOptionsObject<T>,
  legacyOptions?: UsePaginationOptionsSimple
) {
  // Determine if using object or array syntax
  const isObjectSyntax = !Array.isArray(itemsOrOptions);
  
  const items = isObjectSyntax 
    ? (itemsOrOptions as UsePaginationOptionsObject<T>).items 
    : (itemsOrOptions as T[]);
  
  const itemsPerPage = isObjectSyntax
    ? (itemsOrOptions as UsePaginationOptionsObject<T>).itemsPerPage ?? 6
    : legacyOptions?.itemsPerPage ?? 6;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Reset to page 1 when items change
  useEffect(() => {
    if (currentPage > Math.max(1, totalPages)) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    totalItems: items.length,
    startIndex: items.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
    endIndex: Math.min(currentPage * itemsPerPage, items.length),
    onPageChange: goToPage,
  };
}
