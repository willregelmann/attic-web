import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_MY_API_TOKENS, CREATE_API_TOKEN, REVOKE_API_TOKEN } from '../queries';
import { isFormBusy } from '../utils/formUtils';
import './UserProfile.css';

function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const { data, loading, refetch } = useQuery(GET_MY_API_TOKENS, {
    fetchPolicy: 'network-only',
  });

  const [createToken, { loading: isCreatingToken }] = useMutation(CREATE_API_TOKEN, {
    onCompleted: (data) => {
      setGeneratedToken(data.createApiToken.plainTextToken);
      refetch();
    },
  });

  const [revokeToken] = useMutation(REVOKE_API_TOKEN, {
    onCompleted: () => {
      refetch();
    },
  });

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;
    
    try {
      await createToken({
        variables: {
          name: newTokenName,
          abilities: ['*'], // Full access for now
        },
      });
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Failed to create token');
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleRevokeToken = async (tokenId) => {
    if (window.confirm('Are you sure you want to revoke this token? This action cannot be undone.')) {
      try {
        await revokeToken({
          variables: { id: tokenId },
        });
      } catch (error) {
        console.error('Error revoking token:', error);
        alert('Failed to revoke token');
      }
    }
  };

  const closeTokenModal = () => {
    setShowNewTokenModal(false);
    setNewTokenName('');
    setGeneratedToken(null);
    setCopiedToken(false);
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <>
        <div className="profile-backdrop" onClick={handleClose} />
        <div className="profile-container">
          <p>Please log in to view your profile.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="profile-backdrop" onClick={handleClose} />
      <div className="profile-container">
        <div className="profile-header">
          <h1>User Profile</h1>
          <button className="profile-close-button" onClick={handleClose} aria-label="Close profile">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

      <div className="profile-section">
        <h2>Account Information</h2>
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{user.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          {user.picture && (
            <div className="info-row">
              <span className="info-label">Avatar:</span>
              <img src={user.picture} alt={user.name} className="profile-avatar" loading="lazy" />
            </div>
          )}
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header">
          <h2>API Tokens</h2>
          <button
            className="btn-primary"
            onClick={() => setShowNewTokenModal(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create New Token
          </button>
        </div>

        <div className="tokens-description">
          <p>API tokens allow you to access the Attic API programmatically. Each token acts as your authentication credentials.</p>
        </div>

        {loading ? (
          <p>Loading tokens...</p>
        ) : (
          <div className="tokens-list">
            {data?.myApiTokens?.length === 0 ? (
              <p className="no-tokens">No API tokens yet. Create one to get started.</p>
            ) : (
              <table className="tokens-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created</th>
                    <th>Last Used</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.myApiTokens?.map((token) => (
                    <tr key={token.id}>
                      <td className="token-name">{token.name}</td>
                      <td>{new Date(token.created_at).toLocaleDateString()}</td>
                      <td>{token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}</td>
                      <td>{token.expires_at ? new Date(token.expires_at).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => handleRevokeToken(token.id)}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>

      {/* New Token Modal */}
      {showNewTokenModal && (
        <div className="modal-overlay" onClick={closeTokenModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{generatedToken ? 'Token Created Successfully' : 'Create New API Token'}</h2>
              <button className="modal-close" onClick={closeTokenModal}>
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {!generatedToken ? (
              <>
                <div className="modal-body">
                  <p>Give your token a descriptive name to help you remember what it's used for.</p>
                  <div className="form-group">
                    <label htmlFor="token-name">Token Name</label>
                    <input
                      id="token-name"
                      type="text"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="e.g., Mobile App, CLI Tool"
                      className="form-input"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeTokenModal}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleCreateToken}
                    disabled={!newTokenName.trim() || isFormBusy(isCreatingToken)}
                  >
                    Create Token
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-body">
                  <div className="token-warning">
                    <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                      <path d="M12 9v4M12 17h.01M12 2l10 17H2L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>
                      <strong>Important:</strong> This is the only time you'll see this token. 
                      Make sure to copy it now and store it securely.
                    </p>
                  </div>
                  <div className="token-display">
                    <code className="token-value">{generatedToken}</code>
                    <button
                      className="btn-copy"
                      onClick={handleCopyToken}
                      title="Copy to clipboard"
                    >
                      {copiedToken ? (
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="token-usage">
                    <h3>How to use this token:</h3>
                    <p>Include it in your API requests using one of these methods:</p>
                    <ul>
                      <li><strong>Authorization Header:</strong> <code>Bearer {'{token}'}</code></li>
                      <li><strong>X-API-Token Header:</strong> <code>{'{token}'}</code></li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-primary" onClick={closeTokenModal}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfile;