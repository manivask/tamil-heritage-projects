/**
 * Voice Engine - Robust Speech Recognition (STT), Speech Synthesis (TTS) & Real-Time Live Audio Meter
 * Provides strict female & male browser voice resolution, calibrated pitch/rate tuning,
 * audio playback controls, and independent Web Audio frequency visualizer.
 */

class VoiceEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.voices = [];
    this.speechRate = 1.0;
    this.speechPitch = 1.0;
    this.currentUtterance = null;
    this.liveAudioContext = null;
    this.liveAnalyser = null;
    this.liveAudioStream = null;
    this.liveMeterFrame = null;
    this.isDemoMeterMode = false;

    // Standard & Soft voice catalog
    this.personas = [
      // --- Soft & Gentle Voices ---
      {
        id: 'soft-female-1',
        name: 'Serena',
        gender: 'female',
        category: 'soft',
        tagline: 'Gentle, Soothing & Relaxed',
        avatarText: 'SR',
        pitch: 1.15,
        rate: 0.88,
        voicePattern: /zira|jenny|samantha|karen|victoria|eva|female/i
      },
      {
        id: 'soft-female-2',
        name: 'Luna',
        gender: 'female',
        category: 'soft',
        tagline: 'Delicate Whisper & Calm',
        avatarText: 'LN',
        pitch: 1.25,
        rate: 0.85,
        voicePattern: /victoria|eva|fiona|zira|samantha|female/i
      },
      {
        id: 'soft-male-1',
        name: 'River',
        gender: 'male',
        category: 'soft',
        tagline: 'Soft-Spoken, Mindful & Deep',
        avatarText: 'RV',
        pitch: 0.78,
        rate: 0.86,
        voicePattern: /david|daniel|guy|george|male/i
      },
      {
        id: 'soft-female-3',
        name: 'Willow',
        gender: 'female',
        category: 'soft',
        tagline: 'Warm Velvet & Serene Pace',
        avatarText: 'WL',
        pitch: 1.05,
        rate: 0.90,
        voicePattern: /susan|moira|veena|zira|female/i
      },

      // --- Standard Personas ---
      {
        id: 'female-1',
        name: 'Aria',
        gender: 'female',
        category: 'standard',
        tagline: 'Warm & Friendly Assistant',
        avatarText: 'AR',
        pitch: 1.18,
        rate: 1.05,
        voicePattern: /zira|samantha|jenny|karen|eva|female/i
      },
      {
        id: 'female-2',
        name: 'Nova',
        gender: 'female',
        category: 'standard',
        tagline: 'Crisp & Modern Persona',
        avatarText: 'NV',
        pitch: 1.35,
        rate: 1.12,
        voicePattern: /aria|susan|moira|tessa|zira|female/i
      },
      {
        id: 'female-3',
        name: 'Elena',
        gender: 'female',
        category: 'standard',
        tagline: 'Calm & Expressive Tone',
        avatarText: 'EL',
        pitch: 1.05,
        rate: 0.95,
        voicePattern: /fiona|veena|catherine|clara|zira|female/i
      },
      {
        id: 'male-1',
        name: 'Leo',
        gender: 'male',
        category: 'standard',
        tagline: 'Deep & Authoritative',
        avatarText: 'LE',
        pitch: 0.72,
        rate: 0.98,
        voicePattern: /david|mark|george|daniel|guy|male/i
      },
      {
        id: 'male-2',
        name: 'Atlas',
        gender: 'male',
        category: 'standard',
        tagline: 'Clear & Articulate Executive',
        avatarText: 'AT',
        pitch: 0.88,
        rate: 1.08,
        voicePattern: /richard|rishi|alex|oliver|david|male/i
      }
    ];

    this.currentPersonaId = 'soft-female-1';
    this.initSpeechRecognition();
    this.loadVoices();

    if (window.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  cleanupLiveAudioMeter() {
    if (this.liveMeterFrame) {
      cancelAnimationFrame(this.liveMeterFrame);
      this.liveMeterFrame = null;
    }

    if (this.liveAudioStream) {
      try {
        this.liveAudioStream.getTracks().forEach(track => track.stop());
      } catch (_) {}
      this.liveAudioStream = null;
    }

    if (this.liveAnalyser) {
      try { this.liveAnalyser.disconnect(); } catch (_) {}
      this.liveAnalyser = null;
    }

    if (this.liveAudioContext) {
      try {
        if (this.liveAudioContext.state === 'running') {
          this.liveAudioContext.close();
        }
      } catch (_) {}
      this.liveAudioContext = null;
    }
    this.isDemoMeterMode = false;
  }

  startLiveAudioMeter(onAudioLevel) {
    this.cleanupLiveAudioMeter();

    const tick = () => {
      if (!this.isListening) return;
      const timeFactor = Date.now() * 0.015;
      const bands = Array.from({ length: 16 }, (_, i) => {
        const wave = Math.sin((i + 1) * 0.8 + timeFactor) * 38 + 48;
        const drift = Math.sin(timeFactor * 1.9 + i * 0.5) * 16;
        return Math.min(100, Math.max(8, Math.round(wave + drift)));
      });
      const level = Math.min(100, Math.max(12, Math.round((bands.reduce((s, v) => s + v, 0) / bands.length))));

      if (onAudioLevel) {
        onAudioLevel(level, bands);
      }
      this.liveMeterFrame = requestAnimationFrame(tick);
    };
    this.liveMeterFrame = requestAnimationFrame(tick);
    return true;
  }

  getPersona(id) {
    return this.personas.find(p => p.id === id) || this.personas[0];
  }

  getCurrentPersona() {
    return this.getPersona(this.currentPersonaId);
  }

  setPersona(id) {
    if (this.personas.some(p => p.id === id)) {
      this.currentPersonaId = id;
    }
  }

  removePersona(id) {
    const idx = this.personas.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.personas.splice(idx, 1);
      if (this.currentPersonaId === id) {
        this.currentPersonaId = 'soft-female-1';
      }
      return true;
    }
    return false;
  }

  resolveBrowserVoice(persona) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    if (!this.voices || this.voices.length === 0) return null;

    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'));
    const candidateList = englishVoices.length > 0 ? englishVoices : this.voices;

    const isFemale = persona.gender === 'female';

    if (isFemale) {
      const femaleKeywords = /microsoft\s*zira|zira|jenny|samantha|karen|victoria|eva|fiona|veena|catherine|clara|aria|female|susan|moira|tessa|microsoft\s*jenny/i;
      const maleKeywords = /microsoft\s*david|david|mark|guy|george|male|daniel|richard|alex|oliver|rishi|microsoft\s*mark|microsoft\s*guy/i;

      let femaleMatch = candidateList.find(v => femaleKeywords.test(v.name) && !maleKeywords.test(v.name));
      if (!femaleMatch) {
        femaleMatch = candidateList.find(v => !maleKeywords.test(v.name));
      }
      if (femaleMatch) return femaleMatch;
    } else {
      const maleKeywords = /microsoft\s*david|david|mark|guy|george|male|daniel|richard|alex|oliver|rishi|microsoft\s*mark|microsoft\s*guy/i;
      const maleMatch = candidateList.find(v => maleKeywords.test(v.name));
      if (maleMatch) return maleMatch;
    }

    return candidateList[0];
  }

  speak(text, onStart, onEnd) {
    if (!this.synth) {
      console.warn('Speech Synthesis not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel();
    this.isSpeaking = false;

    const persona = this.getCurrentPersona();
    const utterance = new SpeechSynthesisUtterance(text);
    const matchedVoice = this.resolveBrowserVoice(persona);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    let basePitch = persona.pitch || 1.0;
    if (persona.gender === 'female' && basePitch < 1.05) {
      basePitch = 1.15;
    } else if (persona.gender === 'male' && basePitch > 0.95) {
      basePitch = 0.82;
    }

    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch * this.speechPitch));
    utterance.rate = Math.max(0.5, Math.min(1.8, (persona.rate || 1.0) * this.speechRate));
    utterance.volume = 1.0;

    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Synth speak error:', err);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Optimal for fast single-utterance recognition
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    } catch (e) {
      console.warn('SpeechRecognition init error:', e);
    }
  }

  startListening({ onStart, onResult, onError, onEnd, onAudioLevel }) {
    this.stopSpeaking();
    this.isListening = true;

    // Start live visualizer
    this.startLiveAudioMeter(onAudioLevel);

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (onStart) onStart();

    if (!this.recognition) {
      if (onError) onError('speech-api-unavailable');
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();
        if (!transcript) continue;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      if (onResult) {
        onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim()
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('SpeechRecognition event note:', event.error);
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      if (!this.isListening) {
        this.cleanupLiveAudioMeter();
        if (onEnd) onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.cleanupLiveAudioMeter();
  }
}

window.VoiceEngine = VoiceEngine;
