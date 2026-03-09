# Implementation Plan: Advanced Safety Features

## Overview

This implementation plan breaks down the advanced safety features into a 7-week phased rollout. The plan follows the architecture specified in the design document and implements all requirements through incremental, testable steps. Each task builds on previous work and includes testing sub-tasks to validate correctness properties.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - Install Leaflet and React-Leaflet: `npm install leaflet react-leaflet @types/leaflet`
  - Install charting library: `npm install recharts`
  - Install PDF generation: `npm install jspdf jspdf-autotable`
  - Install CSV export: `npm install papaparse @types/papaparse`
  - Install property-based testing: `npm install --save-dev fast-check`
  - Create directory structure for new components and utilities
  - _Requirements: All features_

- [x] 2. Phase 1 - Map Component Foundation (Week 1)
  - [x] 2.1 Create useMap hook for map initialization and state management
    - Implement map initialization with Leaflet
    - Add state management for center, zoom, and cached tiles
    - Handle GPS location updates
    - Implement error handling for GPS unavailable scenarios
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  
  - [x]* 2.2 Write property test for useMap hook
    - **Property 1: Real-time Location Updates**
    - **Property 2: Map Interaction Preservation**
    - **Validates: Requirements 1.2, 1.5**
  
  - [x] 2.3 Create MapComponent with Leaflet integration
    - Implement base MapComponent with tile layer
    - Add current location marker
    - Implement pan and zoom controls
    - Add loading and error states
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [x]* 2.4 Write unit tests for MapComponent
    - Test map initialization with valid coordinates
    - Test error handling for invalid coordinates
    - Test GPS unavailable error message display
    - _Requirements: 1.1, 1.4_

- [ ] 3. Phase 1 - Map Overlays and Layers (Week 1-2)
  - [x] 3.1 Implement AccidentZoneLayer component
    - Create AccidentZone data type and interface
    - Render accident zones as colored polygon overlays
    - Implement click handler to display zone details
    - Add proximity-based highlighting for current location
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x]* 3.2 Write property tests for AccidentZoneLayer
    - **Property 3: Overlay Rendering Completeness**
    - **Property 4: Interactive Element Click Response**
    - **Property 5: Proximity-Based Zone Highlighting**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [x] 3.3 Implement POIMarkers component
    - Create POI data type and interface
    - Render POI markers with category-specific icons
    - Implement click handler to display POI information
    - Add category filtering functionality
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x]* 3.4 Write property tests for POIMarkers
    - **Property 6: POI Category Filtering**
    - **Validates: Requirements 3.3**
  
  - [x] 3.5 Implement SpeedOverlay component
    - Display current speed as map overlay
    - Implement warning color when speed exceeds limit
    - Add real-time speed updates
    - Support mph/km/h unit conversion
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x]* 3.6 Write property tests for SpeedOverlay
    - **Property 7: Speed Limit Warning Color**
    - **Property 8: Speed Unit Conversion**
    - **Validates: Requirements 4.2, 4.4**

- [ ] 4. Phase 1 - Map Caching and Offline Support (Week 2)
  - [x] 4.1 Create mapCache utility for tile caching
    - Implement tile caching using LocalStorage
    - Add cache size management (max 50MB)
    - Implement cache retrieval and storage functions
    - Add cache cleanup for old tiles
    - _Requirements: 15.3, 17.1_
  
  - [x] 4.2 Integrate offline mode detection and cached tile display
    - Detect network connectivity status
    - Display cached tiles when offline
    - Show offline indicator in UI
    - Continue GPS tracking while offline
    - Sync data when connection restored
    - _Requirements: 15.4, 17.1, 17.2, 17.3, 17.4_
  
  - [x]* 4.3 Write property tests for map caching
    - **Property 9: Tile Caching Reduces Network Requests**
    - **Property 10: Offline Tile Display**
    - **Property 11: GPS Independence from Network**
    - **Property 12: Online Reconnection Sync**
    - **Validates: Requirements 15.3, 17.1, 17.2, 17.3, 17.4**
  
  - [x]* 4.4 Write unit tests for map performance
    - Test initial map load time (<2 seconds)
    - Test frame rate during updates (30+ FPS)
    - Test cache size limits
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 5. Checkpoint - Map Component Complete
  - Ensure all map tests pass, verify map displays correctly with all overlays, ask the user if questions arise.

- [ ] 6. Phase 2 - Audio Detection System (Week 3)
  - [x] 6.1 Create AudioContext and useAudioDetection hook
    - Request microphone permission
    - Initialize Web Audio API AudioContext
    - Set up MediaStream and AnalyserNode
    - Implement permission denial handling
    - Add enable/disable functionality
    - _Requirements: 5.1, 5.2, 5.6, 14.5_
  
  - [x] 6.2 Implement audio analysis algorithm
    - Implement FFT analysis for frequency detection
    - Add amplitude threshold detection
    - Implement temporal pattern analysis (200-500ms window)
    - Add crash pattern matching logic
    - Ensure immediate buffer disposal after analysis
    - _Requirements: 5.3, 5.4, 14.1, 14.4_
  
  - [x]* 6.3 Write property tests for audio detection
    - **Property 13: Audio Analysis Continuity**
    - **Property 14: Crash Pattern Detection**
    - **Property 18: Audio Privacy - No Persistent Storage**
    - **Validates: Requirements 5.2, 5.3, 14.1, 14.4**
  
  - [x] 6.4 Implement sensitivity configuration
    - Add sensitivity levels (low, medium, high)
    - Implement threshold adjustments per sensitivity
    - Add sensitivity persistence to LocalStorage
    - Create test mode for validation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x]* 6.5 Write property tests for sensitivity configuration
    - **Property 16: Sensitivity Configuration**
    - **Property 17: Sensitivity Persistence Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [x] 6.6 Integrate audio crash detection with emergency response
    - Create Audio_Crash_Event data type
    - Trigger emergency response workflow on detection
    - Ensure consistency with accelerometer-based detection
    - _Requirements: 5.5_
  
  - [x]* 6.7 Write property test for emergency response consistency
    - **Property 15: Emergency Response Consistency**
    - **Validates: Requirements 5.5**

- [ ] 7. Phase 2 - Audio Detection UI and Privacy (Week 3)
  - [x] 7.1 Create AudioDetectionIndicator component
    - Display visual indicator when audio detection is active
    - Show current sensitivity level
    - Add enable/disable toggle
    - Display permission status
    - _Requirements: 14.2_
  
  - [x]* 7.2 Write property tests for audio privacy and independence
    - **Property 19: Audio Detection Indicator Visibility**
    - **Property 20: Feature Independence - Audio Disable**
    - **Property 21: Conditional Microphone Access**
    - **Validates: Requirements 14.2, 14.3, 14.5**
  
  - [x]* 7.3 Write unit tests for AudioDetectionIndicator
    - Test indicator visibility when active
    - Test toggle functionality
    - Test permission request flow
    - Test error states
    - _Requirements: 14.2, 14.3_

- [x] 8. Checkpoint - Audio Detection Complete
  - Ensure all audio detection tests pass, verify audio detection works with test mode, ask the user if questions arise.

- [ ] 9. Phase 3 - Fleet Management Foundation (Week 4)
  - [x] 9.1 Create FleetContext for fleet data management
    - Define Driver, Fleet, and FleetAnalytics types
    - Implement FleetContext with state management
    - Add LocalStorage persistence for fleet data
    - Create context provider component
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 9.2 Create useFleetData hook with data synchronization
    - Implement data fetching from LocalStorage
    - Add 60-second polling for updates
    - Implement sync failure handling with retry
    - Display last sync timestamp
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 9.3 Write property tests for fleet data synchronization
    - **Property 32: Sync Failure Handling**
    - **Property 33: Sync Timestamp Display**
    - **Validates: Requirements 16.3, 16.4**
  
  - [x] 9.4 Implement role-based access control
    - Add user role checking (admin vs driver)
    - Implement authorization for Fleet_Dashboard access
    - Display authorization error for non-admins
    - _Requirements: 7.5_
  
  - [ ]* 9.5 Write property test for admin access control
    - **Property 22: Admin Access Control**
    - **Validates: Requirements 7.5**

- [ ] 10. Phase 3 - Fleet Dashboard UI (Week 4)
  - [x] 10.1 Create FleetDashboard component with header
    - Implement main dashboard layout
    - Add FleetHeader with fleet name and admin info
    - Add navigation between driver and fleet views
    - Implement role-based routing
    - _Requirements: 7.1_
  
  - [x] 10.2 Create DriverList and DriverCard components
    - Display list of all drivers in fleet
    - Show safety score and risk rank for each driver
    - Implement filtering by status and metrics
    - Implement sorting by various criteria
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 10.3 Write property tests for driver list
    - **Property 23: Driver List Completeness**
    - **Property 24: Driver List Filtering and Sorting**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [ ]* 10.4 Write unit tests for DriverList
    - Test empty fleet display
    - Test single driver display
    - Test filtering functionality
    - Test sorting functionality
    - _Requirements: 7.4_

- [ ] 11. Phase 3 - Risk Ranking System (Week 5)
  - [x] 11.1 Create riskCalculation utility
    - Implement risk rank calculation algorithm
    - Use weights: safety score (0.4), crashes (0.3), harsh driving (0.2), fatigue (0.1)
    - Add daily risk rank updates
    - Store historical risk rank data
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ]* 11.2 Write property test for risk rank calculation
    - **Property 25: Risk Rank Calculation Consistency**
    - **Validates: Requirements 8.1**
  
  - [x] 11.3 Create RiskRankingPanel component
    - Display risk ranks with visual indicators
    - Implement color-coded ranking display
    - Show historical risk rank trends
    - Generate notifications for significant changes (>20 points)
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ]* 11.4 Write property tests for risk ranking
    - **Property 26: Risk Rank Visual Indicator**
    - **Property 27: Risk Rank Change Notification**
    - **Property 28: Historical Risk Rank Availability**
    - **Validates: Requirements 8.3, 8.4, 8.5**

- [ ] 12. Phase 3 - Fleet Analytics (Week 5)
  - [x] 12.1 Create FleetAnalytics component
    - Calculate and display total distance across fleet
    - Calculate and display total trips across fleet
    - Calculate and display average safety score
    - Calculate and display crash event frequency
    - Implement date range filtering
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 12.2 Write property tests for fleet analytics
    - **Property 29: Fleet Metrics Aggregation**
    - **Property 30: Analytics Date Range Filtering**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  
  - [ ] 12.3 Add analytics visualizations with charts
    - Implement trend charts using recharts
    - Display safety score trends over time
    - Display crash event frequency charts
    - Add interactive chart controls
    - _Requirements: 9.6_
  
  - [ ]* 12.4 Write unit tests for FleetAnalytics
    - Test aggregation with empty fleet
    - Test aggregation with single driver
    - Test date range filtering edge cases
    - _Requirements: 9.5_

- [ ] 13. Phase 3 - Driver Detail View (Week 5)
  - [x] 13.1 Create DriverDetailModal component
    - Display detailed trip history for selected driver
    - Show all crash events with timestamps and locations
    - Display safety score trends over time
    - Show driving pattern analysis
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 13.2 Write property test for driver drill-down
    - **Property 31: Driver Drill-Down Completeness**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [ ]* 13.3 Write unit tests for DriverDetailModal
    - Test modal open/close functionality
    - Test data display for driver with no trips
    - Test data display for driver with multiple trips
    - _Requirements: 10.1_

- [ ] 14. Phase 3 - Multi-Driver Account Management (Week 5)
  - [ ] 14.1 Implement driver invitation workflow
    - Add UI for adding drivers by email
    - Create invitation email template
    - Send invitation with setup instructions
    - Set driver status to "invited"
    - _Requirements: 18.1, 18.3, 18.5_
  
  - [ ] 14.2 Implement driver removal workflow
    - Add UI for removing drivers from fleet
    - Revoke fleet access on removal
    - Preserve personal trip data and safety scores
    - Update driver status to "inactive"
    - _Requirements: 18.2, 18.4, 18.5_
  
  - [ ]* 14.3 Write property tests for account management
    - **Property 34: Driver Invitation Workflow**
    - **Property 35: Driver Removal Access Control**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

- [ ] 15. Checkpoint - Fleet Management Complete
  - Ensure all fleet management tests pass, verify dashboard displays correctly with multiple drivers, ask the user if questions arise.

- [ ] 16. Phase 4 - Insurance Report Generation (Week 6)
  - [x] 16.1 Create useInsuranceReport hook
    - Implement report data aggregation from LocalStorage
    - Calculate summary statistics (distance, trips, speed, crashes)
    - Generate verification code (hash of data + timestamp)
    - Implement date range filtering
    - _Requirements: 11.1, 12.4_
  
  - [ ]* 16.2 Write property tests for report generation
    - **Property 36: Report Date Range Filtering**
    - **Property 37: Report Content Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 12.2, 12.3, 12.4**
  
  - [x] 16.3 Create InsuranceReportGenerator component
    - Add UI for date range selection
    - Add UI for data category selection
    - Implement report preview functionality
    - Add validation for required data elements
    - Display report generation progress
    - _Requirements: 11.1, 13.1, 13.3, 13.4_
  
  - [ ]* 16.4 Write property tests for report customization
    - **Property 40: Report Customization Filtering**
    - **Property 41: Trip Selection Filtering**
    - **Property 42: Report Validation**
    - **Validates: Requirements 13.1, 13.2, 13.4**

- [ ] 17. Phase 4 - Report Export Functionality (Week 6)
  - [ ] 17.1 Create pdfExport utility
    - Implement PDF generation using jspdf
    - Format report with driver info, summary, and trips
    - Add verification code to PDF
    - Ensure generation completes within 5 seconds for 1 year data
    - _Requirements: 11.4, 11.5, 12.1_
  
  - [ ] 17.2 Create csvExport utility
    - Implement CSV generation using papaparse
    - Include all report data in CSV format
    - Add verification code to CSV
    - Ensure generation completes within 5 seconds for 1 year data
    - _Requirements: 11.4, 11.5_
  
  - [ ]* 17.3 Write property test for report format support
    - **Property 38: Report Format Support**
    - **Validates: Requirements 11.4**
  
  - [ ]* 17.4 Write unit tests for export utilities
    - Test PDF generation with sample data
    - Test CSV generation with sample data
    - Test export with empty data
    - Test export performance with large datasets
    - _Requirements: 11.5_

