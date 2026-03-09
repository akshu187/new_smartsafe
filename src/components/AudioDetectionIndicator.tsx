import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useAudioDetection, type SensitivityLevel } from '../hooks/useAudioDetection';

export function AudioDetectionIndicator() {
  const {
    isActive,
    isPermissionGranted,
    sensitivity,
    isCrashDetected,
    setSensitivity,
    testDetection,
    enable,
    disable
  } = useAudioDetection();

  const handleToggle = () => {
    if (isActive) {
      disable();
    } else {
      enable();
    }
  };

  const handleSensitivityChange = (level: SensitivityLevel) => {
    setSensitivity(level);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Mic className="w-5 h-5 text-green-600" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="font-semibold text-gray-900">Audio Crash Detection</h3>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Enable Audio Detection</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? 'bg-green-600' : 'bg-gray-300'
          }`}
          aria-label={isActive ? 'Disable audio detection' : 'Enable audio detection'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Permission Status */}
      {!isPermissionGranted && isActive && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            Microphone permission required. Please allow access when prompted.
          </p>
        </div>
      )}

      {/* Sensitivity Controls */}
      {isActive && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sensitivity Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as SensitivityLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleSensitivityChange(level)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  sensitivity === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`Set sensitivity to ${level}`}
                aria-pressed={sensitivity === level}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {sensitivity === 'low' && 'Less sensitive - fewer false alarms'}
            {sensitivity === 'medium' && 'Balanced detection'}
            {sensitivity === 'high' && 'More sensitive - earlier detection'}
          </p>
        </div>
      )}

      {/* Crash Detection Alert */}
      {isCrashDetected && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md animate-pulse">
          <Volume2 className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">Crash Detected!</p>
            <p className="text-xs text-red-700">Audio pattern indicates potential crash</p>
          </div>
        </div>
      )}

      {/* Test Mode */}
      {isActive && (
        <button
          onClick={testDetection}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          aria-label="Test crash detection"
        >
          Test Detection
        </button>
      )}

      {/* Privacy Notice */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          🔒 Audio is analyzed in real-time and immediately discarded. No audio is recorded or stored.
        </p>
      </div>
    </div>
  );
}
