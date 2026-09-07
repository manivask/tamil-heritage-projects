/**
 * Agent Engine - Intent Recognition & Multi-Domain Dispatcher
 * Dispatches queries to domain tools:
 * 1. Kids Storytelling & Comprehension Quiz Engine
 * 2. Product Deals & Price Comparison Engine
 * 3. User Voice Calibration & Enrollment Studio
 * 4. Timer & Alarms Engine
 * 5. Multi-City Comparison Matrix
 * 6. Country & City World Clock
 * 7. Local Time & Date
 * 8. Interactive Calendar
 * 9. Voice Personas & Settings
 */

class AgentEngine {
  constructor(calendarEngine, voiceEngine, timerEngine, dealEngine, storyEngine) {
    this.calendar = calendarEngine;
    this.voice = voiceEngine;
    this.timer = timerEngine;
    this.deals = dealEngine;
    this.stories = storyEngine;
  }

  /**
   * Process a natural language query and return rich response payload
   * @param {string} rawInput 
   * @returns {Promise<{text: string, spokenText: string, widgetHtml?: string, triggerAction?: string}>}
   */
  async processQuery(rawInput) {
    const input = (rawInput || '').trim().toLowerCase();

    if (!input) {
      return {
        text: "I'm listening. Ask me for a kids story, product price comparisons, country times, countdown timers, or voice calibration!",
        spokenText: "I am listening. Ask me for a story, product deals, timers, or world times."
      };
    }

    // 1. Kids Storytelling & Comprehension Quiz Intent Check
    if (this.isStoryIntent(input)) {
      return this.handleStoryQuery(input);
    }

    // 2. Check if user is answering the active Story Comprehension Quiz
    if (this.stories && this.stories.currentActiveQuiz && !this.isTimeIntent(input) && !this.isTimerIntent(input) && !this.isProductDealIntent(input)) {
      const evalResult = this.stories.evaluateComprehensionAnswer(input);
      if (evalResult) {
        // Reset active quiz after answering
        this.stories.currentActiveQuiz = null;
        return {
          text: `${evalResult.praise}\n\n🏆 **Score & Badge**: ${evalResult.stars} • **${evalResult.badge}**\n\n📝 **Feedback**: ${evalResult.feedback}\n\n✨ **Did You Know?**: ${evalResult.funFact}`,
          spokenText: evalResult.spokenPraise,
          widgetHtml: this.stories.renderEvaluationCard(evalResult)
        };
      }
    }

    // 3. Voice Calibration & Training Intent Check
    if (this.isVoiceTrainIntent(input)) {
      return {
        text: `🎙️ **Voice Calibration Studio**: Let's record and calibrate your unique personal voice profile! Click below to open the guided 8-sentence studio.`,
        spokenText: "Opening the Voice Calibration Studio so you can record your voice profile.",
        triggerAction: 'open_voice_studio'
      };
    }

    // 4. Product Search & Best Deal Comparison Intent Check
    if (this.isProductDealIntent(input)) {
      return this.handleProductDealQuery(input);
    }

    // 5. Timer & Countdown Intent Check
    if (this.isTimerIntent(input)) {
      return this.handleTimerQuery(input);
    }

    // 6. Multi-City Comparison Intent Check
    const allMatches = this.calendar.findAllLocationMatches(input);
    if (allMatches.length >= 2 || (input.includes('compare') && allMatches.length >= 1 && !this.isProductDealIntent(input))) {
      return this.handleMultiCityComparisonQuery(allMatches, input);
    }

    // 7. Single Country / Global Location Time Intent Check
    const matchedLocation = this.calendar.findLocationMatch(input);
    if (matchedLocation && (this.isTimeIntent(input) || input.includes('in ') || input.includes('at ') || input.includes('time'))) {
      return this.handleGlobalCountryTimeQuery(matchedLocation, input);
    }

    // 8. Local Time Intent Check
    if (this.isTimeIntent(input)) {
      return this.handleTimeQuery(input);
    }

    // 9. Calendar Intent Check
    if (this.isCalendarIntent(input)) {
      return this.handleCalendarQuery(input);
    }

    // 10. Date Intent Check
    if (this.isDateIntent(input)) {
      return this.handleDateQuery(input);
    }

    // 11. Greetings & Persona Check
    if (this.isGreetingIntent(input)) {
      return this.handleGreetingQuery();
    }

    // 12. Help / Capabilities Check
    if (this.isHelpIntent(input)) {
      return this.handleHelpQuery();
    }

    // 13. Voice Switch / Settings Check
    if (this.isVoiceIntent(input)) {
      return this.handleVoiceQuery(input);
    }

    // 14. Dynamic Product or Search Fallback
    const dealMatch = this.deals.findProductDeals(input);
    if (dealMatch && (input.split(' ').length <= 5)) {
      return this.handleProductDealQuery(input);
    }

    // 15. General Fallback
    return this.handleFallback(input);
  }

