---
name: emergency-brainstorming-implementation-guide
description: Technical Implementation Guide for Emergency Services Brainstorming BMap
version: 1.0.0
created: 2026-02-07
---

# BMap Implementation Guide: Emergency Services Brainstorming

## Document Overview

This guide provides technical implementation details for the Emergency Services Brainstorming BMap, including architecture, database schema, API endpoints, component structure, and deployment instructions.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Dashboard  │  │  Sessions   │  │   Reports   │  │  Settings   │  │
│  │  Component  │  │  Component  │  │  Component  │  │  Component  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application Layer                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Session Management Service                     │   │
│  │  - Create/Update/Delete Sessions                                │   │
│  │  - Manage Participants                                         │   │
│  │  - Track Session State                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Technique Execution Engine                    │   │
│  │  - Execute SCAMPER, Design Thinking, Lean Startup               │   │
│  │  - Manage Timer and Phase Transitions                           │   │
│  │  - Capture Real-time Input                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Idea Organization Service                     │   │
│  │  - Cluster and Tag Ideas                                        │   │
│  │  - Priority Matrix Management                                   │   │
│  │  - Export and Reporting                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Sessions   │  │   Ideas     │  │ Techniques  │  │   Users     │    │
│  │   Table    │  │   Table     │  │   Table     │  │   Table     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Participants│  │  Templates  │  │   Analytics │  │   Audit     │    │
│  │   Table    │  │   Table     │  │   Table     │  │   Table     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        External Integrations                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Supabase    │  │  Auth0/     │  │  Notification│  │   Action    │    │
│  │ Database    │  │  Clerk      │  │  Services   │  │   Systems   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14, React 18 | UI components, session management |
| Styling | Tailwind CSS | Responsive design, dark mode |
| State Management | Zustand | Client-side state for sessions |
| Real-time | Supabase Realtime | Live updates during sessions |
| Database | PostgreSQL (Supabase) | Persistent storage |
| API | Next.js API Routes | RESTful endpoints |
| Authentication | Auth0/Clerk | User authentication |
| Notifications | Twilio (SMS), Firebase (Push) | Alert delivery |
| File Storage | Supabase Storage | Session recordings, exports |

---

## 2. Database Schema

### 2.1 Core Tables

```sql
-- Emergency Brainstorming Sessions
CREATE TABLE emergency_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(10) NOT NULL, -- 'BFSI', 'CPI', 'ERF', 'MAC', 'ES-PI', 'RTO', 'CEX', 'SAR', 'HMR', 'ECS'
    focus_area VARCHAR(255) NOT NULL,
    objectives JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'completed', 'archived'
    facilitator_id UUID REFERENCES auth.users(id),
    organization_id UUID,
    template_id UUID REFERENCES session_templates(id),
    settings JSONB NOT NULL DEFAULT '{}', -- {timeLimits, votingMethod, outputFormat}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Session Participants
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES emergency_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(100),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(session_id, user_id)
);

-- Generated Ideas
CREATE TABLE session_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES emergency_sessions(id) ON DELETE CASCADE,
    technique_id UUID REFERENCES brainstorming_techniques(id),
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    priority_impact INTEGER, -- 1-5
    priority_effort INTEGER, -- 1-5
    cluster_id UUID,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    votes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'approved', 'implemented', 'rejected'
);

-- Idea Clusters
CREATE TABLE idea_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES emergency_sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6'
);

-- Session Templates
CREATE TABLE session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    techniques JSONB NOT NULL DEFAULT '[]',
    time_limits JSONB DEFAULT '{}',
    objectives JSONB DEFAULT '[]',
    organization_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brainstorming Techniques
CREATE TABLE brainstorming_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(10) NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    max_participants INTEGER,
    materials_required JSONB DEFAULT '[]',
    target_outcomes JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE
);

-- Analytics Events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES emergency_sessions(id),
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Indexes

```sql
CREATE INDEX idx_sessions_org ON emergency_sessions(organization_id);
CREATE INDEX idx_sessions_status ON emergency_sessions(status);
CREATE INDEX idx_sessions_mode ON emergency_sessions(mode);
CREATE INDEX idx_ideas_session ON session_ideas(session_id);
CREATE INDEX idx_ideas_category ON session_ideas(category);
CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

---

## 3. API Endpoints

### 3.1 Session Management

```
POST   /api/sessions                    # Create new session
GET    /api/sessions                    # List sessions (with filters)
GET    /api/sessions/:id                # Get session details
PUT    /api/sessions/:id                # Update session
DELETE /api/sessions/:id                # Delete session
POST   /api/sessions/:id/activate       # Start session
POST   /api/sessions/:id/complete       # Complete session
POST   /api/sessions/:id/invite         # Invite participants
DELETE /api/sessions/:id/participants/:userId  # Remove participant
```

### 3.2 Technique Execution

```
GET    /api/techniques                  # List available techniques
GET    /api/techniques/:id              # Get technique details
GET    /api/techniques/mode/:mode       # Get techniques by mode
POST   /api/sessions/:id/technique      # Execute technique
PUT    /api/sessions/:id/phase          # Update session phase
POST   /api/sessions/:id/timer          # Manage timer
```

### 3.3 Ideas

```
POST   /api/sessions/:id/ideas          # Submit idea
GET    /api/sessions/:id/ideas          # List session ideas
PUT    /api/ideas/:id                   # Update idea
DELETE /api/ideas/:id                   # Delete idea
POST   /api/ideas/:id/vote              # Vote on idea
POST   /api/ideas/:id/tag               # Tag idea
POST   /api/ideas/:id/cluster           # Move to cluster
PUT    /api/ideas/:id/priority          # Set priority
```

### 3.4 Clusters and Organization

```
POST   /api/sessions/:id/clusters       # Create cluster
GET    /api/sessions/:id/clusters       # List clusters
PUT    /api/clusters/:id               # Update cluster
DELETE /api/clusters/:id               # Delete cluster
POST   /api/sessions/:id/organize        # Auto-organize ideas
```

### 3.5 Templates

```
GET    /api/templates                   # List templates
POST   /api/templates                  # Create template
GET    /api/templates/:id              # Get template
PUT    /api/templates/:id             # Update template
DELETE /api/templates/:id             # Delete template
POST   /api/templates/:id/apply        # Apply template to session
```

### 3.6 Analytics and Reporting

```
GET    /api/sessions/:id/analytics      # Get session analytics
GET    /api/organizations/:id/analytics # Get org analytics
POST   /api/reports/session            # Generate session report
POST   /api/reports/export             # Export data
GET    /api/dashboard/summary          # Dashboard metrics
```

---

## 4. Frontend Components

### 4.1 Component Structure

```
components/
├── emergency/
│   ├── SessionCard.tsx               # Session list item
│   ├── SessionWizard.tsx             # Session creation wizard
│   ├── SessionDashboard.tsx          # Active session view
│   ├── ParticipantList.tsx           # Participant management
│   ├── TimerDisplay.tsx              # Technique timer
│   ├── IdeaInput.tsx                 # Real-time idea submission
│   ├── IdeaGrid.tsx                  # Ideas display
│   ├── PriorityMatrix.tsx            # Impact/Effort matrix
│   ├── ClusterView.tsx               # Clustered ideas view
│   ├── TechniqueSelector.tsx         # Technique selection
│   ├── TechniqueDisplay.tsx          # Technique instructions
│   ├── ReportGenerator.tsx           # Session report
│   └── ExportOptions.tsx             # Export functionality
├── templates/
│   ├── TemplateCard.tsx
│   ├── TemplateEditor.tsx
│   └── TemplateLibrary.tsx
├── analytics/
│   ├── SessionMetrics.tsx
│   ├── IdeaDistribution.tsx
│   ├── TrendAnalysis.tsx
│   └── DashboardWidgets.tsx
└── common/
    ├── Modal.tsx
    ├── Toast.tsx
    └── LoadingSpinner.tsx
```

