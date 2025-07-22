# Supabase Panel - Instance Manager

A simple web panel for managing multiple Supabase instances using the existing `generate.bash` script.

## Overview

This panel provides a Supabase Cloud-like interface for:
- Creating new Supabase instances
- Managing instance lifecycle (start/stop/delete)
- Monitoring instance status
- Direct access to Studio dashboard

## Architecture

- **Backend**: Node.js/Express API that manages instances and executes `generate.bash`
- **Frontend**: React SPA with Supabase-inspired design
- **Docker Integration**: Uses existing Docker Compose setup
- **Instance Isolation**: Each instance has unique ports, JWT secrets, and data volumes

## Features

### ✅ Instance Creation
- Executes `generate.bash` with unique parameters
- Generates JWT secrets for each instance
- Configures Kong Gateway with admin/admin credentials
- Uses VPS IP for external access

### ✅ Instance Management
- Start/Stop containers via Docker Compose
- Real-time status monitoring
- Complete instance deletion (containers + volumes + files)
- Port pool management (3000-9999)

### ✅ Visual Interface
- Supabase-like design and colors
- Project cards with status indicators
- Modal for creating new projects
- Direct Studio access links

## Setup Instructions

### 1. Backend Setup
```bash
cd panel/backend
npm install
npm start
```

The backend runs on port 5000 and provides REST API endpoints.

### 2. Frontend Setup
```bash
cd panel/frontend
npm install
npm run dev
```

The frontend runs on port 3000 with proxy to backend.

### 3. Access Panel
Open browser to: `http://localhost:3000`

## API Endpoints

### Instances
- `GET /api/instances` - List all instances with status
- `POST /api/instances` - Create new instance
- `POST /api/instances/:id/start` - Start instance
- `POST /api/instances/:id/stop` - Stop instance
- `DELETE /api/instances/:id` - Delete instance

### System
- `GET /api/info` - Server information

## Directory Structure

```
panel/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── api.js         # HTTP client
│   │   ├── components/    # UI components
│   │   └── index.css      # Supabase-like styling
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── data/
│   └── instances.json     # Instance registry
└── README.md
```

## Generated Instance Structure

Each instance creates:
- `docker-compose-{instance-id}.yml` - Docker Compose configuration
- `.env-{instance-id}` - Environment variables
- `volumes-{instance-id}/` - Data volumes (database, storage, etc.)

## Configuration

### Instance Settings
- **Ports**: Auto-assigned from pool (3000-9999)
- **JWT**: Unique secret per instance
- **Auth**: Kong Gateway with admin/admin
- **Database**: Isolated PostgreSQL per instance
- **Storage**: Local file system per instance

### Host IP Configuration
- Use `localhost` for local development
- Use VPS IP address for external access
- Configure in frontend when creating instances

## Usage Workflow

1. **Create Instance**: Click "New project" → Enter name and host IP → Create
2. **Access Studio**: Click "Open Studio" on running instances
3. **Manage Lifecycle**: Start/Stop instances as needed
4. **Clean Up**: Delete instances to remove all associated data

## Integration with generate.bash

The panel is a wrapper around the existing `generate.bash` script:
- Maintains full compatibility
- Preserves all original functionality
- Adds visual management layer
- No modifications to core script

## Default Credentials

- **Kong Gateway**: admin/admin (for all instances)
- **Database**: Generated passwords per instance
- **JWT**: Unique secrets per instance

## Security Notes

- Each instance has isolated JWT secrets
- Kong Gateway configured with basic auth
- Database passwords auto-generated
- No cross-instance data access

## Troubleshooting

### Instance Won't Start
- Check Docker is running
- Verify ports are available
- Check backend logs for errors

### Studio Access Issues
- Verify instance is running
- Check Kong Gateway configuration
- Ensure host IP is correct

### Backend Connection Failed
- Confirm backend is running on port 5000
- Check proxy configuration in Vite
- Verify API endpoints are accessible

## Next Steps

This panel provides the foundation for:
- Multi-tenancy management
- Resource monitoring
- Backup/restore functionality
- Configuration templates
- User access controls

The implementation is intentionally simple to maintain compatibility with the existing `generate.bash` workflow while providing a modern web interface.