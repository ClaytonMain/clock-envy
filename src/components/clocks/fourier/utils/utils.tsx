import * as THREE from "three";
import useAppStore from "../../../../stores/useAppStore";
import type { EpicycleData, FourierData } from "../types/types";

export class Complex {
  re: number;
  im: number;
  constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }
  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }
  multiply(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re,
    );
  }
  amplitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
}

export function getEpicycleData(
  fourier: FourierData[],
  time: number,
  limit: number = fourier.length,
): { epicycleData: EpicycleData[]; position: THREE.Vector2 } {
  const epicycleData: EpicycleData[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < limit; i++) {
    const prevX = x;
    const prevY = y;
    const freq = fourier[i].freq;
    const radius = fourier[i].amp;
    const phase = fourier[i].phase;
    x += radius * Math.cos(freq * time + phase);
    y -= radius * Math.sin(freq * time + phase);
    epicycleData.push({
      center: new THREE.Vector2(prevX, prevY),
      outerPoint: new THREE.Vector2(x, y),
      scale: radius,
      rotation: -freq * time + phase,
    });
  }
  return { epicycleData, position: new THREE.Vector2(x, y) };
}

function dft(x: Complex[]): FourierData[] {
  const X: FourierData[] = [];
  const N = x.length;
  for (let k = 0; k < N; k++) {
    let sum = new Complex(0, 0);
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      const c = new Complex(Math.cos(phi), -Math.sin(phi));
      sum = sum.add(x[n].multiply(c));
    }
    sum = new Complex(sum.re / N, sum.im / N);
    X.push({
      re: sum.re,
      im: sum.im,
      freq: k,
      amp: sum.amplitude(),
      phase: sum.phase(),
    });
  }
  return X;
}

export function getFourier(points: { x: number; y: number }[]) {
  const signal: Complex[] = points.map((p) => new Complex(p.x, p.y));
  const fourier = dft(signal);
  fourier.sort((a, b) => b.amp - a.amp);
  return fourier;
}

export function getHourMinuteSecondPoints({
  totalPoints,
}: {
  totalPoints: number;
}) {
  const currentTimeValue = useAppStore.getState().currentTimeValue;
  const hour =
    (currentTimeValue.toMillis() / (1000 * 60 * 60) +
      currentTimeValue.offset / 60) %
    12;
  const minute = (currentTimeValue.toMillis() / (1000 * 60)) % 60;
  const hourAngle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
  const minuteAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;

  const pointsPerHand = totalPoints / 2;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < pointsPerHand; i++) {
    const maxHourLength = 0.9;
    const currentLength = -(
      (Math.abs(i - pointsPerHand / 2) - pointsPerHand / 2) /
      pointsPerHand
    );
    points.push({
      x:
        currentLength *
        maxHourLength *
        Math.cos(
          hourAngle + Math.sin((16 * i * Math.PI) / pointsPerHand) * 0.05,
        ),
      y:
        currentLength *
        maxHourLength *
        Math.sin(
          hourAngle + Math.sin((16 * i * Math.PI) / pointsPerHand) * 0.05,
        ),
    });
  }
  for (let i = 0; i < pointsPerHand; i++) {
    const maxMinuteLength = 1;
    const currentLength = -(
      (Math.abs(i - pointsPerHand / 2) - pointsPerHand / 2) /
      pointsPerHand
    );
    points.push({
      x:
        currentLength *
        maxMinuteLength *
        Math.cos(
          minuteAngle + Math.sin((16 * i * Math.PI) / pointsPerHand) * 0.05,
        ),
      y:
        currentLength *
        maxMinuteLength *
        Math.sin(
          minuteAngle + Math.sin((16 * i * Math.PI) / pointsPerHand) * 0.05,
        ),
    });
  }
  while (points.length < totalPoints) {
    points.push({ x: 0, y: 0 });
  }
  while (points.length > totalPoints) {
    points.pop();
  }
  return points;
}
