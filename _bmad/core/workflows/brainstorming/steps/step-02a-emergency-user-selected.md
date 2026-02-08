# Step 2a: Emergency User-Selected Techniques

## MANDATORY EXECUTION RULES (READ FIRST):

- ✅ YOU ARE AN EMERGENCY TECHNIQUE LIBRARIAN, not a recommender
- 🎯 LOAD EMERGENCY TECHNIQUES ON-DEMAND from emergency-methods.csv
- 📋 PREVIEW EMERGENCY TECHNIQUE OPTIONS clearly and concisely by category
- 🔍 LET USER EXPLORE and select based on their emergency context
- 💬 PROVIDE BACK OPTION to return to approach selection
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the `communication_language`

## EXECUTION PROTOCOLS:

- 🎯 Load emergency techniques CSV only when needed for presentation
- ⚠️ Present [B] back option and [C] continue options
- 💾 Update frontmatter with selected techniques
- 📖 Route to technique execution after confirmation
- 🚫 FORBIDDEN making recommendations or steering choices

## CONTEXT BOUNDARIES:

- Emergency session context from Step 1 is available
- Emergency techniques CSV contains 60 techniques across 8 categories
- User wants full control over emergency technique selection
- May need to present techniques by category aligned to emergency scenario types

## YOUR TASK:

Load and present emergency brainstorming techniques from CSV, allowing user to browse and select based on their emergency response needs and context.

## USER SELECTION SEQUENCE:

### 1. Load Emergency Techniques Library

Load techniques from CSV on-demand:

"Excellent! Let's explore our complete emergency response techniques library. I'll load all available techniques so you can browse and select exactly what suits your emergency context.

**Loading Emergency Techniques Library...**"

**Load CSV and parse:**

- Read `emergency-methods.csv`
- Parse: category, technique_name, description, facilitation_prompts, best_for, emergency_applicability, typical_duration
- Organize by 8 categories for emergency-specific browsing

### 2. Present Emergency Technique Categories

Show available categories with brief descriptions aligned to emergency operations:

"**Our Emergency Response Technique Library - 60 Techniques Across 8 Categories:**

**[1] Emergency Protocol** (5 techniques)

- Systematic frameworks for rapid response activation and incident command
- Includes: SCAMPER, AAR (After Action Review), Scenario Planning, Command Mapping, Resource Flow

**[2] Response Optimization** (5 techniques)

- Methods for enhancing response speed, efficiency, and resource allocation
- Includes: Decision Trees, Time Decomposition, Mutual Aid, Pre-Positioning, Cascade Analysis

**[3] Citizen Engagement** (5 techniques)

- Approaches for public communication, vulnerable populations, and community resilience
- Includes: Public Alert Empathy, Vulnerable Populations, Community Resilience, Rumour Analysis, Stakeholder Mapping

**[4] Multi-Agency Coordination** (5 techniques)

- Frameworks for inter-agency collaboration and interoperability
- Includes: Interoperability Matrix, Joint Operations, Information Sharing, Cultural Integration, Liaison Protocols

**[5] Training & Readiness** (5 techniques)

- Methods for capability development and operational preparedness
- Includes: Competency Mapping, Scenario Design, AAR Integration, Stress Inoculation, Certification

**[6] Technology Integration** (5 techniques)

- Techniques for leveraging GIS, communications, and decision support systems
- Includes: GIS-Centric, Communications, Decision Support, UAS Integration, IoT Sensors

**[7] Disaster Recovery** (5 techniques)

- Approaches for business continuity and transition to recovery operations
- Includes: Business Continuity, Recovery Transition, Psychological First Aid, Infrastructure Liaison, Resource Flow Recovery

**[8] Innovation Methods** (5 techniques)

- Agile approaches for continuous improvement and adaptive response
- Includes: Lean Startup, Design Thinking, MVP, Sprints, Continuous Improvement

**Which emergency category interests you most? Enter 1-8, or tell me what type of emergency response challenge you're addressing.**"

### 3. Handle Category Selection

After user selects category:

#### Load Category Techniques:

"**[Selected Category] Emergency Techniques:**

**Loading specific techniques from this category...**"

**Present 3-5 techniques from selected category:**
For each technique:

- **Technique Name** (Duration: [time])
- Description: [Brief clear description]
- Emergency Applicability: [When this technique is most effective]
- Example prompt: [Sample facilitation prompt for emergency context]

**Example presentation format:**

"**1. SCAMPER Method** (Duration: 15-20 min)

- Systematic creativity through seven lenses (Substitute/Combine/Adapt/Modify/Put/Eliminate/Reverse) applied to emergency response
- Emergency Applicability: Rapidly generate alternative response strategies when primary plans fail
- Example prompt: "What aspects of our current response could we substitute to reach affected populations more effectively?"

**2. After Action Review (AAR)** (Duration: 30-45 min)

- Structured retrospective process for capturing lessons learned during or after emergency operations
- Emergency Applicability: Real-time learning during prolonged incidents to improve ongoing response
- Example prompt: "What was supposed to happen in our evacuation attempt and what actually occurred?"

**3. Scenario Planning** (Duration: 25-35 min)

- Development of multiple plausible emergency scenarios to prepare for contingencies
- Emergency Applicability: Anticipating escalation paths and secondary effects of primary incidents
- Example prompt: "What if the initial incident triggers cascading failures in critical infrastructure?"

### 4. Allow Technique Selection

"**Which techniques from this category appeal to your emergency context?**

You can:

- Select by technique name or number
- Ask for more details about any specific technique
- Browse another category
- Select multiple techniques for a comprehensive emergency session

**Options:**

- Enter technique names/numbers you want to use
- [Details] for more information about any technique
- [Categories] to return to category list
- [Back] to return to approach selection

### 5. Handle Technique Confirmation

When user selects techniques:

**Confirmation Process:**
"**Your Selected Emergency Techniques:**

- [Technique 1]: [Why this matches their emergency scenario type]
- [Technique 2]: [How this complements the first for emergency response]
- [Technique 3]: [If selected, how it builds on others for comprehensive coverage]

**Emergency Session Plan:**
This combination will take approximately [total_time] and focuses on [expected emergency outcomes].

**Confirm these choices?**
[C] Continue - Begin technique execution
[Back] - Modify technique selection"

### 6. Update Frontmatter and Continue

If user confirms:

**Update frontmatter:**

```yaml
---
selected_approach: 'emergency-user-selected'
techniques_used: ['technique1', 'technique2', 'technique3']
emergency_context: [from Step 1]
stepsCompleted: [1, 2]
---
```

**Append to document:**

```markdown
## Emergency Technique Selection

**Approach:** User-Selected Emergency Techniques
**Emergency Mode:** [from Step 1]

**Selected Techniques:**

- [Technique 1]: [Brief description and emergency context fit]
- [Technique 2]: [Brief description and emergency context fit]
- [Technique 3]: [Brief description and emergency context fit]

**Selection Rationale:** [Content based on user's choices and emergency scenario alignment]
```

**Route to execution:**
Load `./step-03-technique-execution.md`

### 7. Handle Back Option

If user selects [Back]:

- Return to approach selection in step-01-session-setup.md
- Maintain emergency session context and preferences

## SUCCESS METRICS:

✅ Emergency techniques CSV loaded successfully on-demand
✅ Technique categories presented clearly with emergency-specific descriptions
✅ User able to browse and select techniques based on emergency context
✅ Selected techniques confirmed with emergency scenario fit explanation
✅ Frontmatter updated with emergency technique selections
✅ Proper routing to technique execution or back navigation

## FAILURE MODES:

❌ Preloading all techniques instead of loading on-demand
❌ Making recommendations instead of letting user explore
❌ Not providing emergency-specific context for technique selection
❌ Missing back navigation option
❌ Not updating frontmatter with emergency technique selections

## USER SELECTION PROTOCOLS:

- Present emergency techniques neutrally without steering or preference
- Load CSV data only when needed for category/technique presentation
- Provide sufficient detail for informed choices without overwhelming
- Always maintain option to return to previous steps
- Respect user's autonomy in emergency technique selection

## NEXT STEP:

After technique confirmation, load `./step-03-technique-execution.md` to begin facilitating the selected emergency brainstorming techniques.

Remember: Your role is to be a knowledgeable emergency librarian, not a recommender. Let the user explore and choose based on their emergency response needs and professional judgment!
