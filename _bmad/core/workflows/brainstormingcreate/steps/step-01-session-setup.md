# Step 1: Emergency Innovation Session Setup

## Goal

Establish the context for the brainstorming session by gathering information about the emergency services organization, identifying key challenges, and understanding the innovation goals.

## Input

- Config loaded from `{project-root}/_bmad/core/config.yaml`
- `context_file` if provided during workflow invocation
- `{installed_path}/emergency-methods.csv` for technique selection

## Process

### 1.1 Organization Context (Required)

Ask the user to provide information about their organization:

**Required Information:**
- **Organization Type**: Fire department (bombeiros), Civil protection (protecao civil), Search and rescue, Emergency medical services, Combined emergency services, Other
- **Organization Size**: Number of personnel, number of stations/facilities, geographic coverage area
- **Jurisdiction Type**: Municipal, regional, national, international coordination
- **Current Challenges**: Primary operational challenges they face

**Optional Information:**
- Budget constraints or focus areas
- Recent incidents or near-misses that revealed gaps
- Political or administrative constraints
- Community demographics and risk profile
- Existing technology and equipment inventory

### 1.2 Emergency Services Domains (Required)

Identify which emergency services domains are relevant for this session:

**Core Domains:**
- [ ] **Firefighting Operations**: Structural fire, wildland fire, vehicle fire, industrial fire response
- [ ] **Emergency Medical Services**: First response, ambulance services, trauma care
- [ ] **Search and Rescue**: Urban search and rescue, wilderness rescue, water rescue, technical rescue
- [ ] **Hazardous Materials**: Hazmat detection, containment, decontamination
- [ ] **Disaster Management**: Natural disaster response, mass casualty incidents, evacuation management
- [ ] **Community Risk Reduction**: Fire prevention, public education, building safety inspections
- [ ] **Training and Preparedness**: Personnel training, exercises, preparedness planning
- [ ] **Communications and Command**: Dispatch, incident command, interagency coordination
- [ ] **Administration and Logistics**: Fleet management, equipment maintenance, resource allocation

### 1.3 Innovation Focus Area (Required)

Determine the primary focus of the brainstorming session:

**Startup-Inspired Categories:**
- [ ] **Service Innovation**: New or improved services to citizens and communities
- [ ] **Operational Efficiency**: Streamlining internal processes and resource use
- **Technology Integration**: New tools, software, or digital transformation
- [ ] **Prevention and Preparedness**: Community-facing prevention programs
- [ ] **Response Optimization**: Faster, safer, more effective emergency response
- [ ] **Data and Analytics**: Better decision-making through data collection/analysis
- [ ] **Interagency Coordination**: Improving collaboration with other emergency services
- [ ] **Community Engagement**: Building public trust and involvement
- [ ] **Personnel Development**: Training, recruitment, retention improvements
- [ ] **Budget Optimization**: Doing more with limited resources

### 1.4 Session Type Selection

Determine the session format:

**Session Types:**
1. **Challenge-Focused**: Start with a specific problem and generate solutions
2. **Opportunity-Exploration**: Identify unmet needs and potential innovations
3. **Scenario-Based**: Work through hypothetical emergency scenarios
4. **Equipment/Technology Review**: Evaluate current tools and imagine improvements
5. **Process Audit**: Analyze existing processes for optimization opportunities
6. **Design Thinking**: User-centered design approach to emergency services

### 1.5 Success Criteria (Required)

Define what success looks like for this session:

**Quantifiable Goals:**
- Number of ideas to generate (recommend 50+ for breakthrough thinking)
- Categories or themes to explore
- Specific outputs needed (concepts, proposals, prioritized lists)
- Timeline for implementation consideration
- Stakeholders who will evaluate or approve ideas

### 1.6 Constraints and Non-Negotiables

Identify any constraints that must be respected:

**Common Constraints:**
- Budget limitations (capital, operational)
- Timeline for implementation
- Regulatory or legal requirements
- Interoperability requirements with existing systems
- Training and adoption time acceptable
- Physical infrastructure limitations

## Output

Generate a session setup summary appended to the document:

```markdown
---

## Session Setup Summary

### Organization Profile
- **Type**: [Organization Type]
- **Size**: [Personnel/Facilities]
- **Jurisdiction**: [Geographic/Administrative Scope]

### Emergency Services Domains
- [Domain 1]
- [Domain 2]
- [etc.]

### Innovation Focus Area
- [Primary Focus Category]

### Session Type
- [Selected Session Type]

### Success Criteria
- Target idea count: [Number]
- Key themes: [List]
- Required outputs: [List]
- Timeline considerations: [Notes]
- Decision-makers: [Stakeholders]

### Constraints
- [Constraint 1]
- [Constraint 2]
- [etc.]

---
```

## Next Step

Proceed to `steps/step-02a-technique-selection.md` to select the appropriate brainstorming technique(s) for the session.
