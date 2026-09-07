/**
 * App Controller - Connects UI, Voice Engine, Calendar Engine, Timer Engine, Deal Engine, Story Engine, and Voice Cloner Studio
 */

document.addEventListener('DOMContentLoaded', () => {
  const voice = new VoiceEngine();
  const calendar = new CalendarEngine();
  const deals = new ProductDealEngine();
  const stories = new KidsStoryEngine();

  // Initialize Timer Engine with completion callback
  const timer = new TimerEngine((finishedTimer) => {
    setOrbState('speaking');
    waveformContainer.classList.add('active');
    voice.speak(
      `Your ${finishedTimer.label} has finished!`,
      () => setOrbState('speaking'),
      () => {
        setOrbState('idle');
        waveformContainer.classList.remove('active');
      }
    );
  });

  // Global Timer Controller for inline card buttons
  window.TimerController = {
    togglePause: (id) => timer.togglePause(id),
    cancel: (id) => timer.cancelTimer(id)
  };

  // Global Story Controller for reading story aloud
  window.StoryController = {
    readStory: (storyId) => {
      const story = stories.stories.find(s => s.id === storyId) || stories.stories[0];
      if (voice.isSpeaking) {
        voice.stopSpeaking();
        setOrbState('idle');
        waveformContainer.classList.remove('active');
        return;
      }

      setOrbState('speaking');
      waveformContainer.classList.add('active');
      voice.speak(
        `${story.title}. ${story.content} ... Moral of the story: ${story.moral} ... Now, here is your question: ${story.quiz.question}`,
        () => setOrbState('speaking'),
        () => {
          setOrbState('idle');
          waveformContainer.classList.remove('active');
        }
      );
    }
  };

  const agent = new AgentEngine(calendar, voice, timer, deals, stories);

  // Initialize Voice Cloner Studio
  const voiceStudio = new VoiceClonerStudio(voice, (userPersona) => {
    renderVoicePersonaOptions();
    closeVoiceStudioModal();
    appendMessage({
      sender: 'agent',
      text: `🎉 **Voice Calibration Complete!**\n\nYour personalized voice profile **"${userPersona.name}"** (${userPersona.tagline}) has been calibrated and set as your active AI voice persona!`,
      spokenText: "Your personalized voice profile is calibrated and ready."
    });
  });

  // DOM Elements
  const chatViewport = document.getElementById('chatViewport');
  const heroStage = document.getElementById('heroStage');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const micBtn = document.getElementById('micBtn');
  const copilotOrbContainer = document.getElementById('copilotOrbContainer');
  const waveformContainer = document.getElementById('waveformContainer');
  const liveTranscript = document.getElementById('liveTranscript');
  const liveTranscriptText = document.getElementById('liveTranscriptText');
  const inputContainer = document.getElementById('inputContainer');
  const voiceModalOverlay = document.getElementById('voiceModalOverlay');
  const openVoiceModalBtn = document.getElementById('openVoiceModalBtn');
  const closeVoiceModalBtn = document.getElementById('closeVoiceModalBtn');
  const currentVoiceNameBadge = document.getElementById('currentVoiceNameBadge');
  const softVoicePersonaList = document.getElementById('softVoicePersonaList');
  const standardVoicePersonaList = document.getElementById('standardVoicePersonaList');
  const speechRateSlider = document.getElementById('speechRateSlider');
  const speechPitchSlider = document.getElementById('speechPitchSlider');
  const rateValueDisplay = document.getElementById('rateValueDisplay');
  const pitchValueDisplay = document.getElementById('pitchValueDisplay');

  // Studio Elements
  const openVoiceStudioBtn = document.getElementById('openVoiceStudioBtn');
  const voiceStudioModalOverlay = document.getElementById('voiceStudioModalOverlay');
  const closeVoiceStudioBtn = document.getElementById('closeVoiceStudioBtn');
  const studioProgressDots = document.getElementById('studioProgressDots');
  const sentenceIndexTag = document.getElementById('sentenceIndexTag');
  const sentenceText = document.getElementById('sentenceText');
  const recordSentenceBtn = document.getElementById('recordSentenceBtn');
  const studioStatusText = document.getElementById('studioStatusText');
  const liveEqContainer = document.getElementById('liveEqContainer');
  const vuIndicatorBadge = document.getElementById('vuIndicatorBadge');
  const vuLevelText = document.getElementById('vuLevelText');
  const studioActionButtonsRow = document.getElementById('studioActionButtonsRow');
  const playSampleRecordingBtn = document.getElementById('playSampleRecordingBtn');
  const nextSentenceBtn = document.getElementById('nextSentenceBtn');
  const genderPillGroup = document.getElementById('genderPillGroup');
  const modePillGroup = document.getElementById('modePillGroup');

  // Bottom Navigation Tabs
  const tabCopilotBtn = document.getElementById('tabCopilotBtn');
  const tabStoriesBtn = document.getElementById('tabStoriesBtn');
  const tabDealsBtn = document.getElementById('tabDealsBtn');
  const tabStudioBtn = document.getElementById('tabStudioBtn');
  const tabToolsBtn = document.getElementById('tabToolsBtn');

  let hasUserInteracted = false;
  let currentlyPreviewingId = null;
  let isPlayingSample = false;

  // Render Voice Personas with Delete button and Play/Stop toggle
  function renderVoicePersonaOptions() {
    if (softVoicePersonaList) softVoicePersonaList.innerHTML = '';
    if (standardVoicePersonaList) standardVoicePersonaList.innerHTML = '';

    const currentId = voice.currentPersonaId;

    voice.personas.forEach(p => {
      const isSelected = p.id === currentId;
      const card = document.createElement('div');
      card.className = `voice-card-option ${isSelected ? 'selected' : ''}`;
      card.dataset.personaId = p.id;

      let badgeClass = p.category === 'soft' ? 'soft' : p.gender;
      if (p.isUserCloned) badgeClass = 'user-cloned';

      const isPlaying = currentlyPreviewingId === p.id && voice.isSpeaking;

      const deleteBtnHtml = p.isUserCloned ? `
        <button class="delete-voice-btn" data-delete-id="${p.id}" title="Remove Custom Voice">
          ✕
        </button>
      ` : '';

      card.innerHTML = `
        <div class="voice-info">
          <div class="voice-avatar-badge ${badgeClass}">
            ${p.avatarText}
          </div>
          <div class="voice-details">
            <h4>${p.name} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">(${p.isUserCloned ? 'YOUR CLONED VOICE' : p.gender.toUpperCase()})</span></h4>
            <p>${p.tagline}</p>
          </div>
        </div>
        <div class="voice-card-actions">
          <button class="preview-voice-btn ${isPlaying ? 'playing' : ''}" data-preview-id="${p.id}" title="Preview Voice">
            ${isPlaying ? '⏹ Stop' : '▶ Preview'}
          </button>
          ${deleteBtnHtml}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.preview-voice-btn') || e.target.closest('.delete-voice-btn')) return;
        selectPersona(p.id);
      });

      const previewBtn = card.querySelector('.preview-voice-btn');
      previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePreviewPersonaVoice(p);
      });

      if (p.isUserCloned) {
        const delBtn = card.querySelector('.delete-voice-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteClonedVoice(p.id);
          });
        }
      }

      if (p.category === 'soft' && softVoicePersonaList) {
        softVoicePersonaList.appendChild(card);
      } else if (standardVoicePersonaList) {
        standardVoicePersonaList.appendChild(card);
      }
    });

    const activePersona = voice.getCurrentPersona();
    const catLabel = activePersona.isUserCloned ? 'Custom ' : (activePersona.category === 'soft' ? 'Soft ' : '');
    const displayGender = activePersona.userGender === 'kid'
      ? 'Kid'
      : activePersona.userGender === 'female' || activePersona.gender === 'female'
        ? 'Female'
        : 'Male';
    currentVoiceNameBadge.textContent = `${activePersona.name} (${catLabel}${displayGender})`;
  }

  function selectPersona(personaId) {
    voice.setPersona(personaId);
    renderVoicePersonaOptions();
  }

  function togglePreviewPersonaVoice(persona) {
    if (currentlyPreviewingId === persona.id && voice.isSpeaking) {
      voice.stopSpeaking();
      currentlyPreviewingId = null;
      setOrbState('idle');
      waveformContainer.classList.remove('active');
      renderVoicePersonaOptions();
      return;
    }

    voice.stopSpeaking();
    currentlyPreviewingId = persona.id;
    const origId = voice.currentPersonaId;
    voice.setPersona(persona.id);
    setOrbState('speaking');
    waveformContainer.classList.add('active');
    renderVoicePersonaOptions();

    const sampleMsg = persona.isUserCloned ?
      `Hello! This is your calibrated custom voice profile speaking with a clear, natural tone.` :
      `Hello, I am ${persona.name}. Speaking with a soft and natural tone.`;

    voice.speak(sampleMsg, 
      () => {},
      () => {
        currentlyPreviewingId = null;
        setOrbState('idle');
        waveformContainer.classList.remove('active');
        voice.setPersona(origId);
        renderVoicePersonaOptions();
      }
    );
  }

  function confirmDeleteClonedVoice(personaId) {
    const ok = window.confirm("Are you sure you want to remove your custom voice profile?");
    if (ok) {
      voice.stopSpeaking();
      voice.removePersona(personaId);
      renderVoicePersonaOptions();
    }
  }

  // ==================== VOICE STUDIO ENROLLMENT MODAL ====================
  function openVoiceStudioModal() {
    voiceStudio.currentSentenceIndex = 0;
    voiceStudio.recordedSamples = [];
    voiceStudio.detectedPitches = [];
    voiceStudio.recordingDurations = [];
    voiceStudio.lastRecordedBlob = null;
    voiceStudio.userPinnedGender = false;
    voiceStudio.selectedGender = 'male';
    const maleBtn = genderPillGroup?.querySelector('[data-gender="male"]');
    genderPillGroup?.querySelectorAll('.toggle-pill-btn').forEach(b => b.classList.toggle('active', b === maleBtn));
    if (studioActionButtonsRow) studioActionButtonsRow.style.display = 'none';
    renderStudioProgressDots();
    updateStudioSentenceUI();
    resetEqualizerBars();
    voiceStudioModalOverlay.classList.add('open');
  }

  function closeVoiceStudioModal() {
    voiceStudioModalOverlay.classList.remove('open');
    if (voiceStudio.isRecording) {
      voiceStudio.stopRecording();
    }
    voiceStudio.stopPlayback();
  }

  function renderStudioProgressDots() {
    if (!studioProgressDots) return;
    studioProgressDots.innerHTML = '';
    const activeList = voiceStudio.getActiveSentenceList();
    activeList.forEach((s, idx) => {
      const dot = document.createElement('div');
      dot.className = `studio-dot ${idx === voiceStudio.currentSentenceIndex ? 'active' : ''} ${idx < voiceStudio.currentSentenceIndex ? 'completed' : ''}`;
      studioProgressDots.appendChild(dot);
    });
  }

  function updateStudioSentenceUI() {
    const currentIdx = voiceStudio.currentSentenceIndex;
    const total = voiceStudio.getActiveSentenceList().length;
    sentenceIndexTag.textContent = `Sentence ${currentIdx + 1} of ${total}`;
    sentenceText.textContent = `"${voiceStudio.getCurrentSentence()}"`;
    studioStatusText.textContent = 'Tap the microphone button to record reading this sentence';
    recordSentenceBtn.classList.remove('recording');
    if (studioActionButtonsRow) studioActionButtonsRow.style.display = 'none';
    if (vuIndicatorBadge) {
      vuIndicatorBadge.className = 'vu-indicator-badge';
      vuIndicatorBadge.textContent = '⚪ Ready to Listen';
    }
    if (vuLevelText) vuLevelText.textContent = 'Audio Level: 0%';
    renderStudioProgressDots();
  }

  function resetEqualizerBars() {
    if (!liveEqContainer) return;
    const bars = liveEqContainer.querySelectorAll('.live-eq-bar');
    bars.forEach((bar, i) => {
      bar.style.height = `${8 + (i % 4) * 4}%`;
    });
  }

  // Update Live 16-Band Equalizer & VU status in Real-Time
  function updateLiveEqualizer(bandHeights, overallVolume) {
    if (!liveEqContainer) return;
    const bars = liveEqContainer.querySelectorAll('.live-eq-bar');
    bars.forEach((bar, idx) => {
      if (bandHeights[idx] !== undefined) {
        bar.style.height = `${Math.min(100, Math.max(8, bandHeights[idx]))}%`;
      }
    });

    const displayVol = Math.max(overallVolume, Math.round(bandHeights.reduce((a, b) => a + b, 0) / 16));
    const estimatedDb = Math.max(12, Math.min(99, Math.round((displayVol / 100) * 58) + 12));

    if (vuLevelText) {
      vuLevelText.textContent = `Audio Level: ${displayVol}% (${estimatedDb} dB)`;
    }

    if (vuIndicatorBadge) {
      vuIndicatorBadge.style.color = '';
      if (displayVol >= 15) {
        vuIndicatorBadge.className = 'vu-indicator-badge green';
        vuIndicatorBadge.textContent = `🟢 Voice captured loud & clear! (${estimatedDb} dB)`;
      } else if (displayVol >= 6) {
        vuIndicatorBadge.className = 'vu-indicator-badge warning';
        vuIndicatorBadge.style.color = '#fde047';
        vuIndicatorBadge.textContent = `🟡 Hearing your voice (${displayVol}% level)... Speak clearly`;
      } else {
        vuIndicatorBadge.className = 'vu-indicator-badge';
        vuIndicatorBadge.style.color = 'var(--text-muted)';
        vuIndicatorBadge.textContent = '🔴 Listening for your microphone input...';
      }
    }
  }

  // Record Sentence Button Handler
  recordSentenceBtn.addEventListener('click', async () => {
    if (!voiceStudio.isRecording) {
      const ok = await voiceStudio.startRecording((bandHeights, volume) => {
        updateLiveEqualizer(bandHeights, volume);
      });
      if (ok) {
        recordSentenceBtn.classList.add('recording');
        studioStatusText.textContent = '🔴 Recording... Speak the sentence above into your mic';
        if (studioActionButtonsRow) studioActionButtonsRow.style.display = 'none';
      }
    } else {
      recordSentenceBtn.classList.remove('recording');
      studioStatusText.textContent = '✅ Sound captured! Tap Play to check your voice sample';
      await voiceStudio.stopRecording();
      resetEqualizerBars();

      if (vuIndicatorBadge) {
        vuIndicatorBadge.className = 'vu-indicator-badge green';
        vuIndicatorBadge.textContent = '✨ Voice Sample Captured Successfully';
      }

      if (studioActionButtonsRow) {
        studioActionButtonsRow.style.display = 'flex';
      }
    }
  });

  // Play Sample Recording Button
  if (playSampleRecordingBtn) {
    playSampleRecordingBtn.addEventListener('click', () => {
      if (!isPlayingSample) {
        isPlayingSample = true;
        playSampleRecordingBtn.textContent = '⏹ Stop Playback';
        voiceStudio.playLastRecording(() => {
          isPlayingSample = false;
          playSampleRecordingBtn.textContent = '▶ Play My Recording';
        });
      } else {
        voiceStudio.stopPlayback();
        isPlayingSample = false;
        playSampleRecordingBtn.textContent = '▶ Play My Recording';
      }
    });
  }

  // Next Sentence Button
  if (nextSentenceBtn) {
    nextSentenceBtn.addEventListener('click', () => {
      voiceStudio.stopPlayback();
      isPlayingSample = false;
      if (playSampleRecordingBtn) playSampleRecordingBtn.textContent = '▶ Play My Recording';

      const hasNext = voiceStudio.nextSentence();
      if (hasNext) {
        updateStudioSentenceUI();
      } else {
        studioStatusText.textContent = '✨ Calibrating fundamental frequency & synthesis timbre...';
        setTimeout(() => {
          voiceStudio.generateCalibratedVoiceProfile();
        }, 600);
      }
    });
  }

  // Gender Pill Selector (Male / Female / Kid)
  if (genderPillGroup) {
    genderPillGroup.querySelectorAll('.toggle-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        genderPillGroup.querySelectorAll('.toggle-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedGender = btn.getAttribute('data-gender');
        voiceStudio.setGender(selectedGender);
      });
    });
  }

  // Mode Pill Selector (Adult / Kids)
  if (modePillGroup) {
    modePillGroup.querySelectorAll('.toggle-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modePillGroup.querySelectorAll('.toggle-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const selectedMode = btn.getAttribute('data-mode');
        voiceStudio.setMode(selectedMode);
        updateStudioSentenceUI();
      });
    });
  }

  if (openVoiceStudioBtn) openVoiceStudioBtn.addEventListener('click', openVoiceStudioModal);
  if (closeVoiceStudioBtn) closeVoiceStudioBtn.addEventListener('click', closeVoiceStudioModal);

  // Standard Voice Modal Controls
  openVoiceModalBtn.addEventListener('click', () => {
    renderVoicePersonaOptions();
    voiceModalOverlay.classList.add('open');
  });

  closeVoiceModalBtn.addEventListener('click', () => {
    voice.stopSpeaking();
    currentlyPreviewingId = null;
    voiceModalOverlay.classList.remove('open');
  });

  // Slider controls
  speechRateSlider.addEventListener('input', (e) => {
    voice.speechRate = parseFloat(e.target.value);
    rateValueDisplay.textContent = `${voice.speechRate}x`;
  });

  speechPitchSlider.addEventListener('input', (e) => {
    voice.speechPitch = parseFloat(e.target.value);
    pitchValueDisplay.textContent = `${voice.speechPitch}x`;
  });

  // Bottom Navigation Handlers
  function setNavActive(btn) {
    [tabCopilotBtn, tabStoriesBtn, tabDealsBtn, tabStudioBtn, tabToolsBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
  }

  if (tabCopilotBtn) {
    tabCopilotBtn.addEventListener('click', () => {
      setNavActive(tabCopilotBtn);
      chatInput.focus();
    });
  }

  if (tabStoriesBtn) {
    tabStoriesBtn.addEventListener('click', () => {
      setNavActive(tabStoriesBtn);
      handleSend("Tell me a kids story");
    });
  }

  if (tabDealsBtn) {
    tabDealsBtn.addEventListener('click', () => {
      setNavActive(tabDealsBtn);
      handleSend("Find best deals for Sony WH-1000XM5");
    });
  }

  if (tabStudioBtn) {
    tabStudioBtn.addEventListener('click', () => {
      setNavActive(tabStudioBtn);
      openVoiceStudioModal();
    });
  }

  if (tabToolsBtn) {
    tabToolsBtn.addEventListener('click', () => {
      setNavActive(tabToolsBtn);
      handleSend("Compare time in Tokyo, London and New York");
    });
  }

  // Orb Visual States
  function setOrbState(state) {
    copilotOrbContainer.classList.remove('listening', 'speaking');
    if (state === 'listening') {
      copilotOrbContainer.classList.add('listening');
      micBtn.classList.add('active');
    } else if (state === 'speaking') {
      copilotOrbContainer.classList.add('speaking');
      micBtn.classList.remove('active');
    } else {
      micBtn.classList.remove('active');
    }
  }

  // Send Message and Handle Agent Execution
  async function handleSend(text) {
    const query = (text || chatInput.value || '').trim();
    if (!query) return;

    if (!hasUserInteracted) {
      hasUserInteracted = true;
      heroStage.style.display = 'none';
      chatViewport.style.display = 'flex';
    }

    appendMessage({
      sender: 'user',
      text: query
    });

    chatInput.value = '';
    sendBtn.disabled = true;

    // Process Query with Agent Engine
    const response = await agent.processQuery(query);

    if (response.triggerAction === 'open_voice_studio') {
      openVoiceStudioModal();
    }

    appendMessage({
      sender: 'agent',
      text: response.text,
      spokenText: response.spokenText,
      widgetHtml: response.widgetHtml
    });

    sendBtn.disabled = false;

    // Voice Feedback (TTS)
    if (response.spokenText) {
      setOrbState('speaking');
      waveformContainer.classList.add('active');
      voice.speak(
        response.spokenText,
        () => {
          setOrbState('speaking');
        },
        () => {
          setOrbState('idle');
          waveformContainer.classList.remove('active');
        }
      );
    }
  }

  // Append Message to UI
  function appendMessage({ sender, text, spokenText, widgetHtml }) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${sender}`;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    if (sender === 'user') {
      msgEl.innerHTML = `
        <div class="avatar user-avatar">You</div>
        <div class="message-bubble">
          <div>${escapeHtml(text)}</div>
          <div class="message-bubble-time">${timeStr}</div>
        </div>
      `;
    } else {
      const activePersona = voice.getCurrentPersona();
      const catText = activePersona.isUserCloned ? ' • Cloned User Profile' : (activePersona.category === 'soft' ? ' • Soft Voice' : '');
      const replayHtml = spokenText ? `
        <button class="voice-replay-btn" data-spoken="${escapeHtml(spokenText)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Replay
        </button>
      ` : '';

      msgEl.innerHTML = `
        <div class="avatar agent-avatar">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-2h2zm0-4h-2v-6h2z"/></svg>
        </div>
        <div class="message-bubble">
          <div style="font-size:0.75rem; color:#818cf8; margin-bottom:0.3rem; font-weight:600;">${activePersona.name}${catText}</div>
          <div>${formatMarkdown(text)}</div>
          ${widgetHtml ? widgetHtml : ''}
          <div class="message-bubble-time">
            ${timeStr} ${replayHtml}
          </div>
        </div>
      `;

      const replayBtn = msgEl.querySelector('.voice-replay-btn');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          if (voice.isSpeaking) {
            voice.stopSpeaking();
            setOrbState('idle');
            waveformContainer.classList.remove('active');
            return;
          }
          setOrbState('speaking');
          waveformContainer.classList.add('active');
          voice.speak(
            spokenText,
            () => setOrbState('speaking'),
            () => {
              setOrbState('idle');
              waveformContainer.classList.remove('active');
            }
          );
        });
      }
    }

    chatViewport.appendChild(msgEl);
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  // Reset Listening UI
  function resetListeningUi() {
    voice.stopListening();
    setOrbState('idle');
    waveformContainer.classList.remove('active');
    liveTranscript?.classList.remove('active');
    inputContainer?.classList.remove('listening');
    chatInput.placeholder = 'Ask for a kids story, product deals, check world times, or speak...';
    waveformContainer?.querySelectorAll('.waveform-bar').forEach((bar) => {
      bar.style.height = '8px';
      bar.style.opacity = '0.6';
    });
  }

  // Speech Recognition (Voice Input)
  function toggleListening() {
    if (voice.isListening) {
      const pendingText = chatInput.value.trim();
      resetListeningUi();
      if (pendingText) {
        handleSend(pendingText);
      }
    } else {
      setOrbState('listening');
      waveformContainer.classList.add('active');
      liveTranscript?.classList.add('active');
      inputContainer?.classList.add('listening');
      if (liveTranscriptText) liveTranscriptText.textContent = 'Listening for your voice...';

      voice.startListening({
        onStart: () => {
          setOrbState('listening');
          waveformContainer.classList.add('active');
          liveTranscript?.classList.add('active');
          inputContainer?.classList.add('listening');
          chatInput.placeholder = 'Listening... speak naturally';
          chatInput.focus();
        },
        onAudioLevel: (level, bands) => {
          if (!waveformContainer) return;
          const bars = waveformContainer.querySelectorAll('.waveform-bar');
          bars.forEach((bar, idx) => {
            const bandLevel = bands?.[idx] ?? level;
            const barHeight = Math.min(34, Math.max(6, Math.round((bandLevel / 100) * 32) + 4));
            bar.style.height = `${barHeight}px`;
            bar.style.opacity = bandLevel > 6 ? '1' : '0.45';
            bar.style.filter = `brightness(${Math.min(1.8, 1 + bandLevel / 80)})`;
          });

          if (level > 10) {
            if (liveTranscriptText && !chatInput.value) {
              liveTranscriptText.textContent = `🟢 Hearing sound (${level}% volume)... speak now`;
            }
          }
        },
        onResult: ({ final, interim }) => {
          const liveText = (interim || final || '').trim();
          if (liveText) {
            chatInput.value = liveText;
            if (liveTranscriptText) liveTranscriptText.textContent = liveText;
            chatInput.focus();
            chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
          }

          if (final) {
            resetListeningUi();
            handleSend(final);
          }
        },
        onError: (err) => {
          console.warn('Voice recognition note:', err);
          if (liveTranscriptText && !chatInput.value) {
            liveTranscriptText.textContent = '🎙️ Microphone listening. Speak into your mic or type...';
          }
        },
        onEnd: () => {
          if (!voice.isListening) {
            resetListeningUi();
          }
        }
      });
    }
  }

  // Event Listeners
  sendBtn.addEventListener('click', () => {
    if (voice.isListening) {
      voice.stopListening();
      resetListeningUi();
    }
    handleSend();
  });

  micBtn.addEventListener('click', toggleListening);
  copilotOrbContainer.addEventListener('click', toggleListening);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (voice.isListening) {
        voice.stopListening();
        resetListeningUi();
      }
      handleSend();
    }
  });

  // Prompt suggestion chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
      handleSend(prompt);
    });
  });

  // Global Calendar Month Navigation Handler
  window.CalendarWidgetNavigate = (instanceId, delta) => {
    const calEl = document.getElementById(instanceId);
    if (!calEl) return;

    let year = parseInt(calEl.dataset.year, 10);
    let month = parseInt(calEl.dataset.month, 10) + delta;

    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }

    const newDate = new Date(year, month, 1);
    const newHtml = calendar.renderCalendarWidget(newDate, instanceId);
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = newHtml;
    calEl.replaceWith(tempContainer.firstElementChild);
  };

  // Helper text formatters
  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  function formatMarkdown(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  // Initial render of voice personas
  renderVoicePersonaOptions();
});
