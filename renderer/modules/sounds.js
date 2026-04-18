/* ════════════════════════════════════════
   SOUNDS MODULE — Web Audio API
   No audio files required. All synthesized.
════════════════════════════════════════ */

const AppSounds = (() => {
  let ctx = null;
  let enabled = true;

  function _getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function _isOn() {
    const stored = localStorage.getItem('dsbp_sounds');
    return stored === null ? true : stored === 'true';
  }

  function _play(fn) {
    if (!_isOn()) return;
    const ac = _getCtx();
    if (!ac) return;
    try { fn(ac); } catch(e) {}
  }

  // ── Sounds ──────────────────────────────

  /** Soft UI click */
  function click() {
    _play(ac => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(1200, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.06);
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
      o.start(ac.currentTime);
      o.stop(ac.currentTime + 0.08);
    });
  }

  /** Success chime (save / confirm) */
  function success() {
    _play(ac => {
      [[523, 0], [659, 0.1], [784, 0.2]].forEach(([freq, delay]) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.connect(g); g.connect(ac.destination);
        o.frequency.value = freq;
        const t = ac.currentTime + delay;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t); o.stop(t + 0.36);
      });
    });
  }

  /** Error buzz */
  function error() {
    _play(ac => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(150, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.18);
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.22);
    });
  }

  /** Deploy launch whoosh */
  function deploy() {
    _play(ac => {
      // Noise burst
      const buf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = ac.createBufferSource();
      source.buffer = buf;
      const filter = ac.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, ac.currentTime);
      filter.frequency.exponentialRampToValueAtTime(6000, ac.currentTime + 0.4);
      filter.Q.value = 2;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      source.connect(filter); filter.connect(g); g.connect(ac.destination);
      source.start(ac.currentTime);

      // Rising tone
      const o = ac.createOscillator();
      const og = ac.createGain();
      o.type = 'sine';
      o.connect(og); og.connect(ac.destination);
      o.frequency.setValueAtTime(300, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.35);
      og.gain.setValueAtTime(0.1, ac.currentTime);
      og.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.4);
    });
  }

  /** Soft notification ping */
  function notify() {
    _play(ac => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(880, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.05);
      o.frequency.exponentialRampToValueAtTime(1100, ac.currentTime + 0.25);
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.3);
    });
  }

  /** Subtle tab switch */
  function tabSwitch() {
    _play(ac => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(600, ac.currentTime);
      o.frequency.linearRampToValueAtTime(700, ac.currentTime + 0.06);
      g.gain.setValueAtTime(0.04, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.1);
    });
  }

  /** Modal open pop */
  function modalOpen() {
    _play(ac => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.connect(g); g.connect(ac.destination);
      o.frequency.setValueAtTime(400, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(700, ac.currentTime + 0.08);
      g.gain.setValueAtTime(0.06, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.12);
    });
  }

  return { click, success, error, deploy, notify, tabSwitch, modalOpen, isOn: _isOn };
})();

window.AppSounds = AppSounds;
