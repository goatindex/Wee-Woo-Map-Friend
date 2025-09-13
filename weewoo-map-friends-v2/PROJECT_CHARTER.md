# 📋 PROJECT CHARTER - WEEWOO MAP FRIENDS V2

## Project Vision & Goals

**Primary Purpose:** Emergency services mapping tool for all of Australia, starting with Victoria as a proof of concept. The tool will include map overlays and APIs such as weather forecasting and other useful tools.

**Target Users:** Local unit leadership and crew leaders who lead teams out on Requests for Assistance (RFAs). They have basic computer skills and access primarily through mobile devices, though a web browser option is important.

**Work Environment:** Off a laptop, tablet, or phone in field operations, emergency response vehicles, and command centers.

## Problem Statement

Crew leaders need to:
- Quickly plan effective routes between locations
- See service boundaries and facilities in relation to their own
- Understand operational environment (LGA boundaries, flood maps, fire zones)
- Access critical information like alerts from state/federal agencies via API feeds
- Coordinate with other emergency services

## Success Criteria

- **Performance:** App loads in under 3 seconds
- **Usability:** Easy to use core functionality, particularly on mobile
- **Accuracy:** Vehicle navigation level accuracy for specific addresses
- **Reliability:** Highly reliable with offline capabilities
- **Export:** Ability to download map views as PDF or image files, possibly GIF for animated maps

## Must-Have Features

- Interactive map with emergency service boundaries
- Route planning between locations
- Service facility locations
- Mobile-optimized interface
- PDF/image export functionality
- Weather API integration (Willy Weather)
- Alert feeds (Emergency Management Victoria)
- Environmental overlays (flood maps, fire zones)
- In-app documentation with navigable pages and GIF usage examples
- Modern usability and aesthetic (Floating Action Buttons work well)

## Nice-to-Have Features

- GIF export for animated maps
- Training/debriefing modes
- Future authentication system (architectural consideration)
- Offline map viewing within the app

## Technical Requirements

- **Data Sources:** APIs, static files, and third-party providers
- **Weather API:** Willy Weather API
- **Alert Feeds:** Emergency Management Victoria
- **Offline Capability:** Primarily through PDF/image downloads
- **Geographic Scope:** All of Victoria initially, then all Australian states and territories
- **Emergency Services:** All services and maps currently in the existing WeeWoo Map Friends project
- **Data Updates:** Static GeoJSON files initially, weekly updates on backend in future

## Project Constraints

- **Timeline:** Workable solution on GitHub.io within a week
- **Resources:** You and AI assistant
- **Budget:** Modest budget for APIs, hosting, etc., extendable as appropriate
- **Architecture:** Future authentication system should be considered in early architecture

## Project Scope

### Included:
- Emergency services mapping for Victoria (proof of concept)
- Expansion to all Australian states and territories (future)
- Route planning and navigation
- Weather integration
- Alert feeds
- Export functionality
- Mobile-first design
- In-app documentation

### Excluded:
- User authentication (initially)
- Real-time data updates (initially)
- Advanced offline capabilities (initially)

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Active