- [ ] 18. Phase 4 - Report History and Preview (Week 6)
  - [ ] 18.1 Create ReportHistory component
    - Display list of previously generated reports
    - Show report metadata (date, range, format)
    - Implement report retrieval and download
    - Store reports in LocalStorage
    - _Requirements: 12.5_
  
  - [ ]* 18.2 Write property test for report history
    - **Property 39: Report History Persistence**
    - **Validates: Requirements 12.5**
  
  - [ ] 18.3 Create ReportPreview component
    - Display formatted preview of report content
    - Show all selected data categories
    - Allow editing before final generation
    - _Requirements: 13.3_
  
  - [ ]* 18.4 Write unit tests for report UI components
    - Test ReportHistory with no reports
    - Test ReportHistory with multiple reports
    - Test ReportPreview display
    - _Requirements: 12.5, 13.3_

- [ ] 19. Checkpoint - Insurance Reports Complete
  - Ensure all report tests pass, verify PDF and CSV exports work correctly, ask the user if questions arise.

- [ ] 20. Phase 5 - Integration and Testing (Week 7)
  - [ ] 20.1 Integrate all components into main dashboard
    - Add MapComponent to DashboardView
    - Add AudioDetectionIndicator to DashboardView
    - Add navigation to FleetDashboard for admins
    - Add navigation to InsuranceReportGenerator
    - Ensure all components work together seamlessly
    - _Requirements: All features_
  
  - [ ] 20.2 Implement role-based routing and navigation
    - Add route guards for admin-only pages
    - Implement navigation menu with role-based items
    - Add breadcrumb navigation
    - _Requirements: 7.5_
  
  - [ ]* 20.3 Write integration tests for major workflows
    - Test complete trip workflow with map and audio detection
    - Test fleet admin workflow (view drivers, generate reports)
    - Test driver workflow (view map, generate insurance report)
    - Test offline mode with map caching
    - _Requirements: All features_

- [ ] 21. Phase 5 - Performance Optimization (Week 7)
  - [ ] 21.1 Implement code splitting and lazy loading
    - Lazy load MapComponent
    - Lazy load FleetDashboard
    - Lazy load InsuranceReportGenerator
    - Lazy load recharts library
    - _Requirements: 15.1_
  
  - [ ] 21.2 Optimize map performance
    - Implement marker clustering for dense POI areas
    - Debounce map pan/zoom events (300ms)
    - Optimize tile caching strategy
    - _Requirements: 15.1, 15.2_
  
  - [ ] 21.3 Optimize audio detection performance
    - Move audio analysis to Web Worker
    - Batch audio processing (analyze every 100ms)
    - Optimize pattern matching with early exit
    - _Requirements: 5.2, 5.3_
  
  - [ ] 21.4 Optimize fleet dashboard performance
    - Implement virtual scrolling for large driver lists (>100 drivers)
    - Memoize expensive calculations (risk rank, aggregations)
    - Implement pagination for trip history
    - _Requirements: 7.1, 9.1_
  
  - [ ]* 21.5 Write performance tests
    - Test map load time (<2 seconds)
    - Test audio analysis latency (<50ms)
    - Test dashboard load time (<1 second)
    - Test report generation time (<5 seconds for 1 year)
    - _Requirements: 15.1, 11.5_

- [ ] 22. Phase 5 - Accessibility and Browser Compatibility (Week 7)
  - [ ] 22.1 Implement accessibility features
    - Add keyboard navigation for map controls
    - Add ARIA labels for all interactive elements
    - Ensure color contrast ratios >4.5:1
    - Add screen reader support for status indicators
    - Add focus management in modals
    - _Requirements: All features_
  
  - [ ] 22.2 Test browser compatibility
    - Test on Chrome/Edge 90+
    - Test on Firefox 88+
    - Test on Safari 14+
    - Test on mobile browsers (iOS 14+, Android 8+)
    - Implement feature detection and graceful degradation
    - _Requirements: All features_
  
  - [ ]* 22.3 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test color contrast
    - Test focus indicators
    - _Requirements: All features_

- [ ] 23. Final Checkpoint - Complete System Validation
  - Run all unit tests and ensure 85%+ line coverage
  - Run all property tests and ensure 100% property coverage
  - Run all integration tests
  - Perform manual testing on mobile devices
  - Verify all requirements are met
  - Ask the user if questions arise or if ready for deployment

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The 7-week timeline assumes full-time development; adjust as needed for part-time work
- All code should follow TypeScript best practices and React 19 patterns
- Use Tailwind CSS 4 for styling consistency with existing codebase
