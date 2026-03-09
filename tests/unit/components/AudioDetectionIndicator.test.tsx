import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioDetectionIndicator } from '../../../src/components/AudioDetectionIndicator';
import * as useAudioDetectionModule from '../../../src/hooks/useAudioDetection';

// Mock the useAudioDetection hook
vi.mock('../../../src/hooks/useAudioDetection');

describe('AudioDetectionIndicator', () => {
  const mockUseAudioDetection = vi.mocked(useAudioDetectionModule.useAudioDetection);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should display active indicator when audio detection is active', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: true,
      isPermissionGranted: true,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Audio Crash Detection')).toBeInTheDocument();
  });

  test('should display permission warning when permission not granted', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: true,
      isPermissionGranted: false,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText(/Microphone permission required/i)).toBeInTheDocument();
  });

  test('should display sensitivity controls when active', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: true,
      isPermissionGranted: true,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText('Sensitivity Level')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('should display crash alert when crash is detected', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: true,
      isPermissionGranted: true,
      sensitivity: 'medium',
      isCrashDetected: true,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText('Crash Detected!')).toBeInTheDocument();
    expect(screen.getByText(/Audio pattern indicates potential crash/i)).toBeInTheDocument();
  });

  test('should display test button when active', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: true,
      isPermissionGranted: true,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText('Test Detection')).toBeInTheDocument();
  });

  test('should always display privacy notice', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: false,
      isPermissionGranted: false,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.getByText(/Audio is analyzed in real-time and immediately discarded/i)).toBeInTheDocument();
  });

  test('should not display sensitivity controls when inactive', () => {
    mockUseAudioDetection.mockReturnValue({
      isActive: false,
      isPermissionGranted: false,
      sensitivity: 'medium',
      isCrashDetected: false,
      lastCrashEvent: null,
      requestPermission: vi.fn(),
      setSensitivity: vi.fn(),
      testDetection: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn()
    });

    render(<AudioDetectionIndicator />);

    expect(screen.queryByText('Sensitivity Level')).not.toBeInTheDocument();
  });
});
