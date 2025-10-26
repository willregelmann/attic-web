import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import './SuggestionReview.css';

const GET_SUGGESTIONS = gql`
  query GetCuratorSuggestions($collectionId: ID!, $status: String) {
    curatorSuggestions(collection_id: $collectionId, status: $status) {
      id
      action_type
      item_id
      item {
        id
        name
        metadata
      }
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

const REVIEW_SUGGESTION = gql`
  mutation ReviewSuggestion(
    $id: ID!
    $action: String!
    $notes: String
    $executeNow: Boolean
  ) {
    reviewSuggestion(
      id: $id
      action: $action
      notes: $notes
      execute_now: $executeNow
    ) {
      id
      status
      reviewed_at
    }
  }
`;

const SuggestionReview = ({ collectionId }) => {
  const [filter, setFilter] = useState('pending');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, loading, refetch } = useQuery(GET_SUGGESTIONS, {
    variables: { collectionId, status: filter === 'all' ? null : filter },
  });

  const [reviewSuggestion] = useMutation(REVIEW_SUGGESTION);

  const handleReview = async (suggestionId, action, notes = '') => {
    try {
      await reviewSuggestion({
        variables: {
          id: suggestionId,
          action,
          notes,
          executeNow: true,
        },
      });
      await refetch();
      setSelectedSuggestions([]);
      setReviewNotes('');
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
      alert('Failed to review suggestion');
    }
  };

  const handleBulkReview = async (action) => {
    if (selectedSuggestions.length === 0) {
      alert('Please select suggestions to review');
      return;
    }

    for (const id of selectedSuggestions) {
      await handleReview(id, action, reviewNotes);
    }
  };

  const toggleSelection = (id) => {
    if (selectedSuggestions.includes(id)) {
      setSelectedSuggestions(selectedSuggestions.filter(s => s !== id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, id]);
    }
  };

  const selectAllPending = () => {
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    setSelectedSuggestions(pendingSuggestions.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSuggestions([]);
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'add_item': return 'Add';
      case 'remove_item': return 'Remove';
      case 'reorder': return 'Reorder';
      default: return actionType;
    }
  };

  if (loading) return <div>Loading suggestions...</div>;

  const suggestions = data?.curatorSuggestions || [];

  return (
    <div className="suggestion-review">
      <div className="review-header">
        <h3>Curator Suggestions</h3>
        
        <div className="filter-tabs">
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({suggestions.filter(s => s.status === 'pending').length})
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
      </div>

      {suggestions.length === 0 ? (
        <p>No {filter === 'all' ? '' : filter} suggestions</p>
      ) : (
        <>
          {filter === 'pending' && suggestions.length > 0 && (
            <div className="bulk-actions">
              <div className="selection-controls">
                <button
                  onClick={selectAllPending}
                  className="btn btn-secondary btn-sm"
                >
                  Select All ({suggestions.filter(s => s.status === 'pending').length})
                </button>
                <button
                  onClick={deselectAll}
                  className="btn btn-secondary btn-sm"
                  disabled={selectedSuggestions.length === 0}
                >
                  Deselect All
                </button>
              </div>
              <input
                type="text"
                placeholder="Add review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <button
                onClick={() => handleBulkReview('approve')}
                className="btn btn-success"
                disabled={selectedSuggestions.length === 0}
              >
                Approve Selected ({selectedSuggestions.length})
              </button>
              <button
                onClick={() => handleBulkReview('reject')}
                className="btn btn-danger"
                disabled={selectedSuggestions.length === 0}
              >
                Reject Selected ({selectedSuggestions.length})
              </button>
            </div>
          )}

          <div className="suggestions-list">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className={`suggestion-card ${suggestion.status}`}>
                {filter === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.includes(suggestion.id)}
                    onChange={() => toggleSelection(suggestion.id)}
                  />
                )}
                
                <div className="suggestion-content">
                  <div className="suggestion-header">
                    <span className={`action-type ${suggestion.action_type}`}>
                      {getActionLabel(suggestion.action_type)}
                    </span>
                    <span className={`confidence-score ${getConfidenceColor(suggestion.confidence_score)}`}>
                      {suggestion.confidence_score}% confidence
                    </span>
                  </div>

                  <div className="suggestion-details">
                    <h4>{suggestion.suggestion_data.item_name || 'Unknown Item'}</h4>
                    <p className="reasoning">{suggestion.reasoning}</p>
                    
                    {suggestion.suggestion_data.supporting_data && (
                      <div className="supporting-data">
                        {Object.entries(suggestion.suggestion_data.supporting_data).map(([key, value]) => (
                          <span key={key} className="data-point">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {suggestion.status === 'pending' && !selectedSuggestions.includes(suggestion.id) && (
                    <div className="suggestion-actions">
                      <button 
                        onClick={() => handleReview(suggestion.id, 'approve')}
                        className="btn btn-success btn-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReview(suggestion.id, 'reject')}
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {suggestion.status !== 'pending' && (
                    <div className="review-info">
                      <span className="status-badge">{suggestion.status}</span>
                      {suggestion.reviewed_at && (
                        <span className="reviewed-date">
                          Reviewed: {new Date(suggestion.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                      {suggestion.review_notes && (
                        <p className="review-notes">Notes: {suggestion.review_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SuggestionReview;