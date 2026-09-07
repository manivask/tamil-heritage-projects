/* Script Designer / AI Prompt Engineer : Manivasagam Karunakaran */
/* Core Javascript Logic for Thirukkural Facts Finder */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let allKurals = [];
    let chaptersList = []; // Array of { id: 1..133, name: "...", section: "..." }
    let currentChapterId = null;
    let isSearchActive = false;

    // Fact Map Definitions
    const FACT_MAP = {
        fruit: {
            title_ta: "ஒரே பழம்: நெருஞ்சிப்பழம் (Fruit: Nerunjipazham)",
            desc_ta: "திருக்குறளில் குறிப்பிடப்படும் ஒரே பழம் 'நெருஞ்சிப்பழம்' ஆகும். காமத்துப்பாலில் உள்ள 'நலம்புனைந்துரைத்தல்' அதிகாரத்தில் தலைவியின் பாதங்களின் மென்மையை மிகைப்படுத்திப் புகழும்போது இப்பழம் குறிப்பிடப்பட்டுள்ளது.",
            desc_en: "The only fruit mentioned in Thirukkural is 'Nerunjipazham' (a thorny fruit). In couplet 1120, Valluvar says even the delicate Anicham flower and swan feathers would feel like thorny Nerunjipazham under the lover's feet.",
            chapter_num: 112,
            kural_num: 1120
        },
        seed: {
            title_ta: "ஒரே விதை: குன்றிமணி (Seed: Kundrimani)",
            desc_ta: "திருக்குறளில் குறிப்பிடப்படும் ஒரே விதை 'குன்றிமணி' ஆகும். கூடாவொழுக்கம் அதிகாரத்தில், வெளியே சிவந்திருந்தாலும் முகம் கறுத்து விளங்கும் குன்றிமணியைப் போன்ற போலி வேடதாரிகளை விளக்க இந்த விதை பயன்படுத்தப்பட்டுள்ளது.",
            desc_en: "The only seed mentioned in Thirukkural is 'Kundrimani' (rosary pea). In couplet 277, it is used to describe hypocrites who are outwardly red and beautiful like the seed, but black inside.",
            chapter_num: 28,
            kural_num: 277
        },
        flowers: {
            title_ta: "இரு மலர்கள்: அனிச்சம், குவளை (Flowers: Anicham, Kuvalai)",
            desc_ta: "திருக்குறளில் இடம் பெறும் இரு மலர்கள் 'அனிச்சம்' மற்றும் 'குவளை' ஆகும். இதில் அனிச்சம் மோந்து பார்த்தால் வாடக்கூடிய மிக மென்மையான மலராகவும், குவளை நீர் மலராகவும் விளக்கப்பட்டுள்ளது.",
            desc_en: "The only two flowers mentioned are 'Anicham' (sensitive flower) and 'Kuvalai' (water lily). Anicham is mentioned in couplet 90 (hospitality), and both flowers are used in Kamathupal (e.g., 1111, 1115, 1120) to describe the beauty of the beloved.",
            chapter_num: 9,
            kural_num: 90
        },
        trees: {
            title_ta: "இரு மரங்கள்: பனை, மூங்கில் (Trees: Palmyra, Bamboo)",
            desc_ta: "திருக்குறளில் இடம் பெறும் இரு மரங்கள் 'பனை' (Palmyra) மற்றும் 'மூங்கில்' (Bamboo) ஆகும். செய்ந்நன்றியறிதல் அதிகாரத்தில் பனை மரமும், குற்றங்கடிதல் அதிகாரத்தில் மூங்கில் மரமும் உவமைகளாகக் காட்டப்பட்டுள்ளன.",
            desc_en: "The only two trees mentioned are the Palmyra tree (பனை) and the Bamboo tree (மூங்கில்). In couplet 104, Palmyra is used to measure gratitude. In couplet 435, Bamboo is referenced in a cautionary context.",
            chapter_num: 11,
            kural_num: 104
        },
        vowel: {
            title_ta: "பயன்படுத்தப்படாத ஒரே உயிர் எழுத்து: ஔ (Vowel: ஔ)",
            desc_ta: "தமிழின் 247 எழுத்துக்களில், 'ஔ' என்ற உயிர் எழுத்து மட்டும் திருக்குறளில் உள்ள 1330 குறள்களிலும் ஒரு முறை கூட பயன்படுத்தப்படவில்லை.",
            desc_en: "Out of 247 Tamil letters, the vowel 'ஔ' is never used anywhere in the 1330 couplets of Thirukkural.",
            chapter_num: 1,
            kural_num: 1
        },
        words: {
            title_ta: "இடம் பெறாத சொற்கள்: 'தமிழ்', 'கடவுள்'",
            desc_ta: "முழுக்க முழுக்க தமிழில் எழுதப்பட்டு, கடவுள் வாழ்த்தைக் கொண்ட திருக்குறளில், 'தமிழ்' மற்றும் 'கடவுள்' ஆகிய இரு சொற்களும் எங்குமே பயன்படுத்தப்படவில்லை. எனினும், 'தெய்வம்' என்ற சொல் பயின்று வந்துள்ளது.",
            desc_en: "Astonishingly, the words 'Tamil' (தமிழ்) and 'God' (கடவுள்) are never used in any of the verses, despite it being a Tamil classic starting with a praise of the divine. Instead, words like 'Deivam' (தெய்வம்) are used.",
            chapter_num: 1,
            kural_num: 1
        },
        chapter_title: {
            title_ta: "இருமுறை வரும் அதிகாரத் தலைப்பு: குறிப்பறிதல்",
            desc_ta: "திருக்குறளில் 133 அதிகாரங்களில், 'குறிப்பறிதல்' என்ற தலைப்பு மட்டும் பொருட்பாலில் (அதிகாரம் 71) மற்றும் காமத்துப்பாலில் (அதிகாரம் 110) என இருமுறை பயன்படுத்தப்பட்டுள்ளது.",
            desc_en: "'Kuripparithal' (Understanding the signs) is the only chapter title that appears twice: Chapter 71 in Porutpaal (focusing on royal assembly) and Chapter 110 in Kamathupaal (focusing on lovers' unspoken feelings).",
            chapter_num: 71,
            kural_num: 701
        },
        print_year: {
            title_ta: "முதன்முதலில் அச்சிடப்பட்ட ஆண்டு: 1812 (First Printed: 1812)",
            desc_ta: "ஓலைச்சுவடிகளில் மட்டுமே இருந்த திருக்குறள், முதன்முதலில் அச்சிடப்பட்டு நூலாக வெளியீடு கண்ட ஆண்டு 1812 ஆகும்.",
            desc_en: "The Thirukkural, which survived on palm-leaf manuscripts, was printed and published in book form for the first time in the year 1812.",
            chapter_num: 1,
            kural_num: 1
        },
        printer_name: {
            title_ta: "முதன்முதலில் அச்சிட்டவர்: தஞ்சை ஞானப்பிரகாசர்",
            desc_ta: "திருக்குறள் மூலத்தை முதன்முதலில் 1812-இல் அச்சிட்டு வெளியிட்ட பெருமைக்குரியவர் தஞ்சை ஞானப்பிரகாசர் ஆவார்.",
            desc_en: "Tanjore Gnana Pragasar was the first person to publish and print the original text of Thirukkural in 1812.",
            chapter_num: 1,
            kural_num: 1
        }
    };

    // DOM Elements
    const elements = {
        factSelect: document.getElementById('fact-select'),
        sectionSelect: document.getElementById('section-select'),
        chapterSelect: document.getElementById('chapter-select'),
        kuralSearch: document.getElementById('kural-search'),
        searchClearBtn: document.getElementById('search-clear-btn'),
        homeBtn: document.getElementById('home-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        welcomeSection: document.getElementById('welcome-section'),
        explorerSection: document.getElementById('explorer-section'),
        activePaalBadge: document.getElementById('active-paal-badge'),
        activeChapterTitle: document.getElementById('active-chapter-title'),
        activeChapterDesc: document.getElementById('active-chapter-desc'),
        factAlertBanner: document.getElementById('fact-alert-banner'),
        factAlertTitle: document.getElementById('fact-alert-title'),
        factAlertContent: document.getElementById('fact-alert-content'),
        factAlertClose: document.getElementById('fact-alert-close'),
        searchInfoBanner: document.getElementById('search-info-banner'),
        searchQueryText: document.getElementById('search-query-text'),
        searchCount: document.getElementById('search-count'),
        kuralsList: document.getElementById('kurals-list'),
        loadingOverlay: document.getElementById('loading-overlay'),
        prevChapterBtn: document.getElementById('prev-chapter-btn'),
        nextChapterBtn: document.getElementById('next-chapter-btn'),
        scrollArea: document.getElementById('main-scroll-area')
    };

    // Initialization: Fetch Thirukkural Data
    initApp();

    async function initApp() {
        showLoader(true);
        try {
            const response = await fetch('data/thirukkural.json');
            if (!response.ok) throw new Error('Failed to load dataset');
            const data = await response.json();
            
            allKurals = data.kurals;
            console.log(`Loaded ${allKurals.length} kurals.`);
            
            // Build Chapters index mapping
            buildChaptersIndex();
            
            // Populate Chapter selector dropdown
            populateChapterDropdown('all');
            
            // Bind Event Listeners
            bindEvents();
            
            // Load saved theme if any
            initializeTheme();
            
        } catch (error) {
            console.error('Error during app initialization:', error);
            alert('திருக்குறள் தரவுகளை ஏற்றுவதில் சிக்கல் ஏற்பட்டுள்ளது. தயவுசெய்து பக்கத்தை ரீலோடு செய்யவும்.');
        } finally {
            showLoader(false);
        }
    }

    // Build unique index of 133 chapters
    function buildChaptersIndex() {
        const chaptersMap = new Map();
        
        allKurals.forEach(k => {
            const chapName = k.chapter;
            const secName = k.section;
            // Calculate chapter number mathematically (10 kurals per chapter)
            const chapNum = Math.floor((k.number - 1) / 10) + 1;
            
            if (!chaptersMap.has(chapNum)) {
                chaptersMap.set(chapNum, {
                    id: chapNum,
                    name: chapName,
                    section: secName
                });
            }
        });
        
        // Sort chapters numerically
        chaptersList = Array.from(chaptersMap.values()).sort((a, b) => a.id - b.id);
        console.log(`Indexed ${chaptersList.length} chapters.`);
    }

    // Populate Chapter dropdown filter
    function populateChapterDropdown(sectionFilter) {
        // Clear previous options except first one
        elements.chapterSelect.innerHTML = '<option value="">-- அதிகாரத்தைத் தேர்ந்தெடுக்கவும் --</option>';
        
        const filtered = sectionFilter === 'all' 
            ? chaptersList 
            : chaptersList.filter(c => c.section === sectionFilter);
            
        filtered.forEach(chap => {
            const opt = document.createElement('option');
            opt.value = chap.id;
            opt.textContent = `${chap.id}. ${chap.name}`;
            elements.chapterSelect.appendChild(opt);
        });
    }

    // Bind UI Event Listeners
    function bindEvents() {
        // Section selector change
        elements.sectionSelect.addEventListener('change', (e) => {
            populateChapterDropdown(e.target.value);
            // Clear fact selections to prevent conflict
            elements.factSelect.value = '';
            hideFactAlert();
        });

        // Chapter selector change
        elements.chapterSelect.addEventListener('change', (e) => {
            const chapId = e.target.value;
            if (chapId) {
                loadChapter(parseInt(chapId));
                elements.factSelect.value = ''; // Reset fact select
                hideFactAlert();
            }
        });

        // Fact selector change
        elements.factSelect.addEventListener('change', (e) => {
            const factKey = e.target.value;
            if (factKey) {
                handleFactSelection(factKey);
            }
        });

        // Fact Alert Banner Close
        elements.factAlertClose.addEventListener('click', () => {
            hideFactAlert();
            elements.factSelect.value = '';
            // Remove highlight glows from cards
            document.querySelectorAll('.kural-card.glow-highlight').forEach(el => {
                el.classList.remove('glow-highlight');
            });
        });

        // Search Input (Keystroke & input events)
        elements.kuralSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                elements.searchClearBtn.style.display = 'block';
                // Reset select controls
                elements.factSelect.value = '';
                elements.sectionSelect.value = 'all';
                populateChapterDropdown('all');
                elements.chapterSelect.value = '';
                hideFactAlert();
                
                performSearch(query);
            } else {
                clearSearch();
            }
        });

        // Clear Search button click
        elements.searchClearBtn.addEventListener('click', () => {
            elements.kuralSearch.value = '';
            clearSearch();
        });

        // Next/Prev Chapter Navigation Buttons
        elements.prevChapterBtn.addEventListener('click', () => {
            if (currentChapterId > 1) {
                loadChapter(currentChapterId - 1);
            }
        });

        elements.nextChapterBtn.addEventListener('click', () => {
            if (currentChapterId < 133) {
                loadChapter(currentChapterId + 1);
            }
        });

        // Home Button Click
        elements.homeBtn.addEventListener('click', () => {
            goHome();
        });

        // Theme Toggle Click
        elements.themeToggle.addEventListener('click', () => {
            toggleTheme();
        });
    }

    // Handles Fact Selection Logic
    function handleFactSelection(factKey) {
        const fact = FACT_MAP[factKey];
        if (!fact) return;

        // Load the chapter of the fact first
        loadChapter(fact.chapter_num, () => {
            // Callback once chapter kurals are rendered:
            
            // Display fact details banner
            elements.factAlertTitle.textContent = fact.title_ta;
            elements.factAlertContent.innerHTML = `${fact.desc_ta}<br><br><span style="opacity: 0.8; font-style: italic;">English: ${fact.desc_en}</span>`;
            elements.factAlertBanner.classList.remove('hidden');

            // Find target kural card in DOM
            const targetCardId = `kural-card-${fact.kural_num}`;
            const targetCard = document.getElementById(targetCardId);
            
            if (targetCard) {
                // Remove existing glows
                document.querySelectorAll('.kural-card.glow-highlight').forEach(el => {
                    el.classList.remove('glow-highlight');
                });
                
                // Add highlight glow
                targetCard.classList.add('glow-highlight');
                
                // Scroll to target card smoothly
                setTimeout(() => {
                    targetCard.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);
            }
        });
    }

    // Load and Render a Chapter
    function loadChapter(chapId, callback = null) {
        if (!chapId || chapId < 1 || chapId > 133) return;
        
        currentChapterId = chapId;
        isSearchActive = false;
        elements.searchInfoBanner.classList.add('hidden');
        
        // Find chapter metadata
        const chapterMeta = chaptersList.find(c => c.id === chapId);
        if (!chapterMeta) return;

        // Filter the 10 kurals of this chapter
        const chapterKurals = allKurals.filter(k => 
            Math.floor((k.number - 1) / 10) + 1 === chapId
        );

        // Update active dropdowns values to reflect chapter selection
        elements.sectionSelect.value = chapterMeta.section;
        populateChapterDropdown(chapterMeta.section);
        elements.chapterSelect.value = chapId;

        // Render chapter headings
        elements.activePaalBadge.textContent = chapterMeta.section;
        elements.activeChapterTitle.textContent = `${chapId}. ${chapterMeta.name}`;
        
        // Add dynamic subheader descriptions
        const startKural = (chapId - 1) * 10 + 1;
        const endKural = chapId * 10;
        elements.activeChapterDesc.textContent = `அதிகார எண்கள்: ${startKural} - ${endKural} | 10 குறட்பாக்கள் (Couplets ${startKural} to ${endKural})`;

        // Render Cards
        renderKurals(chapterKurals);

        // Manage navigation button states
        elements.prevChapterBtn.disabled = chapId === 1;
        elements.nextChapterBtn.disabled = chapId === 133;
        elements.prevChapterBtn.style.opacity = chapId === 1 ? '0.4' : '1';
        elements.nextChapterBtn.style.opacity = chapId === 133 ? '0.4' : '1';

        // Toggle sections
        elements.welcomeSection.classList.remove('active');
        elements.explorerSection.classList.add('active');

        // Scroll to top of the content panel
        elements.scrollArea.scrollTop = 0;

        // Trigger callback if defined
        if (callback) callback();
    }

    // Render list of Kurals into grid
    function renderKurals(kuralsArray) {
        elements.kuralsList.innerHTML = '';
        
        if (kuralsArray.length === 0) {
            elements.kuralsList.innerHTML = '<div class="empty-state">குறள்கள் எதுவும் கண்டறியப்படவில்லை.</div>';
            return;
        }

        kuralsArray.forEach(k => {
            const card = document.createElement('article');
            card.className = 'kural-card card';
            card.id = `kural-card-${k.number}`;
            
            // Format couplet lines
            const formattedLine1 = k.kural.split(' ').slice(0, 4).join(' ');
            const formattedLine2 = k.kural.split(' ').slice(4).join(' ');
            
            // In the dataset, kural strings are normally formatted as a single string
            // We can split it into line 1 and line 2 by detecting spaces/format or looking at details.
            // Let's check: the raw kural text usually has a space or structure.
            // If it's a raw string, let's splits it nicely based on the standard Tamil Kural rule
            // (first line has 4 words, second line has 3 words).
            const words = k.kural.trim().split(/\s+/);
            const line1Text = words.slice(0, 4).join(' ');
            const line2Text = words.slice(4).join(' ');

            card.innerHTML = `
                <div class="kural-card-top">
                    <span class="kural-number-badge">குறள் ${k.number}</span>
                    <span class="kural-section-meta">${k.section} | ${k.chapter}</span>
                </div>
                <div class="kural-couplet">
                    <span class="line1">${line1Text}</span>
                    <span class="line2">${line2Text}</span>
                </div>
                <div class="kural-explanations-wrapper">
                    <div class="explanation-tabs">
                        <button class="tab-btn active" data-tab="muva">மு. வரதராசனார்</button>
                        <button class="tab-btn" data-tab="pappaiah">சாலமன் பாப்பையா</button>
                        <button class="tab-btn" data-tab="kalaignar">கலைஞர் உரை</button>
                        <button class="tab-btn" data-tab="english">English Translation</button>
                    </div>
                    <div class="explanation-content-panel">
                        <div class="explanation-text active" id="tab-muva-${k.number}">
                            ${k.meaning.ta_mu_va || 'விளக்கம் இல்லை'}
                        </div>
                        <div class="explanation-text" id="tab-pappaiah-${k.number}">
                            ${k.meaning.ta_salamon || 'விளக்கம் இல்லை'}
                        </div>
                        <div class="explanation-text" id="tab-kalaignar-${k.number}">
                            ${k.meaning.ta_kalaignar || 'விளக்கம் இல்லை'}
                        </div>
                        <div class="explanation-text english-text" id="tab-english-${k.number}">
                            ${k.meaning.en || 'No translation available'}
                        </div>
                    </div>
                </div>
            `;

            // Bind tab buttons inside this card
            const tabButtons = card.querySelectorAll('.tab-btn');
            const contentPanels = card.querySelectorAll('.explanation-text');

            tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabKey = e.target.getAttribute('data-tab');
                    
                    // Reset active states for tabs inside this card
                    tabButtons.forEach(b => b.classList.remove('active'));
                    contentPanels.forEach(p => p.classList.remove('active'));
                    
                    // Activate selected tab & corresponding panel
                    e.target.classList.add('active');
                    
                    let targetPanelId = '';
                    if (tabKey === 'muva') targetPanelId = `tab-muva-${k.number}`;
                    else if (tabKey === 'pappaiah') targetPanelId = `tab-pappaiah-${k.number}`;
                    else if (tabKey === 'kalaignar') targetPanelId = `tab-kalaignar-${k.number}`;
                    else if (tabKey === 'english') targetPanelId = `tab-english-${k.number}`;
                    
                    const targetPanel = card.querySelector(`#${targetPanelId}`);
                    if (targetPanel) {
                        targetPanel.classList.add('active');
                    }
                });
            });

            elements.kuralsList.appendChild(card);
        });
    }

    // Perform Search (Keyword or Number)
    function performSearch(query) {
        isSearchActive = true;
        
        // Check if query is a numeric Kural number (1 - 1330)
        const num = parseInt(query);
        if (!isNaN(num) && num >= 1 && num <= 1330) {
            // Calculate chapter id
            const chapId = Math.floor((num - 1) / 10) + 1;
            loadChapter(chapId, () => {
                // Focus and highlight target kural card
                const targetCard = document.getElementById(`kural-card-${num}`);
                if (targetCard) {
                    document.querySelectorAll('.kural-card.glow-highlight').forEach(el => {
                        el.classList.remove('glow-highlight');
                    });
                    targetCard.classList.add('glow-highlight');
                    setTimeout(() => {
                        targetCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 100);
                }
            });
            return;
        }

        // Otherwise perform text search across lines, explanations, translations
        const lowercaseQuery = query.toLowerCase();
        const results = allKurals.filter(k => {
            const textToSearch = [
                k.kural.toLowerCase(),
                k.chapter.toLowerCase(),
                k.section.toLowerCase(),
                k.meaning.ta_mu_va.toLowerCase(),
                k.meaning.ta_salamon.toLowerCase(),
                k.meaning.ta_kalaignar.toLowerCase(),
                k.meaning.en.toLowerCase()
            ].join(' ');
            return textToSearch.includes(lowercaseQuery);
        });

        // Render search results info banner
        elements.searchQueryText.textContent = query;
        elements.searchCount.textContent = results.length;
        elements.searchInfoBanner.classList.remove('hidden');

        // Render results
        elements.activePaalBadge.textContent = 'தேடல்';
        elements.activeChapterTitle.textContent = `முடிவுகள்: "${query}"`;
        elements.activeChapterDesc.textContent = `கண்டறியப்பட்ட குறள்களின் எண்ணிக்கை: ${results.length}`;
        
        renderKurals(results);

        // Hide navigation control button panel during search results view
        elements.prevChapterBtn.disabled = true;
        elements.nextChapterBtn.disabled = true;
        elements.prevChapterBtn.style.opacity = '0.3';
        elements.nextChapterBtn.style.opacity = '0.3';

        // Display results
        elements.welcomeSection.classList.remove('active');
        elements.explorerSection.classList.add('active');
        elements.scrollArea.scrollTop = 0;
    }

    // Reset search state
    function clearSearch() {
        elements.kuralSearch.value = '';
        elements.searchClearBtn.style.display = 'none';
        elements.searchInfoBanner.classList.add('hidden');
        isSearchActive = false;
        
        if (currentChapterId) {
            loadChapter(currentChapterId);
        } else {
            goHome();
        }
    }

    // Return to Homepage / Welcome View
    function goHome() {
        currentChapterId = null;
        isSearchActive = false;
        
        // Reset selections
        elements.factSelect.value = '';
        elements.sectionSelect.value = 'all';
        populateChapterDropdown('all');
        elements.chapterSelect.value = '';
        elements.kuralSearch.value = '';
        elements.searchClearBtn.style.display = 'none';
        
        hideFactAlert();
        elements.searchInfoBanner.classList.add('hidden');

        // Toggle sections
        elements.explorerSection.classList.remove('active');
        elements.welcomeSection.classList.add('active');
        
        elements.scrollArea.scrollTop = 0;
    }

    // Helper functions
    function showLoader(visible) {
        if (visible) {
            elements.loadingOverlay.classList.remove('hidden');
        } else {
            elements.loadingOverlay.classList.add('hidden');
        }
    }

    function hideFactAlert() {
        elements.factAlertBanner.classList.add('hidden');
        elements.factAlertTitle.textContent = '';
        elements.factAlertContent.innerHTML = '';
        // Clean glows
        document.querySelectorAll('.kural-card.glow-highlight').forEach(el => {
            el.classList.remove('glow-highlight');
        });
    }

    // Theme state helpers
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    function toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }
});
