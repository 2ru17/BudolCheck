export interface DeviceProfile {
  isMobileViewport: boolean;
  isLowEndHardware: boolean;
  supportsWebGL: boolean;
  maxDpr: [number, number];
}

export const motionTokens = {
  duration: {
    fast: 0.16,
    normal: 0.28,
    slow: 0.45,
  },
  easing: {
    smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
    sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  distance: {
    sm: 6,
    md: 12,
    lg: 20,
  },
};

export function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function getDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      isMobileViewport: false,
      isLowEndHardware: false,
      supportsWebGL: false,
      maxDpr: [1, 1.5],
    };
  }

  const isMobileViewport = window.innerWidth < 768;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 4;
  const lowCores =
    nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4;
  const isLowEndHardware = lowMemory || (lowCores && isMobileViewport);
  const supportsWebGL = checkWebGLSupport();

  return {
    isMobileViewport,
    isLowEndHardware,
    supportsWebGL,
    maxDpr: isMobileViewport || isLowEndHardware ? [1, 1.25] : [1, 1.5],
  };
}

export function formatCurrency(amountPhp: number, currency: 'PHP' | 'USD'): string {
  if (currency === 'USD') {
    return `$${amountPhp.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₱${amountPhp.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
