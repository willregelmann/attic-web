/**
 * Utility functions for collection-level filtering
 */

/**
 * Discover all filterable fields from a collection of items
 * Analyzes items and their metadata to find all unique fields
 * @param {Array} items - Array of items to analyze
 * @param {number} maxDepth - Maximum depth for nested attributes (default: 3)
 * @returns {Array} Array of field descriptors with { field, label, type, values }
 */
export function discoverFilterableFields(items, maxDepth = 3) {
  if (!items || items.length === 0) return [];

  const fields = new Map();

  // Standard top-level fields to check
  const standardFields = [
    { field: 'type', label: 'Type', priority: 1 },
    { field: 'year', label: 'Year', priority: 2 },
    { field: 'country', label: 'Country', priority: 3 },
  ];

  // Add standard fields
  standardFields.forEach(({ field, label, priority }) => {
    const values = extractFieldValues(items, field);
    if (values.length > 0 && values.length <= 100) { // Only include if reasonable number of values
      fields.set(field, {
        field,
        label,
        type: inferFieldType(values),
        values,
        priority,
        count: values.length
      });
    }
  });

  // Discover fields from attributes
  const attributeFields = discoverAttributeFields(items, maxDepth);
  attributeFields.forEach(fieldInfo => {
    if (!fields.has(fieldInfo.field)) {
      fields.set(fieldInfo.field, fieldInfo);
    }
  });

  // Convert to array and sort by priority and label
  return Array.from(fields.values()).sort((a, b) => {
    // Primary sort by priority (lower is higher)
    if (a.priority !== b.priority) {
      return (a.priority || 999) - (b.priority || 999);
    }
    // Secondary sort by label
    return a.label.localeCompare(b.label);
  });
}

/**
 * Extract all unique values for a field from items
 * @param {Array} items - Items to extract from
 * @param {string} field - Field path (e.g., "year", "attributes.rarity")
 * @returns {Array} Sorted array of unique values
 */
export function extractFieldValues(items, field) {
  const values = new Set();

  items.forEach(item => {
    const value = getNestedValue(item, field);

    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== null && v !== undefined && v !== '') {
            values.add(v);
          }
        });
      } else {
        values.add(value);
      }
    }
  });

  return Array.from(values).sort((a, b) => {
    // Handle numbers
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    // Handle strings
    return String(a).localeCompare(String(b));
  });
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Path like "attributes.rarity"
 * @returns {*} Value at path or null
 */
export function getNestedValue(obj, path) {
  const parts = path.split('.');
  let value = obj;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return null;
    }
  }

  return value;
}

/**
 * Discover filterable fields from item attributes
 * @param {Array} items - Items to analyze
 * @param {number} maxDepth - Maximum nesting depth
 * @returns {Array} Array of attribute field descriptors
 */
function discoverAttributeFields(items, maxDepth = 3) {
  const attributePaths = new Set();

  // Collect all attribute paths
  items.forEach(item => {
    if (item.attributes && typeof item.attributes === 'object') {
      collectPaths(item.attributes, 'attributes', attributePaths, maxDepth, 1);
    }
  });

  // Convert paths to field descriptors
  const fields = [];

  attributePaths.forEach(path => {
    const values = extractFieldValues(items, path);

    // Only include if we have values and not too many unique values
    if (values.length > 0 && values.length <= 100) {
      fields.push({
        field: path,
        label: formatAttributeLabel(path),
        type: inferFieldType(values),
        values,
        priority: 10, // Lower priority than standard fields
        count: values.length
      });
    }
  });

  return fields;
}

/**
 * Recursively collect all paths in an object
 * @param {Object} obj - Object to traverse
 * @param {string} prefix - Current path prefix
 * @param {Set} paths - Set to collect paths into
 * @param {number} maxDepth - Maximum depth
 * @param {number} currentDepth - Current depth
 */
function collectPaths(obj, prefix, paths, maxDepth, currentDepth) {
  if (currentDepth > maxDepth || !obj || typeof obj !== 'object') {
    return;
  }

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const path = `${prefix}.${key}`;

    // Skip null/undefined
    if (value === null || value === undefined) {
      return;
    }

    // If it's an array, add the path (we'll handle array values in extraction)
    if (Array.isArray(value)) {
      // Only add if array contains primitive values
      if (value.length > 0 && (typeof value[0] !== 'object' || value[0] === null)) {
        paths.add(path);
      }
    }
    // If it's an object, recurse
    else if (typeof value === 'object') {
      collectPaths(value, path, paths, maxDepth, currentDepth + 1);
    }
    // If it's a primitive, add the path
    else {
      paths.add(path);
    }
  });
}

/**
 * Format attribute path into a readable label
 * @param {string} path - Path like "attributes.rarity"
 * @returns {string} Formatted label like "Rarity"
 */
function formatAttributeLabel(path) {
  // Remove "attributes." prefix
  const withoutPrefix = path.replace(/^attributes\./, '');

  // Split on dots and camelCase
  const parts = withoutPrefix
    .split('.')
    .map(part =>
      part
        // Insert space before capital letters
        .replace(/([A-Z])/g, ' $1')
        // Split on underscores
        .replace(/_/g, ' ')
        .trim()
    );

  // Capitalize each part
  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' > ');
}

/**
 * Infer the data type of field values
 * @param {Array} values - Array of values
 * @returns {string} Type: 'number', 'boolean', 'string'
 */
function inferFieldType(values) {
  if (values.length === 0) return 'string';

  const firstValue = values[0];

  if (typeof firstValue === 'number') return 'number';
  if (typeof firstValue === 'boolean') return 'boolean';
  return 'string';
}

/**
 * Count how many items match each filter value
 * @param {Array} items - Items to count
 * @param {string} field - Field to count by
 * @returns {Object} Map of value -> count
 */
export function countFilterValues(items, field) {
  const counts = {};

  items.forEach(item => {
    const value = getNestedValue(item, field);

    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
      } else {
        counts[value] = (counts[value] || 0) + 1;
      }
    }
  });

  return counts;
}

/**
 * Format a filter value for display
 * Converts underscores to spaces and capitalizes first letter of each word
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
export function formatFilterValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Replace underscores with spaces
  const withSpaces = str.replace(/_/g, ' ');

  // Capitalize first letter of each word
  return withSpaces
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      // Handle all caps words (like "COLLECTIBLE")
      if (word === word.toUpperCase() && word.length > 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Regular capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Count how many items belong to each parent collection
 * @param {Array} items - Items to count (current filtered view)
 * @param {Array} parentCollections - Parent collections with item_ids in attributes
 * @returns {Object} Map of collection_id -> count
 */
export function countParentCollections(items, parentCollections) {
  const counts = {};

  // Create a Set of item IDs in the current view for fast lookup
  const currentItemIds = new Set(items.map(item => item.id));

  // For each parent collection, count how many of its items are in the current view
  parentCollections.forEach(collection => {
    // item_ids are stored in attributes.item_ids by the backend
    const itemIds = collection.attributes?.item_ids || [];

    // Count how many of these items are in the current filtered view
    const count = itemIds.filter(id => currentItemIds.has(id)).length;

    counts[collection.id] = count;
  });

  return counts;
}
