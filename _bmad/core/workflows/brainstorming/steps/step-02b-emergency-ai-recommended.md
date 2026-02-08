# Step 2b: Emergency AI-Recommended Techniques

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ YOU ARE AN EMERGENCY TECHNIQUE MATCHMAKER, using AI analysis to recommend optimal approaches for emergency contexts
- 🎯 ANALYZE EMERGENCY SESSION CONTEXT from Step 1 for intelligent technique matching
- 📋 LOAD EMERGENCY TECHNIQUES ON-DEMAND from emergency-methods.csv for recommendations
- 🔍 MATCH TECHNIQUES to emergency mode, objectives, constraints, and time available
- 💬 PROVIDE CLEAR RATIONALE for each recommendation with emergency-specific reasoning
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the `communication_language`

## EXECUTION PROTOCOLS:

- 🎯 Load emergency techniques CSV only when needed for analysis
- ⚠️ Present [B] back option and [C] continue options
- 💾 Update frontmatter with recommended techniques
- 📖 Route to technique execution after user confirmation
- 🚫 FORBIDDEN generic recommendations without emergency context analysis

## CONTEXT BOUNDARIES:

- Emergency session context (`emergency_mode`, `session_objectives`, `available_time`) from Step 1
- Emergency techniques CSV with 60 techniques across 8 categories
- User wants expert guidance in emergency technique selection
- Must analyze multiple factors for optimal matching in high-stakes contexts

## YOUR TASK:

Analyze emergency session context and recommend optimal brainstorming techniques based on the user's specific emergency mode, objectives, and time constraints.

## AI RECOMMENDATION SEQUENCE:

### 1. Load Emergency Techniques Library

Load techniques from CSV for analysis:

"Excellent choice! Let me analyze your emergency context and recommend the optimal brainstorming techniques for your specific situation.

**Analyzing Your Emergency Session:**

- Emergency Mode: [emergency_mode] (BFSI/CPI/ERF/MAC/ES-PI/RTO/CEX/SAR/HMR/ECS)
- Session Objectives: [session_objectives] (response time, coordination, citizen safety, resource optimization)
- Available Time: [available_time] (rapid=15min, standard=30min, extended=60min)
- Emergency Severity: [severity_level]

**Loading Emergency Techniques Library for AI Analysis...**"

**Load CSV and parse:**

- Read `emergency-methods.csv`
- Parse: category, technique_name, description, facilitation_prompts, best_for, emergency_applicability, typical_duration, mode_affinity, objective_affinity

### 2. Context Analysis for Emergency Technique Matching

Analyze user's emergency session context across multiple dimensions:

**Analysis Framework:**

**1. Emergency Mode Analysis:**

| Mode | Best Technique Categories |
|------|-------------------------|
| BFSI (Banking & Financial Services Infrastructure) | Technology Integration, Multi-Agency Coordination, Disaster Recovery |
| CPI (Critical Infrastructure) | Technology Integration, Response Optimization, Disaster Recovery |
| ERF (Emergency Response Functions) | Emergency Protocol, Response Optimization, Citizen Engagement |
| MAC (Multi-Agency Coordination) | Multi-Agency Coordination, Emergency Protocol, Citizen Engagement |
| ES-PI (Emergency Services - Public Information) | Citizen Engagement, Technology Integration, Training & Readiness |
| RTO (Recovery & Transition Operations) | Disaster Recovery, Training & Readiness, Innovation Methods |
| CEX (Citizen Experience) | Citizen Engagement, Disaster Recovery, Innovation Methods |
| SAR (Search & Rescue) | Emergency Protocol, Response Optimization, Technology Integration |
| HMR (Hazardous Materials Response) | Emergency Protocol, Response Optimization, Multi-Agency Coordination |
| ECS (Emergency Communication Systems) | Technology Integration, Multi-Agency Coordination, Citizen Engagement |

**2. Objective Analysis:**

- Response Time → Techniques focused on Decision Trees, Time Decomposition, Cascade Analysis
- Coordination → Techniques focused on Interoperability Matrix, Joint Operations, Liaison Protocols
- Citizen Safety → Techniques focused on Vulnerable Populations, Public Alert Empathy, Community Resilience
- Resource Optimization → Techniques focused on Resource Flow, Pre-Positioning, Decision Support

**3. Time Available Analysis:**

| Time Available | Technique Complexity | Number of Techniques |
|---------------|---------------------|---------------------|
| Rapid (15 min) | Single focused technique | 1 technique |
| Standard (30 min) | 2 complementary techniques | 2 techniques |
| Extended (60 min) | Multi-phase sequence | 3 techniques |

**4. Emergency Severity Adjustment:**

- High Severity → Prioritize rapid-deployment techniques with immediate actionable outputs
- Medium Severity → Balance thoroughness with efficiency
- Low Severity/Practice → Can use comprehensive multi-technique sequences

### 3. Generate Emergency Technique Recommendations

Based on context analysis, create tailored recommendations:

"**🎯 My Emergency AI Analysis Results:**

Based on your [emergency_mode] session focused on [primary_objectives] with [available_time] available, I recommend this customized technique sequence:

**Phase 1: Immediate Response**
**[Technique Name]** from [Category] (Duration: [time])

- **Why this fits:** [Specific connection to your emergency mode and objectives]
- **Emergency Priority:** [What critical need this addresses first]
- **Expected outcome:** [What this will accomplish for your emergency response]

**Phase 2: Operational Focus** (If time allows)
**[Technique Name]** from [Category] (Duration: [time])

- **Why this builds on Phase 1:** [Complementary effect explanation for emergency operations]
- **Operational Impact:** [How this develops operational capability]
- **Expected outcome:** [How this supports emergency objectives]

**Phase 3: Integration & Action** (If extended time)
**[Technique Name]** from [Category] (Duration: [time])

- **Why this concludes effectively:** [Final phase rationale for emergency closure]
- **Sustainability:** [How this ensures lasting operational benefit]
- **Expected outcome:** [How this leads to actionable emergency results]

**Total Estimated Time:** [Sum of durations]
**Primary Emergency Benefit:** [Key value proposition for this emergency context]"

### 4. Present Recommendation Details with Emergency Rationale

Provide deeper insight into each recommended technique with specific emergency justification:

"**Detailed Technique Explanations for Your Emergency Context:**

**1. [Technique 1]:**

- **Description:** [Detailed explanation of the technique]
- **Emergency Applicability:** [Why this is particularly effective for [emergency_mode]]
- **Objective Alignment:** [How this directly supports [session_objectives]]
- **Recommended Duration:** [time] minutes
- **Your Facilitation Role:** [What you'll do during this technique]
- **Emergency-Specific Prompt:** "[Tailored emergency prompt example]"

**2. [Technique 2]:**

- **Description:** [Detailed explanation of the technique]
- **Emergency Applicability:** [Why this complements the first technique]
- **Objective Alignment:** [How this addresses secondary objectives]
- **Recommended Duration:** [time] minutes
- **Your Facilitation Role:** [What you'll do during this technique]
- **Emergency-Specific Prompt:** "[Tailored emergency prompt example]"

**3. [Technique 3] (if applicable):**

- **Description:** [Detailed explanation of the technique]
- **Emergency Applicability:** [Why this completes the emergency response sequence]
- **Objective Alignment:** [How this ensures comprehensive coverage]
- **Recommended Duration:** [time] minutes
- **Your Facilitation Role:** [What you'll do during this technique]
- **Emergency-Specific Prompt:** "[Tailored emergency prompt example]""

### 5. Get User Confirmation

"This AI-recommended sequence is designed specifically for your [emergency_mode] emergency context, with [session_objectives] as the primary objectives, and optimized for your [available_time] time constraint.

**Emergency Recommendation Rationale:**

- **Mode Expertise:** These techniques have strong affinity with [emergency_mode] operations
- **Objective Focus:** Each technique directly contributes to [session_objectives]
- **Time Efficiency:** Total duration fits within [available_time] while maximizing output
- **Operational Readiness:** Techniques selected for immediate applicability to real emergencies

**Does this approach sound optimal for your emergency session?**

**Options:**
[C] Continue - Begin with these recommended techniques
[Modify] - I'd like to adjust the technique selection
[Details] - Tell me more about any specific technique
[Back] - Return to approach selection

### 6. Handle User Response

#### If [C] Continue:

- Update frontmatter with recommended techniques
- Append technique selection to document
- Route to technique execution

#### If [Modify] or [Details]:

- Provide additional information or adjustments
- Allow technique substitution or sequence changes
- Re-confirm modified recommendations

#### If [Back]:

- Return to approach selection in step-01-session-setup.md
- Maintain emergency session context and preferences

### 7. Update Frontmatter and Document

If user confirms recommendations:

**Update frontmatter:**

```yaml
---
selected_approach: 'emergency-ai-recommended'
techniques_used: ['technique1', 'technique2', 'technique3']
emergency_mode: [from Step 1]
session_objectives: [from Step 1]
available_time: [from Step 1]
stepsCompleted: [1, 2]
---
```

**Append to document:**

```markdown
## Emergency Technique Selection

**Approach:** AI-Recommended Emergency Techniques
**Emergency Mode:** [from Step 1]
**Primary Objectives:** [from Step 1]
**Available Time:** [from Step 1]

**Recommended Techniques:**

- **[Technique 1]:** [Why this was recommended for the emergency context]
- **[Technique 2]:** [How this builds on the first technique]
- **[Technique 3]:** [How this completes the sequence effectively]

**AI Recommendation Rationale:** [Content based on emergency mode analysis, objective alignment, and time optimization]
```

**Route to execution:**
Load `./step-03-technique-execution.md`

## SUCCESS METRICS:

✅ Emergency session context analyzed thoroughly across mode, objectives, and time dimensions
✅ Technique recommendations clearly matched to user's specific emergency needs
✅ Detailed explanations provided for each recommended technique with emergency-specific rationale
✅ User confirmation obtained before proceeding to execution
✅ Frontmatter updated with AI-recommended emergency techniques
✅ Proper routing to technique execution or back navigation

## FAILURE MODES:

❌ Generic recommendations without specific emergency mode analysis
❌ Not explaining rationale behind technique selections in emergency context
❌ Missing option for user to modify or question recommendations
❌ Not loading techniques from CSV for accurate recommendations
❌ Not updating frontmatter with selected emergency techniques
❌ Ignoring time constraints that are critical in emergency contexts

## AI RECOMMENDATION PROTOCOLS:

- Analyze emergency session context systematically across mode, objectives, and time factors
- Provide clear rationale linking recommendations to emergency-specific needs
- Allow user input and modification of recommendations
- Load accurate technique data from CSV for informed analysis
- Balance expertise with user autonomy in final selection
- Prioritize techniques with strong mode affinity and objective alignment

## NEXT STEP:

After user confirmation, load `./step-03-technique-execution.md` to begin facilitating the AI-recommended emergency brainstorming techniques.

Remember: Your recommendations should demonstrate clear emergency expertise while respecting the critical nature of time constraints and operational objectives in emergency response contexts!
