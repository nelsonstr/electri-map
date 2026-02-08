// Emergency Response Module Index
// Phase 1: Core Infrastructure
// Export all emergency components and services

// Components
export { IncidentList } from './incident-list'
export { IncidentReportForm } from './incident-report-form'
export { CommandCenterDashboard } from './command-center-dashboard'

// Services (for direct imports)
export { 
  createIncident,
  getIncidentById,
  getIncidentByNumber,
  listIncidents,
  updateIncident,
  updateIncidentStatus,
  addTimelineEvent,
  assignIncidentCommander,
  addAgencyToIncident,
  getActiveIncidentsCount,
  searchIncidents,
  getIncidentsNearLocation,
  subscribeToIncidents
} from '@/lib/services/emergency/incident-service'

// Types
export type {
  EmergencyIncident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentFilters,
  IncidentStatus,
  IncidentSeverity,
  Location,
  TimelineEvent,
  StatusHistory
} from '@/types/emergency'
