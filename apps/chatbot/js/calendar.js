/**
 * Calendar and Date Engine with Global World Clock & Multi-City Comparison Support
 * Provides interactive calendar rendering, date calculations, and rich visual widgets
 */

class CalendarEngine {
  constructor() {
    this.currentViewDate = new Date();

    // Comprehensive Country & Major City Timezone Database
    this.timezoneLocations = [
      { name: 'India', aliases: ['india', 'bharat', 'delhi', 'new delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad'], timezone: 'Asia/Kolkata', flag: '🇮🇳', city: 'New Delhi / Chennai', country: 'India' },
      { name: 'Japan', aliases: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama'], timezone: 'Asia/Tokyo', flag: '🇯🇵', city: 'Tokyo', country: 'Japan' },
      { name: 'United Kingdom', aliases: ['uk', 'united kingdom', 'london', 'england', 'britain', 'great britain', 'scotland', 'edinburgh', 'manchester'], timezone: 'Europe/London', flag: '🇬🇧', city: 'London', country: 'United Kingdom' },
      { name: 'United States (East / New York)', aliases: ['usa', 'us', 'united states', 'new york', 'nyc', 'est', 'edt', 'boston', 'miami', 'washington', 'dc', 'atlanta'], timezone: 'America/New_York', flag: '🇺🇸', city: 'New York (EST)', country: 'United States' },
      { name: 'United States (West / California)', aliases: ['california', 'los angeles', 'la', 'san francisco', 'sf', 'seattle', 'pst', 'pdt', 'silicon valley'], timezone: 'America/Los_Angeles', flag: '🇺🇸', city: 'Los Angeles (PST)', country: 'United States' },
      { name: 'United States (Central)', aliases: ['chicago', 'texas', 'houston', 'dallas', 'cst', 'cdt'], timezone: 'America/Chicago', flag: '🇺🇸', city: 'Chicago (CST)', country: 'United States' },
      { name: 'France', aliases: ['france', 'paris', 'lyon', 'marseille'], timezone: 'Europe/Paris', flag: '🇫🇷', city: 'Paris', country: 'France' },
      { name: 'Germany', aliases: ['germany', 'berlin', 'munich', 'frankfurt', 'hamburg'], timezone: 'Europe/Berlin', flag: '🇩🇪', city: 'Berlin', country: 'Germany' },
      { name: 'United Arab Emirates', aliases: ['uae', 'dubai', 'abu dhabi', 'emirates'], timezone: 'Asia/Dubai', flag: '🇦🇪', city: 'Dubai', country: 'United Arab Emirates' },
      { name: 'Singapore', aliases: ['singapore', 'sg'], timezone: 'Asia/Singapore', flag: '🇸🇬', city: 'Singapore', country: 'Singapore' },
      { name: 'Australia (Sydney)', aliases: ['australia', 'sydney', 'melbourne', 'canberra', 'brisbane', 'aussie'], timezone: 'Australia/Sydney', flag: '🇦🇺', city: 'Sydney', country: 'Australia' },
      { name: 'China', aliases: ['china', 'beijing', 'shanghai', 'shenzhen', 'guangzhou'], timezone: 'Asia/Shanghai', flag: '🇨🇳', city: 'Beijing', country: 'China' },
      { name: 'Canada (Toronto)', aliases: ['canada', 'toronto', 'ottawa', 'montreal'], timezone: 'America/Toronto', flag: '🇨🇦', city: 'Toronto', country: 'Canada' },
      { name: 'Canada (Vancouver)', aliases: ['vancouver', 'british columbia'], timezone: 'America/Vancouver', flag: '🇨🇦', city: 'Vancouver', country: 'Canada' },
      { name: 'Brazil', aliases: ['brazil', 'sao paulo', 'rio', 'rio de janeiro', 'brasilia'], timezone: 'America/Sao_Paulo', flag: '🇧🇷', city: 'São Paulo', country: 'Brazil' },
      { name: 'South Africa', aliases: ['south africa', 'johannesburg', 'cape town', 'pretoria'], timezone: 'Africa/Johannesburg', flag: '🇿🇦', city: 'Johannesburg', country: 'South Africa' },
      { name: 'Egypt', aliases: ['egypt', 'cairo', 'alexandria'], timezone: 'Africa/Cairo', flag: '🇪🇬', city: 'Cairo', country: 'Egypt' },
      { name: 'Russia (Moscow)', aliases: ['russia', 'moscow', 'saint petersburg'], timezone: 'Europe/Moscow', flag: '🇷🇺', city: 'Moscow', country: 'Russia' },
      { name: 'Italy', aliases: ['italy', 'rome', 'milan', 'venice', 'florence'], timezone: 'Europe/Rome', flag: '🇮🇹', city: 'Rome', country: 'Italy' },
      { name: 'Spain', aliases: ['spain', 'madrid', 'barcelona', 'valencia'], timezone: 'Europe/Madrid', flag: '🇪🇸', city: 'Madrid', country: 'Spain' },
      { name: 'Netherlands', aliases: ['netherlands', 'holland', 'amsterdam', 'rotterdam'], timezone: 'Europe/Amsterdam', flag: '🇳🇱', city: 'Amsterdam', country: 'Netherlands' },
      { name: 'Switzerland', aliases: ['switzerland', 'zurich', 'geneva', 'bern'], timezone: 'Europe/Zurich', flag: '🇨🇭', city: 'Zurich', country: 'Switzerland' },
      { name: 'South Korea', aliases: ['korea', 'south korea', 'seoul', 'busan'], timezone: 'Asia/Seoul', flag: '🇰🇷', city: 'Seoul', country: 'South Korea' },
      { name: 'Saudi Arabia', aliases: ['saudi', 'saudi arabia', 'riyadh', 'jeddah', 'mecca'], timezone: 'Asia/Riyadh', flag: '🇸🇦', city: 'Riyadh', country: 'Saudi Arabia' },
      { name: 'Malaysia', aliases: ['malaysia', 'kuala lumpur', 'kl', 'penang'], timezone: 'Asia/Kuala_Lumpur', flag: '🇲🇾', city: 'Kuala Lumpur', country: 'Malaysia' },
      { name: 'Sri Lanka', aliases: ['sri lanka', 'colombo', 'jaffna', 'kandy'], timezone: 'Asia/Colombo', flag: '🇱🇰', city: 'Colombo', country: 'Sri Lanka' },
      { name: 'New Zealand', aliases: ['new zealand', 'auckland', 'wellington', 'christchurch', 'nz'], timezone: 'Pacific/Auckland', flag: '🇳🇿', city: 'Auckland', country: 'New Zealand' },
      { name: 'Mexico', aliases: ['mexico', 'mexico city', 'guadalajara', 'cancun'], timezone: 'America/Mexico_City', flag: '🇲🇽', city: 'Mexico City', country: 'Mexico' },
      { name: 'Argentina', aliases: ['argentina', 'buenos aires'], timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', city: 'Buenos Aires', country: 'Argentina' },
      { name: 'Turkey', aliases: ['turkey', 'istanbul', 'ankara'], timezone: 'Europe/Istanbul', flag: '🇹🇷', city: 'Istanbul', country: 'Turkey' }
    ];
  }

  // Find single location match from user text
  findLocationMatch(queryText) {
    if (!queryText) return null;
    const clean = queryText.toLowerCase();

    for (const loc of this.timezoneLocations) {
      for (const alias of loc.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(clean)) {
          return loc;
        }
      }
    }
    return null;
  }

  // Find multiple locations from query (for multi-city comparison)
  findAllLocationMatches(queryText) {
    if (!queryText) return [];
    const clean = queryText.toLowerCase();
    const matches = [];
    const seen = new Set();

    for (const loc of this.timezoneLocations) {
      for (const alias of loc.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(clean) && !seen.has(loc.name)) {
          matches.push(loc);
          seen.add(loc.name);
          break;
        }
      }
    }
    return matches;
  }

  // Get rich time information for local user
  getTimeData() {
    const now = new Date();
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let greeting = 'Hello';
    if (hours24 >= 5 && hours24 < 12) greeting = 'Good morning';
    else if (hours24 >= 12 && hours24 < 17) greeting = 'Good afternoon';
    else if (hours24 >= 17 && hours24 < 22) greeting = 'Good evening';
    else greeting = 'Good night';

    const formattedTime = `${hours12}:${minutes} ${ampm}`;
    const formattedTimeWithSecs = `${hours12}:${minutes}:${seconds} ${ampm}`;
    const formatted24 = `${String(hours24).padStart(2, '0')}:${minutes}:${seconds}`;

    return {
      hours12,
      hours24,
      minutes,
      seconds,
      ampm,
      greeting,
      timeZone,
      formattedTime,
      formattedTimeWithSecs,
      formatted24,
      spokenTime: `The current time is ${hours12} ${minutes === '00' ? "o'clock" : minutes} ${ampm}`
    };
  }

  // Get rich time for a specific country or city
  getGlobalTimeData(loc) {
    const now = new Date();

    const optionsTime = {
      timeZone: loc.timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    const options24 = {
      timeZone: loc.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const optionsDate = {
      timeZone: loc.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const localTimeStr = new Intl.DateTimeFormat('en-US', optionsTime).format(now);
    const local24Str = new Intl.DateTimeFormat('en-US', options24).format(now);
    const localDateStr = new Intl.DateTimeFormat('en-US', optionsDate).format(now);

    const userTime = new Date();
    const targetTimeStr = now.toLocaleString('en-US', { timeZone: loc.timezone });
    const targetDate = new Date(targetTimeStr);
    const diffHours = (targetDate.getTime() - userTime.getTime()) / (1000 * 60 * 60);

    let diffText = '';
    const absDiff = Math.abs(Math.round(diffHours * 10) / 10);
    if (Math.abs(diffHours) < 0.1) {
      diffText = 'Same as your local time';
    } else if (diffHours > 0) {
      diffText = `${absDiff} hrs ahead of you`;
    } else {
      diffText = `${absDiff} hrs behind you`;
    }

    const targetHour24 = parseInt(local24Str.split(':')[0], 10);
    let timeIcon = '☀️';
    let timeOfDay = 'daytime';
    if (targetHour24 >= 5 && targetHour24 < 12) {
      timeIcon = '🌅';
      timeOfDay = 'morning';
    } else if (targetHour24 >= 12 && targetHour24 < 17) {
      timeIcon = '☀️';
      timeOfDay = 'afternoon';
    } else if (targetHour24 >= 17 && targetHour24 < 21) {
      timeIcon = '🌆';
      timeOfDay = 'evening';
    } else {
      timeIcon = '🌙';
      timeOfDay = 'night';
    }

    const spokenTime = `In ${loc.city}, ${loc.country}, the time is currently ${localTimeStr} on ${localDateStr}. It is ${diffText}.`;

    return {
      location: loc,
      localTimeStr,
      local24Str,
      localDateStr,
      diffText,
      timeIcon,
      timeOfDay,
      timezone: loc.timezone,
      spokenTime
    };
  }

  // Get rich date information object
  getDateData() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayNumber = now.getDate();
    const year = now.getFullYear();

    const suffix = this.getOrdinalSuffix(dayNumber);

    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDaysInYear = isLeap ? 366 : 365;
    const daysRemaining = totalDaysInYear - dayOfYear;

    const fullDateString = `${dayName}, ${monthName} ${dayNumber}${suffix}, ${year}`;
    const shortDateString = `${monthName} ${dayNumber}, ${year}`;
    const spokenDate = `Today is ${dayName}, ${monthName} ${dayNumber}, ${year}`;

    return {
      dayName,
      monthName,
      dayNumber,
      year,
      suffix,
      dayOfYear,
      daysRemaining,
      isLeap,
      fullDateString,
      shortDateString,
      spokenDate
    };
  }

  getOrdinalSuffix(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  // Render HTML for Multi-City Timezone Comparison Matrix
  renderMultiCityComparisonWidget(locations) {
    const localTime = this.getTimeData();

    let rowsHtml = `
      <div class="matrix-row matrix-row-local">
        <div class="matrix-loc">
          <span class="country-flag">📍</span>
          <div>
            <div style="font-weight:700; color:#fff;">Your Location</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${localTime.timeZone}</div>
          </div>
        </div>
        <div class="matrix-time">${localTime.formattedTime}</div>
        <div class="matrix-offset"><span class="matrix-pill local">Local Reference</span></div>
      </div>
    `;

    locations.forEach(loc => {
      const data = this.getGlobalTimeData(loc);
      rowsHtml += `
        <div class="matrix-row">
          <div class="matrix-loc">
            <span class="country-flag">${loc.flag}</span>
            <div>
              <div style="font-weight:700; color:#fff;">${loc.city}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">${loc.country}</div>
            </div>
          </div>
          <div class="matrix-time">${data.localTimeStr}</div>
          <div class="matrix-offset"><span class="matrix-pill">${data.timeIcon} ${data.diffText}</span></div>
        </div>
      `;
    });

    return `
      <div class="rich-widget-card matrix-comparison-widget">
        <div class="matrix-header">
          <div style="font-weight:700; font-size:1rem; color:#fff;">🌐 Multi-City Time Comparison</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Real-time cross-region comparison</div>
        </div>
        <div class="matrix-body">
          ${rowsHtml}
        </div>
      </div>
    `;
  }

  // Render HTML for the Global Country/City World Clock Widget
  renderGlobalTimeWidget(globalData) {
    const { location, localTimeStr, local24Str, localDateStr, diffText, timeIcon, timezone } = globalData;

    return `
      <div class="rich-widget-card world-clock-widget">
        <div class="world-clock-header">
          <div class="location-badge">
            <span class="country-flag">${location.flag}</span>
            <div>
              <div class="location-title">${location.city}</div>
              <div class="location-country">${location.country}</div>
            </div>
          </div>
          <span class="diff-pill">${timeIcon} ${diffText}</span>
        </div>

        <div class="world-clock-body">
          <div class="time-clock-huge">
            <span>${localTimeStr}</span>
          </div>
          <div class="time-date-sub">${localDateStr}</div>
        </div>

        <div class="world-clock-footer">
          <span class="tz-pill">${timezone}</span>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${local24Str} (24h)</span>
        </div>
      </div>
    `;
  }

  // Render HTML for the Local Time Widget
  renderTimeWidget() {
    const time = this.getTimeData();
    const date = this.getDateData();

    return `
      <div class="rich-widget-card time-widget">
        <div class="time-main-display">
          <div class="time-clock-huge">
            <span>${time.hours12}:${time.minutes}</span>
            <span class="time-period">${time.ampm}</span>
          </div>
          <div class="time-date-sub">${date.fullDateString}</div>
        </div>
        <div class="time-meta-badge">
          <span class="tz-pill">${time.timeZone}</span>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${time.formatted24} (24h)</span>
        </div>
      </div>
    `;
  }

  // Render HTML for the Interactive Calendar Widget
  renderCalendarWidget(targetDate = null, instanceId = 'cal-' + Date.now()) {
    const date = targetDate || new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let gridHtml = '';
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayHeaders.forEach(d => {
      gridHtml += `<div class="cal-day-header">${d}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
      gridHtml += `<div class="cal-cell empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
      const classes = `cal-cell ${isCurrentDay ? 'today' : ''}`;
      gridHtml += `<div class="${classes}" data-day="${day}" data-month="${month}" data-year="${year}">${day}</div>`;
    }

    const dateData = this.getDateData();

    return `
      <div class="rich-widget-card calendar-widget" id="${instanceId}" data-year="${year}" data-month="${month}">
        <div class="calendar-header">
          <button class="cal-nav-btn" onclick="window.CalendarWidgetNavigate('${instanceId}', -1)" title="Previous Month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="calendar-title">${months[month]} ${year}</div>
          <button class="cal-nav-btn" onclick="window.CalendarWidgetNavigate('${instanceId}', 1)" title="Next Month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="calendar-grid">
          ${gridHtml}
        </div>
        <div class="cal-footer">
          <span>Day ${dateData.dayOfYear} of ${dateData.isLeap ? '366' : '365'}</span>
          <span>${dateData.daysRemaining} days left in ${year}</span>
        </div>
      </div>
    `;
  }
}

window.CalendarEngine = CalendarEngine;
