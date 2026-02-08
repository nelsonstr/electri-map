# Epic: Administrative Boundaries & Responsibility Management

## Goal Description
Implement a comprehensive administrative boundary visualization system that allows users to see infrastructure status (electricity, alerts) aggregated by region. The system supports assigning responsibilities to specific administrative levels (e.g., Regional Director for NUTS 1, Municipal Lead for Concelhos) and synchronizing real-time data from individual reporting points to these boundaries.

## Functional Requirements
- Display administrative boundaries for Portugal (NUTS 1 to Freguesias) based on zoom level.
- Support assigning responsibility titles and users to each administrative boundary.
- Aggregate electricity status and active alerts from individual markers to the parent boundary.
- Color-code boundaries based on aggregated infrastructure health (e.g., % with power).
- Flexible configuration system to allow adding other countries (e.g., Spain, France) with their own hierarchies.

## Non-Functional Requirements
- **Performance**: Boundary rendering should be smooth, with data fetched and cached efficiently.
- **Accessibility**: Boundaries should be clearly distinguishable, and tooltips must meet WCAG contrast standards.
- **Scalability**: Support synchronization of thousands of location markers into boundaries without significant UI lag.

## User Stories

### BMAD-US-060: Administrative Boundary Visualization
**User Type**: Public User / Official
**Capability**: See infrastructure status aggregated by administrative regions (NUTS, Districts, Municipalities)
**Value**: Understand the overall health of utility services in specific regions at a glance, rather than looking at individual points.

**Acceptance Criteria**:
- [ ] Boundaries change dynamically based on map zoom level (Progressive Disclosure).
- [ ] Boundaries are styled/colored based on the percentage of locations with power.
- [ ] Tooltips show the boundary name and current aggregated stats.
- [ ] Street-level view remains point-based for precise location awareness.

**Preconditions**:
- User is viewing the NeighborPulse interactive map.
- Location data points exist within the boundaries.

**Actions**:
- Zoom in/out of the map.
- Hover over a boundary region.

**Expected Outcomes**:
- Map displays different levels of administrative hierarchy (Portugal: NUTS 1-3, Districts, Concelhos, Freguesias).
- Regions are colored from green (100% power) to red (widespread outages).
- Tooltip displays: "Region Name | 85% Power | 3 Active Alerts".

---

### BMAD-US-061: Responsibility & Accountability Assignment
**User Type**: Backoffice Admin / Regional Lead
**Capability**: Assign responsibility roles and users to specific administrative areas
**Value**: Establish clear lines of accountability and contact points for infrastructure management in each region.

**Acceptance Criteria**:
- [ ] Each administrative level has a configured Responsibility Title (e.g., "District Supervisor").
- [ ] Admins can assign a specific user (User ID) to a boundary region.
- [ ] Clicking a boundary displays the responsible person's title and name (if assigned).

**Preconditions**:
- Administrative boundaries are loaded.
- Users are registered in the system.

**Actions**:
- Click on a boundary region.

**Expected Outcomes**:
- Information panel shows the Responsibility Title for that level.
- If a user is assigned, their name and contact status are displayed.

---

### BMAD-US-062: Real-time Data Aggregation (Sync)
**User Type**: System Service
**Capability**: Automatically aggregate individual reporting points into boundary statistics
**Value**: Maintain accurate, real-time regional statistics without manual data entry.

**Acceptance Criteria**:
- [ ] Background service calculates total locations, % with power, and alerts for each boundary.
- [ ] Statistics update in real-time or near real-time as reports are submitted.
- [ ] Aggregated data is stored in the database for performance and historical tracking.

**Preconditions**:
- `boundary_stats` table exists.
- Reports are being submitted by users.

**Actions**:
- Submit a new outage report for a specific location.

**Expected Outcomes**:
- The parent boundary's "Power Outage %" and "Active Alerts" count update automatically.
- The map boundary color reflects the updated statistics.

## Implementation Guide (Conceptual)

### 10.x.x Implementation: Administrative Boundaries System (BMAD-US-060, 061, 062)

This implementation guide covers the development of the hierarchical boundary system, the responsibility management, and the data synchronization logic.

**Phase 1: Configuration & Models**
Define the country-level hierarchies and responsibility roles.
```typescript
// types/administrative.ts
export interface BoundaryStats {
  total: number;
  operational: number;
  alerts: number;
}
```

**Phase 2: Data Services**
Implement the services to fetch GeoJSON and perform spatial aggregation.
```typescript
// lib/services/boundaries/sync-service.ts
export async function syncStatsForBoundary(boundaryId: string) {
  // SQL aggregation logic here
}
```

**Phase 3: Map Integration**
Integrate the Leaflet GeoJSON layer with zoom-level logic.
```tsx
// components/map/boundary-layer.tsx
export function BoundaryLayer() {
  const zoom = useMapZoom();
  const level = getLevelForZoom(zoom);
  // ... render GeoJSON
}
```
