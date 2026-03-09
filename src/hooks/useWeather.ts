import { useState, useEffect } from 'react';
import { WeatherData } from '../types';

// Weather cache with localStorage persistence
interface WeatherCache {
  data: WeatherData;
  timestamp: number;
  location: string;
}

const CACHE_KEY = 'smartsafe_weather_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Round coordinates to reduce cache misses (0.01 degree ≈ 1km precision)
const roundCoordinate = (coord: number): number => Math.round(coord * 100) / 100;

const getCacheKey = (lat: number, lon: number): string => {
  return `${roundCoordinate(lat)},${roundCoordinate(lon)}`;
};

const getFromCache = (lat: number, lon: number): WeatherData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: WeatherCache = JSON.parse(cached);
    const locationKey = getCacheKey(lat, lon);
    const now = Date.now();

    // Check if cache is valid (same location and not expired)
    if (cache.location === locationKey && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('Weather: Using cached data');
      return cache.data;
    }

    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const saveToCache = (lat: number, lon: number, data: WeatherData): void => {
  try {
    const cache: WeatherCache = {
      data,
      timestamp: Date.now(),
      location: getCacheKey(lat, lon)
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

export function useWeather(lat?: number, lon?: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    // Try to load from cache first
    const cachedWeather = getFromCache(lat, lon);
    if (cachedWeather) {
      setWeather(cachedWeather);
    }

    const fetchWeather = async () => {
      // Skip fetch if we have valid cached data
      const cached = getFromCache(lat, lon);
      if (cached) {
        setWeather(cached);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log('Weather: Fetching from API');
        // Using Open-Meteo API (free, no API key required)
        // Fetches current weather data based on GPS coordinates
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`
        );
        
        if (!response.ok) {
          throw new Error('Weather API request failed');
        }

        const data = await response.json();
        
        // Map weather codes to conditions
        // https://open-meteo.com/en/docs
        const weatherCode = data.current.weather_code;
        let condition = 'Clear';
        let icon = 'Sun';
        
        if (weatherCode === 0) {
          condition = 'Clear';
          icon = 'Sun';
        } else if (weatherCode >= 1 && weatherCode <= 3) {
          condition = 'Partly Cloudy';
          icon = 'Cloud';
        } else if (weatherCode >= 45 && weatherCode <= 48) {
          condition = 'Foggy';
          icon = 'Cloud';
        } else if (weatherCode >= 51 && weatherCode <= 67) {
          condition = 'Rainy';
          icon = 'CloudRain';
        } else if (weatherCode >= 71 && weatherCode <= 77) {
          condition = 'Snowy';
          icon = 'CloudSnow';
        } else if (weatherCode >= 80 && weatherCode <= 99) {
          condition = 'Stormy';
          icon = 'CloudLightning';
        }

        const weatherData: WeatherData = {
          temp: Math.round(data.current.temperature_2m),
          condition,
          icon,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          windSpeed: data.current.wind_speed_10m
        };

        setWeather(weatherData);
        saveToCache(lat, lon, weatherData);
      } catch (e) {
        console.error('Weather fetch failed', e);
        setWeather(null);
        setError('Weather feed unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, CACHE_DURATION); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [lat, lon]);

  return { weather, isLoading, error };
}
