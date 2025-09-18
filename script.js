// Game state
let currentCountry = null;
window.currentCountry = null; // Make it global for hints
let countriesGuessed = 0;
let totalCountries = 0;
let guessesLeft = 3; // Will be overridden by window.maxGuesses if set
let gameActive = false;
let availableCountries = [];
let guessedCountries = new Set();
let attempts = 0; // Track attempts for current country
let timerInterval = null;
let elapsedSeconds = 0;
let hardGuessMarker = null; // Marker for Hard mode guess
let hardGuessLine = null;   // Line from guess to target
let hardTargetCircle = null; // Circle marking true target
let easyArrowLine = null;    // Easy mode directional line
let easyArrowMarker = null;  // Easy mode arrow marker
let isPaused = false;

// Easy countries list for Easy mode
const easyCountries = [
    'United States', 'Canada', 'Russia', 'China', 'Japan', 'India', 'Australia', 
    'New Zealand', 'South Africa', 'Egypt', 'United Kingdom', 'Mexico', 'Brazil', 
    'Argentina', 'France', 'Spain', 'Germany', 'Italy', 'Pakistan', 'Greece', 
    'Ireland', 'Colombia', 'Algeria', 'Indonesia', 'Thailand', 'Vietnam', 
    'South Korea', 'Turkey', 'Sweden', 'Iceland', 'Saudi Arabia', 'Iran', 
    'Nigeria', 'Madagascar', 'Peru', 'Chile', 'Venezuela', 'Morocco', 
    'Norway', 'Finland', 'Philippines', 'Kazakhstan', 'Mongolia', 'Kenya', 
    'Afghanistan', 'Poland'
];

// DOM elements
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const prompt = document.getElementById('prompt');
const countriesGuessedElement = document.getElementById('countriesGuessed');
const totalCountriesElement = document.getElementById('totalCountries');
const guessesElement = document.getElementById('guesses');
const feedback = document.getElementById('feedback');
const mapWrapper = document.getElementById('mapWrapper');
const worldMap = document.getElementById('worldMap');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetViewBtn = document.getElementById('resetView');
const realMapBtn = document.getElementById('realMapBtn');
const realSatBtn = document.getElementById('realSatBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playBtn = document.getElementById('playBtn');
const hintBtn = document.getElementById('hintBtn');
const continentOptions = document.querySelectorAll('.continent-option');
const scopeLabel = document.getElementById('scopeLabel');

// Map state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isZooming = false;
let originalViewBox = null;
let realMapActive = false; // toggles Leaflet basemap
let leafletMap = null;
let leafletLayers = { streets: null, satellite: null };
let realBasemapType = null; // 'map' | 'sat'
let leafletCountryLayer = null;
let leafletCountryNames = [];
const countryNameToLeafletLayer = new Map();
const leafletCountryState = new Map(); // name -> 'correct' | 'incorrect' | undefined
let continentLayer = null; // visible continent outlines only

// Country name mapping
const countryNames = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan', 'AG': 'Antigua and Barbuda',
    'AI': 'Anguilla', 'AL': 'Albania', 'AM': 'Armenia', 'AO': 'Angola', 'AR': 'Argentina',
    'AS': 'American Samoa', 'AT': 'Austria', 'AU': 'Australia', 'AW': 'Aruba', 'AX': 'Aland Islands',
    'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados', 'BD': 'Bangladesh',
    'BE': 'Belgium', 'BF': 'Burkina Faso', 'BG': 'Bulgaria', 'BH': 'Bahrain', 'BI': 'Burundi',
    'BJ': 'Benin', 'BL': 'Saint Barthelemy', 'BN': 'Brunei Darussalam', 'BO': 'Bolivia',
    'BM': 'Bermuda', 'BQ': 'Bonaire, Saint Eustachius and Saba', 'BR': 'Brazil', 'BS': 'Bahamas',
    'BT': 'Bhutan', 'BW': 'Botswana', 'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
    'CD': 'Democratic Republic of the Congo', 'CF': 'Central African Republic', 'CG': 'Republic of the Congo',
    'CH': 'Switzerland', 'CI': 'Ivory Coast', 'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China',
    'CO': 'Colombia', 'CR': 'Costa Rica', 'CU': 'Cuba', 'CV': 'Cape Verde', 'CW': 'Curacao',
    'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DE': 'Germany', 'DJ': 'Djibouti', 'DK': 'Denmark',
    'DM': 'Dominica', 'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador', 'EE': 'Estonia',
    'EG': 'Egypt', 'EH': 'Western Sahara', 'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia',
    'FI': 'Finland', 'FJ': 'Fiji', 'FK': 'Falkland Islands', 'FM': 'Micronesia', 'FO': 'Faroe Islands',
    'FR': 'France', 'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada', 'GE': 'Georgia',
    'GF': 'French Guiana', 'GG': 'Guernsey', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GL': 'Greenland',
    'GM': 'Gambia', 'GN': 'Guinea', 'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea', 'GR': 'Greece',
    'GT': 'Guatemala', 'GU': 'Guam', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong',
    'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary', 'ID': 'Indonesia',
    'IE': 'Ireland', 'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India', 'IQ': 'Iraq',
    'IR': 'Iran', 'IS': 'Iceland', 'IT': 'Italy', 'JE': 'Jersey', 'JM': 'Jamaica',
    'JO': 'Jordan', 'JP': 'Japan', 'KE': 'Kenya', 'KG': 'Kyrgyzstan', 'KH': 'Cambodia',
    'KI': 'Kiribati', 'KM': 'Comoros', 'KP': 'North Korea', 'KR': 'South Korea', 'KW': 'Kuwait',
    'KY': 'Cayman Islands', 'KZ': 'Kazakhstan', 'LA': 'Laos', 'LB': 'Lebanon', 'LC': 'Saint Lucia',
    'LI': 'Liechtenstein', 'LK': 'Sri Lanka', 'LR': 'Liberia', 'LS': 'Lesotho', 'LT': 'Lithuania',
    'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya', 'MA': 'Morocco', 'MC': 'Monaco',
    'MD': 'Moldova', 'ME': 'Montenegro', 'MF': 'Saint Martin', 'MG': 'Madagascar', 'MH': 'Marshall Islands',
    'MK': 'North Macedonia', 'ML': 'Mali', 'MM': 'Myanmar', 'MN': 'Mongolia', 'MO': 'Macau',
    'MP': 'Northern Mariana Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MS': 'Montserrat',
    'MT': 'Malta', 'MU': 'Mauritius', 'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico',
    'MY': 'Malaysia', 'MZ': 'Mozambique', 'NA': 'Namibia', 'NC': 'New Caledonia', 'NE': 'Niger',
    'NF': 'Norfolk Island', 'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands', 'NO': 'Norway',
    'NP': 'Nepal', 'NR': 'Nauru', 'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman',
    'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia', 'PG': 'Papua New Guinea', 'PH': 'Philippines',
    'PK': 'Pakistan', 'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'PR': 'Puerto Rico',
    'PS': 'Palestine', 'PT': 'Portugal', 'PW': 'Palau', 'PY': 'Paraguay', 'QA': 'Qatar',
    'RE': 'Reunion', 'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia', 'RW': 'Rwanda',
    'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles', 'SD': 'Sudan',
    'SE': 'Sweden', 'SG': 'Singapore', 'SI': 'Slovenia', 'SK': 'Slovakia', 'SL': 'Sierra Leone',
    'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname', 'SS': 'South Sudan',
    'ST': 'Sao Tome and Principe', 'SV': 'El Salvador', 'SX': 'Sint Maarten', 'SY': 'Syria',
    'SZ': 'Eswatini', 'TC': 'Turks and Caicos Islands', 'TD': 'Chad', 'TG': 'Togo', 'TH': 'Thailand',
    'TJ': 'Tajikistan', 'TL': 'Timor-Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia', 'TO': 'Tonga',
    'TR': 'Turkey', 'TT': 'Trinidad and Tobago', 'TV': 'Tuvalu', 'TW': 'Taiwan', 'TZ': 'Tanzania',
    'UA': 'Ukraine', 'UG': 'Uganda', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan',
    'VA': 'Vatican City', 'VC': 'Saint Vincent and the Grenadines', 'VE': 'Venezuela', 'VG': 'British Virgin Islands',
    'VI': 'U.S. Virgin Islands', 'VN': 'Vietnam', 'VU': 'Vanuatu', 'WF': 'Wallis and Futuna',
    'WS': 'Samoa', 'YE': 'Yemen', 'YT': 'Mayotte', 'ZA': 'South Africa', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

// Load SVG content
async function loadSVG() {
    try {
        const response = await fetch('world.svg');
        const svgText = await response.text();
        
        // Extract the path elements from the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path');
        
        // Store original viewBox for crisp zooming
        originalViewBox = worldMap.getAttribute('viewBox') || '0 0 1009.6727 665.96301';
        
        // Add only valid country paths to our SVG (filter out miscellaneous lines)
        paths.forEach(path => {
            const id = path.getAttribute('id');
            if (!id || !countryNames[id]) return; // skip non-country paths
            const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            newPath.setAttribute('d', path.getAttribute('d'));
            // Remove any title tooltips to avoid showing country names
            newPath.setAttribute('id', id);
            newPath.classList.add('country');
            // Set default colors for countries (no border by default)
            newPath.removeAttribute('fill');
            newPath.style.fill = '#F5F5DC';
            newPath.style.stroke = 'none';
            newPath.style.strokeWidth = '0';
            worldMap.appendChild(newPath);
        });
        
        // Initialize countries array
        availableCountries = Object.keys(countryNames);
        totalCountries = availableCountries.length;
        totalCountriesElement.textContent = totalCountries;
        
        // Add event listeners to countries
        addCountryEventListeners();
        
        // Call resetAllCountryColors after loading SVG and after each round
        resetAllCountryColors();
        
    } catch (error) {
        console.error('Error loading SVG:', error);
        // Fallback: create a simple world map representation
        createFallbackMap();
    }
}

// Create fallback map if SVG loading fails
function createFallbackMap() {
    const fallbackCountries = [
        { id: 'US', title: 'United States', d: 'M 100,200 L 300,200 L 300,300 L 100,300 Z' },
        { id: 'CA', title: 'Canada', d: 'M 100,100 L 300,100 L 300,200 L 100,200 Z' },
        { id: 'MX', title: 'Mexico', d: 'M 100,300 L 300,300 L 300,400 L 100,400 Z' },
        { id: 'BR', title: 'Brazil', d: 'M 200,400 L 400,400 L 400,600 L 200,600 Z' },
        { id: 'AR', title: 'Argentina', d: 'M 200,600 L 400,600 L 400,700 L 200,700 Z' },
        { id: 'GB', title: 'United Kingdom', d: 'M 500,200 L 520,200 L 520,220 L 500,220 Z' },
        { id: 'FR', title: 'France', d: 'M 500,220 L 530,220 L 530,250 L 500,250 Z' },
        { id: 'DE', title: 'Germany', d: 'M 510,230 L 530,230 L 530,250 L 510,250 Z' },
        { id: 'IT', title: 'Italy', d: 'M 520,240 L 540,240 L 540,270 L 520,270 Z' },
        { id: 'ES', title: 'Spain', d: 'M 490,240 L 510,240 L 510,260 L 490,260 Z' },
        { id: 'RU', title: 'Russia', d: 'M 600,100 L 800,100 L 800,300 L 600,300 Z' },
        { id: 'CN', title: 'China', d: 'M 700,250 L 850,250 L 850,350 L 700,350 Z' },
        { id: 'IN', title: 'India', d: 'M 650,300 L 750,300 L 750,400 L 650,400 Z' },
        { id: 'JP', title: 'Japan', d: 'M 850,200 L 870,200 L 870,220 L 850,220 Z' },
        { id: 'AU', title: 'Australia', d: 'M 750,450 L 900,450 L 900,600 L 750,600 Z' }
    ];
    
    fallbackCountries.forEach(country => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', country.d);
        // Do not set title attribute to avoid name tooltips
        path.setAttribute('id', country.id);
        path.classList.add('country');
        path.removeAttribute('fill');
        path.style.fill = '#F5F5DC';
        path.style.stroke = 'none';
        path.style.strokeWidth = '0';
        worldMap.appendChild(path);
    });
    
    availableCountries = fallbackCountries.map(c => c.id);
    totalCountries = availableCountries.length;
    totalCountriesElement.textContent = totalCountries;
    addCountryEventListeners();
    resetAllCountryColors(); // Ensure fallback map is reset
}

// Add event listeners to country paths
function addCountryEventListeners() {
    const countryPaths = document.querySelectorAll('.country');
    countryPaths.forEach(path => {
        const countryId = path.id;
        const countryName = countryNames[countryId];
        
        // Remove existing event listeners first
        path.removeEventListener('click', handleCountryClick);
        path.removeEventListener('mouseenter', handleCountryHover);
        path.removeEventListener('mouseleave', handleCountryLeave);
        
        // Only make countries clickable if they're in the easy list (Easy mode) or all countries (other modes)
        if (window.currentMode !== 'easy' || easyCountries.includes(countryName)) {
            path.addEventListener('click', handleCountryClick);
        }
        
        // Only add hover effects for easy countries in Easy mode
        if (window.currentMode !== 'easy' || easyCountries.includes(countryName)) {
            path.addEventListener('mouseenter', handleCountryHover);
            path.addEventListener('mouseleave', handleCountryLeave);
        }
    });
    applyMapModeStyles();
}

// Handle country click
function handleCountryClick(event) {
    if (!gameActive || isPaused) return;
    if (window.currentMode === 'hard') return; // Hard mode uses map click GPS guess only
    
    const countryId = event.target.id;
    const countryName = countryNames[countryId];
    
    if (!countryName) return;
    
    // Check if this country has already been guessed (except in Easy mode)
    if (guessedCountries.has(countryId) && window.currentMode !== 'easy') {
        // Don't allow re-guessing - just return silently
        return;
    }
    
    // Reset only the current country's styling if it's not already correct
    if (!event.target.classList.contains('correct')) {
        event.target.style.stroke = '';
        event.target.style.strokeWidth = '';
        event.target.style.fill = '';
    }

    if (countryName === currentCountry) {
        // Correct guess
        attempts++; // Increment attempts
        countriesGuessed++;
        countriesGuessedElement.textContent = countriesGuessed;
        guessedCountries.add(countryId);
        
        feedback.textContent = `Correct! ${countryName} is the right answer!`;
        feedback.className = 'feedback correct';
        
        // Fill the correct country with bright green (no border)
        event.target.classList.add('correct');
        event.target.style.fill = '#22c55e'; // Bright green for correct guess
        event.target.style.stroke = 'none';
        event.target.style.strokeWidth = '0';
        
        // Show success popup
        showSuccessPopup(countryName, attempts);
        
        // End round
        endRound();
    } else {
        // Wrong guess
        attempts++; // Increment attempts
        guessesLeft--;
        guessesElement.textContent = guessesLeft;
        // Don't add to guessedCountries in Easy mode - allow re-guessing
        if (window.currentMode !== 'easy') {
            guessedCountries.add(countryId);
        }
        
        // Check if we're in Easy mode for distance-based highlighting
        if (window.currentMode === 'easy') {
            const targetCenter = getCountryCenter(currentCountry);
            const guessCenter = getCountryCenter(countryName);
            
            if (targetCenter && guessCenter) {
                const distance = calculateDistance(targetCenter[0], targetCenter[1], guessCenter[0], guessCenter[1]);
                let greenIntensity;
                
                if (distance < 200) {
                    greenIntensity = 'very_close'; // Extremely close - very dark green
                    feedback.textContent = `Very close! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 500) {
                    greenIntensity = 'close'; // Very close - dark green
                    feedback.textContent = `Close! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 1000) {
                    greenIntensity = 'getting_warm'; // Getting warmer - medium-dark green
                    feedback.textContent = `Getting warmer! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 2000) {
                    greenIntensity = 'medium'; // Moderately close - medium green
                    feedback.textContent = `Not quite! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 4000) {
                    greenIntensity = 'light'; // Somewhat close - lighter green
                    feedback.textContent = `Getting colder! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 8000) {
                    greenIntensity = 'far'; // Far away - light green
                    feedback.textContent = `Far off! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                } else {
                    greenIntensity = 'very_far'; // Very far away - very light green
                    feedback.textContent = `Very far! That's ${countryName}. You're ${Math.round(distance)}km away!`;
                }
                
                feedback.className = 'feedback';
                
                // Apply distance-based green highlighting with more variations
                event.target.classList.add('incorrect');
                if (greenIntensity === 'very_close') {
                    event.target.style.fill = '#064e3b'; // emerald-900 - very dark green
                } else if (greenIntensity === 'close') {
                    event.target.style.fill = '#047857'; // emerald-800 - dark green
                } else if (greenIntensity === 'getting_warm') {
                    event.target.style.fill = '#059669'; // emerald-700 - medium-dark green
                } else if (greenIntensity === 'medium') {
                    event.target.style.fill = '#10b981'; // emerald-500 - medium green
                } else if (greenIntensity === 'light') {
                    event.target.style.fill = '#34d399'; // emerald-400 - light green
                } else if (greenIntensity === 'far') {
                    event.target.style.fill = '#6ee7b7'; // emerald-300 - lighter green
                } else {
                    event.target.style.fill = '#a7f3d0'; // emerald-200 - very light green
                }
                event.target.style.stroke = 'none';
                event.target.style.strokeWidth = '0';
                // Keep the green colors until the correct country is guessed
            } else {
                // Fallback for countries without coordinates - use light green
                feedback.textContent = `Wrong! That's ${countryName}. Try again!`;
                feedback.className = 'feedback';
                
                event.target.classList.add('incorrect');
                event.target.style.fill = '#A7F3D0'; // Light green for fallback
                event.target.style.stroke = 'none';
                event.target.style.strokeWidth = '0';
                // Keep the green color until correct country is guessed
            }
        } else {
            // Normal mode (Medium/Hard)
            feedback.textContent = `Wrong! That's ${countryName}. Try again!`;
            feedback.className = 'feedback incorrect';
            
            // Fill the wrong country with polished red temporarily (no border)
            event.target.classList.add('incorrect');
            event.target.style.fill = '#EF4444';
            event.target.style.stroke = 'none';
            event.target.style.strokeWidth = '0';
            setTimeout(() => {
                event.target.classList.remove('incorrect');
                event.target.style.fill = '#F5F5DC'; // Beige color for countries
                event.target.style.stroke = '#8B7355';
                event.target.style.strokeWidth = '1';
            }, 1000);
        }
        
        if (guessesLeft <= 0) {
            feedback.textContent = `Game Over! The correct answer was ${currentCountry}.`;
            feedback.className = 'feedback game-over';
            
                    // Fill the correct country with polished green
        const correctPath = document.getElementById(Object.keys(countryNames).find(key => countryNames[key] === currentCountry));
        if (correctPath) {
            correctPath.classList.add('correct');
            correctPath.style.fill = '#10B981';
            correctPath.style.stroke = 'none';
            correctPath.style.strokeWidth = '0';
        }
            
            endRound();
        }
    }
}

// Handle country hover
function handleCountryHover(event) {
    if (!gameActive || isPaused) return;
    const path = event.target;
    if (path.classList.contains('correct') || path.classList.contains('incorrect')) return;
    // Fill-only hover highlight to avoid showing internal borders
    // Use bright white for satellite view, bright blue for regular map
    const hoverColor = (realMapActive && realBasemapType === 'sat') ? '#FFFFFF' : '#00BFFF';
    path.style.fill = hoverColor;
    path.style.stroke = 'none';
    path.style.strokeWidth = '0';
}

// Handle country leave
function handleCountryLeave(event) {
    if (!gameActive || isPaused) return;
    
    // Only reset if the country hasn't been selected
    if (!event.target.classList.contains('correct') && !event.target.classList.contains('incorrect')) {
        setCountryDefaultStyle(event.target);
    }
}

// (click triggers guesses; hover is visual only)

// Start game
async function startGame() {
    gameActive = true;
    countriesGuessed = 0;
    if (realMapActive) {
        await ensureLeafletCountries();
        // Apply Easy mode restrictions after map is loaded
        if (typeof applyEasyModeRestrictions === 'function') {
            applyEasyModeRestrictions();
        }
        let filteredCountries = leafletCountryNames;
        
        if (window.geogameContinentFilter) {
            const region = window.geogameContinentFilter;
            filteredCountries = filteredCountries.filter(n => isNameInRegion(n, region));
        }
        
        if (window.currentMode === 'easy') {
            filteredCountries = filteredCountries.filter(name => easyCountries.includes(name));
        }
        
        totalCountries = filteredCountries.length;
        console.log(`Real map active. Total countries: ${totalCountries}`);
        console.log(`Leaflet country names:`, leafletCountryNames.slice(0, 10)); // Show first 10 for debugging
    } else {
        let filteredCountries = availableCountries;
        
        if (window.geogameContinentFilter) {
            const region = window.geogameContinentFilter;
            filteredCountries = filteredCountries.filter(id => isNameInRegion(countryNames[id], region));
        }
        
        if (window.currentMode === 'easy') {
            filteredCountries = filteredCountries.filter(id => easyCountries.includes(countryNames[id]));
        }
        
        totalCountries = filteredCountries.length;
        console.log(`SVG map active. Total countries: ${totalCountries}`);
    }
    guessesLeft = (window.maxGuesses || 3);
    guessedCountries.clear();
    attempts = 0; // Reset attempts for new country
    resetTimer();
    startTimer();
    
    countriesGuessedElement.textContent = countriesGuessed;
    totalCountriesElement.textContent = totalCountries;
    guessesElement.textContent = guessesLeft;
    
    startBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    
    // Clear any previous highlighting when starting a new game
    resetAllCountryColors();
    
    nextCountry();
}

// Next country
function nextCountry() {
    // Build the unguessed list depending on mode
    let candidates;
    if (realMapActive) {
        candidates = leafletCountryNames.filter(name => !guessedCountries.has(name));
    } else {
        candidates = availableCountries.filter(countryId => !guessedCountries.has(countryId));
    }

    if (window.geogameContinentFilter) {
        const region = window.geogameContinentFilter;
        if (realMapActive) {
            candidates = candidates.filter(n => isNameInRegion(n, region));
        } else {
            candidates = candidates.filter(id => isNameInRegion(countryNames[id], region));
        }
    }

    // Filter for easy countries in Easy mode
    if (window.currentMode === 'easy') {
        if (realMapActive) {
            candidates = candidates.filter(name => easyCountries.includes(name));
        } else {
            candidates = candidates.filter(id => easyCountries.includes(countryNames[id]));
        }
    }

    if (candidates.length === 0) {
        if (window.geogameContinentFilter) {
            prompt.textContent = `No countries available for ${window.geogameContinentFilter}.`;
            feedback.textContent = `Select another continent or World Map.`;
        } else {
            prompt.textContent = `Congratulations! You've completed all ${totalCountries} countries!`;
            feedback.textContent = `Final Score: ${countriesGuessed} out of ${totalCountries} countries guessed correctly!`;
        }
        feedback.className = 'feedback correct';
        gameActive = false;
        nextBtn.textContent = 'Play Again';
        return;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    if (realMapActive) {
        currentCountry = candidates[randomIndex]; // name
        window.currentCountry = currentCountry;
    } else {
        const countryId = candidates[randomIndex];
        currentCountry = countryNames[countryId];
        window.currentCountry = currentCountry;
    }

    prompt.textContent = `Find: ${currentCountry}`;
    guessesLeft = (window.maxGuesses || 3);
    attempts = 0; // Reset attempts for new country
    guessesElement.textContent = guessesLeft;
    feedback.textContent = '';
    feedback.className = 'feedback';
    
    // Clear Easy mode green highlighting for new country
    if (window.currentMode === 'easy') {
        if (realMapActive) {
            // Clear all incorrect highlighting on Leaflet
            leafletCountryState.forEach((state, name) => {
                if (state === 'incorrect') {
                    leafletCountryState.set(name, undefined);
                    const layer = countryNameToLeafletLayer.get(name);
                    if (layer) {
                        layer.setStyle(defaultLeafletCountryStyle());
                    }
                }
            });
        } else {
            // Clear all incorrect highlighting on SVG
            document.querySelectorAll('.country.incorrect').forEach(path => {
                path.classList.remove('incorrect');
                setCountryDefaultStyle(path);
            });
        }
    }

    // Clear Hard mode marker if present
    if (hardGuessMarker && typeof leafletMap !== 'undefined' && leafletMap) {
        leafletMap.removeLayer(hardGuessMarker);
        hardGuessMarker = null;
    }
    if (hardGuessLine && typeof leafletMap !== 'undefined' && leafletMap) {
        leafletMap.removeLayer(hardGuessLine);
        hardGuessLine = null;
    }
    if (hardTargetCircle && typeof leafletMap !== 'undefined' && leafletMap) {
        leafletMap.removeLayer(hardTargetCircle);
        hardTargetCircle = null;
    }
    if (easyArrowLine && typeof leafletMap !== 'undefined' && leafletMap) {
        leafletMap.removeLayer(easyArrowLine);
        easyArrowLine = null;
    }
    if (easyArrowMarker && typeof leafletMap !== 'undefined' && leafletMap) {
        leafletMap.removeLayer(easyArrowMarker);
        easyArrowMarker = null;
    }

    // If Hard mode is active, arm the GPS one-guess click handler
    if (window.currentMode === 'hard' && typeof leafletMap !== 'undefined' && leafletMap) {
        activateHardModeGuess();
    }
}

// End round
function endRound() {
    gameActive = false;
    // Don't stop timer - let it continue running
    // stopTimer();
    
    // Check if all countries have been guessed
    const unguessedCountries = availableCountries.filter(countryId => !guessedCountries.has(countryId));
    if (unguessedCountries.length === 0) {
        nextBtn.textContent = 'Next Country';
    } else {
        nextBtn.textContent = 'Next Country';
    }
}

// Map controls
function zoomIn() {
    if (realMapActive && leafletMap) {
        leafletMap.zoomIn();
        return;
    }
    const newScale = Math.min(scale * 1.5, 80);
    if (newScale !== scale) zoomToScale(newScale);
}

function zoomOut() {
    if (realMapActive && leafletMap) {
        leafletMap.zoomOut();
        return;
    }
    const newScale = Math.max(scale / 1.8, 0.6);
    if (newScale !== scale) zoomToScale(newScale);
}

function resetView() {
    if (realMapActive && leafletMap) {
        leafletMap.setView([20, 0], 2);
    } else {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateMapTransform();
        if (originalViewBox) {
            worldMap.setAttribute('viewBox', originalViewBox);
        }
    }
    if (gameActive) {
        guessesLeft = (window.maxGuesses || 3);
        guessesElement.textContent = guessesLeft;
        
        // Reset all correctly guessed countries
        guessedCountries.clear();
        countriesGuessed = 0;
        countriesGuessedElement.textContent = countriesGuessed;
        
        if (realMapActive) {
            // Clear all highlighting on Leaflet (both correct and incorrect)
            leafletCountryState.forEach((state, name) => {
                leafletCountryState.set(name, undefined);
            });
            applyLeafletCountryStyles();
        } else {
            // Clear all highlighting on SVG (both correct and incorrect)
            document.querySelectorAll('.country.correct, .country.incorrect').forEach(path => {
                path.classList.remove('correct', 'incorrect');
                setCountryDefaultStyle(path);
            });
        }
        
        // Clear target country highlighting
        currentCountry = null;
        window.currentCountry = null;
        // Remove hard mode marker
        if (hardGuessMarker && typeof leafletMap !== 'undefined' && leafletMap) {
            leafletMap.removeLayer(hardGuessMarker);
            hardGuessMarker = null;
        }
        if (hardGuessLine && typeof leafletMap !== 'undefined' && leafletMap) {
            leafletMap.removeLayer(hardGuessLine);
            hardGuessLine = null;
        }
        if (hardTargetCircle && typeof leafletMap !== 'undefined' && leafletMap) {
            leafletMap.removeLayer(hardTargetCircle);
            hardTargetCircle = null;
        }
        if (easyArrowLine && typeof leafletMap !== 'undefined' && leafletMap) {
            leafletMap.removeLayer(easyArrowLine);
            easyArrowLine = null;
        }
        if (easyArrowMarker && typeof leafletMap !== 'undefined' && leafletMap) {
            leafletMap.removeLayer(easyArrowMarker);
            easyArrowMarker = null;
        }
        nextCountry();
    }
}

function zoomToScale(newScale, mouseX = null, mouseY = null) {
    const oldScale = scale;
    
    if (mouseX !== null && mouseY !== null) {
        // Get the mouse position relative to the map wrapper
        const rect = mapWrapper.getBoundingClientRect();
        const mouseXRelative = mouseX - rect.left;
        const mouseYRelative = mouseY - rect.top;
        
        // Calculate the mouse position in the untransformed coordinate system
        const mouseXUntransformed = (mouseXRelative - translateX) / oldScale;
        const mouseYUntransformed = (mouseYRelative - translateY) / oldScale;
        
        // Calculate new translation to keep the mouse point fixed
        scale = newScale;
        translateX = mouseXRelative - mouseXUntransformed * scale;
        translateY = mouseYRelative - mouseYUntransformed * scale;
    } else {
        scale = newScale;
    }
    
    updateMapTransform();
}

function updateViewBox() {
    if (!originalViewBox) return;
    
    const [x, y, width, height] = originalViewBox.split(' ').map(Number);
    const newWidth = width / scale;
    const newHeight = height / scale;
    const newX = x - (translateX / scale);
    const newY = y - (translateY / scale);
    
    worldMap.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
}

function updateMapTransform() {
    // Use viewBox for crisp zooming instead of CSS transforms
    updateViewBox();
    
    // Keep minimal CSS transform for smooth transitions
    if (!isDragging) {
        worldMap.style.transition = 'transform 0.1s ease-out';
    } else {
        worldMap.style.transition = 'none';
    }
    
    // Use minimal transform for fine adjustments
    const fineTranslateX = translateX % 1;
    const fineTranslateY = translateY % 1;
    worldMap.style.transform = `translate(${fineTranslateX}px, ${fineTranslateY}px)`;
    
    // Remove transition after animation completes
    if (!isDragging) {
        setTimeout(() => {
            worldMap.style.transition = '';
        }, 100);
    }
}

// Mode switching
function applyMapModeStyles() {
    // legacy SVG styles only; real basemap modes handled by Leaflet
    // Update default, but keep explicit styles for correct/incorrect
    document.querySelectorAll('#worldMap .country').forEach(path => {
        if (!path.classList.contains('correct') && !path.classList.contains('incorrect')) {
            setCountryDefaultStyle(path);
        }
    });
}

function setCountryDefaultStyle(path) {
    path.style.fill = '#F5F5DC';
    path.style.stroke = 'none';
    path.style.strokeWidth = '0';
}

// Mouse controls for panning
function handleMouseDown(event) {
    if (realMapActive) return;
    if (event.target.classList.contains('country')) return;
    
    isDragging = true;
    dragStartX = event.clientX - translateX;
    dragStartY = event.clientY - translateY;
    mapWrapper.style.cursor = 'grabbing';
    
    // Disable transitions during dragging for better performance
    worldMap.style.transition = 'none';
}

function handleMouseMove(event) {
    if (realMapActive) return;
    if (!isDragging) return;
    
    translateX = event.clientX - dragStartX;
    translateY = event.clientY - dragStartY;
    updateMapTransform();
}

function handleMouseUp() {
    if (realMapActive) return;
    isDragging = false;
    mapWrapper.style.cursor = 'grab';
    
    // Re-enable transitions after dragging
    worldMap.style.transition = 'transform 0.1s ease-out';
}

// Wheel zoom
function handleWheel(event) {
    if (!realMapActive) {
        event.preventDefault();
        if (isZooming) return;
        isZooming = true;
        const delta = event.deltaY > 0 ? 0.80 : 1.15;
        const newScale = Math.max(0.6, Math.min(80, scale * delta));
        zoomToScale(newScale, event.clientX, event.clientY);
        setTimeout(() => { isZooming = false; }, 20);
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', () => {
    if (gameActive) {
        endRound();
    } else {
        if (nextBtn.textContent === 'Play Again') {
            // Reset the game completely
            startGame();
        } else {
            gameActive = true;
            nextCountry();
        }
    }
});

zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
resetViewBtn.addEventListener('click', resetView);

// Map interaction events
mapWrapper.addEventListener('mousedown', handleMouseDown);
mapWrapper.addEventListener('mousemove', handleMouseMove);
mapWrapper.addEventListener('mouseup', handleMouseUp);
mapWrapper.addEventListener('mouseleave', handleMouseUp);
mapWrapper.addEventListener('wheel', handleWheel);

// Prevent context menu on map
mapWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

// Reset all country colors to default
function resetAllCountryColors() {
    const countryPaths = document.querySelectorAll('.country');
    countryPaths.forEach(path => {
        path.classList.remove('correct', 'incorrect');
        path.style.fill = '#F5F5DC';
        path.style.stroke = 'none';
        path.style.strokeWidth = '0';
    });
}

// Initialize
// Start with Real Map active by default; hide SVG and show tiles
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for continent selection
    continentOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const continent = e.currentTarget.getAttribute('data-continent');
            window.geogameContinentFilter = continent;
            scopeLabel.textContent = continent;
            
            // Focus map to the selected continent when game starts
            document.querySelectorAll('#modeView .btn-mode').forEach(modeBtn => {
                modeBtn.addEventListener('click', () => {
                    if (window.geogameContinentFilter && typeof focusMapToRegion === 'function') {
                        setTimeout(() => {
                            focusMapToRegion(window.geogameContinentFilter);
                        }, 300);
                    }
                }, { once: true });
            });
        });
    });
    
    // Add event listener for World Map button to reset continent filter
    document.getElementById('btnWorldMap').addEventListener('click', () => {
        window.geogameContinentFilter = null;
        scopeLabel.textContent = 'World Map';
        
        // Reset map view when selecting World Map
        document.querySelectorAll('#modeView .btn-mode').forEach(modeBtn => {
            modeBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (leafletMap) {
                        leafletMap.setView([20, 0], 2);
                        leafletMap.setMinZoom(2);
                        leafletMap.setMaxBounds([[-90, -180], [90, 180]]);
                    }
                }, 300);
            }, { once: true });
        });
    });
    
    // Add event listener for Change Scope button
    document.getElementById('changeScope').addEventListener('click', () => {
        document.getElementById('gameView').style.display = 'none';
        document.getElementById('playMenuView').style.display = 'flex';
    });
    
    showRealBasemap('map');
});
// Real basemap integration (Leaflet)
function ensureLeafletMap() {
    if (leafletMap) return;
    const leafletContainer = document.getElementById('leafletMap');
    leafletContainer.style.display = 'block';
    leafletMap = L.map('leafletMap', {
        zoomControl: false,
        attributionControl: false,
        center: [20, 0],
        zoom: 2,
        preferCanvas: true, // faster vector rendering
        wheelDebounceTime: 20,
        wheelPxPerZoomLevel: 80
    });
    // Real map: CARTO Light (no labels) for a clean normal map without labels
    leafletLayers.streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 19
    });
    // Satellite: Esri World Imagery
    leafletLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    });
}

function showRealBasemap(type) {
    // Save current game score before switching map types
    if (gameActive && window.currentMode && typeof saveCurrentGameScore === 'function') {
        saveCurrentGameScore();
    }
    
    ensureLeafletMap();
    realMapActive = true;
    realBasemapType = type === 'sat' ? 'sat' : 'map';
    // Display leaflet under SVG
    const leafletDiv = document.getElementById('leafletMap');
    leafletDiv.style.display = 'block';
    // Hide SVG entirely to avoid misalignment
    worldMap.style.display = 'none';
    // Switch base layers
    if (leafletMap.hasLayer(leafletLayers.streets)) leafletMap.removeLayer(leafletLayers.streets);
    if (leafletMap.hasLayer(leafletLayers.satellite)) leafletMap.removeLayer(leafletLayers.satellite);
    if (type === 'sat') {
        // Satellite imagery, no labels
        leafletLayers.satellite.addTo(leafletMap);
        leafletDiv.style.background = '';
        // Add satellite class to map wrapper for CSS styling
        mapWrapper.classList.add('satellite');
    } else {
        // Streets basemap (no labels) restored
        leafletLayers.streets.addTo(leafletMap);
        leafletDiv.style.background = '';
        // Remove satellite class from map wrapper
        mapWrapper.classList.remove('satellite');
    }
    // Ensure continent coastlines are visible (no internal borders)
    ensureContinentOutlines();
    ensureLeafletCountries();
    applyLeafletCountryStyles();
    // Update total countries display for real map without mutating SVG country list
    if (!gameActive) {
        totalCountries = leafletCountryNames.length;
        totalCountriesElement.textContent = totalCountries;
    }
}

function hideRealBasemap() {
    realMapActive = false;
    const leafletContainer = document.getElementById('leafletMap');
    leafletContainer.style.display = 'none';
    realBasemapType = null;
    // Remove satellite class when hiding real basemap
    mapWrapper.classList.remove('satellite');
    // Show SVG again
    worldMap.style.display = 'block';
}

// Hook buttons
realMapBtn.addEventListener('click', () => showRealBasemap('map'));
realSatBtn.addEventListener('click', () => showRealBasemap('sat'));

// Helper to get a consistent country name field across datasets
function extractFeatureName(feature) {
    const p = feature.properties || {};
    return p.name || p.NAME || p.ADMIN || p.admin || p.Country || p.country || 'Unknown';
}

// Load and draw GeoJSON countries on Leaflet (prefers real borders, falls back to local)
async function ensureLeafletCountries() {
    if (leafletCountryLayer) return;
    const candidateUrls = [
        // Prefer robust, real borders to avoid boxy country shapes
        'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
        // Local simplified file only as a last resort
        'world-countries.json'
    ];

    let data = null;
    for (const url of candidateUrls) {
        try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) continue;
            const json = await resp.json();
            if (!json || !Array.isArray(json.features) || json.features.length === 0) continue;
            data = json;
            break;
        } catch (_) {
            // try next
        }
    }
    if (!data) {
        console.error('Failed to load any GeoJSON source for country borders');
        return;
    }

    // Filter out non-country territories and disputed regions
    const excludedTerritories = [
        'Southern Patagonian Ice Field', 'Spratly Islands', 'Bir Tawil', 'Somaliland',
        'Serranilla Bank', 'Siachen Glacier', 'Brazilian Island',
        'Coral Islands', 'Baykonur Cosmodrome', 'Southern Reef',
        'Dhekelia Sovereign Base Area', 'Akrotiri Sovereign Base Area',
        'Bajo Nuevo Bank (Petrel Is.)', 'Bajo Nuevo Bank',
        'Clipperton Island', 'Scarborough Reef', 'United States Minor Outlying Islands'
    ];
    // Also exclude non-country military bases (exact match only in filter below)
    excludedTerritories.push('US Naval Base Guantanamo Bay');
    excludedTerritories.push('Guantanamo Bay Naval Base');
    excludedTerritories.push('Guantánamo Bay Naval Base');

    // Filter features to only include recognized sovereign countries
    const filteredFeatures = data.features.filter(feature => {
        const name = extractFeatureName(feature);
        
        // Skip features with no name
        if (!name || name === 'Unknown') {
            return false;
        }
        
        // Exclude specific territories and disputed regions (exact match only)
        if (excludedTerritories.some(territory => 
            name.trim().toLowerCase() === territory.trim().toLowerCase()
        )) {
            return false;
        }
        
        // Special handling for Cyprus - only include exact 'Cyprus'
        if (name && name.toLowerCase().includes('cyprus')) {
            return name.trim().toLowerCase() === 'cyprus';
        }
        
        // More lenient filtering: only exclude features with clearly invalid ISO codes
        const properties = feature.properties || {};
        const isoCode = properties.iso_a2 || properties.ISO3166_1_Alpha_2 || properties.iso_a3 || properties.ISO3166_1_Alpha_3;
        
        // Only exclude features with clearly invalid ISO codes, not missing ones
        if (isoCode === '-99' || isoCode === 'XX' || isoCode === 'ZZ') {
            return false;
        }
        
        return true;
    });

    // Debug logging
    console.log(`Total features loaded: ${data.features.length}`);
    console.log(`Features after filtering: ${filteredFeatures.length}`);
    
    // Check if Cyprus is in the filtered results
    const cyprusInFiltered = filteredFeatures.some(f => extractFeatureName(f).toLowerCase() === 'cyprus');
    console.log(`Cyprus found in filtered results: ${cyprusInFiltered}`);
    
    if (filteredFeatures.length === 0) {
        console.warn('No countries found after filtering. Using unfiltered data.');
        // Fallback to using all features if filtering is too aggressive
        leafletCountryNames = data.features.map(f => extractFeatureName(f)).filter(name => name && name !== 'Unknown');
    } else {
        leafletCountryNames = filteredFeatures.map(f => extractFeatureName(f));
    }
    
    // Log the final country list to verify Cyprus is included
    console.log(`Final country count: ${leafletCountryNames.length}`);
    console.log(`Cyprus in final list: ${leafletCountryNames.includes('Cyprus')}`);
    
    // Ensure Cyprus is included if it exists in the original data
    const originalCyprus = data.features.find(f => extractFeatureName(f).toLowerCase() === 'cyprus');
    if (originalCyprus && !leafletCountryNames.includes('Cyprus')) {
        console.log('Adding Cyprus back to the country list');
        leafletCountryNames.push('Cyprus');
    }

    // Remove existing layer if present to allow region-specific rebuilds
    if (leafletCountryLayer && typeof leafletMap !== 'undefined' && leafletMap) {
        try { leafletMap.removeLayer(leafletCountryLayer); } catch(_) {}
        leafletCountryLayer = null;
        countryNameToLeafletLayer.clear();
    }

    // Apply continent filter to features if selected
    let displayFeatures = filteredFeatures.length > 0 ? filteredFeatures : data.features;
    if (window.geogameContinentFilter) {
        const region = window.geogameContinentFilter;
        displayFeatures = displayFeatures.filter(f => isNameInRegion(extractFeatureName(f), region));
    }

    // Build the country layer with crisper borders at high zoom
    leafletCountryLayer = L.geoJSON(displayFeatures, {
        style: () => defaultLeafletCountryStyle(),
        smoothFactor: 0.1,
        onEachFeature: (feature, layer) => {
            const name = extractFeatureName(feature);
            countryNameToLeafletLayer.set(name, layer);
            
            // Only make countries clickable if they're in the easy list (Easy mode) or all countries (other modes)
            if (window.currentMode !== 'easy' || easyCountries.includes(name)) {
                layer.on('click', () => handleLeafletCountryClick(name, layer));
            }
            
            // Only add hover effects for easy countries in Easy mode
            if (window.currentMode !== 'easy' || easyCountries.includes(name)) {
                layer.on('mouseover', () => handleLeafletCountryHover(name, layer));
                layer.on('mouseout', () => handleLeafletCountryOut(name, layer));
            }
        }
    }).addTo(leafletMap);
    
    // Apply Easy mode restrictions if needed
    applyEasyModeRestrictions();
}

// Function to apply Easy mode restrictions to existing Leaflet map
function applyEasyModeRestrictions() {
    if (!leafletCountryLayer || !leafletMap) return;
    
    // Remove all existing event listeners and re-add them based on current mode
    leafletCountryLayer.eachLayer((layer) => {
        const name = extractFeatureName(layer.feature);
        
        // Remove all existing event listeners
        layer.off('click');
        layer.off('mouseover');
        layer.off('mouseout');
        
        // Only make countries clickable if they're in the easy list (Easy mode) or all countries (other modes)
        if (window.currentMode !== 'easy' || easyCountries.includes(name)) {
            layer.on('click', () => handleLeafletCountryClick(name, layer));
        }
        
        // Only add hover effects for easy countries in Easy mode
        if (window.currentMode !== 'easy' || easyCountries.includes(name)) {
            layer.on('mouseover', () => handleLeafletCountryHover(name, layer));
            layer.on('mouseout', () => handleLeafletCountryOut(name, layer));
        }
    });
}


function defaultLeafletCountryStyle() {
    // Visible by default: subtle outline and faint fill
    return {
        color: '#10B981',
        weight: 1,
        opacity: 0.6,
        fillColor: '#A7F3D0',
        fillOpacity: 0.08,
        fillRule: 'evenodd'
    };
}

function applyLeafletCountryStyles() {
    if (!leafletCountryLayer) return;
    leafletCountryLayer.eachLayer(layer => {
        const name = layer.feature.properties.name;
        const state = leafletCountryState.get(name);
        if (state === 'correct') {
            // fill entire country for correct answer, no border
            layer.setStyle({ 
                color: 'transparent', 
                weight: 0, 
                opacity: 0, 
                fillColor: '#10B981', 
                fillOpacity: 0.85,
                fillRule: 'evenodd'
            }); // Polished green for correct
        } else if (state === 'incorrect') {
            // fill entire country for incorrect (temporary), no border
            layer.setStyle({ 
                color: 'transparent', 
                weight: 0, 
                opacity: 0, 
                fillColor: '#EF4444', 
                fillOpacity: 0.85,
                fillRule: 'evenodd'
            }); // Polished red for incorrect
        } else {
            // default: subtle outline and faint fill to keep countries visible
            layer.setStyle({ 
                color: '#10B981',
                weight: 1,
                opacity: 0.6,
                fillColor: '#A7F3D0',
                fillOpacity: 0.08,
                fillRule: 'evenodd'
            });
        }
    });
}

function handleLeafletCountryHover(name, layer) {
    if (!gameActive || isPaused) return;
    const state = leafletCountryState.get(name);
    if (state === 'correct' || state === 'incorrect') return;
    // Keep outlines visible and strengthen them on hover
    const outlineColor = '#065F46'; // darker emerald for visibility
    const fillHover = realBasemapType === 'sat' ? '#FFFFFF' : '#A7F3D0';
    const fillOpacity = realBasemapType === 'sat' ? 0.25 : 0.2;
    layer.setStyle({
        color: outlineColor,
        weight: 2,
        opacity: 0.9,
        fillColor: fillHover,
        fillOpacity: fillOpacity,
        fillRule: 'evenodd'
    });
}

function handleLeafletCountryOut(name, layer) {
    if (!gameActive || isPaused) return;
    const state = leafletCountryState.get(name);
    if (state === 'correct' || state === 'incorrect') return;
    // Restore subtle outlines after hover
    layer.setStyle(defaultLeafletCountryStyle());
}

function handleLeafletCountryClick(name, layer) {
    if (!gameActive || isPaused) return;
    if (guessedCountries.has(name) && window.currentMode !== 'easy') {
        // Don't allow re-guessing - just return silently (except in Easy mode)
        return;
    }
    if (name === currentCountry) {
        attempts++; // Increment attempts
        countriesGuessed++;
        countriesGuessedElement.textContent = countriesGuessed;
        guessedCountries.add(name);
        feedback.textContent = `Correct! ${name} is the right answer!`;
        feedback.className = 'feedback correct';
        leafletCountryState.set(name, 'correct');
        layer.setStyle({ 
            color: 'transparent', 
            weight: 0, 
            opacity: 0, 
            fillColor: '#22c55e', // Bright green for correct guess
            fillOpacity: 0.9,
            fillRule: 'evenodd'
        });
        // Show success popup
        showSuccessPopup(name, attempts);
        endRound();
    } else {
        attempts++; // Increment attempts
        guessesLeft--;
        guessesElement.textContent = guessesLeft;
        // Don't add to guessedCountries in Easy mode - allow re-guessing
        if (window.currentMode !== 'easy') {
            guessedCountries.add(name);
        }

        if (window.currentMode === 'easy') {
            // Easy mode: distance-based green intensity
            const targetCenter = getCountryCenter(currentCountry);
            const guessCenter = getCountryCenter(name);
            if (targetCenter && guessCenter) {
                const distance = calculateDistance(targetCenter[0], targetCenter[1], guessCenter[0], guessCenter[1]);
                let fillOpacity, fillColor;
                
                if (distance < 200) {
                    fillOpacity = 0.95; fillColor = '#064e3b'; feedback.textContent = `Very close! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 500) {
                    fillOpacity = 0.95; fillColor = '#047857'; feedback.textContent = `Close! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 1000) {
                    fillOpacity = 0.9; fillColor = '#059669'; feedback.textContent = `Getting warmer! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 2000) {
                    fillOpacity = 0.8; fillColor = '#10b981'; feedback.textContent = `Not quite! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 4000) {
                    fillOpacity = 0.7; fillColor = '#34d399'; feedback.textContent = `Getting colder! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else if (distance < 8000) {
                    fillOpacity = 0.6; fillColor = '#6ee7b7'; feedback.textContent = `Far off! That's ${name}. You're ${Math.round(distance)}km away!`;
                } else {
                    fillOpacity = 0.5; fillColor = '#a7f3d0'; feedback.textContent = `Very far! That's ${name}. You're ${Math.round(distance)}km away!`;
                }
                
                feedback.className = 'feedback';
                leafletCountryState.set(name, 'incorrect');
                layer.setStyle({ color: 'transparent', weight: 0, opacity: 0, fillColor, fillOpacity, fillRule: 'evenodd' });
                // Keep the green colors until correct country is guessed
            } else {
                // Fallback for countries without coordinates - use light green
                feedback.textContent = `Wrong! That's ${name}. Try again!`;
                feedback.className = 'feedback';
                leafletCountryState.set(name, 'incorrect');
                layer.setStyle({ color: 'transparent', weight: 0, opacity: 0, fillColor: '#A7F3D0', fillOpacity: 0.5, fillRule: 'evenodd' });
            }
        } else {
            // Medium mode fallback
            feedback.textContent = `Wrong! That's ${name}. Try again!`;
            feedback.className = 'feedback incorrect';
            leafletCountryState.set(name, 'incorrect');
            layer.setStyle({ color: 'transparent', weight: 0, opacity: 0, fillColor: '#EF4444', fillOpacity: 0.65, fillRule: 'evenodd' });
        }
        // If guesses exhausted
        if (guessesLeft <= 0) {
            guessesLeft = 0;
            guessesElement.textContent = guessesLeft;
            feedback.textContent = `Game Over! The correct answer was ${currentCountry}.`;
            feedback.className = 'feedback game-over';
        }
    }
}

// Centralized guess for real map (hover-based)
// (click triggers guesses; hover is visual only)

// Timer helpers
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        if (!isPaused) {
            elapsedSeconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
}

// Continent outlines (disabled - no outlines shown)
async function ensureContinentOutlines() {
    // Function disabled - no continent outlines will be shown
    // This removes the coastline borders from both real map and satellite views
    return;
}

// Distance calculation functions
function getCountryCenter(countryName) {
    // Country center coordinates (approximate)
    const countryCenters = {
        'United States': [39.8283, -98.5795], 'Canada': [56.1304, -106.3468], 'Mexico': [23.6345, -102.5528],
        'Brazil': [-14.2350, -51.9253], 'Argentina': [-38.4161, -63.6167], 'Chile': [-35.6751, -71.5430],
        'Peru': [-9.1900, -75.0152], 'Colombia': [4.5709, -74.2973], 'Venezuela': [6.4238, -66.5897],
        'Ecuador': [-1.8312, -78.1834], 'Bolivia': [-16.2902, -63.5887], 'Paraguay': [-23.4425, -58.4438],
        'Uruguay': [-32.5228, -55.7658], 'Guyana': [4.8604, -58.9302], 'Suriname': [3.9193, -56.0278],
        'French Guiana': [3.9339, -53.1258], 'Guatemala': [15.7835, -90.2308], 'Belize': [17.1899, -88.4976],
        'Honduras': [15.2000, -86.2419], 'El Salvador': [13.7942, -88.8965], 'Nicaragua': [12.8654, -85.2072],
        'Costa Rica': [9.7489, -83.7534], 'Panama': [8.5380, -80.7821], 'Cuba': [21.5218, -77.7812],
        'Jamaica': [18.1096, -77.2975], 'Haiti': [18.9712, -72.2852], 'Dominican Republic': [18.7357, -70.1627],
        'Bahamas': [25.0343, -77.3963], 'Trinidad and Tobago': [10.6918, -61.2225], 'Barbados': [13.1939, -59.5432],
        'Grenada': [12.2626, -61.6019], 'Saint Lucia': [13.9094, -60.9789], 'Saint Vincent and the Grenadines': [12.9843, -61.2872],
        'Antigua and Barbuda': [17.0608, -61.7964], 'Saint Kitts and Nevis': [17.3578, -62.7830], 'Dominica': [15.4150, -61.3710],
        'United Kingdom': [55.3781, -3.4360], 'France': [46.2276, 2.2137], 'Germany': [51.1657, 10.4515],
        'Italy': [41.8719, 12.5674], 'Spain': [40.4637, -3.7492], 'Portugal': [39.3999, -8.2245],
        'Netherlands': [52.1326, 5.2913], 'Belgium': [50.5039, 4.4699], 'Switzerland': [46.8182, 8.2275],
        'Austria': [47.5162, 14.5501], 'Poland': [51.9194, 19.1451], 'Czech Republic': [49.8175, 15.4730],
        'Slovakia': [48.6690, 19.6990], 'Hungary': [47.1625, 19.5033], 'Romania': [45.9432, 24.9668],
        'Bulgaria': [42.7339, 25.4858], 'Greece': [39.0742, 21.8243], 'Albania': [41.1533, 20.1683],
        'Macedonia': [41.6086, 21.7453], 'Serbia': [44.0165, 21.0059], 'Croatia': [45.1000, 15.2000],
        'Slovenia': [46.1512, 14.9955], 'Bosnia and Herzegovina': [43.9159, 17.6791], 'Montenegro': [42.7087, 19.3744],
        'Kosovo': [42.6026, 20.9030], 'Moldova': [47.4116, 28.3699], 'Ukraine': [48.3794, 31.1656],
        'Belarus': [53.7098, 27.9534], 'Lithuania': [55.1694, 23.8813], 'Latvia': [56.8796, 24.6032],
        'Estonia': [58.5953, 25.0136], 'Finland': [61.9241, 25.7482], 'Sweden': [60.1282, 18.6435],
        'Norway': [60.4720, 8.4689], 'Denmark': [56.2639, 9.5018], 'Iceland': [64.9631, -19.0208],
        'Ireland': [53.4129, -8.2439], 'Luxembourg': [49.8153, 6.1296], 'Liechtenstein': [47.1660, 9.5554],
        'Monaco': [43.7384, 7.4246], 'Andorra': [42.5462, 1.6016], 'San Marino': [43.9424, 12.4578],
        'Vatican City': [41.9029, 12.4534], 'Malta': [35.9375, 14.3754], 'Cyprus': [35.1264, 33.4299],
        'China': [35.8617, 104.1954], 'Japan': [36.2048, 138.2529], 'India': [20.5937, 78.9629],
        'South Korea': [35.9078, 127.7669], 'North Korea': [40.3399, 127.5101], 'Vietnam': [14.0583, 108.2772],
        'Thailand': [15.8700, 100.9925], 'Cambodia': [12.5657, 104.9910], 'Laos': [19.8563, 102.4955],
        'Myanmar': [21.9162, 95.9560], 'Malaysia': [4.2105, 101.9758], 'Singapore': [1.3521, 103.8198],
        'Indonesia': [-0.7893, 113.9213], 'Philippines': [12.8797, 121.7740], 'Brunei': [4.5353, 114.7277],
        'East Timor': [-8.8742, 125.7275], 'Mongolia': [46.8625, 103.8467], 'Kazakhstan': [48.0196, 66.9237],
        'Uzbekistan': [41.3775, 64.5853], 'Kyrgyzstan': [41.2044, 74.7661], 'Tajikistan': [38.8610, 71.2761],
        'Turkmenistan': [38.9697, 59.5563], 'Afghanistan': [33.9391, 67.7100], 'Pakistan': [30.3753, 69.3451],
        'Nepal': [28.3949, 84.1240], 'Bhutan': [27.5142, 90.4336], 'Bangladesh': [23.6850, 90.3563],
        'Sri Lanka': [7.8731, 80.7718], 'Maldives': [3.2028, 73.2207], 'Iran': [32.4279, 53.6880],
        'Iraq': [33.2232, 43.6793], 'Syria': [34.8021, 38.9968], 'Lebanon': [33.8547, 35.8623],
        'Jordan': [30.5852, 36.2384], 'Israel': [31.0461, 34.8516], 'Palestine': [31.9522, 35.2332],
        'Saudi Arabia': [23.8859, 45.0792], 'Yemen': [15.5527, 48.5164], 'Oman': [21.4735, 55.9754],
        'United Arab Emirates': [23.4241, 53.8478], 'Qatar': [25.3548, 51.1839], 'Kuwait': [29.3117, 47.4818],
        'Bahrain': [25.9304, 50.6378], 'Armenia': [40.0691, 45.0382], 'Azerbaijan': [40.1431, 47.5769],
        'Georgia': [42.3154, 43.3569], 'Turkey': [38.9637, 35.2433], 'Russia': [61.5240, 105.3188],
        'Egypt': [26.0975, 10.4515], 'Libya': [26.3351, 17.2283], 'Tunisia': [33.8869, 9.5375],
        'Algeria': [28.0339, 1.6596], 'Morocco': [31.7917, -7.0926], 'Mauritania': [21.0079, -10.9408],
        'Western Sahara': [24.2155, -12.8858], 'Sudan': [12.8628, 30.2176], 'South Sudan': [6.8770, 31.3070],
        'Ethiopia': [9.1450, 40.4897], 'Eritrea': [15.1794, 39.7823], 'Djibouti': [11.8251, 42.5903],
        'Somalia': [5.1521, 46.1996], 'Kenya': [-0.0236, 37.9062], 'Uganda': [1.3733, 32.2903],
        'Rwanda': [-1.9403, 29.8739], 'Burundi': [-3.3731, 29.9189], 'Tanzania': [-6.3690, 34.8888],
        'Malawi': [-13.2543, 34.3015], 'Zambia': [-13.1339, 27.8493], 'Zimbabwe': [-19.0154, 29.1549],
        'Botswana': [-22.3285, 24.6849], 'Namibia': [-22.9576, 18.4904], 'South Africa': [-30.5595, 22.9375],
        'Lesotho': [-29.6100, 28.2336], 'Eswatini': [-26.5225, 31.4659], 'Mozambique': [-18.6657, 35.5296],
        'Madagascar': [-18.7669, 46.8691], 'Mauritius': [-20.3484, 57.5522], 'Seychelles': [-4.6796, 55.4920],
        'Comoros': [-11.6455, 43.3333], 'Mayotte': [-12.8275, 45.1662], 'Réunion': [-21.1151, 55.5364],
        'Cape Verde': [16.5388, -24.0132], 'São Tomé and Príncipe': [0.1864, 6.6131], 'Equatorial Guinea': [1.6508, 10.2679],
        'Gabon': [-0.8037, 11.6094], 'Cameroon': [7.3697, 12.3547], 'Central African Republic': [6.6111, 20.9394],
        'Chad': [15.4542, 18.7322], 'Niger': [17.6078, 8.0817], 'Mali': [17.5707, -3.9962],
        'Burkina Faso': [12.2383, -1.5616], 'Senegal': [14.4974, -14.4524], 'Gambia': [13.4432, -15.3101],
        'Guinea-Bissau': [11.8037, -15.1804], 'Guinea': [9.6412, -9.6966], 'Sierra Leone': [8.4606, -11.7799],
        'Liberia': [6.4281, -9.4295], 'Ivory Coast': [7.5400, -5.5471], 'Ghana': [7.9465, -1.0232],
        'Togo': [8.6195, 0.8248], 'Benin': [9.3077, 2.3158], 'Nigeria': [9.0820, 8.6753],
        'Australia': [-25.2744, 133.7751], 'New Zealand': [-40.9006, 174.8860], 'Papua New Guinea': [-6.3150, 143.9555],
        'Fiji': [-16.5788, 179.4144], 'Solomon Islands': [-9.6457, 160.1562], 'Vanuatu': [-15.3767, 166.9592],
        'New Caledonia': [-20.9043, 165.6180], 'Samoa': [-13.7590, -172.1046], 'Tonga': [-21.1789, -175.1982],
        'Kiribati': [-3.3704, -168.7340], 'Tuvalu': [-7.1095, 177.6493], 'Nauru': [-0.5228, 166.9315],
        'Palau': [7.5150, 134.5825], 'Micronesia': [7.4256, 150.5508], 'Marshall Islands': [7.1315, 171.1845],
        'Cook Islands': [-21.2367, -159.7777], 'French Polynesia': [-17.6797, -149.4068], 'Wallis and Futuna': [-13.7689, -177.1561],
        'Norfolk Island': [-29.0408, 167.9547], 'Christmas Island': [-10.4475, 105.6904], 'Cocos Islands': [-12.1642, 96.8710],
        'Heard Island': [-53.0818, 73.5042], 'Macquarie Island': [-54.5000, 158.9400], 'Bouvet Island': [-54.4208, 3.3464],
        'South Georgia': [-54.4296, -36.5879], 'Falkland Islands': [-51.7963, -59.5236], 'Antarctica': [-75.2509, -0.0713],
        'Greenland': [71.7069, -42.6043]
    };
    return countryCenters[countryName] || null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Success popup functionality
async function showSuccessPopup(countryName, attempts) {
    const modal = document.getElementById('successModal');
    const attemptsEl = document.getElementById('successAttempts');
    const capitalEl = document.getElementById('successCapital');
    const flagEl = document.getElementById('successFlag');
    const factEl = document.getElementById('successFact');
    
    // Set attempts
    attemptsEl.textContent = attempts;
    
    // Fetch country info
    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
        const data = await response.json();
        const country = data[0];
        
        if (country) {
            // Set capital
            const capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
            capitalEl.textContent = capital || 'Unknown';
            
            // Set flag
            if (country.flags && (country.flags.svg || country.flags.png)) {
                flagEl.src = country.flags.svg || country.flags.png;
                flagEl.style.display = 'block';
            } else {
                flagEl.style.display = 'none';
            }
            
            // Set cool fact
            const fact = getCoolFact(countryName, country);
            factEl.textContent = fact;
        } else {
            capitalEl.textContent = 'Unknown';
            flagEl.style.display = 'none';
            factEl.textContent = 'This country has a rich cultural heritage!';
        }
    } catch (error) {
        console.error('Error fetching country info:', error);
        capitalEl.textContent = 'Unknown';
        flagEl.style.display = 'none';
        factEl.textContent = 'This country has a rich cultural heritage!';
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Close modal handler
    const closeBtn = document.getElementById('closeSuccessModal');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// Cool facts database
function getCoolFact(countryName, countryData) {
    const coolFacts = {
        'United States': 'The US has the world\'s largest economy and is home to Hollywood, Silicon Valley, and the Grand Canyon.',
        'China': 'China invented paper, gunpowder, and the compass. It\'s also home to the Great Wall, which is visible from space.',
        'India': 'India is the world\'s largest democracy and invented the number zero. It\'s also home to the Taj Mahal.',
        'Brazil': 'Brazil is home to the Amazon rainforest, which produces 20% of the world\'s oxygen.',
        'Russia': 'Russia spans 11 time zones and is the largest country in the world by area.',
        'Canada': 'Canada has the longest coastline in the world and is home to 20% of the world\'s fresh water.',
        'Australia': 'Australia is home to the Great Barrier Reef, the world\'s largest coral reef system.',
        'Germany': 'Germany invented the printing press and is home to the world\'s largest beer festival (Oktoberfest).',
        'Japan': 'Japan has more than 6,800 islands and invented sushi, anime, and bullet trains.',
        'United Kingdom': 'The UK invented the steam engine, telephone, and World Wide Web.',
        'France': 'France is the most visited country in the world and invented the croissant (though it\'s Austrian in origin).',
        'Italy': 'Italy is home to more UNESCO World Heritage sites than any other country.',
        'Spain': 'Spain has the second-highest number of bars per capita in the world.',
        'Mexico': 'Mexico introduced chocolate, corn, and chili peppers to the world.',
        'Argentina': 'Argentina is home to the world\'s widest avenue (9 de Julio Avenue in Buenos Aires).',
        'South Africa': 'South Africa has 11 official languages and is home to the world\'s largest diamond.',
        'Egypt': 'Egypt is home to the Great Pyramid of Giza, one of the Seven Wonders of the Ancient World.',
        'Nigeria': 'Nigeria has the largest population in Africa and is home to Nollywood, the world\'s second-largest film industry.',
        'Kenya': 'Kenya is home to the Great Migration, where millions of animals cross the Serengeti.',
        'Thailand': 'Thailand is the only Southeast Asian country never colonized by European powers.',
        'Vietnam': 'Vietnam is the world\'s second-largest coffee producer and home to Ha Long Bay.',
        'Indonesia': 'Indonesia is the world\'s largest archipelago with over 17,000 islands.',
        'Philippines': 'The Philippines has over 7,000 islands and is home to the world\'s smallest volcano.',
        'Malaysia': 'Malaysia is home to the world\'s largest flower (Rafflesia) and tallest twin towers.',
        'Singapore': 'Singapore is one of the world\'s smallest countries but has one of the highest GDP per capita.',
        'South Korea': 'South Korea has the world\'s fastest internet speeds and invented K-pop.',
        'North Korea': 'North Korea has the world\'s largest stadium (Rungrado 1st of May Stadium).',
        'Mongolia': 'Mongolia has the lowest population density in the world.',
        'Kazakhstan': 'Kazakhstan is the world\'s largest landlocked country.',
        'Turkey': 'Turkey is the only country located on two continents (Europe and Asia).',
        'Iran': 'Iran has the world\'s largest natural gas reserves.',
        'Saudi Arabia': 'Saudi Arabia is home to the world\'s largest sand desert (Rub\' al Khali).',
        'Israel': 'Israel has the highest number of museums per capita in the world.',
        'Jordan': 'Jordan is home to Petra, the "Rose City" carved into red sandstone cliffs.',
        'Lebanon': 'Lebanon has more than 40 different religious groups living together.',
        'Syria': 'Syria is home to one of the world\'s oldest continuously inhabited cities (Damascus).',
        'Iraq': 'Iraq is home to the ancient city of Babylon and the Hanging Gardens.',
        'Afghanistan': 'Afghanistan is home to the world\'s largest Buddha statues (destroyed in 2001).',
        'Pakistan': 'Pakistan is home to the world\'s second-highest mountain (K2).',
        'Nepal': 'Nepal is home to Mount Everest, the world\'s highest mountain.',
        'Bhutan': 'Bhutan measures its success by Gross National Happiness instead of GDP.',
        'Bangladesh': 'Bangladesh has the world\'s largest river delta (Ganges-Brahmaputra).',
        'Sri Lanka': 'Sri Lanka is home to the world\'s oldest human-planted tree (over 2,000 years old).',
        'Maldives': 'The Maldives is the world\'s lowest country, with an average elevation of 1.5 meters.',
        'Myanmar': 'Myanmar is home to the world\'s largest book (Kuthodaw Pagoda with 729 stone tablets).',
        'Cambodia': 'Cambodia is home to Angkor Wat, the world\'s largest religious monument.',
        'Laos': 'Laos is the only landlocked country in Southeast Asia.',
        'Fiji': 'Fiji is home to the world\'s softest water and has 333 islands.',
        'Papua New Guinea': 'Papua New Guinea has over 800 languages, more than any other country.',
        'New Zealand': 'New Zealand was the first country to give women the right to vote.',
        'Solomon Islands': 'The Solomon Islands are home to the world\'s largest saltwater lake.',
        'Vanuatu': 'Vanuatu is home to the world\'s most accessible active volcano.',
        'Samoa': 'Samoa is the first country to see the sunrise each day.',
        'Tonga': 'Tonga is the only Pacific island nation never colonized by Europeans.',
        'Kiribati': 'Kiribati spans all four hemispheres and has the earliest time zone.',
        'Tuvalu': 'Tuvalu is the world\'s least visited country.',
        'Nauru': 'Nauru is the world\'s smallest island nation.',
        'Palau': 'Palau is home to the world\'s first shark sanctuary.',
        'Micronesia': 'Micronesia consists of over 600 islands across the Pacific.',
        'Marshall Islands': 'The Marshall Islands are home to the world\'s largest shark sanctuary.',
        'Cook Islands': 'The Cook Islands are named after Captain James Cook, who never actually visited them.',
        'French Polynesia': 'French Polynesia is home to the world\'s most remote island (Tristan da Cunha).',
        'New Caledonia': 'New Caledonia has the world\'s largest lagoon.',
        'Wallis and Futuna': 'Wallis and Futuna is the world\'s least populated territory.',
        'Norfolk Island': 'Norfolk Island is home to the world\'s tallest pine trees.',
        'Christmas Island': 'Christmas Island is home to the world\'s largest land crab migration.',
        'Cocos Islands': 'The Cocos Islands are home to the world\'s largest coconut crab.',
        'Heard Island': 'Heard Island is home to the world\'s most remote active volcano.',
        'Macquarie Island': 'Macquarie Island is home to the world\'s largest penguin colony.',
        'Bouvet Island': 'Bouvet Island is the world\'s most remote island.',
        'South Georgia': 'South Georgia is home to the world\'s largest king penguin colony.',
        'Falkland Islands': 'The Falkland Islands are home to more penguins than people.',
        'Antarctica': 'Antarctica is the world\'s coldest, driest, and windiest continent.',
        'Greenland': 'Greenland is the world\'s largest island and is mostly covered in ice.',
        'Iceland': 'Iceland is home to the world\'s oldest parliament and has no mosquitoes.',
        'Norway': 'Norway has the world\'s longest coastline and invented the paperclip.',
        'Sweden': 'Sweden is home to the world\'s largest furniture store (IKEA) and invented the zipper.',
        'Finland': 'Finland is the world\'s happiest country and has more saunas than cars.',
        'Denmark': 'Denmark is the world\'s happiest country and invented LEGO.',
        'Estonia': 'Estonia is the world\'s most digitally advanced country.',
        'Latvia': 'Latvia is home to the world\'s widest waterfall (Ventas Rumba).',
        'Lithuania': 'Lithuania is home to the world\'s largest amber deposit.',
        'Poland': 'Poland is home to the world\'s largest castle (Malbork Castle).',
        'Belarus': 'Belarus is home to the world\'s largest tractor factory.',
        'Ukraine': 'Ukraine is home to the world\'s largest sunflower seed producer.',
        'Moldova': 'Moldova is home to the world\'s largest wine cellar (Mileștii Mici).',
        'Romania': 'Romania is home to the world\'s heaviest building (Palace of the Parliament).',
        'Bulgaria': 'Bulgaria is home to the world\'s oldest gold treasure.',
        'Greece': 'Greece is home to the world\'s oldest democracy and invented the Olympic Games.',
        'Albania': 'Albania is home to the world\'s largest bunker network.',
        'Macedonia': 'Macedonia is home to the world\'s oldest lake (Lake Ohrid).',
        'Serbia': 'Serbia is home to the world\'s largest raspberry producer.',
        'Montenegro': 'Montenegro is home to the world\'s deepest canyon (Tara River Canyon).',
        'Bosnia and Herzegovina': 'Bosnia and Herzegovina is home to the world\'s oldest pyramid (Pyramid of the Sun).',
        'Croatia': 'Croatia is home to the world\'s smallest town (Hum).',
        'Slovenia': 'Slovenia is home to the world\'s oldest vine (over 400 years old).',
        'Hungary': 'Hungary is home to the world\'s largest thermal lake (Lake Hévíz).',
        'Slovakia': 'Slovakia is home to the world\'s largest castle (Spiš Castle).',
        'Czech Republic': 'Czech Republic is home to the world\'s largest castle complex (Prague Castle).',
        'Austria': 'Austria is home to the world\'s oldest zoo (Tiergarten Schönbrunn).',
        'Switzerland': 'Switzerland is home to the world\'s longest railway tunnel (Gotthard Base Tunnel).',
        'Liechtenstein': 'Liechtenstein is the world\'s smallest country to border two countries.',
        'Monaco': 'Monaco is the world\'s second-smallest country and has no income tax.',
        'San Marino': 'San Marino is the world\'s oldest republic and has no national debt.',
        'Vatican City': 'Vatican City is the world\'s smallest country and has the world\'s shortest railway.',
        'Malta': 'Malta is home to the world\'s oldest free-standing structures (Ġgantija temples).',
        'Cyprus': 'Cyprus is home to the world\'s oldest wine label (Commandaria).',
        'Andorra': 'Andorra is the world\'s only country with Catalan as its official language.',
        'Luxembourg': 'Luxembourg is the world\'s richest country per capita.',
        'Belgium': 'Belgium is home to the world\'s largest chocolate producer.',
        'Netherlands': 'The Netherlands is home to the world\'s largest flower auction (Aalsmeer).',
        'Ireland': 'Ireland is home to the world\'s oldest pub (Sean\'s Bar, over 1,000 years old).',
        'Portugal': 'Portugal is home to the world\'s oldest bookstore (Livraria Bertrand, 1732).',
        'Morocco': 'Morocco is home to the world\'s largest desert (Sahara).',
        'Algeria': 'Algeria is the world\'s largest African country by area.',
        'Tunisia': 'Tunisia is home to the world\'s largest Roman amphitheater (El Jem).',
        'Libya': 'Libya is home to the world\'s largest oil reserves in Africa.',
        'Sudan': 'Sudan is home to the world\'s largest pyramid field (Meroë).',
        'South Sudan': 'South Sudan is the world\'s newest country (2011).',
        'Ethiopia': 'Ethiopia is home to the world\'s oldest human remains (Lucy).',
        'Eritrea': 'Eritrea is home to the world\'s largest salt flat (Danakil Depression).',
        'Djibouti': 'Djibouti is home to the world\'s saltiest lake (Lake Assal).',
        'Somalia': 'Somalia has the world\'s longest coastline in Africa.',
        'Uganda': 'Uganda is home to the world\'s largest mountain gorilla population.',
        'Rwanda': 'Rwanda is home to the world\'s largest mountain gorilla population.',
        'Burundi': 'Burundi is home to the world\'s largest coffee producer per capita.',
        'Tanzania': 'Tanzania is home to the world\'s largest caldera (Ngorongoro Crater).',
        'Malawi': 'Malawi is home to the world\'s largest lake by volume (Lake Malawi).',
        'Zambia': 'Zambia is home to the world\'s largest waterfall (Victoria Falls).',
        'Zimbabwe': 'Zimbabwe is home to the world\'s largest man-made lake (Lake Kariba).',
        'Botswana': 'Botswana is home to the world\'s largest diamond mine (Jwaneng).',
        'Namibia': 'Namibia is home to the world\'s largest sand dunes (Sossusvlei).',
        'South Africa': 'South Africa is home to the world\'s largest diamond (Cullinan).',
        'Lesotho': 'Lesotho is the world\'s highest country (lowest point is 1,400m above sea level).',
        'Eswatini': 'Eswatini is the world\'s smallest country in the Southern Hemisphere.',
        'Mozambique': 'Mozambique\'s Bazaruto Archipelago has some of the Indian Ocean\'s richest coral reefs.',
        'Madagascar': 'Madagascar is home to the world\'s largest lemur population.',
        'Mauritius': 'Mauritius is home to the world\'s rarest bird (Mauritius kestrel).',
        'Seychelles': 'Seychelles is home to the world\'s largest seed (coco de mer).',
        'Comoros': 'Comoros is home to the world\'s largest active volcano (Karthala).',
        'Mayotte': 'Mayotte is home to the world\'s largest lagoon in the Indian Ocean.',
        'Réunion': 'Réunion is home to the world\'s most active volcano (Piton de la Fournaise).',
        'Cape Verde': 'Cape Verde is home to the world\'s largest salt flat (Sal).',
        'São Tomé and Príncipe': 'São Tomé and Príncipe is home to the world\'s largest cocoa producer per capita.',
        'Equatorial Guinea': 'Equatorial Guinea is home to the world\'s largest oil reserves per capita.',
        'Gabon': 'Gabon is home to the world\'s largest forest elephant population.',
        'Cameroon': 'Cameroon is home to the world\'s largest gorilla population.',
        'Central African Republic': 'Central African Republic is home to the world\'s largest diamond reserves.',
        'Chad': 'Chad is home to the world\'s largest lake in the Sahara (Lake Chad).',
        'Niger': 'Niger is home to the world\'s largest uranium reserves.',
        'Mali': 'Mali is home to the world\'s largest mud-brick building (Great Mosque of Djenné).',
        'Burkina Faso': 'Burkina Faso is home to the world\'s largest gold reserves in West Africa.',
        'Senegal': 'Senegal is home to the world\'s largest pink lake (Lake Retba).',
        'Gambia': 'Gambia is the world\'s smallest country in Africa.',
        'Guinea-Bissau': 'Guinea-Bissau is home to the world\'s largest cashew producer per capita.',
        'Guinea': 'Guinea is home to the world\'s largest bauxite reserves.',
        'Sierra Leone': 'Sierra Leone is home to the world\'s largest diamond (Star of Sierra Leone).',
        'Liberia': 'Liberia is home to the world\'s largest rubber plantation.',
        'Ivory Coast': 'Ivory Coast is home to the world\'s largest cocoa producer.',
        'Ghana': 'Ghana is home to the world\'s largest gold reserves in Africa.',
        'Togo': 'Togo is home to the world\'s largest phosphate reserves.',
        'Benin': 'Benin is home to the world\'s largest voodoo market.',
        'Nigeria': 'Nigeria is home to the world\'s largest oil reserves in Africa.',
        'Mauritania': 'Mauritania is home to the world\'s largest iron ore reserves.',
        'Western Sahara': 'Western Sahara is home to the world\'s largest phosphate reserves.',
        'Cuba': 'Cuba is home to the world\'s largest cigar producer.',
        'Jamaica': 'Jamaica is home to the world\'s fastest man (Usain Bolt).',
        'Haiti': 'Haiti is home to the world\'s largest fortress in the Americas (Citadelle Laferrière).',
        'Dominican Republic': 'Dominican Republic is home to the world\'s largest amber deposit.',
        'Bahamas': 'The Bahamas is home to the world\'s clearest water.',
        'Trinidad and Tobago': 'Trinidad and Tobago is home to the world\'s largest natural asphalt lake.',
        'Barbados': 'Barbados is home to the world\'s oldest rum distillery.',
        'Grenada': 'Grenada is home to the world\'s largest nutmeg producer.',
        'Saint Lucia': 'Saint Lucia is home to the world\'s only drive-in volcano.',
        'Saint Vincent and the Grenadines': 'Saint Vincent and the Grenadines is home to the world\'s largest breadfruit.',
        'Antigua and Barbuda': 'Antigua and Barbuda is home to the world\'s largest cricket ground.',
        'Saint Kitts and Nevis': 'Saint Kitts and Nevis is home to the world\'s smallest sovereign state in the Americas.',
        'Dominica': 'Dominica is home to the world\'s largest boiling lake.',
        'Guatemala': 'Guatemala is home to the world\'s largest jade deposit.',
        'Belize': 'Belize is home to the world\'s largest barrier reef (after Australia).',
        'Honduras': 'Honduras is home to the world\'s largest Mayan ruins (Copán).',
        'El Salvador': 'El Salvador is home to the world\'s smallest country in Central America.',
        'Nicaragua': 'Nicaragua is home to the world\'s largest lake in Central America (Lake Nicaragua).',
        'Costa Rica': 'Costa Rica is home to the world\'s largest butterfly (Morpho).',
        'Panama': 'Panama is home to the world\'s largest canal (Panama Canal).',
        'Colombia': 'Colombia is home to the world\'s largest emerald producer.',
        'Venezuela': 'Venezuela is home to the world\'s largest oil reserves.',
        'Ecuador': 'Ecuador is home to the world\'s largest Galapagos tortoise.',
        'Peru': 'Peru is home to the world\'s largest ancient city (Machu Picchu).',
        'Bolivia': 'Bolivia is home to the world\'s largest salt flat (Salar de Uyuni).',
        'Paraguay': 'Paraguay is home to the world\'s largest hydroelectric dam (Itaipu).',
        'Uruguay': 'Uruguay is home to the world\'s largest beef producer per capita.',
        'Chile': 'Chile is home to the world\'s driest desert (Atacama).',
        'Argentina': 'Argentina is home to the world\'s largest waterfall (Iguazu Falls).',
        'Guyana': 'Guyana is home to the world\'s largest single-drop waterfall (Kaieteur Falls).',
        'Suriname': 'Suriname is home to the world\'s largest bauxite reserves.',
        'French Guiana': 'French Guiana is home to the world\'s largest spaceport (Kourou).'
    };
    
    return coolFacts[countryName] || `${countryName} has a rich cultural heritage and unique traditions!`;
}

// Hard mode: one map click to guess coordinates, drop a pin, report distance
function activateHardModeGuess() {
    if (typeof leafletMap === 'undefined' || !leafletMap) return;
    // Ensure only one handler per round
    leafletMap.once('click', (e) => {
        if (!gameActive) return;
        const targetCenter = getCountryCenter(currentCountry);
        if (!targetCenter) {
            feedback.textContent = 'No reference available for this country. Try next country.';
            feedback.className = 'feedback';
            return;
        }
        const dist = calculateDistance(e.latlng.lat, e.latlng.lng, targetCenter[0], targetCenter[1]);
        // Drop pin
        try { if (hardGuessMarker) leafletMap.removeLayer(hardGuessMarker); } catch(_) {}
        hardGuessMarker = L.marker(e.latlng).addTo(leafletMap);
        guessesLeft = 0;
        guessesElement.textContent = guessesLeft;
        feedback.textContent = `You were ${Math.round(dist)} km from ${currentCountry}.`;
        feedback.className = 'feedback';
        // End round after reporting
        endRound();

        // Draw line to true location and reveal target center softly
        const targetLatLng = L.latLng(targetCenter[0], targetCenter[1]);
        try { if (hardGuessLine) leafletMap.removeLayer(hardGuessLine); } catch(_) {}
        hardGuessLine = L.polyline([e.latlng, targetLatLng], { color: '#2563EB', weight: 3, opacity: 0.8 }).addTo(leafletMap);
        try { if (hardTargetCircle) leafletMap.removeLayer(hardTargetCircle); } catch(_) {}
        hardTargetCircle = L.circleMarker(targetLatLng, { radius: 6, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.9 }).addTo(leafletMap);

        // Show popup on marker with distance
        hardGuessMarker.bindPopup(`Distance to ${currentCountry}: ${Math.round(dist)} km`).openPopup();
    });
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
}

function destinationPoint(lat, lon, bearingDeg, distanceKm) {
    const R = 6371;
    const δ = distanceKm / R;
    const θ = bearingDeg * Math.PI / 180;
    const φ1 = lat * Math.PI / 180, λ1 = lon * Math.PI / 180;
    const φ2 = Math.asin( Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(θ) );
    const λ2 = λ1 + Math.atan2(Math.sin(θ)*Math.sin(δ)*Math.cos(φ1), Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));
    return [ (φ2*180/Math.PI), ((λ2*180/Math.PI)+540)%360-180 ];
}

// Region helper for continent filtering
function isNameInRegion(name, region) {
    if (!name || !region) return true;
    const continentMap = {
        'North America': ['United States','Canada','Mexico','Guatemala','Belize','Honduras','El Salvador','Nicaragua','Costa Rica','Panama','Cuba','Jamaica','Haiti','Dominican Republic','Bahamas','Trinidad and Tobago','Barbados','Grenada','Saint Lucia','Saint Vincent and the Grenadines','Antigua and Barbuda','Saint Kitts and Nevis','Dominica'],
        'South America': ['Brazil','Argentina','Chile','Peru','Colombia','Venezuela','Ecuador','Bolivia','Paraguay','Uruguay','Guyana','Suriname','French Guiana'],
        'Europe': ['United Kingdom','France','Germany','Italy','Spain','Portugal','Netherlands','Belgium','Switzerland','Austria','Poland','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Greece','Albania','Macedonia','Serbia','Croatia','Slovenia','Bosnia and Herzegovina','Montenegro','Kosovo','Moldova','Ukraine','Belarus','Lithuania','Latvia','Estonia','Finland','Sweden','Norway','Denmark','Iceland','Ireland','Luxembourg','Liechtenstein','Monaco','Andorra','San Marino','Vatican City','Malta','Cyprus'],
        'Asia': ['China','Japan','India','South Korea','North Korea','Vietnam','Thailand','Cambodia','Laos','Myanmar','Malaysia','Singapore','Indonesia','Philippines','Brunei','East Timor','Mongolia','Kazakhstan','Uzbekistan','Kyrgyzstan','Tajikistan','Turkmenistan','Afghanistan','Pakistan','Nepal','Bhutan','Bangladesh','Sri Lanka','Maldives','Iran','Iraq','Syria','Lebanon','Jordan','Israel','Palestine','Saudi Arabia','Yemen','Oman','United Arab Emirates','Qatar','Kuwait','Bahrain','Armenia','Azerbaijan','Georgia','Turkey'],
        'Africa': ['Egypt','Libya','Tunisia','Algeria','Morocco','Mauritania','Western Sahara','Sudan','South Sudan','Ethiopia','Eritrea','Djibouti','Somalia','Kenya','Uganda','Rwanda','Burundi','Tanzania','Malawi','Zambia','Zimbabwe','Botswana','Namibia','South Africa','Lesotho','Eswatini','Madagascar','Mauritius','Seychelles','Comoros','Mayotte','Réunion','Cape Verde','São Tomé and Príncipe','Equatorial Guinea','Gabon','Cameroon','Central African Republic','Chad','Niger','Mali','Burkina Faso','Senegal','Gambia','Guinea-Bissau','Guinea','Sierra Leone','Liberia','Ivory Coast','Ghana','Togo','Benin','Nigeria'],
        'Oceania': ['Australia','New Zealand','Papua New Guinea','Fiji','Solomon Islands','Vanuatu','New Caledonia','Samoa','Tonga','Kiribati','Tuvalu','Nauru','Palau','Micronesia','Marshall Islands']
    };
    const list = continentMap[region] || [];
    return list.includes(name);
}

// Fit Leaflet map to a selected region (continent)
function focusMapToRegion(region) {
    if (typeof L === 'undefined' || !window.leafletMap) return;
    const boundsByRegion = {
        'Africa': [[-35, -20], [38, 55]],
        'Asia': [[-10, 25], [55, 150]],
        'Europe': [[34, -25], [72, 45]],
        'North America': [[7, -170], [83, -52]],
        'South America': [[-57, -82], [13, -34]],
        'Oceania': [[-50, 110], [5, 180]]
    };
    const b = boundsByRegion[region];
    if (b) {
        window.leafletMap.setMaxBounds(b);
        window.leafletMap.fitBounds(b, { padding: [20, 20] });
        window.leafletMap.setMinZoom(window.leafletMap.getZoom());
    }
}

// Pause/Play controls
function setPaused(paused) {
    isPaused = paused;
    if (pauseBtn && playBtn) {
        pauseBtn.style.display = paused ? 'none' : '';
        playBtn.style.display = paused ? '' : 'none';
    }
    // Disable interaction while paused
    const blocker = document.getElementById('mapWrapper');
    if (blocker) blocker.style.pointerEvents = paused ? 'none' : '';
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const hintBtn = document.getElementById('hintBtn');
    if (startBtn) startBtn.disabled = paused;
    if (nextBtn) nextBtn.disabled = paused;
    if (hintBtn) hintBtn.disabled = paused;
}

if (pauseBtn) pauseBtn.addEventListener('click', () => setPaused(true));
if (playBtn) playBtn.addEventListener('click', () => setPaused(false));