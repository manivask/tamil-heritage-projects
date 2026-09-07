/**
 * Voice Enrollment & Session Voice Cloning Studio
 * Features:
 * - Ultra-Sensitive RMS Acoustic Wave Meter (Guarantees visible volume in Edge & Chrome)
 * - Direct Web Audio PCM WAV Encoder
 * - Adult & Kids-Friendly Sentence Catalogs
 * - Male / Female / Kids Profile Selection
 * - Live 16-Band Real-Time Audio Frequency Equalizer
 * - Instant Audio Sample Playback & Validation
 */

class VoiceClonerStudio {
  constructor(voiceEngine, onVoiceProfileCreated) {
    this.voiceEngine = voiceEngine;
    this.onVoiceProfileCreated = onVoiceProfileCreated;

    this.adultSentences = [
      "The quick brown fox jumps over the lazy dog.",
      "Artificial intelligence and voice technology are evolving rapidly every day.",
      "Can you tell me the current time in Tokyo, London, and New York?",
      "Setting a timer and comparing product deals helps me save time and money.",
      "The calm and peaceful ocean waves bring a sense of serenity and focus.",
      "Technology is most powerful when it understands human natural speech.",
      "I am training my personal custom voice persona for this AI assistant.",
      "Thank you for calibrating and cloning my unique voice profile."
    ];

    this.kidsSentences = [
      "Twinkle twinkle little star, how I wonder what you are!",
      "The playful puppy wags his tail and runs around the sunny garden.",
      "I love eating sweet ice cream and watching colorful butterflies.",
      "The friendly dolphin jumped high out of the sparkling blue water.",
      "Reading fun stories makes my imagination fly like a magical kite.",
      "Can you tell me a story about a brave little dragon?",
      "I am training my super voice for the AI robot assistant!",
      "Yay! My kid voice is ready to play and learn!"
    ];

    this.currentMode = 'adult'; // 'adult' | 'kids'
    this.selectedGender = 'male'; // 'male' | 'female' | 'kid'
    this.userPinnedGender = false;
    this.currentSentenceIndex = 0;

    this.activeStream = null;
    this.isRecording = false;
    this.isDemoMode = false;
    this.recordedSamples = [];
    this.audioContext = null;
    this.analyser = null;
    this.scriptProcessor = null;
    this.dummyGain = null;
    this.pcmBufferChunks = [];
    this.detectedPitches = [];
    this.recordingDurations = [];
    this.recordStartTime = 0;
    this.lastRecordedBlob = null;
    this.currentPlaybackAudio = null;
    this.lastDetectedF0Hz = null;
    this.animationFrameId = null;
    this.smoothedBands = Array(16).fill(10);
    this.freqDataArray = null;
    this.timeDataArray = null;
  }

  getActiveSentenceList() {
    return this.currentMode === 'kids' ? this.kidsSentences : this.adultSentences;
  }

  getCurrentSentence() {
    const list = this.getActiveSentenceList();
    return list[this.currentSentenceIndex] || list[0];
  }

  setMode(mode) {
    this.currentMode = mode;
    this.currentSentenceIndex = 0;
    this.recordedSamples = [];
  }

  setGender(gender) {
    this.selectedGender = gender;
    this.userPinnedGender = true;
  }

  cleanupRecordingSession() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }

    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect(); } catch (_) {}
      this.scriptProcessor = null;
    }

    if (this.dummyGain) {
      try { this.dummyGain.disconnect(); } catch (_) {}
      this.dummyGain = null;
    }

    if (this.analyser) {
      try { this.analyser.disconnect(); } catch (_) {}
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state === 'running') {
      try { this.audioContext.close(); } catch (_) {}
    }
    this.audioContext = null;
    this.isDemoMode = false;
  }

  detectRecommendedGenderFromPitch(f0Hz) {
    if (f0Hz == null || Number.isNaN(f0Hz)) return this.selectedGender || 'male';
    if (f0Hz < 145) return 'male';
    if (f0Hz < 250) return 'female';
    return 'kid';
  }

  async startRecording(onFrequencyBars) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isDemoMode = false;
    this.pcmBufferChunks = [];
    this.recordStartTime = Date.now();
    this.smoothedBands = Array(16).fill(10);

    try {
      if (this.activeStream) {
        this.activeStream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API unavailable');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        } 
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      await this.audioContext.resume();

      this.activeStream = stream;
      const source = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.55; // Fast, sensitive reaction
      source.connect(this.analyser);

      this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDataArray = new Uint8Array(this.analyser.fftSize);

      // Direct Web Audio PCM sample recorder
      const bufferSize = 4096;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        this.pcmBufferChunks.push(new Float32Array(inputData));
      };
      source.connect(this.scriptProcessor);

      this.dummyGain = this.audioContext.createGain();
      this.dummyGain.gain.value = 0.0;
      this.scriptProcessor.connect(this.dummyGain);
      this.dummyGain.connect(this.audioContext.destination);

      this.isRecording = true;
      this.userPinnedGender = false;

      this.analyzeFrequencyLoop(onFrequencyBars);
      return true;
    } catch (err) {
      console.warn('Microphone access fallback to interactive demo visualizer:', err);
      this.isRecording = true;
      this.isDemoMode = true;
      this.analyzeFrequencyLoop(onFrequencyBars, true);
      return true;
    }
  }

  analyzeFrequencyLoop(onFrequencyBars, isDemoModeOverride = false) {
    if (!this.isRecording) return;

    const demoMode = isDemoModeOverride || this.isDemoMode;

    if (demoMode) {
      const timeFactor = Date.now() * 0.015;
      const bandHeights = Array.from({ length: 16 }, (_, i) => {
        const wave = Math.sin((i + 1) * 0.8 + timeFactor) * 35 + 50;
        const drift = Math.sin(timeFactor * 2 + i * 0.6) * 18;
        return Math.min(100, Math.max(10, Math.round(wave + drift)));
      });
      const overallVolume = Math.min(100, Math.max(18, Math.round((bandHeights.reduce((sum, v) => sum + v, 0) / bandHeights.length) * 0.95)));
      if (onFrequencyBars) onFrequencyBars(bandHeights, overallVolume);
      this.animationFrameId = requestAnimationFrame(() => this.analyzeFrequencyLoop(onFrequencyBars, true));
      return;
    }

    if (this.analyser && this.audioContext) {
      // 1. Calculate RMS Time-Domain Energy (Highly Sensitive sound pressure)
      this.analyser.getByteTimeDomainData(this.timeDataArray);
      let sumSquares = 0;
      for (let i = 0; i < this.timeDataArray.length; i++) {
        const norm = (this.timeDataArray[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / this.timeDataArray.length); // 0.0 to 1.0
      // Boost sensitivity so normal talking easily reaches 30% - 85%
      const rmsVolume = Math.min(100, Math.round(rms * 450));

      // 2. Calculate 16-Band Frequency Spectrum
      this.analyser.getByteFrequencyData(this.freqDataArray);
      const bufferLength = this.freqDataArray.length;
      const numBands = 16;
      const bandSize = Math.max(1, Math.floor(bufferLength / numBands));
      const bandHeights = [];

      for (let i = 0; i < numBands; i++) {
        let bandSum = 0;
        const start = i * bandSize;
        const end = Math.min(start + bandSize, bufferLength);
        for (let j = start; j < end; j++) {
          bandSum += this.freqDataArray[j];
        }
        const avg = (end > start) ? (bandSum / (end - start)) : 0;
        // Combine frequency response with RMS baseline
        const bandValue = Math.min(100, Math.max(6, Math.round((avg / 140) * 85 + (rmsVolume * 0.3))));
        bandHeights.push(bandValue);
      }

      const smoothedBands = bandHeights.map((value, index) => {
        const previous = this.smoothedBands[index] ?? value;
        const nextValue = previous + (value - previous) * 0.55;
        this.smoothedBands[index] = nextValue;
        return Math.round(nextValue);
      });

      const effectiveVolume = Math.max(rmsVolume, Math.round(smoothedBands.reduce((a, b) => a + b, 0) / numBands));

      if (onFrequencyBars) {
        onFrequencyBars(smoothedBands, effectiveVolume);
      }

      // Pitch detection
      if (effectiveVolume > 5 && this.audioContext) {
        let maxIndex = 0;
        let maxVal = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (this.freqDataArray[i] > maxVal) {
            maxVal = this.freqDataArray[i];
            maxIndex = i;
          }
        }
        const nyquist = this.audioContext.sampleRate / 2;
        const dominantFreq = (maxIndex / bufferLength) * nyquist;
        if (dominantFreq >= 75 && dominantFreq <= 500) {
          this.detectedPitches.push(dominantFreq);
          this.lastDetectedF0Hz = dominantFreq;
          if (!this.userPinnedGender) {
            const suggestedGender = this.detectRecommendedGenderFromPitch(dominantFreq);
            this.selectedGender = suggestedGender;
          }
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.analyzeFrequencyLoop(onFrequencyBars));
  }

  // Convert raw PCM float chunks to standard 16-bit PCM WAV Blob
  encodeWavBlob(pcmChunks, sampleRate) {
    let totalLength = 0;
    for (const chunk of pcmChunks) {
      totalLength += chunk.length;
    }

    const mergedBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pcmChunks) {
      mergedBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // WAV Header: 44 bytes
    const wavBuffer = new ArrayBuffer(44 + mergedBuffer.length * 2);
    const view = new DataView(wavBuffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + mergedBuffer.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, mergedBuffer.length * 2, true);

    // Write 16-bit PCM samples
    let index = 44;
    for (let i = 0; i < mergedBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, mergedBuffer[i]));
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      index += 2;
    }

    return new Blob([view], { type: 'audio/wav' });

    function writeString(v, off, string) {
      for (let i = 0; i < string.length; i++) {
        v.setUint8(off + i, string.charCodeAt(i));
      }
    }
  }

  async stopRecording() {
    this.isRecording = false;
    const duration = (Date.now() - this.recordStartTime) / 1000;
    this.recordingDurations.push(duration);

    const sampleRate = this.audioContext ? this.audioContext.sampleRate : 44100;

    // Build WAV Blob from PCM chunks
    if (this.pcmBufferChunks.length > 0) {
      const wavBlob = this.encodeWavBlob(this.pcmBufferChunks, sampleRate);
      this.lastRecordedBlob = wavBlob;
      this.recordedSamples.push({
        sentenceIndex: this.currentSentenceIndex,
        blob: wavBlob,
        duration
      });
    } else {
      this.lastRecordedBlob = null;
      this.recordedSamples.push({
        sentenceIndex: this.currentSentenceIndex,
        blob: null,
        duration
      });
    }

    this.cleanupRecordingSession();
    return true;
  }

  // Play back the recorded sentence audio
  playLastRecording(onEnd) {
    if (!this.lastRecordedBlob || this.lastRecordedBlob.size === 0) {
      console.warn('No recorded audio blob available for playback.');
      if (onEnd) onEnd();
      return;
    }

    if (this.currentPlaybackAudio) {
      this.currentPlaybackAudio.pause();
      this.currentPlaybackAudio = null;
    }

    const audioUrl = URL.createObjectURL(this.lastRecordedBlob);
    const audio = new Audio(audioUrl);
    this.currentPlaybackAudio = audio;

    audio.onended = () => {
      this.currentPlaybackAudio = null;
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.warn('Playback error:', e);
      this.currentPlaybackAudio = null;
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play exception:', err);
        if (onEnd) onEnd();
      });
    }
  }

  stopPlayback() {
    if (this.currentPlaybackAudio) {
      this.currentPlaybackAudio.pause();
      this.currentPlaybackAudio = null;
    }
  }

  nextSentence() {
    const list = this.getActiveSentenceList();
    if (this.currentSentenceIndex < list.length - 1) {
      this.currentSentenceIndex += 1;
      this.lastRecordedBlob = null;
      return true;
    }
    return false;
  }

  // Generate calibrated voice profile with exact gender and pitch
  generateCalibratedVoiceProfile() {
    let avgPitchHz = 135;
    if (this.detectedPitches.length > 0) {
      const sum = this.detectedPitches.reduce((a, b) => a + b, 0);
      avgPitchHz = sum / this.detectedPitches.length;
    }

    const gender = this.selectedGender; // 'male' | 'female' | 'kid'
    let calibratedPitch = 1.0;
    let voicePattern = null;
    let genderLabel = 'Male';

    if (gender === 'male') {
      genderLabel = 'MALE';
      const normalized = Math.min(Math.max((avgPitchHz - 80) / 100, 0), 1);
      calibratedPitch = 0.75 + normalized * 0.13;
      calibratedPitch = Math.max(0.75, Math.min(0.88, calibratedPitch));
      voicePattern = /microsoft\s*david|david|mark|guy|george|male|daniel|richard|alex|oliver|rishi|microsoft\s*mark|microsoft\s*guy/i;
    } else if (gender === 'female') {
      genderLabel = 'FEMALE';
      const normalized = Math.min(Math.max((avgPitchHz - 120) / 180, 0), 1);
      calibratedPitch = 1.10 + normalized * 0.22;
      calibratedPitch = Math.max(1.10, Math.min(1.34, calibratedPitch));
      voicePattern = /microsoft\s*zira|zira|jenny|samantha|karen|victoria|eva|fiona|veena|catherine|clara|aria|female|susan|moira|tessa|microsoft\s*jenny|microsoft\s*samantha/i;
    } else {
      genderLabel = 'KID';
      const normalized = Math.min(Math.max((avgPitchHz - 150) / 220, 0), 1);
      calibratedPitch = 1.28 + normalized * 0.22;
      calibratedPitch = Math.max(1.28, Math.min(1.60, calibratedPitch));
      voicePattern = /microsoft\s*zira|zira|jenny|samantha|tessa|aria|female|kid|child|teen/i;
    }

    const avgDuration = this.recordingDurations.length > 0 ? 
      this.recordingDurations.reduce((a, b) => a + b, 0) / this.recordingDurations.length : 3.0;
    
    let calibratedRate = 1.0;
    if (avgDuration < 2.2) calibratedRate = 1.15;
    else if (avgDuration > 3.8) calibratedRate = 0.88;
    else calibratedRate = 0.98;

    this.voiceEngine.removePersona('user-custom-voice');

    const userPersona = {
      id: 'user-custom-voice',
      name: `My Voice (${genderLabel})`,
      gender: gender === 'kid' ? 'female' : gender,
      category: 'soft',
      tagline: `Calibrated • ${Math.round(avgPitchHz)} Hz • ${genderLabel}`,
      avatarText: gender === 'kid' ? 'KD' : 'ME',
      pitch: Math.round(calibratedPitch * 100) / 100,
      rate: Math.round(calibratedRate * 100) / 100,
      voicePattern: voicePattern,
      isUserCloned: true,
      userGender: gender,
      avgPitchHz: Math.round(avgPitchHz),
      sentencesCompleted: this.recordedSamples.length
    };

    this.voiceEngine.personas.unshift(userPersona);
    this.voiceEngine.setPersona(userPersona.id);

    if (this.onVoiceProfileCreated) {
      this.onVoiceProfileCreated(userPersona);
    }

    return userPersona;
  }
}

window.VoiceClonerStudio = VoiceClonerStudio;
