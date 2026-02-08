# Electri-Map PRD (Product Requirements Document)

**Version:** 2.0  
**Date:** February 2026  
**Project:** Services Status / Electri-Map  
**Status:** Living Document

---

## Executive Summary

**Electri-Map** (Services Status) is a **community-driven civic infrastructure monitoring platform** that empowers citizens to report and track utility service disruptions in real-time. The platform provides critical information during everyday inconveniences and life-threatening emergency situations.

> **Key Value:** When infrastructure fails, information becomes lifesaving. Knowing where power, water, or roads are available can mean the difference between safety and danger during emergencies.

---

## Problem Statement

### Pain Points Addressed

1. **Information Vacuum During Emergencies** - Utility companies have delayed/incomplete outage info; citizens can't share real-time ground truth
2. **Everyday Inconveniences** - Power outages, road blocks, water issues affect productivity and safety
3. **Vulnerable Populations** - Elderly, disabled, and families need to locate safe areas with working services

---

## Current Implementation ✅

### Core Features

| Feature | Description |
|---------|-------------|
| Interactive Map | Leaflet-based map with real-time markers |
| Multi-Service Reporting | Electrical, Water, Communication, Mobile, Gas, Road Blocks |
| Location Auto-Detection | GPS geolocation with manual override |
| Quick Report Dialog | One-tap reporting from map center |
| Real-Time Updates | Supabase real-time subscriptions |
| Reverse Geocoding | City/country display via Nominatim |
| Multi-Language | EN, PT, ES, FR, DE, ZH, AR translations |
| 24-Hour Data Window | Auto-expiring reports |
| Dark/Light Theme | System preference support |
| Mobile Responsive | Optimized for all devices |
| Blog/Best Practices | Emergency preparedness content |

### Emergency & Incident Management

| Feature | Description |
|---------|-------------|
| Command Center Dashboard | Real-time emergency operations center with live incident feed, active responder tracking, and resource allocation overview |
| Incident List | Comprehensive view of all reported incidents with filtering by type, status, priority, and location |
| Incident Report Form | Structured form for reporting emergencies with priority levels, location data, and media attachments |

### Escalation System

| Feature | Description |
|---------|-------------|
| Escalation Dashboard | Multi-tier incident tracking with automated escalation triggers, SLA monitoring, and status progression |
| Communication Center | Centralized messaging hub for emergency communications, notifications, and stakeholder alerts |

### Support & Ticketing System

| Feature | Description |
|---------|-------------|
| Request Dashboard | Comprehensive service request management with queue visualization and priority sorting |
| My Requests | User-facing portal for tracking personal service requests with status updates |
| Service Request Form | Structured form for submitting non-emergency service requests with category selection |
| Request Detail View | Detailed view of individual service requests with history and resolution tracking |
| Request Status Tracker | Real-time status updates for service requests with milestone notifications |

### Statistics & Analytics

| Feature | Description |
|---------|-------------|
| Statistics Dashboard | Comprehensive analytics dashboard with key performance indicators and trend analysis |
| Statistics Content | Detailed statistics views with charts, metrics, and data visualization |

### Civic Issue Reporting

| Feature | Description |
|---------|-------------|
| Analytics Dashboard | Civic engagement analytics with issue tracking metrics and community insights |
| Issue List | Community-reported issues with filtering, sorting, and geographic display |
| Issue Report Form | User-friendly form for reporting non-emergency civic issues with photo upload support |
| Category Selector | Organized category selection for civic issues (infrastructure, safety, utilities) |
| Status Tracker | Real-time tracking of reported civic issues with resolution updates |
| Media Uploader | Image and video upload functionality for issue documentation |

### Resource Allocation

| Feature | Description |
|---------|-------------|
| Resource Dashboard | Real-time resource monitoring with availability status and deployment tracking |
| Resource Allocation Modal | Interactive modal for assigning resources to incidents with capacity planning |

### Maintenance Scheduling

| Feature | Description |
|---------|-------------|
| Maintenance Calendar | Calendar view of scheduled maintenance activities with timeline visualization |
| Maintenance Scheduler | Advanced scheduling interface for planning preventive and corrective maintenance |
| Work Order Detail | Detailed work order documentation with task lists, assignments, and completion tracking |

### Current Service Types

| Service | Icon | Use Case |
|---------|------|----------|
| Electrical | ⚡ | Power outages, downed lines |
| Communication | 📶 | Internet, phone lines |
| Water | 💧 | Water supply, pressure issues |
| Mobile | 📱 | Cell coverage, signal strength |
| Road Block | ⚠️ | Closed roads, accidents |
| Gas | 🔥 | Gas leaks, supply issues |

---

## Proposed Enhancements

### 🚨 Phase 1: Emergency Features (Q1 2026)

**1.1 Emergency SOS Mode**
- One-tap SOS button for critical situations
- Emergency types: Fire, Flooding, Electrocution Hazard, Building Collapse, Medical Emergency
- Automatic escalation and SMS alerts to emergency contacts
- Priority visibility on map (pulsing markers)

**1.2 Safe Zone Locator**
- Find nearest locations with working services
- Filter by: Has Power, Has Water, Road Accessible
- Navigation directions to safe zones
- Hospital/shelter integration

**1.3 Community Alert System**
- Push notifications for nearby emergencies
- Configurable alert radius (500m - 10km)
- Severity levels: informational, warning, critical
- Opt-in SMS for critical alerts

---

### 📱 Phase 2: Everyday Utility (Q2 2026)

**2.1 Scheduled Outage Notifications**
- Utility provider API integration
- Subscribe to areas of interest
- 24-hour advance notice for maintenance

**2.2 Service Restoration Tracking**
- Report restorations (not just outages)
- Estimated restoration times
- Verification system (multiple confirmations)

**2.3 Personal Dashboard**
- My Reports history
- Favorite/watched locations
- Weekly/monthly outage summaries
- Export data for insurance claims

**2.4 Offline Mode**
- Cache map tiles for offline viewing
- Queue reports for sync when online
- Peer-to-peer sharing via Bluetooth/WiFi Direct

---

### 🤝 Phase 3: Community & Collaboration (Q3 2026)

**3.1 Verified Reporters**
- Badge system for reliable contributors
- Trust score based on accuracy history
- Community moderation

**3.2 Neighborhood Groups**
- Create/join local community groups
- Volunteer coordination during emergencies
- Resource sharing (generators, water)

**3.3 Business Integration**
- Verified business accounts
- Real-time status: Gas stations, Grocery stores, Pharmacies
- "Open During Emergency" badges

---

### 🔧 Phase 4: Technical Enhancements (Q4 2026)

**4.1 IoT Integration**
- Smart meter data integration
- Weather station correlation
- Traffic sensor integration

**4.2 AI-Powered Features**
- Outage prediction from weather patterns
- Anomaly detection
- Duplicate report detection

**4.3 Public API**
```
GET  /api/v2/status       - Retrieve area status
POST /api/v2/status       - Submit new report
GET  /api/v2/alerts       - Subscribe to alerts
GET  /api/v2/safe-zones   - Find nearest safe locations
GET  /api/v2/historical   - Historical outage data
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Monthly Active Users | 100,000 |
| Reports per Day | 10,000 |
| Report Response Time | < 5 min |
| Safe Zone Accuracy | > 95% |
| User Satisfaction | > 4.5/5 |
| Emergency Alert Delivery | < 30 sec |

---

## Technical Requirements

- **Performance:** Map load < 2s, Report submission < 1s
- **Scalability:** 1M concurrent users during emergencies
- **Security:** End-to-end encryption, GDPR/CCPA compliance
- **Accessibility:** WCAG 2.1 AA, screen reader support

---

## Proposed Additional Service Types

| Service | Icon | Use Case |
|---------|------|----------|
| Emergency Services | 🚨 | First responder access |
| Public Transport | 🚌 | Transit disruptions |
| Healthcare | 🏥 | Hospital capacity |
| Fuel | ⛽ | Gas station availability |
| Food/Water Distribution | 🥤 | Emergency supply points |
