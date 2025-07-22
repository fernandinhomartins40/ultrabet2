import React, { useState, useEffect } from 'react'
import { Plus, Database, ExternalLink, Play, Square, Trash2, MoreVertical } from 'lucide-react'
import api from './api'
import CreateProjectModal from './components/CreateProjectModal'
import ProjectCard from './components/ProjectCard'

function App() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    try {
      setLoading(true)
      const response = await api.get('/instances')
      setInstances(response.data)
    } catch (error) {
      console.error('Error loading instances:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async (name, hostIp) => {
    try {
      const response = await api.post('/instances', { name, hostIp })
      setInstances([...instances, response.data])
      setShowCreateModal(false)
      return response.data
    } catch (error) {
      console.error('Error creating instance:', error)
      throw error
    }
  }

  const startInstance = async (instanceId) => {
    try {
      await api.post(`/instances/${instanceId}/start`)
      loadInstances() // Refresh to get updated status
    } catch (error) {
      console.error('Error starting instance:', error)
    }
  }

  const stopInstance = async (instanceId) => {
    try {
      await api.post(`/instances/${instanceId}/stop`)
      loadInstances() // Refresh to get updated status
    } catch (error) {
      console.error('Error stopping instance:', error)
    }
  }

  const deleteInstance = async (instanceId) => {
    try {
      await api.delete(`/instances/${instanceId}`)
      setInstances(instances.filter(i => i.id !== instanceId))
    } catch (error) {
      console.error('Error deleting instance:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--supabase-bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--supabase-bg-light)',
        borderBottom: '1px solid var(--supabase-border)',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={24} color="var(--supabase-green)" />
            <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Supabase Manager</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              New project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '12px'
          }}>
            <div className="spinner"></div>
            <span>Loading projects...</span>
          </div>
        ) : instances.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--supabase-text-muted)'
          }}>
            <Database size={48} style={{ margin: '0 auto 16px' }} />
            <h2>No projects yet</h2>
            <p>Create your first Supabase instance to get started</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ marginTop: '16px' }}
            >
              <Plus size={16} />
              Create project
            </button>
          </div>
        ) : (
          <div className="instances-grid">
            {instances.map(instance => (
              <ProjectCard
                key={instance.id}
                instance={instance}
                onStart={() => startInstance(instance.id)}
                onStop={() => stopInstance(instance.id)}
                onDelete={() => deleteInstance(instance.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createInstance}
        />
      )}
    </div>
  )
}

export default App