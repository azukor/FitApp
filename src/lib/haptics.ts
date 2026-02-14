function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail on unsupported browsers
    }
  }
}

/** Light haptic — weight/rep increment */
export function hapticLight() {
  vibrate(10);
}

/** Medium haptic — set logged, interval complete */
export function hapticMedium() {
  vibrate(25);
}

/** Heavy haptic — timer finished */
export function hapticHeavy() {
  vibrate([30, 50, 30]);
}

/** Error haptic — save failure */
export function hapticError() {
  vibrate([50, 30, 50, 30, 50]);
}
