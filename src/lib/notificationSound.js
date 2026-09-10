// Zvučni signal i vibracija za novi radni nalog

class SoundNotificationService {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Svira jasan, ugodan i glasan dvotonski zvučni signal (Ding-Dong / Alert)
  playOrderAlert() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Ton 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Ton 2: A5 (880 Hz) - glasniji i viši ton
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);

      // Ton 3: D6 (1174.66 Hz) - finiš tona
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1174.66, now + 0.35);
      gain3.gain.setValueAtTime(0.35, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.35);
      osc3.stop(now + 0.8);

      // Fizička vibracija na telefonu (ako telefon podržava)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 250, 100, 400]);
      }
    } catch (e) {
      console.warn("Audio chime notice:", e);
    }
  }

  // Zahtjev za dozvolu sistemskih notifikacija
  async requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return false;
  }

  // Slanje nativne sistemske notifikacije na telefon
  showSystemNotification(title, body) {
    try {
      this.playOrderAlert();
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "warehouse-order-alert",
          renotify: true
        });
      }
    } catch (e) {
      console.warn("System notification error:", e);
    }
  }
}

export const notificationService = new SoundNotificationService();
