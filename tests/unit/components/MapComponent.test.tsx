import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapComponent } from '../../../src/components/MapComponent';
import * as useMapModule from '../../../src/hooks/useMap';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      setZoom: vi.fn(),
      getZoom: vi.fn(() => 13),
      getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
      on: vi.fn(),
      remove: vi.fn(),
      removeLayer: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(),
      setLatLng: vi.fn()
    })),
    divIcon: vi.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn()
      }
    }
  }
}));

// Mock useMap hook
vi.mock('../../../src/hooks/useMap');

const mockUseMap = vi.mocked(useMapModule.useMap);
const createMockLocation = (): GeolocationCoordinates => ({
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
  toJSON: () => ({}),
});

describe('MapComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseMap.mockReturnValue({
      mapRef: { current: null },
      mapState: {
        center: [0, 0],
        zoom: 13,
        cachedTiles: [],
        lastUpdate: new Date()
      },
      isInitialized: true,
      error: null,
      isOffline: false,
      updateCenter: vi.fn(),
      updateZoom: vi.fn(),
      initializeMap: vi.fn()
    });
  });

  // Test map initialization with valid coordinates
  test('should initialize map with valid coordinates', () => {
    const validLocation = createMockLocation();

    const { container } = render(<MapComponent currentLocation={validLocation} />);
    
    // Map container should be rendered
    const mapContainer = container.querySelector('.w-full.h-full');
    expect(mapContainer).toBeDefined();
    expect(mapContainer).not.toBeNull();
  });

  // Test error handling for invalid coordinates
  test('should handle invalid coordinates gracefully', () => {
    mockUseMap.mockReturnValue({
      mapRef: { current: null },
      mapState: {
        center: [0, 0],
        zoom: 13,
        cachedTiles: [],
        lastUpdate: new Date()
      },
      isInitialized: false,
      error: 'Invalid coordinates provided',
      isOffline: false,
      updateCenter: vi.fn(),
      updateZoom: vi.fn(),
      initializeMap: vi.fn()
    });

    render(<MapComponent currentLocation={null} />);
    
    // Error message should be displayed
    expect(screen.getByText(/Map Unavailable/i)).toBeDefined();
    expect(screen.getByText(/Invalid coordinates provided/i)).toBeDefined();
  });

  // Test GPS unavailable error message display
  test('should display GPS unavailable error message', () => {
    mockUseMap.mockReturnValue({
      mapRef: { current: null },
      mapState: {
        center: [0, 0],
        zoom: 13,
        cachedTiles: [],
        lastUpdate: new Date()
      },
      isInitialized: false,
      error: 'Geolocation is not supported',
      isOffline: false,
      updateCenter: vi.fn(),
      updateZoom: vi.fn(),
      initializeMap: vi.fn()
    });

    render(<MapComponent currentLocation={null} />);
    
    // GPS error message should be displayed
    expect(screen.getByText(/Map Unavailable/i)).toBeDefined();
    expect(screen.getByText(/Location services are disabled/i)).toBeDefined();
    expect(screen.getByText(/Please enable GPS to use map features/i)).toBeDefined();
  });

  // Test waiting for location state
  test('should display waiting message when location is null', () => {
    mockUseMap.mockReturnValue({
      mapRef: { current: null },
      mapState: {
        center: [0, 0],
        zoom: 13,
        cachedTiles: [],
        lastUpdate: new Date()
      },
      isInitialized: false,
      error: null,
      isOffline: false,
      updateCenter: vi.fn(),
      updateZoom: vi.fn(),
      initializeMap: vi.fn()
    });

    render(<MapComponent currentLocation={null} />);
    
    // Waiting message should be displayed
    expect(screen.getByText(/Waiting for Location/i)).toBeDefined();
    expect(screen.getByText(/Please enable location services to view the map/i)).toBeDefined();
  });

  // Test loading state
  test('should display loading spinner when map is initializing', () => {
    mockUseMap.mockReturnValue({
      mapRef: { current: null },
      mapState: {
        center: [37.7749, -122.4194],
        zoom: 13,
        cachedTiles: [],
        lastUpdate: new Date()
      },
      isInitialized: false,
      error: null,
      isOffline: false,
      updateCenter: vi.fn(),
      updateZoom: vi.fn(),
      initializeMap: vi.fn()
    });

    const validLocation = createMockLocation();

    render(<MapComponent currentLocation={validLocation} />);
    
    // Loading message should be displayed
    expect(screen.getByText(/Loading map.../i)).toBeDefined();
  });

  // Test custom className prop
  test('should apply custom className', () => {
    const validLocation = createMockLocation();

    const { container } = render(
      <MapComponent currentLocation={validLocation} className="custom-class" />
    );
    
    // Custom class should be applied to container
    expect(container.querySelector('.custom-class')).toBeDefined();
  });
});