  isStoryIntent(input) {
    return /\b(story|stories|tale|bedtime story|tell me a story|kids story|story for kids|story time|fairy tale)\b/i.test(input);
  }

  isVoiceTrainIntent(input) {
    return /\b(calibrate voice|train voice|clone voice|record voice|my voice|enroll voice|voice studio|voice training)\b/i.test(input);
  }

  isProductDealIntent(input) {
    return /\b(find|deal|deals|compare prices?|price of|buy|discount|cheap|cheapest|best price|cost of|store price|laptop|phone|headphones|shoes|iphone|sony|macbook|samsung|nike)\b/i.test(input);
  }

  isTimerIntent(input) {
    return /\b(timer|alarm|countdown|count down|stopwatch|remind me in)\b/i.test(input);
  }

  isTimeIntent(input) {
    return /\b(time|clock|hour|minute|timing|what time|current time|tell me the time|time now|o'?clock)\b/i.test(input);
  }

  isCalendarIntent(input) {
    return /\b(calendar|calender|month view|view month|show month|monthly|schedule view)\b/i.test(input);
  }

  isDateIntent(input) {
    return /\b(date|today|day of the week|weekday|day is it|what day|which day|year|month|day of year|days left|days remaining|leap year)\b/i.test(input);
  }

  isGreetingIntent(input) {
    return /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|what is your name)\b/i.test(input);
  }

  isHelpIntent(input) {
    return /\b(help|what can you do|features|commands|capabilities|options)\b/i.test(input);
  }

  isVoiceIntent(input) {
    return /\b(voice|voices|change voice|switch voice|persona|male voice|female voice|soft voice|whisper voice|sound)\b/i.test(input);
  }

  // Handle Kids Story Telling
  handleStoryQuery(input) {
    const story = this.stories.getStory(input);
    const introSpoken = `Here is a special story called ${story.title}. Listen carefully because there is a fun quiz at the end!`;

    return {
      text: `📖 **Story Time**: **${story.title}** ${story.emoji}\n\n*${story.summary}*\n\n🎯 *At the end of the story, answer the comprehension question below to test your listening skills!*`,
      spokenText: introSpoken,
      widgetHtml: this.stories.renderStoryCard(story)
    };
  }

  // Handle Product Deal & Price Comparison Queries
  handleProductDealQuery(input) {
    const dealData = this.deals.findProductDeals(input);

    return {
      text: `🛍️ **Best Deal Found**: **${dealData.name}**\n\n- 🏆 **Lowest Price**: **$${dealData.bestRetailer.price.toFixed(2)}** at **${dealData.bestRetailer.store}**\n- 💰 **Savings**: Save up to **$${dealData.maxSavings.toFixed(0)}** across top stores (${dealData.sortedRetailers.map(r => r.store).join(', ')}).\n- ⭐ **Rating**: ${dealData.rating} / 5.0 (${dealData.reviewsCount.toLocaleString()} reviews)`,
      spokenText: dealData.spokenText,
      widgetHtml: this.deals.renderProductDealCard(dealData)
    };
  }