### 4.2 State Management (Zustand)

```typescript
// stores/sessionStore.ts
interface SessionState {
  currentSession: Session | null;
  participants: Participant[];
  ideas: Idea[];
  clusters: Cluster[];
  activeTechnique: Technique | null;
  timer: TimerState;
  phase: SessionPhase;
  
  // Actions
  setSession: (session: Session) => void;
  addIdea: (idea: Idea) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  setTimer: (timer: TimerState) => void;
  setPhase: (phase: SessionPhase) => void;
  subscribeToUpdates: () => () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  participants: [],
  ideas: [],
  clusters: [],
  activeTechnique: null,
  timer: { remaining: 0, total: 0, isRunning: false },
  phase: 'setup',
  
  setSession: (session) => set({ currentSession: session }),
  
  addIdea: (idea) => set((state) => ({ 
    ideas: [...state.ideas, idea] 
  })),
  
  updateIdea: (id, updates) => set((state) => ({
    ideas: state.ideas.map((i) => 
      i.id === id ? { ...i, ...updates } : i
    )
  })),
  
  setTimer: (timer) => set({ timer }),
  
  setPhase: (phase) => set({ phase }),
  
  subscribeToUpdates: () => {
    const subscription = supabase
      .channel('session-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'session_ideas' 
      }, (payload) => {
        // Handle real-time updates
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }
}));
```

---

## 5. Technique Implementations

### 5.1 SCAMPER Technique

```typescript
// techniques/scamper.ts
export const scamperTechnique: Technique = {
  id: 'scamper-fire-service',
  mode: 'BFSI',
  category: 'Emergency Protocol',
  name: 'SCAMPER for Fireground Decisions',
  description: 'Systematic exploration of alternatives using SCAMPER framework',
  instructions: `
# SCAMPER Technique for Fireground Decisions

## What is SCAMPER?
SCAMPER is a systematic questioning technique that helps teams explore different perspectives on a problem or situation.

## The SCAMPER Prompts for Fire Service:

### S - Substitute
What could we substitute in our current approach?
- Different equipment?
- Different personnel assignments?
- Different water supply strategy?

### C - Combine
What could we combine that we haven't considered?
- Resources from different stations?
- Personnel from different shifts?
- Equipment from different units?

### A - Adapt
How can we adapt successful tactics from other incidents?
- What worked in residential fires that could work here?
- What can we learn from industrial fires?
- How do other departments handle this?

### M - Modify
What could we modify about current procedures?
- Change the sequence of operations?
- Adjust crew sizes?
- Modify communication protocols?

### P - Put to Another Use
What existing resources could serve a different purpose?
- Can a ladder truck serve a different function?
- Can personnel be reassigned mid-incident?
- Can equipment be used unconventionally?

### E - Eliminate
What could we eliminate from current procedures?
- Unnecessary steps?
- Redundant communications?
- Unused equipment staging?

### R - Reverse
What if we approached from the opposite direction?
- Reverse attack plan?
- Start where we'd normally finish?
- Change interior/exterior priorities?

## Exercise Duration: 45 minutes
- 5 minutes per prompt
- 10 minutes final discussion
`,
  duration_minutes: 45,
  max_participants: 12,
  materials_required: ['SCAMPER worksheet', 'Incident diagram'],
  target_outcomes: [
    '5-10 ideas per prompt',
    'Prioritized alternatives',
    'Action items for testing'
  ]
};
```

### 5.2 Lean Startup for Emergency Services

```typescript
// techniques/lean-startup-emergency.ts
export const leanStartupTechnique: Technique = {
  id: 'lean-startup-emergency',
  mode: 'BFSI',
  category: 'Startup Methodology',
  name: 'Lean Startup for Emergency Procedures',
  description: 'Apply Build-Measure-Learn cycle to emergency service improvements',
  instructions: `
# Lean Startup for Emergency Services

## The Build-Measure-Learn Cycle

### BUILD: Create Your MVP
Define the Minimum Viable Procedure - the simplest version that tests your hypothesis.

Questions to answer:
1. What is the core problem you're solving?
2. What is the minimum you need to test this?
3. What resources are absolutely required?

### MEASURE: Design Your Test
How will you measure whether the MVP is successful?

Metrics to consider:
- Time to complete task
- Success/failure rate
- Personnel required
- Equipment needed
- Citizen outcome

### LEARN: Analyze Results
What did the test tell you?

Analysis framework:
- What worked as expected?
- What surprised you?
- What needs to change?
- Is this worth scaling?

## Emergency Services Application

### Traditional Approach
1. Research (months)
2. Plan (weeks)
3. Train (weeks)
4. Implement (all at once)
5. Evaluate (months later)

### Lean Approach
1. Hypothesis (hours)
2. MVP (days)
3. Test (days/weeks)
4. Learn (immediate)
5. Iterate (continuous)

## Your Turn

Select an operational challenge and work through:
1. Define the problem statement
2. Identify your MVP
3. Design your test
4. Set success criteria
5. Plan your iteration

## Exercise Duration: 60 minutes
`,
  duration_minutes: 60,
  max_participants: 8,
  materials_required: ['MVP Canvas worksheet', 'Success criteria template'],
  target_outcomes: [
    'Problem statement documented',
    'MVP defined',
    'Test plan created',
    'Success criteria established'
  ]
};
```

---

## 6. Real-Time Updates

### 6.1 Supabase Realtime Configuration

```typescript
// lib/realtime/session-realtime.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class SessionRealtime {
  private channel: any;
  private sessionId: string;
  private callbacks: Map<string, Function[]> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect() {
    this.channel = supabase
      .channel(`session:${this.sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_ideas',
        filter: `session_id=eq.${this.sessionId}`
      }, (payload) => {
        this.emit('ideaChange', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${this.sessionId}`
      }, (payload) => {
        this.emit('participantChange', payload);
      })
      .subscribe();
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const handlers = this.callbacks.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }

  // Broadcast timer updates
  async broadcastTimerUpdate(timerState: TimerState) {
    await supabase.channel(`session:${this.sessionId}`).send({
      type: 'broadcast',
      event: 'timerUpdate',
      payload: timerState
    });
  }

  // Broadcast phase changes
  async broadcastPhaseChange(phase: SessionPhase) {
    await supabase.channel(`session:${this.sessionId}`).send({
      type: 'broadcast',
      event: 'phaseChange',
      payload: { phase, timestamp: new Date().toISOString() }
    });
  }
}
```

---

## 7. API Implementation Examples

### 7.1 Create Session Endpoint

```typescript
// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sessionSchema = z.object({
  mode: z.enum(['BFSI', 'CPI', 'ERF', 'MAC', 'ES-PI', 'RTO', 'CEX', 'SAR', 'HMR', 'ECS']),
  focus_area: z.string().min(1).max(255),
  objectives: z.array(z.string()).min(1),
  template_id: z.string().uuid().optional(),
  settings: z.object({
    time_limits: z.record(z.number()).optional(),
    voting_method: z.enum(['dot', 'rank', 'consensus']).optional(),
    output_format: z.enum(['markdown', 'pdf', 'json']).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sessionSchema.parse(body);

    // Get current user
    const authHeader = request.headers.get('authorization');
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create session
    const { data: session, error } = await supabase
      .from('emergency_sessions')
      .insert({
        mode: validated.mode,
        focus_area: validated.focus_area,
        objectives: validated.objectives,
        template_id: validated.template_id,
        settings: validated.settings || {},
        facilitator_id: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      session_id: session.id,
      user_id: user.id,
      event_type: 'session_created',
      event_data: { mode: session.mode }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('emergency_sessions')
      .select(`
        *,
        facilitator:auth_users!emergency_sessions_facilitator_id_fkey(email, name),
        participant_count:session_participants(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mode) {
      query = query.eq('mode', mode);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      sessions,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Session list error:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
```

---

## 8. Authentication and Authorization

### 8.1 Middleware Configuration

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes require authentication
  if (req.nextUrl.pathname.startsWith('/sessions') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes require specific role
  if (req.nextUrl.pathname.startsWith('/admin') && session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/sessions/:path*', '/admin/:path*', '/api/sessions/:path*'],
};
```

---

## 9. Deployment Instructions

### 9.1 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Notifications
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
FIREBASE_SERVER_KEY=your-firebase-key

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 9.2 Supabase Setup

```bash
# 1. Create project
supabase projects create emergency-brainstorming

# 2. Apply migrations
supabase db push

# 3. Set up Row Level Security
# Enable RLS on all tables
# Create policies for organization-based access

# 4. Configure realtime
# Enable realtime for session_ideas and session_participants tables

# 5. Set up storage bucket
supabase storage buckets create session-exports
```

### 9.3 Build and Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Deploy to Vercel
vercel --prod
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

```typescript
// __tests__/techniques/scamper.test.ts
import { describe, it, expect } from 'vitest';
import { scamperTechnique } from '@/techniques/scamper';

describe('SCAMPER Technique', () => {
  it('should have required fields', () => {
    expect(scamperTechnique.id).toBeDefined();
    expect(scamperTechnique.mode).toBe('BFSI');
    expect(scamperTechnique.instructions).toContain('SCAMPER');
  });

  it('should include all SCAMPER prompts', () => {
    const prompts = ['Substitute', 'Combine', 'Adapt', 'Modify', 'Put to Another Use', 'Eliminate', 'Reverse'];
    prompts.forEach(prompt => {
      expect(scamperTechnique.instructions).toContain(prompt);
    });
  });

  it('should have fire service specific content', () => {
    expect(scamperTechnique.instructions).toContain('fireground');
    expect(scamperTechnique.instructions).toContain('water supply');
  });
});
```

### 10.2 Integration Tests (Playwright)

```typescript
// __tests__/e2e/session-creation.spec.ts
import { test, expect } from '@playwright/test';

test('creates emergency brainstorming session', async ({ page }) => {
  await page.goto('/sessions/new');
  
  // Fill session details
  await page.selectOption('select[name="mode"]', 'BFSI');
  await page.fill('input[name="focusArea"]', 'Wildfire Response');
  await page.fill('textarea[name="objectives"]', 'Reduce response time');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify redirect to session page
  await expect(page).toHaveURL(/\/sessions\/[a-z0-9-]+/);
  await expect(page.locator('h1')).toContainText('Wildfire Response');
});
```

---

## 11. Monitoring and Observability

### 11.1 Performance Monitoring

```typescript
// lib/analytics/performance.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function trackPerformance(
  metric: string,
  value: number,
  metadata: Record<string, any> = {}
) {
  await supabase.from('performance_metrics').insert({
    metric_name: metric,
    metric_value: value,
    metadata,
    recorded_at: new Date().toISOString()
  });
}

// Usage examples
trackPerformance('session_creation_time', 450, { mode: 'BFSI' });
trackPerformance('idea_submission_latency', 120, { session_size: 8 });
trackPerformance('page_load_time', 2100, { page: 'dashboard' });
```

### 11.2 Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Wrap API routes
export const handler = Sentry.wrapApiHandlerWithSentry(
  'pages/api/sessions',
  async (req, res) => {
    // Original handler
  }
);

// Track custom errors
export function trackSessionError(error: Error, sessionId: string) {
  Sentry.captureException(error, {
    extra: { sessionId }
  });
}
```

---

## 12. Security Considerations

### 12.1 Data Protection

- All session data encrypted at rest (Supabase)
- TLS 1.3 for data in transit
- Row Level Security policies for multi-tenant isolation
- Audit logging for compliance
- Data retention policies with automatic purging

### 12.2 Access Control

- Role-based access control (RBAC)
- Organization-level permissions
- Session-specific access lists
- Time-limited session access
- Watermarking for exports

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-07  
**Next Review:** After Phase 2 completion
