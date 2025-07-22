import React, { useState } from 'react'
import { X, Database } from 'lucide-react'

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [projectName, setProjectName] = useState('')
  const [hostIp, setHostIp] = useState('82.25.69.57')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      await onSubmit(projectName.trim(), hostIp.trim())
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} />
            Create a new project
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--supabase-text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectName">Project name</label>
            <input
              id="projectName"
              type="text"
              className="form-control"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My awesome project"
              autoFocus
              disabled={creating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hostIp">Host IP Address</label>
            <input
              id="hostIp"
              type="text"
              className="form-control"
              value={hostIp}
              onChange={(e) => setHostIp(e.target.value)}
              placeholder="82.25.69.57"
              disabled={creating}
            />
            <small style={{
              color: 'var(--supabase-text-muted)',
              fontSize: '12px',
              marginTop: '4px',
              display: 'block'
            }}>
              Use your VPS IP address for external access
            </small>
          </div>

          <div style={{
            background: 'var(--supabase-bg)',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid var(--supabase-border)'
          }}>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Project details</h4>
            <div style={{ fontSize: '12px', color: 'var(--supabase-text-muted)' }}>
              <div>Region: VPS Local</div>
              <div>Database: PostgreSQL 15</div>
              <div>Auth: GoTrue with JWT</div>
              <div>Storage: Local file system</div>
              <div>Kong Gateway: admin/admin</div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(220, 53, 69, 0.1)',
              color: '#dc3545',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !projectName.trim()}
            >
              {creating ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                'Create project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal