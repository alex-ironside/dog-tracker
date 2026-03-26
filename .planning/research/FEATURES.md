# Feature Research

**Domain:** Dog walk scheduling and group management (professional behaviorist tool)
**Researched:** 2026-03-26
**Confidence:** MEDIUM — UX patterns and algorithm design are stable knowledge; dog-walker-specific workflow based on domain reasoning, not primary user research. Flag for validation with the actual behaviorist user before committing to detailed implementation.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the behaviorist will assume exist from day one. Missing these makes the tool feel broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dog roster with profile cards | Every management tool starts with "the thing you manage" — dogs here | LOW | Name, breed, photo (optional), owner, behavioural tags, active/inactive status |
| Add / edit / delete dogs | Basic CRUD — implied by having a roster | LOW | Soft-delete preferred; archived dogs can still appear in old walk history |
| Pairwise compatibility entry | Core domain input: "do these two dogs get on?" | MEDIUM | Boolean or 3-point scale (good/neutral/bad) per pair; symmetric (A↔B = B↔A) |
| Compatibility network graph (read) | Behaviorist expects to see all dog relationships at a glance | HIGH | Visual node-edge graph; colour-coded edges (green=compatible, red=conflict, grey=unknown) |
| Walk group composition | Composing a group is the primary daily action | MEDIUM | Named group, list of dogs, date/time slot |
| Group compatibility validation | Before committing a group, alert on incompatible pairings | MEDIUM | Inline warning if any pair in proposed group is flagged as conflicting |
| Weekly calendar view | Time-based scheduling is the core output of the workflow | HIGH | Hour-grid, 7-day week, walk groups placed into slots |
| Walk history log per dog | Record what happened after each walk | LOW-MEDIUM | Outcome (good/neutral/poor), notes, date, duration, who was present |
| LocalStorage persistence | Without save, the tool is a whiteboard that resets on refresh | MEDIUM | All state serialised to localStorage; no data loss on close/reload |

### Differentiators (Competitive Advantage)

Features that directly serve the behaviorist's expertise and set this tool apart from generic calendar or task apps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Group compatibility score | Quantified safety signal — "this group scores 87/100" gives the behaviorist a fast go/no-go gut-check | HIGH | Weighted average of all pairwise scores in the group; display as percentage or traffic-light |
| Auto-suggest compatible groups | Removes manual trial-and-error from group composition; the tool proposes, the behaviorist approves | HIGH | Constraint-satisfaction or greedy algorithm over pairwise data; see algorithm notes below |
| Compatibility network graph (editable) | Editing relationships directly on the graph is faster than a settings form | HIGH | Click edge to toggle state; click pair to open score editor |
| Walk outcome timeline per dog | Spot behavioural trends over time — is this dog improving or regressing? | MEDIUM | Sparkline or bar chart; outcome per walk plotted chronologically |
| Conflict warnings inline on group builder | Catches mistakes before they become dangerous | MEDIUM | Real-time: as dogs are dragged into a group, conflicting pairs highlight immediately |
| "Dogs available for a slot" filter | Quick answer to "who hasn't been scheduled yet this week?" | LOW | Filter roster by walks already assigned in the selected week |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Neural network / ML grouping | "Make it smarter over time" — appealing idea | Needs large historical dataset that won't exist at v1; training loop adds massive complexity; deterministic scoring is more auditable for a safety-critical domain | Math scoring function; revisit ML if dataset grows beyond ~200 walks |
| Cloud sync / multi-device | "What if I need it on my phone?" | Adds backend, auth, conflict resolution — scope explosion for a local single-user tool | Ship LocalStorage v1; wire up Firebase export in v2 if the user validates the need |
| Client-facing portal / booking | "Could clients book their own slots?" | Transforms the tool into a SaaS product with auth, payment, and scheduling rules — entirely different scope | Keep tool behaviorist-only for v1; evaluate as v2 if business model demands it |
| Real-time notifications / reminders | Feels like a natural calendar feature | No backend means no push notifications; browser notifications require service workers and user permission flow | Static display only; the behaviorist checks the tool before each session |
| Undo/redo history | Standard in creative tools | High implementation complexity for LocalStorage-backed state; easy to get wrong | Optimistic UI with explicit "delete" actions and confirmation dialogs |

---

## Feature Dependencies

```
Dog Roster (CRUD)
    └──required by──> Compatibility Entry
                          └──required by──> Compatibility Network Graph
                          └──required by──> Group Compatibility Score
                                               └──required by──> Auto-suggest Groups

Dog Roster (CRUD)
    └──required by──> Group Builder (drag dogs into group)
                          └──required by──> Calendar Scheduler (schedule groups into slots)
                          └──enhanced by──> Group Compatibility Score (inline validation)
                          └──enhanced by──> Conflict Warnings (real-time drag feedback)

Walk Group
    └──required by──> Walk History Log (a walk record references a group)
                          └──required by──> Walk Outcome Timeline (charts history per dog)

LocalStorage
    └──required by──> everything (data must persist across sessions)
```

### Dependency Notes

- **Compatibility Entry requires Dog Roster:** You can't score a pair until both dogs exist in the system.
- **Group Score requires Compatibility Entry:** The scoring function has no input without pairwise data. Empty or sparse data should degrade gracefully (show "insufficient data" rather than a false score).
- **Auto-suggest requires Group Score:** The suggestion algorithm ranks candidate groups by score, so scoring must exist first.
- **Calendar requires Group Builder:** The calendar places groups into time slots; groups must be composable before they can be scheduled.
- **Walk History requires Walk Group:** Each walk record is anchored to a group instance on a specific date/time; groups must exist first.
- **LocalStorage underlies everything:** Implement and validate persistence in the earliest phase so it doesn't become a retrofit problem.

---

## Domain-Specific Data Models

These are the concrete data structures the features operate on. Specificity here prevents ambiguity during implementation.

### Dog Profile

```typescript
interface Dog {
  id: string;                     // UUID
  name: string;
  breed?: string;
  ownerName?: string;
  ownerContact?: string;
  tags: string[];                 // behavioural tags: e.g. "reactive", "nervous", "social"
  notes?: string;                 // free-text behavioural notes
  photoUrl?: string;              // base64 or blob URL (local only)
  active: boolean;                // archived dogs hidden from scheduler but preserved in history
  createdAt: string;              // ISO date
}
```

### Compatibility Record

```typescript
type CompatibilityScore = -1 | 0 | 1;  // -1 = conflict, 0 = unknown/neutral, 1 = compatible

interface CompatibilityEntry {
  dogAId: string;
  dogBId: string;
  score: CompatibilityScore;
  notes?: string;               // "fought at park 2025-11-03", "best friends"
  updatedAt: string;
}
// Key pattern: store as map keyed by sorted([dogAId, dogBId]).join('|')
// Symmetry guaranteed: always look up with sorted IDs
```

### Walk Group

```typescript
interface WalkGroup {
  id: string;
  name: string;                  // "Tuesday Morning Group", "Pack A"
  dogIds: string[];
  compatibilityScore?: number;   // 0-100; computed, not stored — derive on load
  createdAt: string;
  updatedAt: string;
}
```

### Walk Session (scheduled instance)

```typescript
interface WalkSession {
  id: string;
  groupId: string;              // which group configuration
  dogIds: string[];             // snapshot of group at walk time (group may change later)
  date: string;                 // ISO date
  startTime: string;            // "HH:MM" 24h
  durationMinutes: number;      // e.g. 60
  outcome: 'great' | 'good' | 'neutral' | 'poor' | 'incident';
  notes?: string;               // free-text post-walk notes
  createdAt: string;
}
```

**Why snapshot dogIds on session?** The group composition may be edited after the walk occurs. The history record must reflect who was actually present, not the current group state.

### Group Compatibility Score Algorithm

The scoring function must handle:
- Sparse data (many pairs unknown) — degrade gracefully, not silently wrong
- Small groups (2 dogs) — pairwise is just one pair
- Asymmetric information — one known conflict should dominate

Recommended formula:

```
score = (sum of known pairwise scores) / (count of known pairs)
      mapped from [-1, 1] → [0, 100]

If any pair scores -1 (conflict): clamp output to 0 and surface a hard warning
If known_pairs / total_pairs < 0.5: show "low confidence" indicator
```

This is simple, auditable, and safe (a single conflict kills the score).

---

## Professional Dog Walker Scheduling Workflow

Based on domain reasoning for a professional behaviorist running group social walks:

**Daily workflow:**
1. Open tool, view the week's calendar to see what's already scheduled
2. Check which dogs are available (not yet in a slot for that day)
3. Compose a group — drag available dogs together, watch conflict indicators
4. Review the compatibility score — adjust if warnings show
5. Assign the group to a time slot on the calendar
6. After the walk: open the session, log outcome and notes
7. Periodically: review walk history timelines per dog to spot behavioural trends

**Key UX insight:** The behaviorist is optimising for safety, not just filling slots. The tool must make incompatible groupings impossible to miss — not buried in a settings pane.

