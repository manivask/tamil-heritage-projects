/**
 * Timer & Alarm Engine
 * Provides live countdown timers, audio synthesizer chimes (Web Audio API),
 * and interactive inline timer cards with start/pause/cancel controls.
 */

class TimerEngine {
  constructor(onTimerComplete) {
    this.activeTimers = new Map(); // id -> timerObject
    this.onTimerComplete = onTimerComplete;
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play gentle melodic chime using Web Audio API
  playChimeSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Gentle chime chords: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const frequencies = [523.25, 659.25, 783.99, 1046.50];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0.001, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Create and start a countdown timer
  createTimer(seconds, label = 'Timer') {
    const id = 'timer-' + Date.now();
    const totalSeconds = Math.max(1, Math.floor(seconds));

    const timerObj = {
      id,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
      intervalId: null
    };

    this.startInterval(timerObj);
    this.activeTimers.set(id, timerObj);

    return timerObj;
  }

  startInterval(timerObj) {
    if (timerObj.intervalId) clearInterval(timerObj.intervalId);

    timerObj.intervalId = setInterval(() => {
      if (!timerObj.isRunning) return;

      timerObj.remainingSeconds -= 1;
      this.updateTimerCardUI(timerObj);

      if (timerObj.remainingSeconds <= 0) {
        clearInterval(timerObj.intervalId);
        timerObj.isRunning = false;
        timerObj.remainingSeconds = 0;
        this.playChimeSound();

        if (this.onTimerComplete) {
          this.onTimerComplete(timerObj);
        }
      }
    }, 1000);
  }

  togglePause(id) {
    const timer = this.activeTimers.get(id);
    if (!timer) return;

    timer.isRunning = !timer.isRunning;
    const btn = document.querySelector(`#${id} .timer-pause-btn`);
    if (btn) {
      btn.innerHTML = timer.isRunning ? '⏸ Pause' : '▶ Resume';
    }
  }

  cancelTimer(id) {
    const timer = this.activeTimers.get(id);
    if (!timer) return;

    if (timer.intervalId) clearInterval(timer.intervalId);
    this.activeTimers.delete(id);

    const card = document.getElementById(id);
    if (card) {
      card.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">⏱ Timer cancelled</div>`;
    }
  }

  formatTimeDisplay(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  updateTimerCardUI(timer) {
    const card = document.getElementById(timer.id);
    if (!card) return;

    const timeDisplay = card.querySelector('.timer-countdown');
    const progressBar = card.querySelector('.timer-progress-fill');

    if (timeDisplay) {
      timeDisplay.textContent = this.formatTimeDisplay(timer.remainingSeconds);
    }

    if (progressBar) {
      const percentage = (timer.remainingSeconds / timer.totalSeconds) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (timer.remainingSeconds === 0) {
      card.classList.add('timer-finished');
      const statusText = card.querySelector('.timer-status-badge');
      if (statusText) statusText.textContent = '🎉 Done!';
    }
  }

  // Render HTML for inline Timer Card
  renderTimerCard(timer) {
    const formatted = this.formatTimeDisplay(timer.totalSeconds);

    return `
      <div class="rich-widget-card timer-widget-card" id="${timer.id}">
        <div class="timer-card-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="timer-icon-pulse">⏱️</span>
            <div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem;">${timer.label}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Set for ${formatted}</div>
            </div>
          </div>
          <span class="diff-pill timer-status-badge">Counting down</span>
        </div>

        <div class="timer-countdown-row">
          <div class="timer-countdown">${formatted}</div>
        </div>

        <div class="timer-progress-track">
          <div class="timer-progress-fill" style="width: 100%;"></div>
        </div>

        <div class="timer-controls-row">
          <button class="timer-btn timer-pause-btn" onclick="window.TimerController.togglePause('${timer.id}')">
            ⏸ Pause
          </button>
          <button class="timer-btn timer-cancel-btn" onclick="window.TimerController.cancel('${timer.id}')">
            ✕ Cancel
          </button>
        </div>
      </div>
    `;
  }
}

window.TimerEngine = TimerEngine;
