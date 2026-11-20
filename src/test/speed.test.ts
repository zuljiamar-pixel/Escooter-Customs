import { describe, expect, it } from 'vitest';
import {
  circumferenceFromInch,
  correctedSpeed,
  displayDeviation,
  distanceM,
  INITIAL_GPS,
  nextGps,
  rpmFromSpeed,
  speedFromRpm,
} from '../lib/speed';

describe('wheel math', () => {
  it('derives the circumference of an 11 inch wheel', () => {
    expect(circumferenceFromInch(11)).toBeCloseTo(877.75, 1);
  });

  it('converts between rotations per minute and km/h', () => {
    const c = circumferenceFromInch(11);
    expect(speedFromRpm(475, c)).toBeCloseTo(25.02, 1);
    expect(rpmFromSpeed(25, c)).toBeCloseTo(474.7, 0);
    expect(speedFromRpm(rpmFromSpeed(37, c), c)).toBeCloseTo(37, 6);
    expect(rpmFromSpeed(20, 0)).toBe(0);
  });

  it('corrects the displayed speed for a smaller real tire', () => {
    // Abgefahrener Reifen: 2 % weniger Umfang → echte Geschwindigkeit 2 % niedriger
    expect(correctedSpeed(25, 1000, 980)).toBeCloseTo(24.5, 6);
    expect(displayDeviation(25, 24.5)).toBeCloseTo(2.04, 2);
    expect(displayDeviation(25, 0)).toBe(0);
  });
});

describe('gps speed', () => {
  it('measures distance between coordinates', () => {
    // 0.001° Breite ≈ 111 m
    expect(distanceM(47, 8, 47.001, 8)).toBeCloseTo(111.2, 0);
  });

  it('uses the speed the browser reports and tracks max and distance', () => {
    let s = nextGps(INITIAL_GPS, { lat: 47, lon: 8, accuracy: 5, speed: 0, time: 0 });
    expect(s.kmh).toBe(0);
    s = nextGps(s, { lat: 47.0001, lon: 8, accuracy: 5, speed: 6.25, time: 2000 });
    expect(s.kmh).toBeCloseTo(22.5, 6);
    expect(s.maxKmh).toBeCloseTo(22.5, 6);
    expect(s.distanceKm).toBeCloseTo(0.0111, 3);
  });

  it('falls back to position changes when no speed is reported', () => {
    let s = nextGps(INITIAL_GPS, { lat: 47, lon: 8, accuracy: 5, speed: null, time: 0 });
    s = nextGps(s, { lat: 47.0001, lon: 8, accuracy: 5, speed: null, time: 2000 });
    expect(s.kmh).toBeCloseTo(20, 0); // 11,1 m in 2 s
  });

  it('ignores standstill noise and inaccurate fixes for max and distance', () => {
    let s = nextGps(INITIAL_GPS, { lat: 47, lon: 8, accuracy: 5, speed: 0.3, time: 0 });
    expect(s.kmh).toBe(0);
    s = nextGps(s, { lat: 47.001, lon: 8, accuracy: 80, speed: 20, time: 1000 });
    expect(s.kmh).toBeCloseTo(72, 6);
    expect(s.maxKmh).toBe(0);
    expect(s.distanceKm).toBe(0);
  });
});
