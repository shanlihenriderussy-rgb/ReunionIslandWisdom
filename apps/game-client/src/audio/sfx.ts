// SFX combat procéduraux via Web Audio API.
// Pas d'asset audio (aucune licence a tracer), pas de dependance : oscillateurs + enveloppe.
// `resumeAudio()` doit etre appele sur un geste utilisateur (politique autoplay navigateur).

let ctx: AudioContext | null = null;
let enabled = true;

function getContext(): AudioContext | null {
  if (!enabled) {
    return null;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    enabled = false;
    return null;
  }
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      enabled = false;
      return null;
    }
  }
  return ctx;
}

// A appeler sur un geste (clic/touche) pour debloquer l'audio.
export function resumeAudio(): void {
  const c = getContext();
  if (c && c.state === "suspended") {
    void c.resume();
  }
}

type ToneOptions = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  freqEnd?: number;
};

function tone({ freq, dur, type = "triangle", gain = 0.06, freqEnd }: ToneOptions): void {
  const c = getContext();
  // Tant que le contexte n'est pas "running" (pas de geste utilisateur), on ne joue rien.
  if (!c || c.state !== "running") {
    return;
  }
  const now = c.currentTime;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + dur);
  }
  // Enveloppe percussive (attaque rapide, decroissance exponentielle).
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(gain, now + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(env).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export const sfx = {
  // Coup porte (swing) — court, sec.
  attack(): void {
    tone({ freq: 180, dur: 0.07, type: "square", gain: 0.04, freqEnd: 120 });
  },
  // Impact sur une cible.
  hit(): void {
    tone({ freq: 420, dur: 0.06, type: "triangle", gain: 0.06, freqEnd: 300 });
  },
  // Cible detruite — double tonalite descendante.
  kill(): void {
    tone({ freq: 520, dur: 0.1, type: "sawtooth", gain: 0.06, freqEnd: 160 });
    tone({ freq: 260, dur: 0.16, type: "triangle", gain: 0.05 });
  },
  // Joueur touche.
  playerHurt(): void {
    tone({ freq: 150, dur: 0.12, type: "sawtooth", gain: 0.07, freqEnd: 90 });
  },
  // Joueur vaincu.
  playerDown(): void {
    tone({ freq: 200, dur: 0.5, type: "sawtooth", gain: 0.08, freqEnd: 50 });
  }
};
