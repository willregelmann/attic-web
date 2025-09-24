import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import './CuratorConfig.css';

// GraphQL queries and mutations
const GET_CURATOR = gql`
  query GetCollectionCurator($collectionId: ID!) {
    collectionCurator(collection_id: $collectionId) {
      id
      name
      description
      status
      curator_config
      schedule_type
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
    $name: String!
    $description: String
    $curatorConfig: JSON!
    $scheduleType: String
    $autoApprove: Boolean
    $confidenceThreshold: Int
  ) {
    createCurator(
      collection_id: $collectionId
      name: $name
      description: $description
      curator_config: $curatorConfig
      schedule_type: $scheduleType
      auto_approve: $autoApprove
      confidence_threshold: $confidenceThreshold
    ) {
      id
      name
      status
    }
  }
`;

const UPDATE_CURATOR = gql`
  mutation UpdateCurator(
    $id: ID!
    $name: String
    $description: String
    $curatorConfig: JSON
    $scheduleType: String
    $autoApprove: Boolean
    $confidenceThreshold: Int
  ) {
    updateCurator(
      id: $id
      name: $name
      description: $description
      curator_config: $curatorConfig
      schedule_type: $scheduleType
      auto_approve: $autoApprove
      confidence_threshold: $confidenceThreshold
    ) {
      id
      name
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
    name: `${collectionName} Curator`,
    description: '',
    personality: '',
    rules: [''],
    aiModel: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    scheduleType: 'manual',
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
        name: curator.name,
        description: curator.description || '',
        personality: curator.curator_config.personality || '',
        rules: curator.curator_config.rules || [''],
        aiModel: curator.curator_config.ai_model || 'claude-3-sonnet-20240229',
        temperature: curator.curator_config.temperature || 0.7,
        scheduleType: curator.schedule_type,
        autoApprove: curator.auto_approve,
        confidenceThreshold: curator.confidence_threshold,
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const curatorConfig = {
      personality: formData.personality,
      rules: formData.rules.filter(r => r.trim() !== ''),
      ai_model: formData.aiModel,
      temperature: formData.temperature,
    };

    try {
      if (data?.collectionCurator) {
        await updateCurator({
          variables: {
            id: data.collectionCurator.id,
            name: formData.name,
            description: formData.description,
            curatorConfig,
            scheduleType: formData.scheduleType,
            autoApprove: formData.autoApprove,
            confidenceThreshold: formData.confidenceThreshold,
          },
        });
      } else {
        await createCurator({
          variables: {
            collectionId,
            name: formData.name,
            description: formData.description,
            curatorConfig,
            scheduleType: formData.scheduleType,
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

  const addRule = () => {
    setFormData({ ...formData, rules: [...formData.rules, ''] });
  };

  const updateRule = (index, value) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData({ ...formData, rules: newRules });
  };

  const removeRule = (index) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData({ ...formData, rules: newRules });
  };

  if (loading) return <div>Loading curator configuration...</div>;

  const curator = data?.collectionCurator;

  if (!isEditing && !curator) {
    return (
      <div className="curator-setup">
        <h3>AI Curator</h3>
        <p>Set up an AI curator to automatically suggest items for this collection.</p>
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
            <label>Curator Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this curator should focus on..."
            />
          </div>

          <div className="form-group">
            <label>Curator Personality</label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="E.g., 'An expert Pokemon card collector focusing on competitive play...'"
              required
            />
          </div>

          <div className="form-group">
            <label>Curation Rules</label>
            {formData.rules.map((rule, index) => (
              <div key={index} className="rule-input">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(index, e.target.value)}
                  placeholder="E.g., 'Only include cards from Standard format'"
                />
                <button type="button" onClick={() => removeRule(index)}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addRule}>Add Rule</button>
          </div>

          <div className="form-group">
            <label>AI Model</label>
            <select
              value={formData.aiModel}
              onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
            >
              <option value="claude-3-opus-20240229">Claude 3 Opus (Best quality)</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Balanced)</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast & cheap)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Schedule</label>
            <select
              value={formData.scheduleType}
              onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
            >
              <option value="manual">Manual Only</option>
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
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
          </div>

          {formData.autoApprove && (
            <div className="form-group">
              <label>Confidence Threshold</label>
              <input
                type="range"
                min="50"
                max="100"
                value={formData.confidenceThreshold}
                onChange={(e) => setFormData({ ...formData, confidenceThreshold: parseInt(e.target.value) })}
              />
              <span>{formData.confidenceThreshold}%</span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Configuration</button>
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
      <h3>AI Curator: {curator.name}</h3>
      <div className="curator-info">
        <p className={`status ${curator.status}`}>
          Status: <strong>{curator.status}</strong>
        </p>
        {curator.description && <p>{curator.description}</p>}
        
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
        </div>

        <div className="curator-actions">
          <button 
            onClick={handleToggleStatus} 
            className={`btn ${curator.status === 'active' ? 'btn-danger' : 'btn-success'}`}
          >
            {curator.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          
          <button onClick={handleRunNow} className="btn btn-primary">
            Run Now
          </button>
          
          <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
            Edit Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuratorConfig;