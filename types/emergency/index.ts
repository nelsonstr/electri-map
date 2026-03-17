// Emergency Response System Type Exports
// All emergency types re-exported for convenient importing

export * from './incident'
export * from './resource'
export * from './alert'
export * from './coordination'

// Additional convenience exports

export type {
  EmergencyIncident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentFilters,
  IncidentEventType
} from './incident'

export type {
  EmergencyResource,
  CreateResourceInput,
  UpdateResourceInput,
  ResourceAllocation,
  ResourceFilters,
  ResourceEventType
} from './resource'

export type {
  EmergencyAlert,
  CreateAlertInput,
  UpdateAlertInput,
  CitizenAlertSubscription,
  AlertFilters,
  AlertEventType,
  CAPMessage,
  CAPInfo,
  CAPArea
} from './alert'

export type {
  Agency,
  CommunicationLog,
  JointOperationsCenter,
  MutualAidRequest,
  ResourceRequest,
  AgencyFilters,
  CommunicationFilters,
  CoordinationEventType
} from './coordination'

// Common enums for easy access
export type { 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus, 
  IncidentPriority 
} from './incident'

export type { 
  ResourceType, 
  ResourceStatus 
} from './resource'

export type { 
  AlertType, 
  AlertSeverity, 
  AlertStatus, 
  AlertChannel 
} from './alert'

export type { 
  AgencyType, 
  AgencyStatus, 
  CoordinationRole, 
  CommunicationType 
} from './coordination'
