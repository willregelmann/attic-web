import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CollectionFilterProvider, useCollectionFilter } from './CollectionFilterContext';

describe('CollectionFilterContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }) => (
    <CollectionFilterProvider>{children}</CollectionFilterProvider>
  );

  describe('Filter Management', () => {
    it('should set and get filters for a collection', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('collection-1', {
          year: ['2020', '2021'],
          country: ['US', 'JP'],
        });
      });

      const filters = result.current.getFiltersForCollection('collection-1', false);
      expect(filters).toEqual({
        year: ['2020', '2021'],
        country: ['US', 'JP'],
      });
    });

    it('should update a single filter field', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.updateCollectionFilter('collection-1', 'year', ['2020']);
      });

      const filters = result.current.getFiltersForCollection('collection-1', false);
      expect(filters.year).toEqual(['2020']);

      act(() => {
        result.current.updateCollectionFilter('collection-1', 'year', ['2021', '2022']);
      });

      const updatedFilters = result.current.getFiltersForCollection('collection-1', false);
      expect(updatedFilters.year).toEqual(['2021', '2022']);
    });

    it('should remove filter field when values are empty', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('collection-1', {
          year: ['2020'],
          country: ['US'],
        });
      });

      act(() => {
        result.current.updateCollectionFilter('collection-1', 'year', []);
      });

      const filters = result.current.getFiltersForCollection('collection-1', false);
      expect(filters.year).toBeUndefined();
      expect(filters.country).toEqual(['US']);
    });

    it('should clear all filters for a collection', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('collection-1', {
          year: ['2020'],
          country: ['US'],
        });
      });

      act(() => {
        result.current.clearFiltersForCollection('collection-1');
      });

      const filters = result.current.getFiltersForCollection('collection-1', false);
      expect(filters).toEqual({});
    });

    it('should persist filters to localStorage', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('collection-1', {
          year: ['2020'],
        });
      });

      const stored = JSON.parse(localStorage.getItem('collection-filters'));
      expect(stored['collection-1']).toEqual({ year: ['2020'] });
    });

    it('should restore filters from localStorage', () => {
      localStorage.setItem('collection-filters', JSON.stringify({
        'collection-1': { year: ['2020'] },
      }));

      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filters = result.current.getFiltersForCollection('collection-1', false);
      expect(filters).toEqual({ year: ['2020'] });
    });
  });

  describe('Filter Inheritance', () => {
    it('should inherit filters from parent collections', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      // Set filters on parent and grandparent
      act(() => {
        result.current.setFiltersForCollection('grandparent', {
          country: ['US'],
        });
        result.current.setFiltersForCollection('parent', {
          year: ['2020'],
        });
        result.current.setFiltersForCollection('child', {
          'attributes.rarity': ['Rare'],
        });
      });

      // Set active collection with parent path
      act(() => {
        result.current.setActiveCollection('child', ['grandparent', 'parent']);
      });

      // Get filters with inheritance
      const filters = result.current.getFiltersForCollection('child', true);

      expect(filters).toEqual({
        country: ['US'],
        year: ['2020'],
        'attributes.rarity': ['Rare'],
      });
    });

    it('should override inherited filters with own filters', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('parent', {
          year: ['2020'],
        });
        result.current.setFiltersForCollection('child', {
          year: ['2021'], // Override parent's year filter
        });
        result.current.setActiveCollection('child', ['parent']);
      });

      const filters = result.current.getFiltersForCollection('child', true);
      expect(filters.year).toEqual(['2021']); // Should use child's value, not parent's
    });
  });

  describe('Filter Application', () => {
    const mockItems = [
      { id: '1', name: 'Item 1', type: 'item', year: '2020', country: 'US' },
      { id: '2', name: 'Item 2', type: 'item', year: '2021', country: 'JP' },
      { id: '3', name: 'Item 3', type: 'collection', year: '2020', country: 'US' },
      { id: '4', name: 'Item 4', type: 'item', year: null, country: 'US' },
    ];

    it('should filter items by year', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(mockItems, {
        year: ['2020'],
      });

      expect(filtered).toHaveLength(2); // Item 1 and Item 3 (collection)
      expect(filtered.map(i => i.id)).toEqual(['1', '3']);
    });

    it('should filter items by country', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(mockItems, {
        country: ['JP'],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter items by multiple fields (AND logic)', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(mockItems, {
        year: ['2020'],
        country: ['US'],
      });

      expect(filtered).toHaveLength(2); // Item 1 and Item 3
      expect(filtered.map(i => i.id)).toEqual(['1', '3']);
    });

    it('should keep collections even if they have null values', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(mockItems, {
        year: ['2020'],
      });

      const collection = filtered.find(i => i.type === 'collection');
      expect(collection).toBeTruthy();
    });

    it('should exclude non-collections with null values', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(mockItems, {
        year: ['2020'],
      });

      const itemWithNull = filtered.find(i => i.id === '4');
      expect(itemWithNull).toBeUndefined();
    });

    it('should handle nested attribute filters', () => {
      const itemsWithAttributes = [
        { id: '1', type: 'item', attributes: { rarity: 'Common' } },
        { id: '2', type: 'item', attributes: { rarity: 'Rare' } },
        { id: '3', type: 'item', attributes: {} },
      ];

      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const filtered = result.current.applyFilters(itemsWithAttributes, {
        'attributes.rarity': ['Rare'],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });
  });

  describe('Field Values Extraction', () => {
    const mockItems = [
      { id: '1', year: '2020', country: 'US' },
      { id: '2', year: '2021', country: 'JP' },
      { id: '3', year: '2020', country: 'US' },
      { id: '4', year: '2022', country: 'UK' },
    ];

    it('should extract unique values from a field', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const years = result.current.getFieldValues(mockItems, 'year');
      expect(years).toEqual(['2020', '2021', '2022']);

      const countries = result.current.getFieldValues(mockItems, 'country');
      expect(countries).toEqual(['JP', 'UK', 'US']); // Sorted alphabetically
    });

    it('should handle nested fields', () => {
      const itemsWithNested = [
        { id: '1', attributes: { rarity: 'Common' } },
        { id: '2', attributes: { rarity: 'Rare' } },
        { id: '3', attributes: { rarity: 'Common' } },
      ];

      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const rarities = result.current.getFieldValues(itemsWithNested, 'attributes.rarity');
      expect(rarities).toEqual(['Common', 'Rare']);
    });

    it('should handle array values', () => {
      const itemsWithArrays = [
        { id: '1', tags: ['red', 'blue'] },
        { id: '2', tags: ['green', 'red'] },
        { id: '3', tags: [] },
      ];

      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const tags = result.current.getFieldValues(itemsWithArrays, 'tags');
      expect(tags).toEqual(['blue', 'green', 'red']); // Sorted, unique
    });

    it('should ignore null and undefined values', () => {
      const itemsWithNulls = [
        { id: '1', year: '2020' },
        { id: '2', year: null },
        { id: '3', year: undefined },
        { id: '4', year: '' },
      ];

      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      const years = result.current.getFieldValues(itemsWithNulls, 'year');
      expect(years).toEqual(['2020']);
    });
  });

  describe('Active Filters Detection', () => {
    it('should detect when collection has active filters', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('collection-1', {
          year: ['2020'],
        });
      });

      expect(result.current.hasActiveFilters('collection-1')).toBe(true);
      expect(result.current.hasActiveFilters('collection-2')).toBe(false);
    });

    it('should detect effective filters including inherited', () => {
      const { result } = renderHook(() => useCollectionFilter(), { wrapper });

      act(() => {
        result.current.setFiltersForCollection('parent', {
          year: ['2020'],
        });
        result.current.setActiveCollection('child', ['parent']);
      });

      expect(result.current.hasActiveFilters('child')).toBe(false); // No own filters
      expect(result.current.hasEffectiveFilters('child')).toBe(true); // Has inherited filters
    });
  });
});
