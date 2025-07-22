import React, { useState } from 'react'
import { ExternalLink, Play, Square, Trash2, MoreVertical, Database, Clock } from 'lucide-react'

const ProjectCard = ({ instance, onStart, onStop, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--supabase-green)' }} />
      case 'stopped':
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#666' }} />
      case 'partial':
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffc107' }} />
      default:
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#666' }} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Online'
      case 'stopped':
        return 'Stopped'
      case 'partial':
        return 'Starting'
      default:
        return 'Unknown'
    }
  }

  const handleAction = async (action) => {
    setLoading(true)
    setShowMenu(false)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--supabase-green)" />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{instance.name}</h3>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--supabase-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              background: 'var(--supabase-bg-light)',
              border: '1px solid var(--supabase-border)',
              borderRadius: '6px',
              padding: '4px',
              minWidth: '120px',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <button
                onClick={() => handleAction(onDelete)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        {getStatusIcon(instance.status)}
        <span className={`status status-${instance.status}`}>
          {getStatusText(instance.status)}
        </span>
      </div>

      {/* Details */}
      <div style={{
        fontSize: '14px',
        color: 'var(--supabase-text-muted)',
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        <div>Port: {instance.port}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          {formatDate(instance.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {instance.status === 'running' ? (
          <>
            <a
              href={instance.studio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              Open Studio
            </a>
            <button
              onClick={() => handleAction(onStop)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              <Square size={14} />
              Stop
            </button>
          </>
        ) : (
          <button
            onClick={() => handleAction(onStart)}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Starting...
              </>
            ) : (
              <>
                <Play size={14} />
                Start
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div className="spinner"></div>
          <span style={{ fontSize: '14px' }}>Processing...</span>
        </div>
      )}
    </div>
  )
}

export default ProjectCard