  // Handle Timer Intent
  handleTimerQuery(input) {
    let totalSeconds = 60;
    const minMatch = input.match(/(\d+)\s*(?:min|minute|minutes|m\b)/i);
    const secMatch = input.match(/(\d+)\s*(?:sec|second|seconds|s\b)/i);
    const hrMatch = input.match(/(\d+)\s*(?:hr|hour|hours|h\b)/i);

    if (minMatch || secMatch || hrMatch) {
      totalSeconds = 0;
      if (hrMatch) totalSeconds += parseInt(hrMatch[1], 10) * 3600;
      if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1], 10);
    } else {
      const numMatch = input.match(/\b(\d+)\b/);
      if (numMatch) {
        totalSeconds = parseInt(numMatch[1], 10) * 60;
      }
    }

    totalSeconds = Math.max(5, totalSeconds);
    const formattedDuration = totalSeconds >= 60 ? 
      `${Math.floor(totalSeconds / 60)} minute${Math.floor(totalSeconds / 60) > 1 ? 's' : ''}` : 
      `${totalSeconds} seconds`;

    const timer = this.timer.createTimer(totalSeconds, `${formattedDuration} Timer`);

    return {
      text: `⏱️ Starting your countdown timer for **${formattedDuration}**. You'll hear a gentle melodic chime when it finishes!`,
      spokenText: `Setting a timer for ${formattedDuration}. Starting now.`,
      widgetHtml: this.timer.renderTimerCard(timer)
    };
  }

  // Handle Multi-City Timezone Comparison
  handleMultiCityComparisonQuery(locations, input) {
    if (locations.length === 0) {
      locations = [
        this.calendar.timezoneLocations[0], // India
        this.calendar.timezoneLocations[1], // Tokyo
        this.calendar.timezoneLocations[2], // London
        this.calendar.timezoneLocations[3]  // New York
      ];
    }

    const cityNames = locations.map(l => l.city.split('/')[0].trim()).join(', ');
    const spoken = `Here is the current time comparison between your location and ${cityNames}.`;

    return {
      text: `🌐 **Multi-City Time Comparison** for **${cityNames}**:`,
      spokenText: spoken,
      widgetHtml: this.calendar.renderMultiCityComparisonWidget(locations)
    };
  }

  // Handle Country-Specific Time Queries
  handleGlobalCountryTimeQuery(location, input) {
    const globalData = this.calendar.getGlobalTimeData(location);

    const responseText = `The current time in **${location.city} (${location.country} ${location.flag})** is **${globalData.localTimeStr}** (${globalData.timezone}).\n\n📅 Local Date: **${globalData.localDateStr}**\n⏳ Comparison: **${globalData.diffText}**.`;

    return {
      text: responseText,
      spokenText: globalData.spokenTime,
      widgetHtml: this.calendar.renderGlobalTimeWidget(globalData)
    };
  }

  handleTimeQuery(input) {
    const time = this.calendar.getTimeData();

    let spoken = `${time.greeting}! ${time.spokenTime}.`;
    let responseText = `${time.greeting}! It is currently **${time.formattedTime}** (${time.timeZone}).`;

    if (input.includes('24') || input.includes('military')) {
      responseText = `The current local time in 24-hour format is **${time.formatted24}**.`;
      spoken = `In 24 hour format, the local time is ${time.formatted24}.`;
    }

    return {
      text: responseText,
      spokenText: spoken,
      widgetHtml: this.calendar.renderTimeWidget()
    };
  }

  handleDateQuery(input) {
    const date = this.calendar.getDateData();

    if (input.includes('day of the week') || input.includes('what day') || input.includes('which day')) {
      return {
        text: `Today is **${date.dayName}**, ${date.monthName} ${date.dayNumber}${date.suffix}, ${date.year}.`,
        spokenText: `Today is ${date.dayName}.`,
        widgetHtml: this.calendar.renderCalendarWidget()
      };
    }

    if (input.includes('what year') || input.includes('which year')) {
      return {
        text: `We are currently in the year **${date.year}** (${date.isLeap ? 'Leap Year' : 'Regular Year'}).`,
        spokenText: `The current year is ${date.year}.`,
        widgetHtml: this.calendar.renderCalendarWidget()
      };
    }

    if (input.includes('days left') || input.includes('days remaining') || input.includes('day of year')) {
      return {
        text: `Today is **Day ${date.dayOfYear}** of ${date.year}. There are **${date.daysRemaining} days remaining** in this year.`,
        spokenText: `There are ${date.daysRemaining} days left in the year ${date.year}.`,
        widgetHtml: this.calendar.renderCalendarWidget()
      };
    }

    return {
      text: `Today is **${date.fullDateString}**.`,
      spokenText: `${date.spokenDate}.`,
      widgetHtml: this.calendar.renderCalendarWidget()
    };
  }

  handleCalendarQuery(input) {
    const date = this.calendar.getDateData();
    return {
      text: `Here is the interactive calendar for **${date.monthName} ${date.year}**. You can navigate between months using the arrow controls.`,
      spokenText: `Here is the interactive calendar for ${date.monthName} ${date.year}.`,
      widgetHtml: this.calendar.renderCalendarWidget()
    };
  }

  handleGreetingQuery() {
    const time = this.calendar.getTimeData();
    const persona = this.voice.getCurrentPersona();

    return {
      text: `${time.greeting}! I'm **${persona.name}**, your Voice AI Copilot. You can ask me to tell a kids story, compare product deals, check world times, or set timers!`,
      spokenText: `${time.greeting}! I am ${persona.name}, your voice assistant. How can I help you today?`
    };
  }

  handleHelpQuery() {
    return {
      text: `Here are some things you can ask me:
- 📖 **"Tell me a kids story"** - Interactive storytelling with comprehension quiz & badges.
- 🛍️ **"Find best deals for Sony WH-1000XM5 / iPhone 15"** - Compare prices across Amazon, Best Buy, Walmart, eBay.
- 🎙️ **"Calibrate my voice"** - Guided 8-sentence studio to clone & calibrate your personal voice profile.
- ⏱️ **"Set a 2 minute timer"** - Interactive countdown timer with melodic audio chime.
- 🌐 **"Compare time in Tokyo, London and New York"** - Multi-city timezone comparison matrix.
- 🌍 **"What time is it in Tokyo / London / India?"** - Country world clock with flags & offsets.`,
      spokenText: `You can ask me to tell a story, compare product deals, calibrate your voice, set timers, or check world times.`
    };
  }

  handleVoiceQuery(input) {
    const persona = this.voice.getCurrentPersona();
    const displayGender = persona.userGender === 'kid'
      ? 'Kid'
      : persona.userGender === 'female' || persona.gender === 'female'
        ? 'Female'
        : 'Male';
    return {
      text: `I am currently speaking in **${persona.name}** (${displayGender} - ${persona.tagline}). Click the Voice Settings button at the top to select from our soft voices or calibrate your own voice!`,
      spokenText: `You are currently listening to ${persona.name}. You can switch voices or calibrate your own voice anytime.`
    };
  }

  handleFallback(input) {
    return {
      text: `I understood: *"${input}"*.\n\nTry asking me:\n- 📖 *"Tell me a kids story"*\n- 🛍️ *"Find best deals for Sony WH-1000XM5"*\n- 🎙️ *"Calibrate my voice"*\n- ⏱️ *"Set a 1 minute timer"*\n- 🌐 *"Compare Tokyo, London and New York"*`,
      spokenText: `I can help you with kids stories, product deals, voice calibration, timers, or world clocks.`
    };
  }
}

window.AgentEngine = AgentEngine;
