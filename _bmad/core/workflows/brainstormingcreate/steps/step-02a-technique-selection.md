# Step 2a: Technique Selection

## Goal

Select the most appropriate brainstorming technique(s) for the emergency services innovation session based on the session setup completed in Step 1.

## Input

- Session setup summary from Step 1
- Available emergency brainstorming techniques from `{installed_path}/emergency-methods.csv`

## Process

### 2.1 Technique Overview

Based on the session setup, recommend one or more techniques from the following categories:

#### Category 1: Problem-Focused Techniques
- **SCAMPER**: Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse - useful for equipment and process innovation
- **5 Whys**: Deep dive into root causes of emergency response challenges
- **Problem Tree Analysis**: Map causes and effects of emergency service challenges

#### Category 2: User-Centered Techniques
- **Empathy Mapping**: Understand citizens', victims', and responders' needs and experiences
- **User Journey Mapping**: Map the experience of people in emergency situations
- **Persona Development**: Create detailed profiles of different community members and their emergency needs

#### Category 3: Opportunity Discovery
- **Brainstorming (Classic)**: Generate ideas freely with quantity focus
- **Brainwriting**: Written idea generation for quieter participants
- **Random Word Stimulation**: Use random words to spark creative connections
- **SCAMPER for Services**: Apply SCAMPER to service delivery instead of products

#### Category 4: Constraint-Based Innovation
- **Reverse Brainstorming**: Solve problems by asking "how might we cause this problem?"
- **Assumption Busting**: Challenge fundamental assumptions about emergency services
- **Pre-Mortem Analysis**: Imagine the innovation has failed and analyze why

#### Category 5: Systemic Thinking
- **Systems Mapping**: Map the emergency services ecosystem and interactions
- **STEEP Analysis**: Social, Technological, Economic, Environmental, Political factors
- **PESTLE for Emergency Services**: Political, Economic, Social, Technological, Legal, Environmental factors affecting emergency services

#### Category 6: Scenario-Based
- **Scenario Planning**: Develop scenarios for future emergency situations
- **Role Storming**: Imagine solutions from different stakeholder perspectives
- **Worst-Case Ideation**: Generate solutions for best-case responses to worst-case scenarios

#### Category 7: Startup-Inspired
- **Lean Canvas for Emergency Services**: Business model canvas adapted for public safety
- **Design Thinking Sprint**: 5-day sprint methodology adapted for emergency services
- **MVP Canvas**: Identify minimum viable solutions for emergency innovations

### 2.2 Technique Selection Matrix

Match session type to recommended techniques:

| Session Type | Primary Technique | Secondary Techniques |
|--------------|-------------------|----------------------|
| Challenge-Focused | SCAMPER | 5 Whys, Problem Tree |
| Opportunity-Exploration | Brainstorming | Random Word, SCAMPER |
| Scenario-Based | Scenario Planning | Role Storming, Pre-Mortem |
| Equipment/Technology | SCAMPER | Systems Mapping, Pre-Mortem |
| Process Audit | 5 Whys | Empathy Mapping, Systems Mapping |
| Design Thinking | Empathy Mapping | User Journey, MVP Canvas |

### 2.3 Emergency-Specific Adaptations

Apply emergency services context to each technique:

#### SCAMPER Adaptations for Emergency Services:
- **Substitute**: What if we substitute personnel roles? Equipment? Technology?
- **Combine**: What services can be combined? What resources can be shared?
- **Adapt**: How can we adapt best practices from other countries?
- **Modify**: How can we modify current processes? Scale up/down?
- **Put to another use**: How can existing equipment be repurposed?
- **Eliminate**: What steps can be eliminated? What bureaucracy?
- **Reverse**: What if we did the opposite? What if citizens responded differently?

#### Empathy Mapping for Emergency Services:
- **Think and Feel**: What are citizens worried about? What do responders worry about?
- **Hear**: What information are they receiving? What rumors exist?
- **See**: What do they see in the community? In media?
- **Say and Do**: What do they say about emergencies? How do they behave?
- **Pain**: What are their fears? Frustrations? Barriers?
- **Gain**: What do they want? What success looks like?

### 2.4 Technique Selection Decision

Present recommended technique(s) to user:

```markdown
### Recommended Techniques

Based on your session setup, I recommend:

**Primary Technique**: [Technique Name]
- **Why**: [Brief explanation of fit with session goals]
- **Focus**: [What this technique emphasizes]

**Secondary Techniques** (for variety):
1. [Technique 1] - [Brief description]
2. [Technique 2] - [Brief description]

**Emergency Services Adaptations**:
- [Specific adaptation for context]
- [Another adaptation]
```

### 2.5 User Confirmation

Confirm technique selection with user before proceeding:

- Does the recommended technique align with the session goals?
- Are there specific techniques the user prefers?
- Should multiple techniques be combined?

## Output

Update session document with technique selection:

```markdown
---

### Selected Technique(s)

**Primary**: [Technique Name]
**Secondary**: [Technique Names]

**Technique Rationale**: [Why these techniques fit the session]

**Emergency Services Adaptations Applied**:
- [Adaptation 1]
- [Adaptation 2]

---
```

## Next Step

Proceed to `steps/step-03-technique-execution.md` to execute the selected brainstorming technique(s).
