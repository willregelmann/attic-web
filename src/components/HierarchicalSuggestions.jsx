import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { ChevronDown, ChevronRight, Package, Plus, X, Check, AlertCircle, Layers, Hash } from 'lucide-react';
import './HierarchicalSuggestions.css';

const GET_SUGGESTIONS = gql`
  query GetCuratorSuggestions($collectionId: ID!, $status: String) {
    curatorSuggestions(collection_id: $collectionId, status: $status) {
      id
      action_type
      item_id
      suggestion_data
      reasoning
      confidence_score
      status
      reviewed_at
      review_notes
      created_at
    }
  }
`;

const REVIEW_SUGGESTIONS = gql`
  mutation ReviewSuggestions($ids: [ID!]!, $action: String!, $notes: String) {
    reviewMultipleSuggestions(ids: $ids, action: $action, notes: $notes) {
      success
      approved
      rejected
    }
  }
`;

const HierarchicalSuggestions = ({ collectionId }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filter, setFilter] = useState('pending');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'flat'

  const { data, loading, refetch } = useQuery(GET_SUGGESTIONS, {
    variables: { collectionId, status: filter === 'all' ? null : filter },
  });

  const [reviewSuggestions] = useMutation(REVIEW_SUGGESTIONS);

  // Process suggestions into hierarchical structure
  const hierarchicalData = useMemo(() => {
    if (!data?.curatorSuggestions) return { subcollections: [], items: [] };

    const suggestions = data.curatorSuggestions;
    const subcollections = new Map();
    const standaloneItems = [];

    suggestions.forEach(suggestion => {
      const suggestionData = suggestion.suggestion_data;
      
      if (suggestion.action_type === 'add_subcollection') {
        // This is a subcollection suggestion with nested items
        subcollections.set(suggestion.id, {
          ...suggestion,
          subcollection_name: suggestionData.subcollection_name || suggestionData.item_name,
          subcollection_metadata: suggestionData.subcollection_metadata || suggestionData.metadata,
          nested_items: suggestionData.nested_items || []
        });
      } else if (suggestionData.parent_subcollection) {
        // This item belongs to a subcollection
        const parent = subcollections.get(suggestionData.parent_subcollection);
        if (parent) {
          parent.nested_items.push(suggestion);
        }
      } else {
        // Standalone item suggestion
        standaloneItems.push(suggestion);
      }
    });

    return {
      subcollections: Array.from(subcollections.values()),
      items: standaloneItems
    };
  }, [data]);

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleSelection = (itemId, isSubcollection = false, parentId = null) => {
    const newSelection = new Set(selectedItems);
    
    if (isSubcollection) {
      // When selecting a subcollection, also select all its items
      const subcollection = hierarchicalData.subcollections.find(s => s.id === itemId);
      if (subcollection) {
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
          // Deselect all nested items
          subcollection.nested_items.forEach(item => {
            newSelection.delete(`${itemId}:${item.item_name}`);
          });
        } else {
          newSelection.add(itemId);
          // Select all nested items
          subcollection.nested_items.forEach(item => {
            newSelection.add(`${itemId}:${item.item_name}`);
          });
        }
      }
    } else {
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
    }
    
    setSelectedItems(newSelection);
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) return;

    try {
      const ids = Array.from(selectedItems).filter(id => !id.includes(':'));
      await reviewSuggestions({
        variables: { ids, action }
      });
      await refetch();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error reviewing suggestions:', error);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const renderSubcollection = (subcollection) => {
    const isExpanded = expandedNodes.has(subcollection.id);
    const isSelected = selectedItems.has(subcollection.id);
    const itemCount = subcollection.nested_items?.length || 0;

    return (
      <div key={subcollection.id} className="suggestion-subcollection">
        <div className={`subcollection-header ${subcollection.status} ${isSelected ? 'selected' : ''}`}>
          {filter === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(subcollection.id, true)}
              onClick={e => e.stopPropagation()}
            />
          )}
          
          <button
            className="expand-toggle"
            onClick={() => toggleExpanded(subcollection.id)}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          
          <Layers size={20} className="subcollection-icon" />
          
          <div className="subcollection-info">
            <h4>{subcollection.subcollection_name}</h4>
            <div className="metadata">
              <span className="item-count">{itemCount} items</span>
              <span className={`confidence ${getConfidenceColor(subcollection.confidence_score)}`}>
                {subcollection.confidence_score}% confidence
              </span>
              {subcollection.status !== 'pending' && (
                <span className={`status-badge ${subcollection.status}`}>
                  {subcollection.status}
                </span>
              )}
            </div>
          </div>

          {subcollection.subcollection_metadata?.description && (
            <div className="subcollection-description">
              {subcollection.subcollection_metadata.description}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="nested-items">
            <div className="reasoning-box">
              <strong>Reasoning:</strong> {subcollection.reasoning}
            </div>
            
            {subcollection.nested_items.map((item, index) => (
              <div 
                key={index} 
                className={`nested-item ${selectedItems.has(`${subcollection.id}:${item.item_name}`) ? 'selected' : ''}`}
              >
                {filter === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`${subcollection.id}:${item.item_name}`)}
                    onChange={() => toggleSelection(`${subcollection.id}:${item.item_name}`, false, subcollection.id)}
                  />
                )}
                
                <Package size={16} />
                <span className="item-name">{item.item_name || item.name}</span>
                
                {item.metadata && (
                  <div className="item-metadata">
                    {item.metadata.rarity && <span className="tag rarity">{item.metadata.rarity}</span>}
                    {item.metadata.value && <span className="tag value">${item.metadata.value}</span>}
                    {item.metadata.set && <span className="tag set">{item.metadata.set}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStandaloneItem = (suggestion) => {
    const isSelected = selectedItems.has(suggestion.id);
    
    return (
      <div 
        key={suggestion.id} 
        className={`suggestion-item standalone ${suggestion.status} ${isSelected ? 'selected' : ''}`}
      >
        {filter === 'pending' && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(suggestion.id)}
          />
        )}
        
        <Package size={20} />
        
        <div className="item-content">
          <h4>{suggestion.suggestion_data.item_name || 'Unknown Item'}</h4>
          <p className="reasoning">{suggestion.reasoning}</p>
          
          <div className="item-meta">
            <span className={`confidence ${getConfidenceColor(suggestion.confidence_score)}`}>
              {suggestion.confidence_score}% confidence
            </span>
            {suggestion.status !== 'pending' && (
              <span className={`status-badge ${suggestion.status}`}>
                {suggestion.status}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-state">Loading suggestions...</div>;

  const hasSubcollections = hierarchicalData.subcollections.length > 0;
  const hasItems = hierarchicalData.items.length > 0;
  const totalSuggestions = hierarchicalData.subcollections.length + hierarchicalData.items.length;

  return (
    <div className="hierarchical-suggestions">
      <div className="suggestions-header">
        <h2>Curator Suggestions</h2>
        
        <div className="header-controls">
          <div className="filter-pills">
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button 
              className={filter === 'rejected' ? 'active' : ''}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>

          {hasSubcollections && (
            <div className="view-toggle">
              <button 
                className={viewMode === 'tree' ? 'active' : ''}
                onClick={() => setViewMode('tree')}
                title="Tree View"
              >
                <Layers size={18} />
              </button>
              <button 
                className={viewMode === 'flat' ? 'active' : ''}
                onClick={() => setViewMode('flat')}
                title="Flat View"
              >
                <Hash size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {filter === 'pending' && selectedItems.size > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedItems.size} items selected</span>
          <div className="actions">
            <button 
              className="btn-approve"
              onClick={() => handleBulkAction('approve')}
            >
              <Check size={16} /> Approve Selected
            </button>
            <button 
              className="btn-reject"
              onClick={() => handleBulkAction('reject')}
            >
              <X size={16} /> Reject Selected
            </button>
          </div>
        </div>
      )}

      <div className="suggestions-content">
        {totalSuggestions === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No {filter === 'all' ? '' : filter} suggestions</h3>
            <p>The curator hasn't generated any suggestions yet.</p>
          </div>
        ) : (
          <>
            {viewMode === 'tree' ? (
              <>
                {hasSubcollections && (
                  <div className="subcollections-section">
                    <h3>Suggested Subcollections</h3>
                    {hierarchicalData.subcollections.map(renderSubcollection)}
                  </div>
                )}
                
                {hasItems && (
                  <div className="items-section">
                    <h3>Individual Items</h3>
                    {hierarchicalData.items.map(renderStandaloneItem)}
                  </div>
                )}
              </>
            ) : (
              <div className="flat-view">
                {[...hierarchicalData.subcollections, ...hierarchicalData.items]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(item => 
                    item.nested_items ? renderSubcollection(item) : renderStandaloneItem(item)
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HierarchicalSuggestions;