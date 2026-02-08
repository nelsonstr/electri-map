

---

## 10. Implementation Strategy

This section provides comprehensive guidance for developers implementing NeighborPulse user stories. It establishes consistent patterns, workflows, and best practices that ensure code quality, maintainability, and efficient development across all features.

### 10.1 Codebase Architecture

#### 10.1.1 Folder Structure

The NeighborPulse project follows a feature-based folder structure that organizes code by domain functionality rather than file type. This approach improves code discoverability, reduces coupling between features, and makes it easier to understand and modify feature-specific code.

**Root Directory Structure:**

```
neighborpulse/
├── app/                    # Next.js 14 App Router pages and layouts
│   ├── [locale]/          # Localization routing (i18n)
│   │   ├── about/
│   │   ├── blog/
│   │   ├── issues/
│   │   ├── privacy/
│   │   ├── statistics/
│   │   └── backoffice/    # Admin/backoffice features
│   └── api/               # API routes
│       ├── emergency/
│       ├── escalation/
│       ├── incidents/
│       ├── locations/
│       └── ...
├── components/            # React components organized by feature
│   ├── ui/              # Shared UI components (shadcn/ui)
│   ├── emergency/       # Emergency-related components
│   ├── civic/           # Civic engagement components
│   ├── escalation/      # Escalation system components
│   ├── incidents/       # Incident management components
│   ├── maintenance/     # Maintenance scheduling components
│   └── resources/       # Resource management components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
│   ├── services/       # Business logic services
│   ├── supabase/       # Supabase client configuration
│   ├── i18n/          # Internationalization utilities
│   └── analytics.ts    # Analytics utilities
├── types/              # TypeScript type definitions
├── messages/           # i18n message files
├── supabase/           # Supabase migrations and configurations
└── docs/              # Documentation
```

**Feature Module Structure:**

When implementing new features, create a consistent module structure following this pattern:

```
components/feature-name/
├── component-a.tsx          # Main component
├── component-a.test.tsx     # Unit tests
├── component-b.tsx          # Secondary component
├── component-b.test.tsx
├── index.ts                 # Public exports
└── types.ts                 # Feature-specific types

lib/services/feature-name/
├── service-a.ts             # Business logic service
├── service-a.test.ts
├── service-b.ts
└── index.ts                 # Public exports

app/[locale]/feature-name/
├── page.tsx                 # Main page
├── layout.tsx               # Page layout (if needed)
└── components/              # Page-specific components
```

This structure ensures that everything related to a feature is co-located, making it easier to understand, test, and maintain. Components, services, types, and tests stay together, reducing the cognitive load when working on specific features.

#### 10.1.2 Component Patterns

NeighborPulse uses a layered component architecture that separates presentation from business logic. Components are categorized into three types based on their responsibilities.

**Presentational Components:**

Presentational components focus solely on rendering UI and receiving data through props. They do not contain business logic, data fetching, or state management. These components are highly reusable and easily testable because their behavior is purely a function of their inputs. All presentational components should be written as functional components using TypeScript with explicit prop types.

```tsx
// components/emergency/sos-button.tsx
import { Button } from '@/components/ui/button'
import { SOSButtonProps } from './types'

export function SOSButton({ 
  onActivate, 
  disabled, 
  loading 
}: SOSButtonProps) {
  return (
    <Button
      variant="destructive"
      size="lg"
      className="w-full h-16 text-xl font-bold animate-pulse"
      onClick={onActivate}
      disabled={disabled || loading}
      aria-label="Activate Emergency SOS"
    >
      {loading ? 'Activating...' : 'SOS EMERGENCY'}
    </Button>
  )
}
```

**Container Components:**

Container components handle data fetching, state management, and pass data to presentational components. They serve as the bridge between the service layer and the UI layer, orchestrating the data flow and managing the component lifecycle. Container components should be minimal, delegating rendering logic entirely to presentational components.

```tsx
// components/emergency/sos-button-container.tsx
'use client'

import { useState, useCallback } from 'react'
import { SOSButton } from './sos-button'
import { useSOSActivation } from '@/hooks/use-sos-activation'
import { useToast } from '@/hooks/use-toast'

export function SOSButtonContainer() {
  const [loading, setLoading] = useState(false)
  const { activateSOS } = useSOSActivation()
  const { toast } = useToast()

  const handleActivate = useCallback(async () => {
    setLoading(true)
    try {
      await activateSOS()
      toast({ title: 'SOS Activated', variant: 'destructive' })
    } catch (error) {
      toast({ title: 'Failed to activate SOS', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activateSOS, toast])

  return <SOSButton onActivate={handleActivate} loading={loading} />
}
```

**Shared UI Components:**

Shared UI components are generic, reusable components that implement design system patterns. These components live in the `components/ui` directory and are built on top of shadcn/ui. All shared components should be accessible, responsive, and themable. They should not contain feature-specific business logic.

```tsx
// components/ui/data-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
}

export function DataCard({ title, value, description, icon }: DataCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

**Component Composition Guidelines:**

Components should be composed rather than extended. Instead of creating variants through inheritance, use composition to combine smaller components into larger ones. This approach promotes reusability and makes it easier to test individual pieces in isolation.

#### 10.1.3 Service Layer Patterns

The service layer encapsulates all business logic and data access operations. Services are organized by domain and follow a consistent pattern that separates concerns and promotes testability. The service layer is the single source of truth for all business operations, ensuring consistent behavior across the application.

**Service File Structure:**

```typescript
// lib/services/emergency/incident-service.ts

// Imports - always use absolute imports from @/lib/supabase
import { createClient } from '@/lib/supabase/server'
import type { 
  EmergencyIncident, 
  CreateIncidentInput, 
  IncidentFilters 
} from '@/types/emergency'

// ============================================================================
// Section Organization
// ============================================================================
// Use section headers to organize related functions
// ============================================================================

export async function createIncident(input: CreateIncidentInput): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  // Implementation with proper error handling
  const { data, error } = await supabase
    .rpc('create_emergency_incident', { /* params */ })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

export async function listIncidents(filters?: IncidentFilters): Promise<EmergencyIncident[]> {
  // Implementation
}

// ============================================================================
// Helper Functions (private, but not using private keyword for testing)
// ============================================================================

export function mapIncidentRow(row: Record<string, unknown>): EmergencyIncident {
  // Mapping logic
}
```

**Service Layer Principles:**

The service layer follows several key principles that ensure maintainability and consistency. First, each service should have a single responsibility, focusing on one domain area. Second, all database operations should go through the service layer, never directly from components. Third, services should handle errors consistently, throwing descriptive errors that can be caught and handled appropriately. Fourth, all service functions should be async and return promises, enabling proper error handling and allowing for future caching or memoization.

**Error Handling Pattern:**

```typescript
export async function getIncidentById(id: string): Promise<EmergencyIncident | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('emergency.incidents')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    // Handle "not found" case specifically
    if (error.code === 'PGRST116') {
      return null
    }
    // Throw for other errors
    throw new Error(`Failed to get incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}
```

#### 10.1.4 Hook Patterns

Custom hooks encapsulate reusable stateful logic and provide a clean API for components to interact with complex functionality. Hooks should follow the Rules of React and only be called from functional components or other hooks.

**Hook Organization:**

```typescript
// hooks/use-sos-activation.ts
import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SOSLocation, MedicalTriageData } from '@/types/emergency'

export function useSOSActivation() {
  const supabase = createClient()

  const activateSOS = useCallback(async (location?: SOSLocation) => {
    // Implementation
  }, [])

  const sendMedicalSOS = useCallback(async (
    triageData: MedicalTriageData,
    location?: SOSLocation
  ) => {
    // Implementation
  }, [])

  return {
    activateSOS,
    sendMedicalSOS,
    // Export related functions together
  }
}
```

**Hook Composition Pattern:**

When hooks share functionality, compose them rather than duplicating logic:

```typescript
// hooks/use-incidents.ts
export function useIncidents(filters?: IncidentFilters) {
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchIncidents() {
      try {
        setLoading(true)
        const data = await incidentService.listIncidents(filters)
        setIncidents(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [filters])

  return { incidents, loading, error, refetch: fetchIncidents }
}
```

#### 10.1.5 TypeScript Conventions

TypeScript is the primary language for NeighborPulse, providing type safety and improving code documentation. All TypeScript code should follow consistent conventions that maximize the benefits of static typing.

**Type Definition Organization:**

```typescript
// types/emergency/index.ts

// Re-export all types from sub-modules
export * from './incident'
export * from './sos'
export * from './medical'

// Shared types
export interface GeoLocation {
  latitude: number
  longitude: number
  address?: string
  city?: string
  municipality?: string
  district?: string
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'detected' | 'responding' | 'contained' | 'resolved' | 'closed'
```

**Interface vs Type Alias:**

Use interfaces for object types that may be extended or implemented, and type aliases for unions, intersections, and primitive types. This distinction helps maintainers understand the intended usage of each type definition.

```typescript
// Use interfaces for extensible objects
export interface EmergencyIncident {
  id: string
  incidentNumber: string
  title: string
  incidentType: string
  severity: IncidentSeverity
  status: IncidentStatus
  location: GeoLocation | null
  detectedAt: Date
  // ...
}

// Use type aliases for unions and primitives
export type IncidentFilters = {
  status?: IncidentStatus[]
  severity?: IncidentSeverity[]
  dateFrom?: Date
  dateTo?: Date
  boundingBox?: BoundingBox
  limit?: number
  offset?: number
}
```

**Generic Constraints:**

Use generics to create reusable, type-safe utilities while maintaining specificity where needed:

```typescript
export function useQuery<T>(
  queryKey: string[], 
  queryFn: () => Promise<T>
): { data: T | undefined; loading: boolean; error: Error | null } {
  // Implementation with generic type
}
```

### 10.2 Development Standards

#### 10.2.1 Code Style Guidelines

Consistent code style is essential for maintainability. The NeighborPulse project uses ESLint and Prettier for automated code formatting and style enforcement. All code must pass linting checks before being committed.

**Naming Conventions:**

Variables and functions should use camelCase, with descriptive names that indicate purpose. Constants should use UPPER_SNAKE_CASE. Components should use PascalCase. Files containing default exports should match the exported name.

```typescript
// Variables and functions - camelCase
const incidentList: EmergencyIncident[] = []
function getActiveIncidents(): Promise<EmergencyIncident[]>

// Constants - UPPER_SNAKE_CASE
const MAX_INCIDENTS_PER_PAGE = 50
const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = { ... }

// Components - PascalCase
function EmergencyDashboard(): JSX.Element { ... }

// File names - kebab-case for utilities, PascalCase for components
// use-mobile.tsx, emergency-dashboard.tsx
```

**Function Design:**

Functions should be small, focused, and do one thing well. Use explicit return types for exported functions and complex internal functions. Prefer arrow functions for anonymous functions, but use function declarations for named functions that are called recursively.

```typescript
// Well-structured function
export async function createIncident(
  input: CreateIncidentInput
): Promise<EmergencyIncident> {
  validateCreateInput(input)
  
  const incident = await incidentRepository.create(input)
  await eventBus.publish('incident.created', { incident })
  
  return incident
}

// Avoid: Too many parameters, complex nested logic
// Avoid: Implicit returns for complex functions
```

**Early Returns and Guard Clauses:**

Use early returns to handle error conditions and edge cases at the beginning of functions. This reduces nesting and makes the main logic flow more visible.

```typescript
export async function processIncidentUpdate(
  id: string, 
  updates: UpdateIncidentInput
): Promise<EmergencyIncident> {
  // Guard clauses first
  if (!id) {
    throw new Error('Incident ID is required')
  }
  
  if (updates.status === 'closed' && !canCloseIncident(updates)) {
    throw new Error('Incident cannot be closed in current state')
  }
  
  // Main logic with reduced nesting
  const incident = await getIncidentById(id)
  const updated = applyUpdates(incident, updates)
  
  return saveIncident(updated)
}
```

#### 10.2.2 Testing Requirements

All new code must include appropriate test coverage. The testing pyramid guides the distribution of test types, with unit tests forming the foundation and integration and E2E tests providing coverage for critical paths.

**Unit Test Structure:**

Unit tests follow the Arrange-Act-Assert pattern, with clear separation between test setup, execution, and verification:

```typescript
// lib/services/emergency/incident-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createIncident } from './incident-service'
import { createMockSupabase } from '@/test-utils/mock-supabase'

describe('createIncident', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    vi.spyOn(supabaseUtils, 'createClient').mockReturnValue(mockSupabase)
  })

  it('should create incident with valid input', async () => {
    // Arrange
    const input: CreateIncidentInput = {
      title: 'Power Outage',
      incidentType: 'power_outage',
      severity: 'high',
      location: { latitude: 40.7128, longitude: -74.0060 }
    }

    mockSupabase.rpc.mockResolvedValue({ data: mockIncident, error: null })

    // Act
    const result = await createIncident(input)

    // Assert
    expect(result.title).toBe('Power Outage')
    expect(result.severity).toBe('high')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_emergency_incident', expect.anything())
  })

  it('should throw error on database failure', async () => {
    // Arrange
    const input = { /* valid input */ }
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'Database error' } })

    // Act & Assert
    await expect(createIncident(input)).rejects.toThrow('Failed to create incident')
  })
})
```

**Component Test Structure:**

Component tests verify rendering and user interactions:

```tsx
// components/emergency/sos-button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SOSButtonContainer } from './sos-button-container'
import { useSOSActivation } from '@/hooks/use-sos-activation'

vi.mock('@/hooks/use-sos-activation')

describe('SOSButtonContainer', () => {
  it('should render SOS button', () => {
    vi.mocked(useSOSActivation).mockReturnValue({ activateSOS: vi.fn() })
    
    render(<SOSButtonContainer />)
    
    expect(screen.getByRole('button', { name: /sos emergency/i })).toBeInTheDocument()
  })

  it('should call activateSOS on click', async () => {
    const activateSOS = vi.fn()
    vi.mocked(useSOSActivation).mockReturnValue({ activateSOS })

    render(<SOSButtonContainer />)
    fireEvent.click(screen.getByRole('button'))
    
    expect(activateSOS).toHaveBeenCalledTimes(1)
  })
})
```

**Test Coverage Targets:**

| Test Type | Target Coverage | Scope |
|-----------|----------------|-------|
| Unit Tests | 80% code coverage | All non-UI code |
| Component Tests | 70% coverage | All components |
| Integration Tests | 60% coverage | API endpoints, services |
| E2E Tests | Critical paths | User journeys |

#### 10.2.3 Documentation Requirements

Code should be self-documenting through clear naming and structure, but complex logic requires additional documentation. All public APIs, complex algorithms, and non-obvious decisions should be documented.

**JSDoc Conventions:**

```typescript
/**
 * Creates a new emergency incident in the system.
 * 
 * @param input - The incident creation data including title, type, severity, and location
 * @returns The created incident with generated ID and timestamps
 * @throws Error if database operation fails
 * 
 * @example
 * ```typescript
 * const incident = await createIncident({
 *   title: 'Building Fire',
 *   incidentType: 'fire',
 *   severity: 'critical',
 *   location: { latitude: 40.7128, longitude: -74.0060 }
 * })
 * ```
 */
export async function createIncident(input: CreateIncidentInput): Promise<EmergencyIncident>
```

**README for Feature Modules:**

Each feature module should include a README explaining its purpose, key components, and integration points:

```markdown
# Emergency Incident Service

## Overview
Handles all emergency incident CRUD operations and business logic.

## Key Functions
- `createIncident`: Creates new emergency incidents
- `listIncidents`: Retrieves incidents with filtering
- `updateIncidentStatus`: Updates incident status with audit trail

## Dependencies
- Supabase client (`@/lib/supabase/server`)
- Incident types (`@/types/emergency`)

## Integration Points
- Real-time subscriptions via Supabase channels
- Alert service for notifications
```

#### 10.2.4 Security Requirements

Security is paramount for an emergency response platform. All code must follow security best practices to protect user data and system integrity.

**Authentication and Authorization:**

All protected routes and API endpoints must verify user authentication and authorization before processing requests. Use the centralized auth utilities and never bypass security checks.

```typescript
// api/emergency/incidents/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verify authentication
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify authorization - check user role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!canCreateIncident(profile?.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Process request
  const body = await request.json()
  // ...
}
```

**Input Validation:**

All inputs must be validated before processing. Use Zod for schema validation in forms and API endpoints:

```typescript
import { z } from 'zod'

export const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  incidentType: z.enum(['fire', 'medical', 'power_outage', 'flood', 'other']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    city: z.string().optional()
  })
})

export async function handleCreateIncident(request: Request) {
  const body = await request.json()
  
  const result = CreateIncidentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 })
  }
  
  // Proceed with validated data
}
```

**Sensitive Data Handling:**

Never log sensitive information, including user data, authentication tokens, or personal identifiable information. Use environment variables for secrets and sensitive configuration:

```typescript
// Good - using environment variables
const apiKey = process.env.SMS_GATEWAY_API_KEY

// Bad - hardcoded secrets
const apiKey = 'sk-1234567890abcdef' // Never do this

// Bad - logging sensitive data
console.log('User login:', { email: user.email, password: user.password }) // Never
```

### 10.3 Feature Implementation Guides

#### 10.3.1 P0 Story Implementation: Emergency SOS Button (BMAD-US-001)

The Emergency SOS Button is the highest-priority feature, providing users with a one-tap mechanism to send emergency alerts. This implementation guide covers the complete feature development.

**Implementation Phases:**

**Phase 1: Core Infrastructure:**

The first phase establishes the foundational components and services needed for SOS functionality. Create the SOS types to define the data structures, build the service layer to handle SOS activation logic, and implement the basic UI components. This phase should be completed in isolation before integrating with other systems.

```typescript
// types/emergency/sos.ts
export interface SOSLocation {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

export interface SOSAlert {
  id: string
  userId: string
  location: SOSLocation
  alertType: 'general' | 'medical' | 'fire' | 'police'
  timestamp: Date
  status: 'pending' | 'dispatched' | 'resolved'
  biometricConfirmed: boolean
}

export interface SOSPreferences {
  requireBiometric: boolean
  autoIncludeLocation: boolean
  emergencyContacts: string[]
  preferredLanguage: string
}
```

**Phase 2: UI Components:**

Build the SOS button component with accessibility support, including proper ARIA labels, keyboard navigation, and screen reader announcements. The button should have distinct visual states for idle, loading, and activated.

```tsx
// components/emergency/sos-button/sos-button.tsx
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { SOSButtonProps } from './types'

export function SOSButton({ 
  onActivate, 
  disabled,
  showStatus 
}: SOSButtonProps) {
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  const handleClick = useCallback(async () => {
    if (activating || activated) return
    
    setActivating(true)
    try {
      await onActivate()
      setActivated(true)
    } finally {
      setActivating(false)
    }
  }, [onActivate, activating, activated])

  if (activated) {
    return (
      <div className="text-center p-4 bg-green-100 rounded-lg" role="status">
        <p className="text-green-800 font-semibold">Emergency Services Notified</p>
        {showStatus && <p className="text-sm">Help is on the way</p>}
      </div>
    )
  }

  return (
    <Button
      variant="destructive"
      size="lg"
      className={`
        w-48 h-48 rounded-full text-xl font-bold
        animate-pulse shadow-lg shadow-red-500/50
        focus:outline-none focus:ring-4 focus:ring-red-500/50
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
      disabled={disabled || activating}
      aria-label="Activate Emergency SOS - Will dispatch emergency services to your location"
      aria-describedby="sos-description"
    >
      <div className="flex flex-col items-center gap-2">
        <ShieldAlert className="w-12 h-12" />
        <span>{activating ? 'Activating...' : 'SOS'}</span>
      </div>
    </Button>
  )
}
```

**Phase 3: Service Integration:**

Integrate with the alert service to dispatch SOS alerts, handle biometric verification if enabled, and manage the alert lifecycle. The service should handle offline scenarios by queuing alerts for later delivery.

```typescript
// lib/services/emergency/sos-service.ts
import { createClient } from '@/lib/supabase/server'
import type { SOSAlert, SOSLocation } from '@/types/emergency'

export async function activateSOS(
  userId: string,
  location: SOSLocation,
  alertType: SOSAlert['alertType'] = 'general',
  biometricConfirmed: boolean = false
): Promise<SOSAlert> {
  const supabase = createClient()
  
  // Create SOS alert record
  const { data, error } = await supabase
    .rpc('activate_emergency_sos', {
      p_user_id: userId,
      p_location_lat: location.latitude,
      p_location_lng: location.longitude,
      p_location_accuracy: location.accuracy,
      p_alert_type: alertType,
      p_biometric_confirmed: biometricConfirmed
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to activate SOS: ${error.message}`)
  }

  // Queue notification to emergency services
  await notificationService.queueEmergencyDispatch({
    alertId: data.id,
    location,
    alertType,
    priority: 'critical'
  })

  // Send push notification to user's emergency contacts
  await notifyEmergencyContacts(userId, data.id)

  return data
}
```

**Phase 4: Real-time Updates:**

Implement real-time status updates using Supabase subscriptions so users can track the status of their SOS alert and receive updates from dispatchers.

```typescript
// hooks/use-sos-status.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SOSAlert } from '@/types/emergency'

export function useSOSStatus(alertId: string | null) {
  const [status, setStatus] = useState<SOSAlert['status'] | null>(null)
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null)

  useEffect(() => {
    if (!alertId) return

    const supabase = createClient()
    
    const subscription = supabase
      .channel(`sos:${alertId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'emergency',
          table: 'sos_alerts',
          filter: `id=eq.${alertId}`
        },
        (payload) => {
          setStatus(payload.new.status)
          if (payload.new.estimated_arrival) {
            setEstimatedArrival(new Date(payload.new.estimated_arrival))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [alertId])

  return { status, estimatedArrival }
}
```

#### 10.3.2 P0 Story Implementation: Medical SOS Triage (BMAD-US-003)

The Medical SOS Triage feature adds a questionnaire to collect medical emergency details before dispatch, enabling more effective emergency response. Implementation follows a step-by-step questionnaire flow.

**Implementation Pattern:**

```tsx
// components/emergency/triage-questionnaire/triage-questionnaire.tsx
'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import type { TriageAnswers, TriageStep } from './types'

const TRIAGE_STEPS: TriageStep[] = [
  {
    id: 'consciousness',
    question: 'Is the patient conscious and responsive?',
    options: [
      { value: 'yes', label: 'Yes, fully responsive' },
      { value: 'semi', label: 'Semi-conscious' },
      { value: 'no', label: 'Unconscious' }
    ],
    priority: 'critical'
  },
  {
    id: 'breathing',
    question: 'Is the patient breathing normally?',
    options: [
      { value: 'normal', label: 'Normal breathing' },
      { value: 'labored', label: 'Labored or difficulty breathing' },
      { value: 'none', label: 'Not breathing' }
    ],
    priority: 'critical'
  },
  // Additional steps...
]

export function TriageQuestionnaire({ 
  onComplete, 
  onCancel 
}: TriageQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<TriageAnswers>({})
  const [loading, setLoading] = useState(false)

  const progress = ((currentStep + 1) / TRIAGE_STEPS.length) * 100
  const step = TRIAGE_STEPS[currentStep]

  const handleAnswer = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: value }))
  }, [step.id])

  const handleNext = useCallback(async () => {
    if (currentStep < TRIAGE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setLoading(true)
      try {
        await onComplete(answers)
      } finally {
        setLoading(false)
      }
    }
  }, [currentStep, answers, onComplete])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Medical Triage</CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {TRIAGE_STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-lg font-medium">{step.question}</h3>
        
        <RadioGroup 
          value={answers[step.id] || ''} 
          onValueChange={handleAnswer}
        >
          {step.options.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[step.id] || loading}
            >
              {loading ? 'Sending...' : currentStep === TRIAGE_STEPS.length - 1 ? 'Send SOS' : 'Next'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 10.3.3 P0 Story Implementation: Safe Zone Locator (BMAD-US-006)

The Safe Zone Locator enables users to find emergency shelters and safe areas near their location, with real-time capacity information and navigation.

**Integration Pattern:**

```typescript
// lib/services/safe-zones/safe-zone-service.ts
import { createClient } from '@/lib/supabase/server'
import type { SafeZone, GeoLocation, SafeZoneFilters } from '@/types/safe-zone'

export async function findNearbySafeZones(
  location: GeoLocation,
  radiusKm: number = 10,
  filters?: SafeZoneFilters
): Promise<SafeZone[]> {
  const supabase = createClient()
  
  // Use PostGIS for spatial queries
  const { data, error } = await supabase
    .rpc('find_safe_zones_near_location', {
      p_lat: location.latitude,
      p_lng: location.longitude,
      p_radius_km: radiusKm,
      p_type_filter: filters?.type,
      p_available_only: filters?.availableOnly || false
    })

  if (error) {
    throw new Error(`Failed to find safe zones: ${error.message}`)
  }

  return (data || []).map(mapSafeZoneRow)
}

export async function getSafeZoneDetails(id: string): Promise<SafeZone | null> {
  // Implementation with capacity check
}

export async function reserveSpot(
  safeZoneId: string, 
  userId: string
): Promise<{ success: boolean; spotNumber?: number }> {
  // Transactional spot reservation
}
```

#### 10.3.4 P0 Story Implementation: Multi-Channel Alerts (BMAD-US-011)

The Multi-Channel Alerts feature delivers emergency notifications through SMS, email, push notifications, and in-app alerts based on user preferences.

**Implementation Pattern:**

```typescript
// lib/services/alerts/alert-delivery-service.ts
import { createClient } from '@/lib/supabase/server'
import type { Alert, DeliveryChannel, UserPreferences } from '@/types/alerts'

export async function deliverAlert(
  alert: Alert,
  userId: string
): Promise<DeliveryResult[]> {
  const user = await getUserWithPreferences(userId)
  const results: DeliveryResult[] = []

  // Determine channels based on alert priority and user preferences
  const channels = determineChannels(alert.priority, user.preferences)

  // Deliver to each channel in parallel
  const deliveryPromises = channels.map(async (channel) => {
    switch (channel) {
      case 'sms':
        return deliverSMS(alert, user.phone)
      case 'email':
        return deliverEmail(alert, user.email)
      case 'push':
        return deliverPush(alert, user.deviceTokens)
      case 'inapp':
        return deliverInApp(alert, userId)
    }
  })

  const settled = await Promise.allSettled(deliveryPromises)
  
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      results.push({
        channel: channels[index],
        success: false,
        error: result.reason
      })
    }
  })

  // Update alert delivery status
  await updateAlertDeliveryStatus(alert.id, results)

  return results
}

async function deliverSMS(alert: Alert, phone: string): Promise<DeliveryResult> {
  const smsProvider = getSMSProvider()
  const message = formatAlertAsSMS(alert)
  
  try {
    const result = await smsProvider.send({
      to: phone,
      message,
      priority: alert.priority === 'critical' ? 'high' : 'normal'
    })
    
    return {
      channel: 'sms',
      success: result.success,
      messageId: result.messageId,
      deliveredAt: new Date()
    }
  } catch (error) {
    return {
      channel: 'sms',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

#### 10.3.5 Common Implementation Patterns

Several patterns appear across multiple P0 and P1 features. Understanding these patterns enables efficient implementation of new features.

**Real-time Subscription Pattern:**

Many features require real-time updates from the database. Use Supabase subscriptions with proper cleanup:

```typescript
// hooks/use-realtime-data.ts
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeData<T>(
  table: string,
  filter?: { column: string; value: string }
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel>

    async function initialLoad() {
      let query = supabase.from(table).select('*')
      
      if (filter) {
        query = query.eq(filter.column, filter.value)
      }

      const { data: initialData } = await query
      setData(initialData as T[])
      setLoading(false)
    }

    initialLoad()

    // Set up real-time subscription
    channel = supabase
      .channel(`${table}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new as T, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              (item as { id: string }).id === payload.new.id ? payload.new as T : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => 
              (item as { id: string }).id !== payload.old.id
            ))
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, filter?.column, filter?.value])

  return { data, loading }
}
```

**Offline-First Pattern:**

For features that must work offline, implement optimistic updates with background sync:

```typescript
// hooks/use-offline-incidents.ts
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OfflineQueueItem {
  type: 'create' | 'update' | 'delete'
  data: unknown
  timestamp: Date
}

export function useOfflineIncidents() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Monitor online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }
    
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const createIncidentOffline = useCallback(async (data: CreateIncidentInput) => {
    const queueItem: OfflineQueueItem = {
      type: 'create',
      data,
      timestamp: new Date()
    }

    // Add to local queue
    setQueue(prev => [...prev, queueItem])

    // Store in IndexedDB for persistence
    await saveToIndexedDB('offlineQueue', queueItem)

    if (isOnline) {
      processQueue()
    }
  }, [isOnline])

  const processQueue = useCallback(async () => {
    const supabase = createClient()
    
    for (const item of queue) {
      try {
        await supabase.from('incidents').insert(item.data)
        setQueue(prev => prev.filter(q => q !== item))
      } catch (error) {
        console.error('Failed to sync offline change:', error)
      }
    }
  }, [queue])

  return { createIncidentOffline, isOnline, pendingChanges: queue.length }
}
```

### 10.4 Migration and Integration

#### 10.4.1 Database Migration Strategy

Database schema changes are managed through Supabase migrations, ensuring consistent and version-controlled schema evolution. All migrations must be reversible and tested thoroughly before deployment.

**Migration File Structure:**

```sql
-- supabase/migrations/20240208000001_create_emergency_schema.sql

-- Create emergency schema
CREATE SCHEMA IF NOT EXISTS emergency;

-- Create incidents table
CREATE TABLE IF NOT EXISTS emergency.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    incident_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'responding', 'contained', 'resolved', 'closed')),
    location_point GEOGRAPHY(POINT),
    location_address TEXT,
    location_city TEXT,
    location_municipality TEXT,
    location_district TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    contained_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status 
    ON emergency.incidents(status);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_severity 
    ON emergency.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_detected_at 
    ON emergency.incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_location 
    ON emergency.incidents USING GIST(location_point);

-- Enable Row Level Security
ALTER TABLE emergency.incidents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON emergency.incidents
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create" ON emergency.incidents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Incident commanders can update" ON emergency.incidents
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM emergency.incident_commanders)
    );
```

**Migration Best Practices:**

Always write migrations that are idempotent and can be run multiple times without side effects. Use transactions to ensure atomicity of related changes. Test migrations against production-like data volumes to identify performance issues. Back up data before running migrations in production.

#### 10.4.2 API Versioning Strategy

The API follows semantic versioning to manage changes while maintaining backward compatibility. Breaking changes require a new API version, while non-breaking changes can be applied to the current version.

**API Route Structure:**

```
app/api/v1/
├── incidents/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET, PUT, DELETE
└── alerts/
    └── route.ts           # GET, POST
```

**Version Handling:**

```typescript
// app/api/v2/incidents/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// V2 includes additional fields not available in V1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeAnalysis = searchParams.get('include_analysis') === 'true'

  const supabase = createClient()
  let query = supabase
    .from('emergency.incidents')
    .select(includeAnalysis 
      ? '*, analysis:incident_analysis(*)'
      : '*'
    )

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    data,
    meta: {
      version: 'v2',
      deprecated: false
    }
  })
}
```

#### 10.4.3 Frontend Integration Patterns

New features integrate with the existing frontend through established patterns that maintain consistency and reduce complexity.

**Page Route Integration:**

```typescript
// app/[locale]/emergency/sos/page.tsx
import { Suspense } from 'react'
import { SOSPageClient } from './sos-page-client'
import { Skeleton } from '@/components/ui/skeleton'

export default function SOSPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Emergency SOS</h1>
      <Suspense fallback={<Skeleton className="w-full h-64" />}>
        <SOSPageClient />
      </Suspense>
    </div>
  )
}
```

**Navigation Integration:**

```typescript
// components/header/navigation.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAVIGATION_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/emergency/sos', label: 'SOS' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/statistics', label: 'Statistics' },
  { href: '/backoffice', label: 'Backoffice', roles: ['admin', 'operator'] },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: { session } } = useSession()

  return (
    <nav className="flex gap-4">
      {NAVIGATION_ITEMS.map(item => {
        if (item.roles && !session?.user.roles.some(r => item.roles.includes(r))) {
          return null
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'font-bold' : ''}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

### 10.5 Development Tools Setup

#### 10.5.1 Environment Configuration

The development environment requires specific configuration files and environment variables for proper operation.

**Required Environment Variables:**

```bash
# .env.local.example

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_BIOMETRIC_AUTH=true
NEXT_PUBLIC_ALERT_DELIVERY_TIMEOUT=30000

# External Services
SMS_GATEWAY_API_KEY=your-sms-gateway-key
PUSH_NOTIFICATION_VAPID_KEY=your-vapid-key
```

**Environment Validation:**

```typescript
// lib/environment.ts
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  // Validate URL formats
  const urlPattern = /^https:\/\//
  if (!urlPattern.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be an HTTPS URL')
  }
}

// Call validation early in the application lifecycle
validateEnvironment()
```

#### 10.5.2 IDE Configuration

Visual Studio Code is the recommended IDE with specific extensions and settings for optimal development experience.

**VSCode Settings (.vscode/settings.json):**

```json
{
  "typescript.preferences.importModuleSpecifier": "@",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

**Recommended Extensions:**

| Extension | Purpose |
|-----------|---------|
| ESLint | Linting and code quality |
| Prettier | Code formatting |
| Tailwind CSS | Tailwind support |
| TypeScript Vue Plugin | TypeScript support |
| GitLens | Enhanced Git integration |
| Error Lens | Better error display |
| Path Intellisense | Import path completion |

#### 10.5.3 Local Development Setup

**Setup Steps:**

Clone the repository and install dependencies:

```bash
git clone https://github.com/neighborpulse/neighborpulse.git
cd electri-map
npm install
```

Set up environment variables:

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

Start the development server:

```bash
npm run dev
```

Run database migrations locally:

```bash
npm run db:migrate
```

Access the development environment at `http://localhost:3000`.

**Docker-Based Development:**

For a complete environment with databases:

```bash
docker-compose up -d
npm run dev:docker
```

#### 10.5.4 Debugging Tools

**Client-Side Debugging:**

Use browser DevTools and React Developer Tools for component inspection and state debugging. The application includes a debug panel in development mode.

```typescript
// lib/debug.ts
const DEBUG = process.env.NODE_ENV === 'development'

export function debug(...args: unknown[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args)
  }
}

export function debugGroup(label: string, fn: () => void) {
  if (DEBUG) {
    console.group(label)
    fn()
    console.groupEnd()
  }
}
```

**Server-Side Debugging:**

Use Node.js inspector for debugging API routes and server-side code:

```bash
npm run dev:debug
```

**Performance Profiling:**

Use the Next.js performance analyzer for identifying bottlenecks:

```typescript
// app/profile/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // Return performance metrics
  return NextResponse.json({
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    // Additional metrics
  })
}
```

### 10.6 Developer Checklist

Before committing code, ensure all of the following are complete:

**Code Quality:**
- [ ] Code passes ESLint without warnings
- [ ] Code is formatted with Prettier
- [ ] No console.log statements in production code
- [ ] All functions have appropriate type signatures
- [ ] Complex logic is documented with JSDoc

**Testing:**
- [ ] Unit tests added for new functions
- [ ] Component tests added for new UI components
- [ ] All tests pass locally
- [ ] Test coverage meets targets (80% unit, 70% component)

**Security:**
- [ ] No hardcoded secrets or API keys
- [ ] User input is validated
- [ ] Authentication checks are in place for protected routes
- [ ] Sensitive data is not logged

**Documentation:**
- [ ] README updated for new feature modules
- [ ] Complex functions have JSDoc comments
- [ ] Breaking changes documented

**Integration:**
- [ ] Changes tested with local database
- [ ] API endpoints tested with Postman or similar
- [ ] UI tested for responsiveness
- [ ] Offline functionality tested

---

**Document Version:** 1.2  
**Date:** February 2026  
**Section Author:** Bmad Dev Mode  
**Sprint Review:** Engineering Lead, DevOps Lead, Senior Developer  
**Last Updated:** February 2026