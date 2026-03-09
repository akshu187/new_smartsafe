import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Lock, ChevronRight, Navigation, Cloud, Wifi, MapPin, Activity, Clock, Menu, X, Home, BarChart2, History, Settings, Square, Play, AlertCircle, Timer, LogOut, Users, FileText, Mic } from 'lucide-react';
import { useGeolocation, useAccelerometer } from './hooks/useSensors';
import { useWeather } from './hooks/useWeather';
import { useAccidentZones } from './hooks/useAccidentZones';
import { SpeedDisplay } from './components/SpeedDisplay';
import { TripControlPanel } from './components/TripControlPanel';
import { SOSButton } from './components/SOSButton';
import { MonitoringGrid } from './components/MonitoringGrid';
import { SafetyTips } from './components/SafetyTips';
import { TripHistoryList } from './components/TripHistoryList';
import { CrashOverlay } from './components/CrashOverlay';
import { MapComponent } from './components/MapComponent';
import { AudioDetectionIndicator } from './components/AudioDetectionIndicator';
import { FleetDashboard } from './components/fleet/FleetDashboard';
import { InsuranceReportGenerator } from './components/insurance/InsuranceReportGenerator';
import { useAuth } from './contexts/AuthContext';
import { FleetProvider } from './contexts/FleetContext';
import { AppState, Trip, User as DashboardUser } from './types';
import { cn } from './utils/utils';
import { reportCrashEvent } from './services/crashService';
import { SOCKET_URL } from './config/api';

type SafetyAdvisoryLevel = 'info' | 'warning' | 'critical';

interface SafetyAdvisory {
  level: SafetyAdvisoryLevel;
  title: string;
  message: string;
  timestamp: number;
}

const EARTH_RADIUS_KM = 6371;
const toRadians = (value: number) => (value * Math.PI) / 180;
const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const getZoneCenter = (coordinates: [number, number][]): [number, number] => {
  if (!coordinates.length) {
    return [0, 0];
  }
  const sums = coordinates.reduce(
    (acc, [lat, lon]) => [acc[0] + lat, acc[1] + lon] as [number, number],
    [0, 0]
  );
  return [sums[0] / coordinates.length, sums[1] / coordinates.length];
};

export default function App() {
  const { user: authUser, login, register: registerAccount, logout, isAuthenticated, isLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>('welcome');
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripDuration, setTripDuration] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [safetyScore, setSafetyScore] = useState(98);
  const [harshEvents, setHarshEvents] = useState(0);
  const [fatigueTime, setFatigueTime] = useState(45); // minutes
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState<'main' | 'fleet' | 'insurance'>('main');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [autoSosEnabled, setAutoSosEnabled] = useState(() => {
    const saved = localStorage.getItem('smartsafe_auto_sos_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [sosStatusMessage, setSosStatusMessage] = useState<string | null>(null);
  const [safetyAdvisory, setSafetyAdvisory] = useState<SafetyAdvisory | null>(null);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [riskScore, setRiskScore] = useState(98);
  const [trips, setTrips] = useState<Trip[]>([
    { id: '1', date: 'Today, 08:45 AM', distance: 12.4, duration: 1450, safetyScore: 96 },
    { id: '2', date: 'Yesterday, 06:12 PM', distance: 45.2, duration: 3600, safetyScore: 92 },
    { id: '3', date: '28 Feb, 09:20 AM', distance: 8.1, duration: 900, safetyScore: 99 },
  ]);

  const { location, gpsSpeed, setSpeed: setGpsSpeed } = useGeolocation();
  const { gForce, isCrashDetected, crashDetectionResult, accelerometerSpeed, setIsCrashDetected } = useAccelerometer();
  const { weather, error: weatherError } = useWeather(location?.latitude, location?.longitude);
  const { zones: nearbyZones } = useAccidentZones({
    location: location
      ? { latitude: location.latitude, longitude: location.longitude }
      : null,
    radius: 30,
    enabled: !!location && isTripActive,
  });
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [hasCheckedBackendHealth, setHasCheckedBackendHealth] = useState(false);
  const advisoryCooldownRef = useRef<Record<string, number>>({});
  const currentUser: DashboardUser | null = authUser
    ? {
        id: authUser._id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
      }
    : null;

  // Sensor Fusion: Combine GPS (40%) + Accelerometer (60%) for accurate speed
  const [fusedSpeed, setFusedSpeed] = useState<number>(0);

  useEffect(() => {
    // Weighted average: GPS (40%) + Accelerometer (60%)
    // Formula: FusedSpeed = (GPS × 0.4) + (Accelerometer × 0.6)
    const calculatedSpeed = (gpsSpeed * 0.4) + (accelerometerSpeed * 0.6);
    
    // Apply final smoothing for ultra-stable reading
    setFusedSpeed(prevSpeed => {
      const smoothed = (calculatedSpeed * 0.3) + (prevSpeed * 0.7);
      return Math.max(0, Math.round(smoothed * 10) / 10);
    });
  }, [gpsSpeed, accelerometerSpeed]);

  // Use fused speed for all calculations
  const speed = fusedSpeed;

  const nearestZone = location
    ? nearbyZones
        .map((zone) => {
          const center = getZoneCenter(zone.coordinates);
          return {
            zone,
            distanceKm: haversineDistanceKm(
              location.latitude,
              location.longitude,
              center[0],
              center[1]
            ),
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null
    : null;

  const normalizedWeather = (weather?.condition || '').toLowerCase();
  const isBadWeather =
    normalizedWeather.includes('rain') ||
    normalizedWeather.includes('storm') ||
    normalizedWeather.includes('fog') ||
    normalizedWeather.includes('snow');
  const recommendedSpeedLimit = isBadWeather ? 45 : weather?.windSpeed && weather.windSpeed > 30 ? 50 : 60;

  useEffect(() => {
    let score = 100;

    if (speed > 80) {
      score -= 34;
    } else if (speed > 60) {
      score -= 16;
    }

    if (isBadWeather) {
      score -= 18;
    }

    if (weather?.windSpeed && weather.windSpeed > 40) {
      score -= 10;
    }

    if (nearestZone) {
      if (nearestZone.zone.severity === 'high' && nearestZone.distanceKm < 1) {
        score -= 30;
      } else if (nearestZone.distanceKm < 1) {
        score -= 20;
      } else if (nearestZone.distanceKm < 2) {
        score -= 10;
      }
    }

    if (!isBackendHealthy) {
      score -= 8;
    }

    const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
    setRiskScore(boundedScore);
    if (boundedScore >= 75) {
      setRiskLevel('LOW');
    } else if (boundedScore >= 45) {
      setRiskLevel('MEDIUM');
    } else {
      setRiskLevel('HIGH');
    }
  }, [speed, isBadWeather, weather?.windSpeed, nearestZone, isBackendHealthy]);

  useEffect(() => {
    if (!isTripActive || !location) {
      return;
    }

    const now = Date.now();
    const canNotify = (key: string, cooldownMs: number) => {
      const previous = advisoryCooldownRef.current[key] || 0;
      if (now - previous < cooldownMs) {
        return false;
      }
      advisoryCooldownRef.current[key] = now;
      return true;
    };

    const pushAdvisory = (
      key: string,
      level: SafetyAdvisoryLevel,
      title: string,
      message: string,
      cooldownMs: number,
      speak: boolean
    ) => {
      if (!canNotify(key, cooldownMs)) {
        return;
      }
      setSafetyAdvisory({ level, title, message, timestamp: now });
      if (speak && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`${title}. ${message}`);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 0.95;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    };

    if (speed > recommendedSpeedLimit + 10) {
      pushAdvisory(
        'overspeed',
        speed > recommendedSpeedLimit + 25 ? 'critical' : 'warning',
        'Reduce Speed',
        `Your speed is ${Math.round(speed)} km/h. Recommended max is ${recommendedSpeedLimit} km/h for current conditions.`,
        30000,
        true
      );
      setHarshEvents((prev) => prev + 1);
      return;
    }

    if (nearestZone && nearestZone.distanceKm <= 1.2) {
      const km = nearestZone.distanceKm < 0.1 ? '<0.1' : nearestZone.distanceKm.toFixed(1);
      pushAdvisory(
        `zone_${nearestZone.zone.id}`,
        nearestZone.zone.severity === 'high' ? 'critical' : 'warning',
        'Accident-Prone Zone Ahead',
        `${nearestZone.zone.severity.toUpperCase()} risk zone ${km} km ahead. Slow down and increase following distance.`,
        45000,
        true
      );
      return;
    }

    if (isBadWeather && speed > 45) {
      pushAdvisory(
        'weather_speed',
        'warning',
        'Weather Risk Alert',
        `Road conditions are ${weather?.condition || 'adverse'}. Keep speed below 45 km/h and avoid sudden braking.`,
        60000,
        false
      );
      return;
    }

    if (now - (safetyAdvisory?.timestamp || 0) > 25000) {
      setSafetyAdvisory(null);
    }
  }, [isTripActive, location, speed, recommendedSpeedLimit, nearestZone, isBadWeather, weather?.condition, safetyAdvisory?.timestamp]);

  useEffect(() => {
    localStorage.setItem('smartsafe_auto_sos_enabled', String(autoSosEnabled));
  }, [autoSosEnabled]);

  useEffect(() => {
    let cancelled = false;

    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/health`);
        if (cancelled) {
          return;
        }
        setIsBackendHealthy(response.ok);
      } catch {
        if (cancelled) {
          return;
        }
        setIsBackendHealthy(false);
      } finally {
        if (!cancelled) {
          setHasCheckedBackendHealth(true);
        }
      }
    };

    void checkBackendHealth();
    const interval = setInterval(() => {
      void checkBackendHealth();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTripActive) {
      interval = setInterval(() => {
        setTripDuration((prev) => prev + 1);
        // Simulate distance if moving
        if (speed > 5) {
          setTripDistance((prev) => prev + speed / 3600);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTripActive, speed]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && appState !== 'dashboard') {
      setAppState('dashboard');
      return;
    }

    if (!isAuthenticated && appState === 'dashboard') {
      setAppState('login');
    }
  }, [isAuthenticated, isLoading, appState]);

  const canStartRealTimeMonitoring =
    isBackendHealthy &&
    !!location &&
    !!weather &&
    !weatherError;

  const handleStartTrip = () => {
    if (!canStartRealTimeMonitoring) {
      setSosStatusMessage('Cannot start: core real-time services are unavailable');
      return;
    }
    setIsTripActive(true);
    setTripDuration(0);
    setTripDistance(0);
  };

  const handleStopTrip = () => {
    setIsTripActive(false);
    const newTrip: Trip = {
      id: Date.now().toString(),
      date: 'Just now',
      distance: Number(tripDistance.toFixed(2)),
      duration: tripDuration,
      safetyScore: safetyScore,
    };
    setTrips([newTrip, ...trips.slice(0, 4)]);
  };

  const handleLoginSubmit = async () => {
    setAuthError(null);

    if (!loginEmail.trim() || !loginPassword.trim() || (isSignupMode && !signupName.trim())) {
      setAuthError(
        isSignupMode
          ? 'Name, email and password are required.'
          : 'Email and password are required.'
      );
      return;
    }

    try {
      setIsLoggingIn(true);
      if (isSignupMode) {
        await registerAccount({
          name: signupName.trim(),
          email: loginEmail.trim(),
          password: loginPassword,
        });
      } else {
        await login({ email: loginEmail.trim(), password: loginPassword });
      }
      setLoginPassword('');
      setSignupName('');
      setDashboardView('main');
      setAppState('dashboard');
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : isSignupMode
          ? 'Sign up failed'
          : 'Login failed'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDashboardView('main');
    setIsTripActive(false);
    setAppState('welcome');
  };

  const dispatchSOS = (
    source: 'manual' | 'auto',
    details: unknown = null
  ): boolean => {
    if (!isBackendHealthy) {
      setSosStatusMessage('SOS blocked: backend dispatch service offline');
      return false;
    }

    if (!location) {
      setSosStatusMessage('SOS not sent: GPS location unavailable');
      return false;
    }

    const sosMessage = {
      type: 'EMERGENCY_SOS',
      source,
      timestamp: Date.now(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      crashDetails: details,
      message: 'CRASH DETECTED - IMMEDIATE ASSISTANCE REQUIRED'
    };

    window.dispatchEvent(new CustomEvent('sos-sent', { detail: sosMessage }));
    setSosStatusMessage(source === 'manual' ? 'Manual SOS sent' : 'Auto SOS sent');

    void reportCrashEvent({
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      severity: 'high',
      indicatorsTriggered:
        source === 'manual'
          ? ['manual_sos']
          : Array.isArray((details as any)?.triggeredIndicators)
          ? (details as any).triggeredIndicators
          : ['crash_detected'],
      confidence:
        source === 'manual'
          ? 100
          : typeof (details as any)?.confidence === 'number'
          ? (details as any).confidence
          : 80,
      indicatorCount:
        source === 'manual'
          ? 1
          : typeof (details as any)?.indicatorCount === 'number'
          ? (details as any).indicatorCount
          : 1,
      gForce,
      speed,
      weatherConditions: weather
        ? {
            temperature: weather.temp,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            condition: weather.condition,
          }
        : undefined,
      sosTriggered: true,
      sosSentAt: new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to persist SOS event:', error);
      setSosStatusMessage('SOS sent locally, backend sync failed');
    });

    return true;
  };

  const handleManualSOS = () => {
    dispatchSOS('manual');
  };

  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col bg-slate-950 overflow-y-auto"
    >
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1517672682452-9411399e7f4a?auto=format&fit=crop&q=80&w=2000" 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
        <div className="scanline opacity-20" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Real-Time Monitoring Enabled</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight px-4"
        >
          Next-Generation <br />
          <span className="text-emerald-400">Road Safety System</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-xl mb-12 max-w-2xl font-medium leading-relaxed px-6"
        >
          Advanced predictive alerts, real-time weather analysis, and automated emergency SOS dispatch to keep you safe on every journey.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => setAppState('login')}
            className="w-full sm:w-auto px-10 py-4 bg-white text-slate-950 font-black text-base rounded-full shadow-2xl flex items-center justify-center gap-2 group hover:scale-105 transition-all"
          >
            Start Driving Safely
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => setAppState('login')}
            className="w-full sm:w-auto px-10 py-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 text-white font-black text-base rounded-full hover:bg-slate-800 transition-all"
          >
            View Live Map
          </button>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="relative z-10 py-16 md:py-24 px-4 md:px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Comprehensive Safety Infrastructure</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium">Our system integrates multiple data points to provide unparalleled protection on the road.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: AlertCircle, title: "Advanced Crash Detection", desc: "95-98% accuracy with 8-method detection system including accelerometer, gyroscope, and sound analysis.", color: "text-red-500", bg: "bg-red-500/10" },
              { icon: MapPin, title: "Accident Zone Alerts", desc: "Real-time alerts when approaching high-risk areas. Automatic detection of nearby accident-prone zones.", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Cloud, title: "Weather & Risk Analysis", desc: "Live weather monitoring with visibility tracking. Dynamic risk calculation based on conditions and speed.", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Activity, title: "Harsh Driving Detection", desc: "Real-time monitoring of harsh braking, rapid acceleration, and speeding. Instant feedback to improve behavior.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
              { icon: Shield, title: "Automated SOS Dispatch", desc: "Instant emergency alerts to contacts with GPS location. Manual SOS button for immediate help.", color: "text-red-500", bg: "bg-red-500/10" },
              { icon: Clock, title: "Fatigue Detection", desc: "Monitors driving duration and patterns. Alerts when rest is needed. Prevents drowsy driving accidents.", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Navigation, title: "Live GPS Tracking", desc: "Real-time location tracking with interactive map. Route history and trip analytics.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: BarChart2, title: "Safety Score & Analytics", desc: "Comprehensive driving behavior analysis. Trip metrics including speed, distance, and safety events.", color: "text-cyan-500", bg: "bg-cyan-500/10" },
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-3xl hover:border-emerald-500/30 transition-all group">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", feature.bg)}>
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Section */}
      <section className="relative z-10 py-24 px-6 bg-slate-950 border-t border-slate-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              Intelligent routing meets <br />
              <span className="text-emerald-400">emergency response.</span>
            </h2>
            <ul className="space-y-6">
              {[
                "95-98% accurate crash detection with 8-method system",
                "Real-time accident zone alerts within 50km radius",
                "Fatigue detection with smart rest recommendations",
                "Harsh driving monitoring (braking, acceleration, speeding)",
                "Live weather integration with risk calculation",
                "Automated SOS dispatch to emergency contacts",
                "Trip analytics with safety score tracking"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-300 font-bold">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-black text-white">Live Tracking</span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
            <div className="space-y-6">
              <div className="p-4 md:p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Risk Level</span>
                  <span className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest">Medium</span>
                </div>
                <div className="w-full h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-amber-500" />
                </div>
              </div>
              <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-black text-red-400 mb-1">Accident Prone Zone</div>
                  <p className="text-xs text-slate-500 font-medium">Reduce speed to 40km/h. Sharp curve ahead.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6 bg-emerald-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to upgrade your road safety?</h2>
          <p className="text-white/80 text-lg md:text-xl mb-12 font-medium">Join thousands of drivers using the SmartSafe website to protect themselves and their passengers on every journey.</p>
          <button 
            onClick={() => setAppState('login')}
            className="px-12 py-5 bg-white text-slate-950 font-black text-lg rounded-full shadow-2xl hover:scale-105 transition-all"
          >
            Open SmartSafe Website
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 bg-slate-950 border-t border-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">SmartSafe</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-slate-500">
            <button className="hover:text-white transition-colors">About Us</button>
            <button className="hover:text-white transition-colors">Contact</button>
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <button className="hover:text-white transition-colors">Terms of Service</button>
          </div>
          <div className="text-sm font-bold text-slate-500">
            © 2026 SmartSafe. All rights reserved.
          </div>
        </div>
      </footer>
    </motion.div>
  );

  const renderLogin = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-slate-950"
    >
      <div className="w-full max-w-[320px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-[28px] p-7 md:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">
            {isSignupMode ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            {isSignupMode ? 'New User Signup' : 'Secure Access'}
          </p>
        </div>
        <div className="space-y-4">
          {isSignupMode && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors font-medium"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="email"
                placeholder="driver@smartsafe.ai"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors font-medium"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors font-medium"
              />
            </div>
          </div>
          {authError && (
            <div className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {authError}
            </div>
          )}
          <button
            onClick={handleLoginSubmit}
            disabled={isLoggingIn}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] mt-2 uppercase tracking-widest"
          >
            {isLoggingIn
              ? isSignupMode
                ? 'Creating Account...'
                : 'Signing In...'
              : isSignupMode
              ? 'Create Account'
              : 'Sign In'}
          </button>
          <button
            onClick={() => {
              setIsSignupMode((prev) => !prev);
              setAuthError(null);
            }}
            className="w-full text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            {isSignupMode ? 'Existing user? Sign In' : 'New user? Create account'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => {
    // Show different views based on dashboardView state
    if (dashboardView === 'fleet') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[100dvh] bg-[#05070a] text-slate-200 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setDashboardView('main')}
                className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                ← Back to Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] group"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
            <FleetDashboard
              currentUser={currentUser}
              onNavigateBack={() => setDashboardView('main')}
            />
          </div>
        </motion.div>
      );
    }

    if (dashboardView === 'insurance') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[100dvh] bg-[#05070a] text-slate-200 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setDashboardView('main')}
                className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                ← Back to Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] group"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
            <InsuranceReportGenerator
              driverId={currentUser?.id || ''}
              driverName={currentUser?.name || 'Unknown Driver'}
              driverEmail={currentUser?.email || 'unknown@smartsafe.ai'}
            />
          </div>
        </motion.div>
      );
    }

    // Main dashboard view
    return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] bg-[#05070a] text-slate-200 flex flex-col overflow-hidden"
    >
      {/* Top Navbar Removed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDashboardView('fleet')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              Fleet
            </button>
            <button
              onClick={() => setDashboardView('insurance')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              Insurance
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] group"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
        <div className="mb-8 md:mb-10">
          <div className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Live Journey Monitor</div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2">SmartSafe Dashboard</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium">Real-time risk analysis, weather conditions, and safety guidance for your current trip.</p>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6 md:mt-8">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={isTripActive ? handleStopTrip : handleStartTrip}
                disabled={!isTripActive && !canStartRealTimeMonitoring}
                className={cn(
                  "px-6 md:px-8 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm flex items-center gap-2 transition-all shadow-xl whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
                  isTripActive ? "bg-slate-800 text-white" : "bg-white text-slate-950"
                )}
              >
                {isTripActive ? <Square className="w-3 h-3 md:w-4 md:h-4 fill-current" /> : <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />}
                {isTripActive ? "Stop Trip" : "Start Trip"}
              </button>
              <span className="text-[10px] md:text-xs font-bold text-slate-500">
                {canStartRealTimeMonitoring ? 'Start tracking your journey' : 'Waiting for GPS, weather, and backend'}
              </span>
            </div>
          </div>
        </div>

        {safetyAdvisory && (
          <div
            className={cn(
              "mb-6 rounded-2xl border px-4 py-3 md:px-5 md:py-4",
              safetyAdvisory.level === 'critical'
                ? 'bg-red-500/10 border-red-500/40'
                : safetyAdvisory.level === 'warning'
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-cyan-500/10 border-cyan-500/40'
            )}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={cn(
                  "w-5 h-5 mt-0.5 shrink-0",
                  safetyAdvisory.level === 'critical'
                    ? 'text-red-400'
                    : safetyAdvisory.level === 'warning'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                )}
              />
              <div>
                <div className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                  {safetyAdvisory.title}
                </div>
                <div className="text-[11px] md:text-xs text-slate-300 font-medium mt-1">
                  {safetyAdvisory.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Risk Level Card */}
          <div className="bg-emerald-500 rounded-[32px] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest">Risk Level</span>
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
            </div>
            <div className="my-6 md:my-8 relative z-10">
              <div className="text-4xl md:text-6xl font-black text-white mb-2">{riskLevel}</div>
              <p className="text-white/80 text-[10px] md:text-xs font-medium leading-relaxed max-w-[200px]">
                Calculated from speed, weather, and accident zone data.
              </p>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">Live</div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-white/20 flex items-center justify-center">
                <div className="text-[10px] md:text-xs font-black text-white">{riskScore}%</div>
              </div>
            </div>
          </div>

          {/* Trip Metrics Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-black text-white uppercase tracking-widest">Trip Metrics</span>
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-auto">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Speed</div>
                <div className="text-xl font-black text-white">{Math.round(speed)} <span className="text-[10px] text-slate-500">km/h</span></div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Distance</div>
                <div className="text-xl font-black text-white">{tripDistance.toFixed(1)} <span className="text-[10px] text-slate-500">km</span></div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Duration</div>
                <div className="text-xl font-black text-white">{Math.floor(tripDuration / 60)} <span className="text-[10px] text-slate-500">min</span></div>
              </div>
            </div>
          </div>

          {/* Weather Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-black text-white uppercase tracking-widest">Weather & Visibility</span>
              <Cloud className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Cloud className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Condition</div>
                <div className="text-lg font-black text-white">
                  {weatherError ? 'Unavailable' : weather?.condition || 'Loading...'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temp</div>
                <div className="text-sm font-black text-white">{weather?.temp ?? '--'}°C</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Humid</div>
                <div className="text-sm font-black text-blue-400">{weather?.humidity ?? '--'}%</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Wind</div>
                <div className="text-sm font-black text-amber-500">{weather?.windSpeed ? Math.round(weather.windSpeed) : '--'} <span className="text-[10px]">km/h</span></div>
              </div>
            </div>
          </div>

          {/* Driving Behavior Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-black text-white uppercase tracking-widest">Driving Behavior</span>
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-white">100 <span className="text-xl text-slate-500">/100</span></div>
              <div className="mt-2 inline-block px-4 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">Excellent</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-1.5">
                  <AlertCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg font-black text-white">0</div>
                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center">Harsh Brakes</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg font-black text-white">0</div>
                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center">Rapid Accels</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-1.5">
                  <Timer className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg font-black text-white">{harshEvents}</div>
                <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center">Speeding</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white mb-1">Live Route & Accident Zones</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time map with your location and nearby accident zones.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-colors">
                <Activity className="w-4 h-4" />
                View analytics
              </button>
            </div>
            <div className="flex-1 rounded-2xl border border-slate-800/50 overflow-hidden">
              <MapComponent currentLocation={location} speed={speed} className="h-full min-h-[300px]" />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isBackendHealthy ? 'Dispatch backend connected' : 'Dispatch backend offline'}
                </span>
              </div>
              <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoSosEnabled((prev) => !prev)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      autoSosEnabled ? "bg-emerald-500" : "bg-slate-600"
                    )}
                    type="button"
                    aria-label={`Auto SOS ${autoSosEnabled ? 'enabled' : 'disabled'}`}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        autoSosEnabled ? "right-1" : "left-1"
                      )}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Auto SOS Dispatch</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      {autoSosEnabled ? 'Enabled on crash' : 'Disabled (manual only)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Audio Detection Indicator */}
            <AudioDetectionIndicator />
            
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Safety Guidelines</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Keep Safe Distance</div>
                    <p className="text-[10px] text-slate-500 font-medium">Maintain at least 3 seconds gap from the vehicle ahead.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Reduce Speed</div>
                    <p className="text-[10px] text-slate-500 font-medium">Wet roads increase braking distance by 2x.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Use Headlights</div>
                    <p className="text-[10px] text-slate-500 font-medium">Turn on low beams in fog or heavy rain.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-8 flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-slate-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-xs text-slate-500 font-medium">No activity yet. Start your trip to see events.</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Bar */}
        <div className="mt-8 md:mt-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">
                System Health: {canStartRealTimeMonitoring ? 'Ready' : 'Limited'}
              </span>
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-500 font-medium">
              {canStartRealTimeMonitoring
                ? 'Core real-time safety modules are online.'
                : 'Real-time safety is reduced until all core services recover.'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {[
              hasCheckedBackendHealth
                ? `Backend ${isBackendHealthy ? 'online' : 'offline'}`
                : 'Backend checking',
              weatherError ? 'Weather offline' : 'Weather online',
              location ? 'GPS online' : 'GPS offline',
              autoSosEnabled ? 'Auto SOS on' : 'Auto SOS off',
              `Safe speed ${recommendedSpeedLimit} km/h`,
            ].map((status, i) => (
              <div key={i} className="px-2 md:px-3 py-1 bg-slate-950/50 border border-slate-800/50 rounded-full text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {status}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating SOS Button */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100]">
        <SOSButton onSOS={handleManualSOS} />
      </div>

      {sosStatusMessage && (
        <div className="fixed bottom-24 right-4 md:bottom-32 md:right-8 z-[100] px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-[10px] md:text-xs font-bold text-slate-200 uppercase tracking-wider">
          {sosStatusMessage}
        </div>
      )}

      {/* Crash Overlay */}
      <AnimatePresence>
        {isCrashDetected && (
          <CrashOverlay
            crashDetectionResult={crashDetectionResult}
            onCancel={() => setIsCrashDetected(false)}
            onConfirm={() => {
              if (autoSosEnabled) {
                dispatchSOS('auto', crashDetectionResult);
              } else {
                setSosStatusMessage('Crash detected: auto SOS is off');
              }
              setIsCrashDetected(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          speed > 60 ? "bg-red-500/5 opacity-100" : "bg-blue-500/5 opacity-100"
        )} />
      </div>
    </motion.div>
    );
  };

  return (
    <FleetProvider>
      <div className="font-sans selection:bg-blue-500 selection:text-white">
        <AnimatePresence mode="wait">
          {appState === 'welcome' && renderWelcome()}
          {appState === 'login' && renderLogin()}
          {appState === 'dashboard' && renderDashboard()}
        </AnimatePresence>
      </div>
    </FleetProvider>
  );
}

