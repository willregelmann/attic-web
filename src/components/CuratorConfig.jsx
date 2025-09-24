import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import './CuratorConfig.css';

// GraphQL queries and mutations
const GET_CURATOR = gql`
  query GetCollectionCurator($collectionId: ID!) {
    collectionCurator(collection_id: $collectionId) {
      id
      prompt
      status
      auto_approve
      confidence_threshold
      suggestions_made
      suggestions_approved
      suggestions_rejected
      last_run_at
      next_run_at
    }
  }
`;

const CREATE_CURATOR = gql`
  mutation CreateCurator(
    $collectionId: ID!
    $prompt: String!
    $autoApprove: Boolean
    $confidenceThreshold: Int
  ) {
    createCurator(
      collection_id: $collectionId
      prompt: $prompt
      auto_approve: $autoApprove
      confidence_threshold: $confidenceThreshold
    ) {
      id
      prompt
      status
    }
  }
`;

const UPDATE_CURATOR = gql`
  mutation UpdateCurator(
    $id: ID!
    $prompt: String
    $autoApprove: Boolean
    $confidenceThreshold: Int
  ) {
    updateCurator(
      id: $id
      prompt: $prompt
      auto_approve: $autoApprove
      confidence_threshold: $confidenceThreshold
    ) {
      id
      prompt
      status
    }
  }
`;

const TOGGLE_CURATOR_STATUS = gql`
  mutation ToggleCuratorStatus($id: ID!) {
    toggleCuratorStatus(id: $id) {
      id
      status
    }
  }
`;

const RUN_CURATOR = gql`
  mutation RunCurator($id: ID!) {
    runCurator(id: $id) {
      success
      message
    }
  }
`;

const CuratorConfig = ({ collectionId, collectionName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    autoApprove: false,
    confidenceThreshold: 80,
  });

  const { data, loading, refetch } = useQuery(GET_CURATOR, {
    variables: { collectionId },
  });

  const [createCurator] = useMutation(CREATE_CURATOR);
  const [updateCurator] = useMutation(UPDATE_CURATOR);
  const [toggleStatus] = useMutation(TOGGLE_CURATOR_STATUS);
  const [runCurator] = useMutation(RUN_CURATOR);

  useEffect(() => {
    if (data?.collectionCurator) {
      const curator = data.collectionCurator;
      setFormData({
        prompt: curator.prompt,
        autoApprove: curator.auto_approve,
        confidenceThreshold: curator.confidence_threshold,
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (data?.collectionCurator) {
        await updateCurator({
          variables: {
            id: data.collectionCurator.id,
            prompt: formData.prompt,
            autoApprove: formData.autoApprove,
            confidenceThreshold: formData.confidenceThreshold,
          },
        });
      } else {
        await createCurator({
          variables: {
            collectionId,
            prompt: formData.prompt,
            autoApprove: formData.autoApprove,
            confidenceThreshold: formData.confidenceThreshold,
          },
        });
      }
      await refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving curator:', error);
      alert('Failed to save curator configuration');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatus({
        variables: { id: data.collectionCurator.id },
      });
      await refetch();
    } catch (error) {
      console.error('Error toggling curator status:', error);
    }
  };

  const handleRunNow = async () => {
    try {
      const result = await runCurator({
        variables: { id: data.collectionCurator.id },
      });
      alert(result.data.runCurator.message);
    } catch (error) {
      console.error('Error running curator:', error);
      alert('Failed to run curator');
    }
  };

  if (loading) return <div>Loading curator configuration...</div>;

  const curator = data?.collectionCurator;

  if (!isEditing && !curator) {
    return (
      <div className="curator-setup">
        <h3>AI Curator</h3>
        <p>Set up an AI curator to automatically suggest items for this collection daily.</p>
        <button onClick={() => setIsEditing(true)} className="btn btn-primary">
          Setup AI Curator
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="curator-config">
        <h3>{curator ? 'Edit' : 'Setup'} AI Curator</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Curator Instructions</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder={`Describe what this curator should do. For example:

"You are curating a Pokemon TCG collection. Focus on:
- Competitive playability in Standard format
- Cards from recent sets (Sword & Shield onwards)
- Key trainer cards and energy cards
- Pokemon with strong abilities or attacks
- Prioritize cards seeing play in tournament-winning decks"`}
              required
              rows="10"
              style={{ width: '100%', fontFamily: 'monospace' }}
            />
            <small className="form-help">
              The AI will use these instructions to suggest items to add or remove from your collection.
              Be specific about what you want the curator to focus on.
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.autoApprove}
                onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
              />
              Auto-approve high confidence suggestions
            </label>
            <small className="form-help">
              When enabled, suggestions with confidence above the threshold will be automatically applied.
            </small>
          </div>

          {formData.autoApprove && (
            <div className="form-group">
              <label>Confidence Threshold: {formData.confidenceThreshold}%</label>
              <input
                type="range"
                min="50"
                max="100"
                value={formData.confidenceThreshold}
                onChange={(e) => setFormData({ ...formData, confidenceThreshold: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <small className="form-help">
                Only suggestions with confidence above {formData.confidenceThreshold}% will be auto-approved.
              </small>
            </div>
          )}

          <div className="form-info">
            <p><strong>Schedule:</strong> The curator will run automatically once per day.</p>
            <p><strong>AI Model:</strong> Using the latest Claude model configured on the server.</p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {curator ? 'Save Changes' : 'Create Curator'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Display curator status
  return (
    <div className="curator-status">
      <h3>AI Curator Status</h3>
      <div className="curator-info">
        <p className={`status ${curator.status}`}>
          Status: <strong>{curator.status === 'active' ? 'Active' : 'Inactive'}</strong>
        </p>
        
        <div className="curator-prompt">
          <h4>Instructions:</h4>
          <pre>{curator.prompt}</pre>
        </div>
        
        <div className="curator-stats">
          <div className="stat">
            <span className="label">Suggestions Made:</span>
            <span className="value">{curator.suggestions_made}</span>
          </div>
          <div className="stat">
            <span className="label">Approved:</span>
            <span className="value">{curator.suggestions_approved}</span>
          </div>
          <div className="stat">
            <span className="label">Rejected:</span>
            <span className="value">{curator.suggestions_rejected}</span>
          </div>
          {curator.last_run_at && (
            <div className="stat">
              <span className="label">Last Run:</span>
              <span className="value">{new Date(curator.last_run_at).toLocaleString()}</span>
            </div>
          )}
          {curator.next_run_at && (
            <div className="stat">
              <span className="label">Next Run:</span>
              <span className="value">{new Date(curator.next_run_at).toLocaleString()}</span>
            </div>
          )}
          <div className="stat">
            <span className="label">Auto-approve:</span>
            <span className="value">{curator.auto_approve ? `Yes (>${curator.confidence_threshold}%)` : 'No'}</span>
          </div>
        </div>

        <div className="curator-actions">
          <button 
            onClick={handleToggleStatus} 
            className={`btn ${curator.status === 'active' ? 'btn-danger' : 'btn-success'}`}
          >
            {curator.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          
          <button 
            onClick={handleRunNow} 
            className="btn btn-primary"
            disabled={curator.status !== 'active'}
          >
            Run Now
          </button>
          
          <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
            Edit Instructions
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuratorConfig;