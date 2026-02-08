# Emergency Services Brainstorming Methods

## Overview

This file extends the core [`brain-methods.csv`](/_bmad/core/workflows/brainstorming/brain-methods.csv) with **40 specialized brainstorming techniques** adapted for emergency services (bombeiros, protecao civil, and emergency response organizations).

These techniques integrate with the existing brainstorming workflow steps:
- [`step-01-session-setup.md`](/_bmad/core/workflows/brainstorming/steps/step-01-session-setup.md) - Session initialization
- [`step-02a-user-selected.md`](/_bmad/core/workflows/brainstorming/steps/step-02a-user-selected.md) - User-selected techniques
- [`step-02b-ai-recommended.md`](/_bmad/core/workflows/brainstorming/steps/step-02b-ai-recommended.md) - AI-recommended approaches
- [`step-02c-random-selection.md`](/_bmad/core/workflows/brainstorming/steps/step-02c-random-selection.md) - Random technique selection
- [`step-02d-progressive-flow.md`](/_bmad/core/workflows/brainstorming/steps/step-02d-progressive-flow.md) - Progressive technique flow
- [`step-03-technique-execution.md`](/_bmad/core/workflows/brainstorming/steps/step-03-technique-execution.md) - Core ideation execution
- [`step-04-idea-organization.md`](/_bmad/core/workflows/brainstorming/steps/step-04-idea-organization.md) - Prioritization and roadmap

---

## 1. Emergency Protocol Techniques

### 1.1 Incident Command SCAMPER

| Element | Emergency Services Application |
|---------|------------------------------|
| **Substitute** | What resources could substitute for unavailable apparatus? |
| **Combine** | How could multiple agencies combine efforts more effectively? |
| **Adapt** | How can tactics from one incident type adapt to another? |
| **Modify** | What modifications to communication protocols would help? |
| **Put to Other Uses** | How could equipment designed for one purpose serve another? |
| **Eliminate** | What delays in the response chain could be eliminated? |
| **Reverse** | What if we escalated instead of de-escalated? What insights emerge? |

**Flow Integration:** [`step-03-technique-execution.md`](/_bmad/core/workflows/brainstorming/steps/step-03-technique-execution.md)

### 1.2 Rapid After Action Review (AAR)

**Purpose:** Structured debrief technique extracting lessons from incidents within 24-48 hours

**Application:**
1. What actually happened (timeline)
2. Why it happened (causal analysis)
3. What worked well (preserve)
4. What didn't work (improve)
5. What changes immediately (action items)
6. What requires longer study (research)

**Emergency Specifics:**
- **Bombeiros:** Fireground decisions, rescue operations, hazmat response
- **Proteção Civil:** Multi-agency coordination, resource mobilization, public communication
- **Flow Integration:** [`step-04-idea-organization.md`](/_bmad/core/workflows/brainstorming/steps/step-04-idea-organization.md)

### 1.3 What-If Scenario Planning

**Purpose:** Explore hypothetical emergency scenarios to prepare for edge cases

**Scenario Prompts:**
- What if X happens during Y? (compound events)
- What if our primary response fails? (backup scenarios)
- What if communication fails at critical moment? (resilience)
- What if multiple incidents occur simultaneously? (capacity)

**Examples:**
| Scenario Type | Example |
|---------------|---------|
| Compound | Wildfire + earthquake + power outage |
| Cascading | Major fire during mass gathering |
| Resource Depletion | Extended operation exhausting crews |

**Flow Integration:** [`step-02b-ai-recommended.md`](/_bmad/core/workflows/brainstorming/steps/step-02b-ai-recommended.md)

### 1.4 Chain of Command Mapping

**Purpose:** Visualize decision-making pathways and authority structures during emergencies

**Mapping Elements:**
```
┌─────────────────────────────────────────┐
│           INCIDENT COMMAND              │
│         (Incident Commander)            │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌───────┐    ┌──────────┐    ┌────────┐
│OPS SECT│    │PLANNING  │    │LOGISTICS│
└───────┘    │  SECT    │    └────────┘
             └──────────┘
```

**Flow Integration:** [`step-02c-random-selection.md`](/_bmad/core/workflows/brainstorming/steps/step-02c-random-selection.md)

### 1.5 Resource Flow Analysis

**Purpose:** Track resource movement and allocation during emergency response

**Key Questions:**
- Where are resources at each phase?
- What bottlenecks exist?
- How do resources flow between agencies?
- What information accompanies resources?

**Emergency Domains:**
| Domain | Resource Examples |
|--------|------------------|
| Bombeiros | Apparatus, personnel, water supply, foam, tools |
| Proteção Civil | Shelters, medical supplies, transport, food |
| Multi-Agency | Shared resources, mutual aid, national reserves |

---

## 2. Response Optimization Techniques

### 2.1 Time-Critical Decision Tree

**Purpose:** Map critical decision points with time constraints

**Template:**
```
                    ┌─────────────────┐
                    │  INCIDENT TYPE  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐    ┌──────────┐   ┌──────────┐
        │  FIRE   │    │  MEDICAL │   │ RESCUE  │
        └────┬────┘    └────┬─────┘   └────┬─────┘
             │              │              │
        [Size-up]      [Patient]      [Type of]
             │              │          [Entrapment]
             └──────────────┼──────────────┘
                           │
                    [Time Clock Starts]
                           │
        ┌──────────────────┼──────────────────┐
        ▼                 ▼                  ▼
   [Defensive]      [ALS Intervention]   [Extrication]
   [Attack]         [Transport]           [Rescue]
```

**Decision Windows:**
- **0-5 min:** Initial size-up, resource request
- **5-15 min:** Strategic decisions (defensive/offensive)
- **15+ min:** Tactical adjustments, resource optimization

**Flow Integration:** [`step-03-technique-execution.md`](/_bmad/core/workflows/brainstorming/steps/step-03-technique-execution.md)

### 2.2 Response Time Decomposition

**Purpose:** Break down total response time into component phases for bottleneck identification

**Decomposition Model:**
```
TOTAL RESPONSE TIME = 
  ┌────────────────────────────────────────────────────────┐
  │  ALARM TO DISPATCH (Processing Time)                    │
  │  + DISPATCH TO ENROUTE (Turnout Time)                  │
  │  + ENROUTE TO ARRIVAL (Travel Time)                    │
  │  + SET-UP TIME (Positioning, Gear, Assessment)         │
  │  + INTERVENTION TIME (Operational Time)                 │
  └────────────────────────────────────────────────────────┘
```

**Optimization Targets:**
| Phase | Typical Target | Improvement Levers |
|-------|---------------|-------------------|
| Alarm to Dispatch | < 2 min | CAD optimization, caller information |
| Dispatch to Enroute | < 2 min | Crew readiness, apparatus status |
| Enroute to Arrival | Varies | Station placement, traffic systems |
| Set-up | < 3 min | Training, pre-positioning |
| Intervention | Variable | Tactics, equipment, command |

**Flow Integration:** [`step-04-idea-organization.md`](/_bmad/core/workflows/brainstorming/steps/step-04-idea-organization.md) (prioritization by time impact)

### 2.3 Mutual Aid Pathways

**Purpose:** Design inter-agency cooperation mechanisms and resource sharing agreements

**Design Elements:**
1. **Trigger Conditions:** When does mutual aid activate?
2. **Resource Types:** What can be shared? (personnel, apparatus, specialized teams)
3. **Request Process:** How is aid requested?
4. **Command Structure:** Who commands incoming resources?
5. **Cost Recovery:** How are costs handled?
6. **Demobilization:** How does mutual aid end?

**Levels:**
- **Level 1:** Automatic aid (predetermined)
- **Level 2:** Requested aid (operational discretion)
- **Level 3:** Requested aid (administrative approval)
- **Level 4:** Emergency assistance (disaster declarations)

**Flow Integration:** Links to resource management workflows

### 2.4 Pre-Positioning Strategy

**Purpose:** Determine optimal resource placement for rapid deployment to high-risk areas

**Analysis Framework:**
1. **Risk Mapping:** Where are the high-risk areas?
2. **Historical Analysis:** Where have incidents occurred?
3. **Population Exposure:** Where are people most vulnerable?
4. **Infrastructure:** What roads, bridges, terrain affect access?
5. **Competing Demands:** Where else might resources be needed?

**Pre-Positioning Options:**
| Type | Pros | Cons |
|------|------|------|
| Station-based | Familiar area, fast response | Fixed location |
| Staging Areas | Flexible location, rapid move | Personnel burden |
| Pre-Positioned Cache | Quick access, reduced travel | Cache maintenance |
| Mobile Resources | Adaptive, can cover multiple areas | Operational complexity |

---

## 3. Citizen Engagement Techniques

### 3.1 Public Alert Empathy Map

**Purpose:** Understand how citizens receive, interpret, and respond to emergency alerts

**Empathy Map Template:**
```
┌─────────────────────────────────────────────────────────┐
│  THINKING & FEELING                                    │
│  "What concerns citizens during alerts?"               │
│  - Is this real? (trust in source)                     │
│  - What should I do? (action clarity)                  │
│  - How serious? (severity understanding)               │
├─────────────────────────────────────────────────────────┤
│  HEARING          │  SEEING                             │
│  "What are they   │  "What do they see                  │
│   hearing?"       │   during alerts?"                   │
│  - Sirens        │  - Alert messages                   │
│  - Notifications  │  - Social media                     │
│  - Word of mouth │  - Others reacting                 │
├─────────────────────────────────────────────────────────┤
│  SAYING & DOING   │  PAINS                              │
│  "What actions    │  "What frustrates                   │
│   do they take?"  │   citizens?"                        │
│  - Seek info     │  - Information overload             │
│  - Follow orders │  - Contradictory info              │
│  - Ignore alerts  │  - Language barriers              │
└─────────────────────────────────────────────────────────┘
│  GAINS                                   │
│  "What do citizens need?"                │
│  - Clear, actionable instructions       │
│  - Trusted source identification        │
│  - Updates as situation evolves        │
└─────────────────────────────────────────────────────────┘
```

**Flow Integration:** [`step-03-technique-execution.md`](/_bmad/core/workflows/brainstorming/steps/step-03-technique-execution.md)

### 3.2 Vulnerable Population Journey

**Purpose:** Map emergency experience for elderly, disabled, non-Portuguese speakers, isolated populations

**Journey Phases:**
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ ALERT    │───▶│ ASSESS   │───▶│ DECIDE  │───▶│ ACTION   │───▶│ RECOVERY │
│ RECEIVED │    │ THREAT   │    │         │    │ TAKEN    │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │              │               │              │              │
     ▼              ▼               ▼              ▼              ▼
[Vulnerability   [Communication   [Decision      [Mobility     [Specialized
 Challenges]     Barriers]         Capacity]      Challenges]   Support Needs]
```

**Vulnerable Groups:**
| Group | Specific Needs |
|-------|---------------|
| Elderly | Mobility aids, hearing/vision impairment, cognitive support |
| Disabled | Accessible alerts, transportation, service animal accommodation |
| Non-Portuguese | Translation, pictograms, community liaison |
| Isolated Rural | Extended notification, transportation, supply caches |
| Institutionalized | Facility coordination, evacuation protocols |

**Flow Integration:** [`step-04-idea-organization.md`](/_bmad/core/workflows/brainstorming/steps/step-04-idea-organization.md) (equity-focused prioritization)

### 3.3 Community Resilience Mapping

**Purpose:** Identify and strengthen community capacity for self-response before help arrives

**Mapping Framework:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMUNITY RESILIENCE MAPPING                 │
├─────────────────────────────────────────────────────────────────┤
│  EXISTING CAPACITY          │  POTENTIAL CAPACITY              │
│  ────────────────────       │  ────────────────────            │
│  • Community Emergency      │  • Training opportunities         │
│    Response Teams (CERT)    │  • Equipment provision            │
│  • Neighborhood watch       │  • Youth engagement              │
│  • Faith-based networks     │  • Business partnerships          │
│  • Volunteer organizations   │  • Social media networks          │
├─────────────────────────────────────────────────────────────────┤
│  GAPS ANALYSIS                                               │
│  ─────────────────────────                                │
│  • Geographic coverage holes                               │
│  • Demographic underserved                                  │
│  • Skill gaps                                               │
│  • Resource deficiencies                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Flow Integration:** Connects to adoption and community workflows

### 3.4 Rumour Cascade Analysis

**Purpose:** Understand how information (and misinformation) spreads during emergencies

**Analysis Questions:**
1. Where do rumours originate?
2. How do they spread?
3. What makes them credible?
4. How can official information penetrate?
5. What corrections are effective?

**Information Flow Pyramid:**
```
                    ┌───────────┐
                   /  OFFICIAL  \
                  /   CHANNELS   \
                 /    (10-20%)    \
                /___________________\
               /       \   /        \
              /         \ /          \
             /    SOCIAL \   MEDIA    \
            /     (40-60%) \          \
           /__________________________\
          /            \   /            \
         /   WORD OF   \ /   ALTERNATIVE \
        /     MOUTH    X      SOURCES     \
       /    (20-40%)   \                  \
      /_________________\__________________\
```

**Counter-Rumour Strategies:**
- Pre-bunking (advance information)
- Multiple official channels
- Trusted messenger activation
- Rapid factual correction
- Transparency about uncertainty

---

## 4. Multi-Agency Coordination Techniques

### 4.1 Interoperability Matrix

**Purpose:** Map communication and coordination between different agencies and jurisdictions

**Matrix Template:**
```
┌───────────────┬────────────┬────────────┬────────────┬────────────┐
│   FROM/TO     │  BOMBEIROS │  PSP/GNR   │    SNS     │ PROTEÇÃO   │
│               │            │            │            │    CIVIL   │
├───────────────┼────────────┼────────────┼────────────┼────────────┤
│  BOMBEIROS    │     -      │  Tactical  │  Patient   │  Strategic │
│               │            │  Channel   │  Handoff   │  Support   │
├───────────────┼────────────┼────────────┼────────────┼────────────┤
│    PSP/GNR    │ Tactical   │     -      │  Traffic   │  Security  │
│               │  Channel    │            │  Control   │  Support   │
├───────────────┼────────────┼────────────┼────────────┼────────────┤
│      SNS      │ Patient    │  Traffic   │     -      │  Medical   │
│               │  Handoff    │  Control   │            │  Support   │
├───────────────┼────────────┼────────────┼────────────┼────────────┤
│ PROTEÇÃO CIVIL│ Strategic  │  Security │  Medical   │     -      │
│               │  Support   │  Support   │  Support   │            │
└───────────────┴────────────┴────────────┴────────────┴────────────┘
```

**Coordination Levels:**
- **Tactical:** Real-time operations (scene-level)
- **Operational:** Resource coordination (incident-level)
- **Strategic:** Policy and resource allocation (event-level)

**Flow Integration:** [`step-02c-random-selection.md`](/_bmad/core/workflows/brainstorming/steps/step-02c-random-selection.md)

### 4.2 Joint Operations Protocol

**Purpose:** Design how multiple agencies work together during complex emergencies

**Protocol Elements:**
1. **Unified Command Structure:** Who leads what?
2. **Incident Action Plan:** What are shared objectives?
3. **Coordination Meetings:** How often? Who attends?
4. **Information Sharing:** What? When? How?
5. **Resource Management:** Who controls what?
6. **Public Information:** Who speaks for the event?

**Command Options:**
| Model | Best For | Challenges |
|-------|----------|------------|
| Single Command | Single agency dominant | Agency relations |
| Unified Command | Multiple equal partners | Decision consensus |
| Area Command | Multiple incidents | Resource competition |
| Team Command | Large-scale events | Complexity |

### 4.3 Information Sharing Framework

**Purpose:** Define what information flows between which agencies at what times

**Information Categories:**
| Category | Examples | Timing | Security |
|----------|----------|--------|----------|
| Operational | Location, status, resources | Real-time | Internal |
| Tactical | Tactics, assignments | Frequent | Internal |
| Strategic | Objectives, priorities | Periodic | Limited |
| Public | General information | As needed | Public |
| Sensitive | Intelligence, personal data | As required | Restricted |

**Sharing Mechanisms:**
- **Push:** Proactive sharing (alerts, updates)
- **Pull:** Request-based (status checks, queries)
- **Publish/Subscribe:** Topic-based subscriptions

---

## 5. Training & Readiness Techniques

### 5.1 Competency Tree Mapping

**Purpose:** Map skills required for different emergency scenarios and identify gaps

**Competency Framework:**
```
                    ┌─────────────────┐
                    │  CORE COMPETENCY│
                    │     (All)       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐    ┌──────────┐   ┌──────────┐
        │ FIRE    │    │ TECHNICAL│   │  EMS     │
        │         │    │ RESCUE   │   │          │
        └────┬────┘    └────┬─────┘   └────┬─────┘
             │              │              │
        [Fire Suppression] [Rope Rescue] [BLS/ALS]
             │              │              │
             └──────────────┼──────────────┘
                           │
                    ┌──────┴──────┐
                    │ SPECIALIZED │
                    │  (Select)   │
                    └─────────────┘
                    • Hazmat
                    • Water Rescue
                    • Wildfire
                    • Urban Search
```

**Assessment Dimensions:**
- **Knowledge:** What they know
- **Skills:** What they can do
- **Judgments:** How they decide
- **Physical:** What they can handle
- **Psychological:** How they cope

**Flow Integration:** [`step-04-idea-organization.md`](/_bmad/core/workflows/brainstorming/steps/step-04-idea-organization.md) (training prioritization)

### 5.2 Scenario-Based Training Design

**Purpose:** Create realistic training scenarios that build decision-making under pressure

**Scenario Design Framework:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    SCENARIO DESIGN                              │
├─────────────────────────────────────────────────────────────────┤
│  OBJECTIVES                                                    │
│  ────────────  What competencies does this build?              │
│                                                                │
│  SITUATION                                                     │
│  ──────────  What is the context and conditions?              │
│                                                                │
│  INJECTION POINTS                                              │
│  ──────────────  Where do we add complexity or change?        │
│                                                                │
│  EXPECTED DECISIONS                                            │
│  ──────────────────  What should participants do?              │
│                                                                │
│  SUCCESS CRITERIA                                              │
│  ────────────────  How do we measure performance?            │
└─────────────────────────────────────────────────────────────────┘
```

**Training Exercise Types:**
| Type | Purpose | Duration |
|------|---------|----------|
| Discussion-Based | Decision-making, protocols | 1-4 hours |
| Tabletop | Coordination, command | 2-8 hours |
| Functional | Systems, procedures | 4-8 hours |
| Full-Scale | Realism, integrated response | 4+ hours |
| Live Fire/Training | Tactical skills | Hours |

### 5.3 After Action Review Integration

**Purpose:** Connect real incident learning to training program updates

**Integration Loop:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   INCIDENT  │───▶│     AAR     │───▶│   LESSONS   │───▶│  TRAINING   │
│             │    │             │    │   CAPTURED   │    │   UPDATE    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                   │                   │
      │                  │                   │                   │
      ▼                  ▼                   ▼                   ▼
  Document          Extract            Prioritize           Revise
  Everything         Learnings          Actions             Programs
```

---

## 6. Technology Integration Techniques

### 6.1 GIS-Centric Planning

**Purpose:** Use geographic information systems for emergency planning and response

**GIS Applications:**
| Phase | Application |
|-------|------------|
| Prevention | Risk mapping, hazard identification |
| Preparedness | Pre-incident planning, resource placement |
| Response | Real-time situational awareness |
| Recovery | Damage assessment, impact mapping |

**Key GIS Layers:**
- **Base:** Roads, buildings, terrain
- **Risk:** Fire risk, flood zones, hazardous sites
- **Response:** Stations, hydrants, shelters, hospitals
- **Dynamic:** Incidents, resources, status

### 6.2 Communications Architecture

**Purpose:** Design reliable communication systems for emergency operations

**Architecture Components:**
```
┌─────────────────────────────────────────────────────────────┐
│                  COMMUNICATIONS ARCHITECTURE                │
├─────────────────────────────────────────────────────────────┤
│  FIELD LAYER                                                │
│  Radios, phones, cellular, satellite, data terminals       │
├─────────────────────────────────────────────────────────────┤
│  NETWORK LAYER                                              │
│  Repeaters, networks, systems, interoperability gateways   │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                          │
│  CAD, dispatch, records, resource management                │
├─────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                          │
│  APIs, data sharing, common operating picture               │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Decision Support Systems

**Purpose:** Create tools that help commanders make better decisions faster

**System Categories:**
| Category | Examples | Output |
|----------|----------|--------|
| Predictive | Fire spread, traffic, flood | Forecasts |
| Optimization | Resource allocation, routing | Recommendations |
| Visualization | Common operating picture | Situational display |
| Analytics | Performance metrics, trends | Insights |

---

## 7. Innovation Emergency Techniques

### 7.1 Lean Startup for Emergency Services

**Purpose:** Apply startup methodology to emergency service innovation

**Adaptation:**
| Startup Concept | Emergency Application |
|----------------|----------------------|
| MVP | Minimum viable training, pilot procedure |
| Customer Development | Firefighter interviews, citizen surveys |
| Pivot/Persist | Strategy adjustment based on outcomes |
| Validated Learning | Measurable improvement in operations |
| Innovation Accounting | Response times, survival rates, citizen satisfaction |

**Emergency Build-Measure-Learn:**
```
BUILD → Pilot new approach in controlled setting
   ↓
MEASURE → Collect data on outcomes and adoption
   ↓
LEARN → Analyze results, identify improvements
   ↓
       ↓ Yes        ↓ No
   WORKS? ──────→ ADJUST
       No
       ↓
    PIVOT
```

**Full Workflow Integration:** All brainstorming steps apply

### 7.2 Design Thinking for Citizen Experience

**Purpose:** Use design thinking for emergency citizen journey

**5-Phase Process:**
1. **Empathize:** Understand citizen needs and fears
2. **Define:** Frame the problem from citizen perspective
3. **Ideate:** Generate solutions (quantity over quality)
4. **Prototype:** Create testable versions of solutions
5. **Test:** Get feedback from actual citizens

**Citizen Journey Map:**
```
┌─────────────────────────────────────────────────────────────────┐
│                 CITIZEN EMERGENCY JOURNEY                       │
├─────────────────────────────────────────────────────────────────┤
│  BEFORE           │  DURING             │  AFTER               │
│  ──────           │  ──────             │  ──────              │
│  • Risk awareness │  • Alert receipt    │  • Return home       │
│  • Preparedness   │  • Information      │  • Damage assessment │
│  • Planning       │  • Action taken     │  • Support access    │
│                   │  • Help received    │  • Recovery          │
└─────────────────────────────────────────────────────────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
   Prevention       Response              Recovery
```

**Flow Integration:** [`step-03-technique-execution.md`](/_bmad/core/workflows/brainstorming/steps/step-03-technique-execution.md)

### 7.3 Sprint Methodology for Emergency Planning

**Purpose:** Adapt Google Sprint for emergency service improvements

**5-Day Sprint:**
| Day | Focus | Emergency Application |
|-----|-------|---------------------|
| Monday | Map | Current emergency response flow |
| Tuesday | Sketch | Alternative approaches |
| Wednesday | Decide | Select best solution |
| Thursday | Prototype | Create pilot version |
| Friday | Test | Validate with stakeholders |

---

## 8. Technique Selection Guide

### By Session Type

| Session Goal | Recommended Techniques |
|--------------|------------------------|
| Protocol Improvement | 1.1 SCAMPER, 1.2 AAR, 2.1 Decision Tree |
| Multi-Agency Coordination | 4.1 Interoperability Matrix, 4.2 Joint Operations |
| Citizen Engagement | 3.1 Empathy Map, 3.2 Vulnerable Populations |
| Training Design | 5.1 Competency Tree, 5.2 Scenario Design |
| Technology Planning | 6.1 GIS-Centric, 6.3 Decision Support |
| Innovation Projects | 7.1 Lean Startup, 7.3 Sprint Methodology |

### By Emergency Service Type

| Service | Top 5 Techniques |
|---------|------------------|
| **Bombeiros** | 1.1 SCAMPER, 2.1 Decision Tree, 5.1 Competency, 6.1 GIS, 2.2 Response Time |
| **Proteção Civil** | 1.3 Scenario Planning, 3.1 Empathy Map, 4.1 Interoperability, 3.3 Community Resilience, 2.3 Mutual Aid |
| **EMS** | 2.1 Decision Tree, 3.1 Empathy Map, 5.2 Scenario Design, 6.3 Decision Support, 4.2 Joint Operations |

---

## 9. Workflow Integration Matrix

| Technique | Step 01 | Step 02A | Step 02B | Step 02C | Step 02D | Step 03 | Step 04 |
|----------|---------|----------|----------|----------|----------|---------|---------|
| 1.1 SCAMPER | | | | | | ● | |
| 1.2 AAR | | | | | | | ● |
| 1.3 Scenarios | | | ● | | | | |
| 1.4 Command Map | | | | ● | | | |
| 2.1 Decision Tree | | | | | | ● | |
| 2.2 Time Decomposition | | | | | | | ● |
| 3.1 Empathy Map | | | | | | ● | |
| 3.2 Vulnerable Journey | | | | | | | ● |
| 4.1 Interoperability | | | | ● | | | |
| 5.1 Competency Tree | | | | | | | ● |
| 6.1 GIS-Centric | | ● | | | | | |
| 7.1 Lean Startup | ● | | | | ● | ● | ● |

**Legend:**
- ● = Primary integration point
- (blank) = Secondary or no direct integration

---

## 10. Emergency Services Glossary

| Term | Portuguese | Definition |
|------|------------|------------|
| Incident Command System | Sistema de Comando de Incidentes (SCI) | Standardized approach to command, control, and coordination |
| After Action Review | Revisão Pós-Ação (RPA) | Structured debrief process |
| Mutual Aid | Apoio Mútuo | Pre-arranged assistance between agencies |
| Unified Command | Comando Unificado | Multiple agencies sharing command |
| Common Operating Picture | Imagem Operacional Comum | Shared situational awareness |
| Emergency Operations Center | Centro de Operações de Emergência (COE) | Coordination facility |
| Mass Casualty Incident | Incidente de Vítimas em Massa (IVM) | Large-scale medical emergency |
| Unified Command | Comando Único | Single incident commander |
| Operational Period | Período Operacional | Defined work shift during event |
| Incident Action Plan | Plano de Ação de Incidente (PAI) | Documented objectives and tactics |

---

## References

- **FEMA:** National Incident Management System (NIMS)
- **ANEPC:** Autoridade Nacional de Emergência e Proteção Civil (Portugal)
- **USFA:** United States Fire Administration
- **IAFF:** International Association of Fire Fighters