---

## UX Patterns: Drag-and-Drop Group Building

**Pattern: Two-panel composer (Source list + Target area)**
Used by Trello (cards → list), Asana (tasks → sections), and calendar tools (events → timeslots).

- Left panel: Dog roster (filterable)
- Right panel: Current group composition
- Drag from roster to group; drag back to remove
- Drop target highlights on hover; invalid drops (dog already in group) rejected with visual feedback

**Pattern: Inline conflict highlighting on drop**
As soon as a dog is dropped into the group, re-evaluate all pairs. Any conflicting pair should immediately highlight (red badge on both dogs in the group). This is superior to a summary warning because it identifies which dogs are the problem.

**Pattern: Chip/token representation for dogs in groups**
Dogs in the group panel shown as small chips with name + optional photo avatar. Chips are draggable back out. Compact enough to show 6-8 dogs in a group without scrolling.

**Calendar drop target pattern:**
- Week grid: columns = days, rows = hour slots
- Groups represented as coloured blocks spanning their duration
- Drag a group card from a staging area or re-drag from an existing slot

---

## UX Patterns: Compatibility / Conflict Visualisation

**Network graph (recommended for overview):**
- Nodes = dogs (labelled circles, optionally with photo)
- Edges = compatibility: green (compatible), red (conflict), grey (unknown/not assessed)
- Clicking a node: highlight all edges for that dog — immediate "who does this dog get on with?"
- Clicking an edge: open pair editor inline
- Force-directed layout (D3-style) works well for 5-20 nodes; degrades for larger sets

**Matrix view (useful alternative / supplement):**
- N×N grid where rows and columns are dogs
- Cell colour = compatibility score for that pair
- Better than graph for seeing gaps (grey = unknown) across the whole population
- Harder to perceive clusters; graph is better for cluster perception

**Recommendation:** Graph as primary view, matrix as secondary "data entry" view (easier to scan all pairs systematically). Allow toggling between the two.

**Colour conventions (established in accessibility-aware tools):**
- Green (#22c55e range): compatible / safe
- Red (#ef4444 range): conflict / unsafe
- Amber (#f59e0b range): caution / needs monitoring
- Grey (#94a3b8 range): unknown / not assessed
- Never rely on colour alone: use edge thickness, icons, or labels as secondary encoding

---

## Walk History Logging Patterns

**Most useful data to capture:**

| Field | Why Useful | Type |
|-------|------------|------|
| Date + time | Temporal analysis, day-of-week patterns | datetime |
| Duration (minutes) | Stamina / recovery tracking | integer |
| Outcome rating | Primary signal for trend analysis | enum: great/good/neutral/poor/incident |
| Dogs present (snapshot) | Who was actually there (vs. planned group) | string[] of IDs |
| Notes (free text) | Captures specifics: "Rover lunged at Max twice", "all played well" | string |
| Weather (optional) | Some behavioural responses correlate with weather | enum or free text |

**Fields to avoid in v1:**
- GPS route / map data — requires device APIs, out of scope for a local web app
- Photo attachments — localStorage bloat risk; defer to v2

**Timeline / chart patterns:**
- Per-dog view: horizontal timeline with outcome dots colour-coded by rating
- Trend line over rolling N-walk average is more useful than raw dots for spotting improvement
- Recharts or Nivo both handle this pattern well; a simple LineChart with custom dot renderer suffices

---

## Auto-Grouping Algorithm Patterns

**The "suggest compatible groups" problem** is a variant of the **graph colouring / stable matching** class of problems. For a v1 with 5-25 dogs and groups of 3-6, a greedy constraint-satisfaction approach is sufficient.

**Recommended approach: Greedy ranked candidate enumeration**

```
Input:  available dogs for a slot, desired group size, pairwise compatibility data
Output: ranked list of candidate groups (top 3-5)

Algorithm:
1. Filter out dogs already scheduled in that slot
2. For each candidate starting dog, attempt to build a group by:
   a. Add dogs in descending order of average compatibility with current group
   b. Reject any dog that has a conflict (-1 score) with any dog already in the group
   c. Stop when group size reached or no more compatible dogs exist
3. Score each candidate group (formula above)
4. Sort candidates by score descending, return top N
5. Present to user as suggestions — user accepts, modifies, or ignores
```

**Handling sparse data:**
- If a pair is unknown (score = 0), treat as neutral (allow in group, but show "unverified" indicator)
- Suggest assessing unknown pairs before relying heavily on auto-suggest

**What the behaviorist validates:** The algorithm is a time-saver, not an authority. The behaviorist's contextual knowledge (e.g., "these two dogs fought last week, I haven't updated the app yet") always overrides suggestions. The UI must make this clear — present suggestions as "recommended starting points," not "safe groups."

---

## MVP Definition

### Launch With (v1)

These are the minimum features for the behaviorist to use the tool in real sessions:

- [ ] Dog roster — add, edit, archive dogs with name, breed, tags, notes
- [ ] Compatibility entry — set pairwise score (compatible / neutral / conflict) with optional notes
- [ ] Compatibility network graph — read-only view; editable on click
- [ ] Walk group builder — drag-and-drop composer with inline conflict warnings
- [ ] Group compatibility score — computed score displayed in group builder
- [ ] Weekly calendar — place groups into hour slots, view the week
- [ ] Walk session logger — after-walk record: outcome rating + notes + dogs present (auto-filled from group)
- [ ] LocalStorage persistence — all data saved; no data loss on close

### Add After Validation (v1.x)

Add these once the core loop has been used in real sessions:

- [ ] Walk outcome timeline per dog — add once there are 10+ sessions to visualise
- [ ] Auto-suggest groups — add once pairwise data is sufficiently populated (20+ dogs, sparse data makes suggestions unreliable)
- [ ] "Dogs available this slot" filter — small QoL win once the calendar has real data in it

### Future Consideration (v2+)

- [ ] Firebase / cloud sync — when multi-device or backup becomes a real pain point
- [ ] Walk outcome trend alerts — "Rover has had 3 poor sessions in a row" — needs history volume first
- [ ] Compatibility matrix view — useful supplement to graph once roster exceeds 15 dogs
- [ ] Export to PDF / CSV — reporting for dog owners; deferred until behaviorist requests it

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dog roster CRUD | HIGH | LOW | P1 |
| LocalStorage persistence | HIGH | MEDIUM | P1 |
| Pairwise compatibility entry | HIGH | LOW | P1 |
| Compatibility network graph | HIGH | HIGH | P1 |
| Walk group builder (drag-drop) | HIGH | HIGH | P1 |
| Group compatibility score | HIGH | MEDIUM | P1 |
| Weekly calendar scheduler | HIGH | HIGH | P1 |
| Walk session logger | HIGH | LOW-MEDIUM | P1 |
| Inline conflict warnings | HIGH | MEDIUM | P1 |
| Walk outcome timeline chart | MEDIUM | MEDIUM | P2 |
| Auto-suggest groups | MEDIUM | HIGH | P2 |
| Available-dogs filter | LOW | LOW | P2 |
| Compatibility matrix view | LOW | MEDIUM | P3 |
| Export (PDF/CSV) | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — the tool is not usable without it
- P2: Adds significant value, add after core is stable
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Generic calendar (Google Calendar) | Dog walker SaaS (Time To Pet, Precise Petcare) | This tool |
|---------|------|------|------|
| Dog compatibility tracking | None | None (booking-focused, not behavioural) | Core differentiator — compatibility graph is the unique value |
| Group composition | Manual event description | Per-pet appointments, not group-aware | Drag-drop builder with compatibility validation |
| Auto-suggest groups | None | None | Greedy scoring algorithm (v1.x) |
| Walk history / outcomes | Notes only | Basic visit notes, no behavioural rating | Outcome rating + timeline chart per dog |
| Compatibility visualisation | None | None | Network graph — unique in this domain |
| Scheduling | Full-featured calendar | Full booking workflow | Lightweight hour-grid; no booking/payments |

**Insight:** Existing dog walker software is booking/billing-focused. None of them address the behaviorist's core problem — managing inter-dog compatibility. This tool owns that gap entirely.

---

## Sources

- Domain reasoning based on professional pet behaviorist workflow patterns (MEDIUM confidence — needs validation with actual user)
- UX patterns: Trello, Asana, Google Calendar drag-and-drop conventions (HIGH confidence — well-established)
- Compatibility visualisation: D3.js force-graph, Cytoscape.js documentation patterns (HIGH confidence)
- Graph colouring / stable matching algorithm literature (MEDIUM confidence — applied to this domain by analogy)
- Colour conventions: WCAG accessibility guidelines for colour-as-information encoding (HIGH confidence)
- Competitor analysis: Time To Pet, Precise Petcare, Google Calendar feature sets (MEDIUM confidence — based on training data, features may have changed)

---

*Feature research for: dog walk scheduling and group management (professional behaviorist tool)*
*Researched: 2026-03-26*
