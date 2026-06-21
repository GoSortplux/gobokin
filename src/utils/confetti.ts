import confetti from 'canvas-confetti';

/**
 * Multi-color "puff" from sides when event is published.
 */
export const triggerSuccessConfetti = () => {
  const end = Date.now() + (3 * 1000);

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      zIndex: 9999
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      zIndex: 9999
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};
