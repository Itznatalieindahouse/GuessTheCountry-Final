// Navigation and views
(function() {
	const homeView = document.getElementById('homeView');
	const modeView = document.getElementById('modeView');
	const gameView = document.getElementById('gameView');
	const statsMenuView = document.getElementById('statsMenuView');
	const statsView = document.getElementById('statsView');

	const btnPlay = document.getElementById('btnPlay');
	const btnStats = document.getElementById('btnStats');
	const playMenuView = document.getElementById('playMenuView');
	const btnContinents = document.getElementById('btnContinents');
	const btnWorldMap = document.getElementById('btnWorldMap');
	const playMenuBack = document.getElementById('playMenuBack');
	const continentsView = document.getElementById('continentsView');
	const continentsBack = document.getElementById('continentsBack');
	const modeEasy = document.getElementById('modeEasy');
	const modeMedium = document.getElementById('modeMedium');
	const modeHard = document.getElementById('modeHard');
	const modeBack = document.getElementById('modeBack');
	const statsMenuBack = document.getElementById('statsMenuBack');
	const btnGlobalStats = document.getElementById('btnGlobalStats');
	const btnYourStats = document.getElementById('btnYourStats');
	const statsBackHome = document.getElementById('statsBackHome');
	const gameBack = document.getElementById('gameBack');
	const statsBackMenu = document.getElementById('statsBackMenu');
	const hintBtn = document.getElementById('hintBtn');
	const scopeLabel = document.getElementById('scopeLabel');
	const changeScopeBtn = document.getElementById('changeScope');

	// Game state
	let currentMode = null;
	let gameStats = {
		easy: { gamesPlayed: 0, countriesGuessed: 0, totalCountries: 0, bestTime: null },
		medium: { gamesPlayed: 0, countriesGuessed: 0, totalCountries: 0, bestTime: null },
		hard: { gamesPlayed: 0, countriesGuessed: 0, totalCountries: 0, bestTime: null }
	};

	// Load stats from localStorage
	try {
		const saved = localStorage.getItem('geogameStats');
		if (saved) gameStats = JSON.parse(saved);
	} catch (e) {
		console.log('Could not load saved stats');
	}

	function saveStats() {
		try {
			localStorage.setItem('geogameStats', JSON.stringify(gameStats));
		} catch (e) {
			console.log('Could not save stats');
		}
	}

	// Function to save current game score (only called when switching map types)
	function saveCurrentGameScore() {
		if (!window.currentMode || !gameActive) return;
		
		const mode = window.currentMode;
		const currentScore = window.countriesGuessed || 0;
		const totalCountries = window.totalCountries || 0;
		const currentTime = window.elapsedSeconds || 0;
		
		// Update stats for current mode
		gameStats[mode].gamesPlayed++;
		gameStats[mode].countriesGuessed += currentScore;
		gameStats[mode].totalCountries += totalCountries;
		
		// Update best time if this is better
		if (!gameStats[mode].bestTime || currentTime < gameStats[mode].bestTime) {
			gameStats[mode].bestTime = currentTime;
		}
		
		// Save to localStorage
		saveStats();
		
		console.log(`Saved game score for ${mode} mode: ${currentScore}/${totalCountries} countries, ${currentTime}s`);
	}
	
	// Make saveCurrentGameScore globally available
	window.saveCurrentGameScore = saveCurrentGameScore;

	function show(view) {
		homeView.style.display = 'none';
		modeView.style.display = 'none';
		gameView.style.display = 'none';
		statsMenuView.style.display = 'none';
		statsView.style.display = 'none';
		if (playMenuView) playMenuView.style.display = 'none';
		if (continentsView) continentsView.style.display = 'none';
		view.style.display = '';
		setTimeout(() => {
			// Invalidate map sizes after layout changes
			if (view === gameView && typeof leafletMap !== 'undefined' && leafletMap) {
				leafletMap.invalidateSize();
			}
			if (view === statsView && statsMap) {
				statsMap.invalidateSize();
			}
		}, 50);
	}

	if (btnPlay) btnPlay.addEventListener('click', () => show(playMenuView));
	if (btnStats) btnStats.addEventListener('click', () => show(statsMenuView));
	if (playMenuBack) playMenuBack.addEventListener('click', () => show(homeView));
	if (btnContinents) btnContinents.addEventListener('click', () => show(continentsView));
	if (btnWorldMap) btnWorldMap.addEventListener('click', () => { 
    window.geogameContinentFilter = null; 
    if (scopeLabel) scopeLabel.textContent = 'World Map'; 
    show(modeView); 
});
if (continentsBack) continentsBack.addEventListener('click', () => show(playMenuView));

// Mode back: if a continent is selected, go back to continents view; otherwise to play menu
if (modeBack) modeBack.addEventListener('click', () => {
    if (window.geogameContinentFilter) {
        show(continentsView);
    } else {
        show(playMenuView);
    }
});

// Game back returns to difficulty selection (preserve continent filter)
if (gameBack) gameBack.addEventListener('click', () => {
    show(modeView);
});

// Stats menu buttons
if (statsMenuBack) statsMenuBack.addEventListener('click', () => show(homeView));
if (statsBackHome) statsBackHome.addEventListener('click', () => show(homeView));
if (statsBackMenu) statsBackMenu.addEventListener('click', () => show(statsMenuView));

	// Change scope inline
	if (changeScopeBtn) changeScopeBtn.addEventListener('click', () => {
		show(playMenuView);
	});

	// Continent selection
	document.querySelectorAll('.continent-option').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const continent = e.currentTarget.getAttribute('data-continent');
			window.geogameContinentFilter = continent; // Used by game script to filter
			show(modeView);
		});
	});

	// Easy mode implementation
	if (modeEasy) modeEasy.addEventListener('click', () => {
		currentMode = 'easy';
		window.currentMode = 'easy';
		show(gameView);
		scopeLabel.textContent = window.geogameContinentFilter ? window.geogameContinentFilter : 'World Map';
		
		// Re-apply event listeners for Easy mode restrictions
		if (typeof addCountryEventListeners === 'function') {
			addCountryEventListeners();
		}
		
		// Apply Easy mode restrictions to Leaflet map
		setTimeout(() => {
			if (typeof applyEasyModeRestrictions === 'function') {
				applyEasyModeRestrictions();
			}
		}, 100);
		
		// Override game settings for Easy mode
		if (typeof startGame === 'function') {
			// Store original values
			const originalGuessesLeft = window.guessesLeft;
			const originalNextBtnText = document.getElementById('nextBtn').textContent;
			
			// Set Easy mode settings
			window.maxGuesses = 5;
			window.guessesLeft = 5;
			document.getElementById('guesses').textContent = '5';
			hintBtn.style.display = 'inline-block';
			
			// Start the game
			startGame();
			
			// Override the endRound function to not reset timer
			const originalEndRound = window.endRound;
			window.endRound = function() {
				gameActive = false;
				// Do not stop the timer in Easy mode; it should keep counting
				const unguessedCountries = availableCountries.filter(countryId => !guessedCountries.has(countryId));
				nextBtn.textContent = 'Next Country';
			};
		}
		if (typeof showRealBasemap === 'function') {
			showRealBasemap('map');
			setTimeout(() => { 
                if (leafletMap) {
                    leafletMap.invalidateSize();
                    if (window.geogameContinentFilter && typeof focusMapToRegion === 'function') {
                        focusMapToRegion(window.geogameContinentFilter);
                    }
                }
            }, 100);
		}
	});

	if (modeMedium) modeMedium.addEventListener('click', () => {
		currentMode = 'medium';
		window.currentMode = 'medium';
		// Launch existing game as Medium
		show(gameView);
		scopeLabel.textContent = window.geogameContinentFilter ? window.geogameContinentFilter : 'World Map';
		
		// Re-apply event listeners for Medium mode (all countries clickable)
		if (typeof addCountryEventListeners === 'function') {
			addCountryEventListeners();
		}
		
		// Apply Medium mode restrictions to Leaflet map (all countries clickable)
		setTimeout(() => {
			if (typeof applyEasyModeRestrictions === 'function') {
				applyEasyModeRestrictions();
			}
		}, 100);
		
		hintBtn.style.display = 'none';
		window.maxGuesses = 3;
		// Ensure real map is active and game ready
		if (typeof showRealBasemap === 'function') {
			showRealBasemap('map');
			setTimeout(() => { 
                if (leafletMap) {
                    leafletMap.invalidateSize();
                    if (window.geogameContinentFilter && typeof focusMapToRegion === 'function') {
                        focusMapToRegion(window.geogameContinentFilter);
                    }
                }
            }, 100);
		}
		if (typeof startGame === 'function') startGame();
	});
	if (modeHard) modeHard.addEventListener('click', () => {
		currentMode = 'hard';
		window.currentMode = 'hard';
		show(gameView);
		scopeLabel.textContent = window.geogameContinentFilter ? window.geogameContinentFilter : 'World Map';
		
		// Re-apply event listeners for Hard mode (all countries clickable)
		if (typeof addCountryEventListeners === 'function') {
			addCountryEventListeners();
		}
		
		// Apply Hard mode restrictions to Leaflet map (all countries clickable)
		setTimeout(() => {
			if (typeof applyEasyModeRestrictions === 'function') {
				applyEasyModeRestrictions();
			}
		}, 100);
		
		hintBtn.style.display = 'none';
		window.maxGuesses = 1; // Only one guess in Hard mode
		
		// Ensure real map is active and game ready
		if (typeof showRealBasemap === 'function') {
			showRealBasemap('map');
			setTimeout(() => { 
                if (leafletMap) {
                    leafletMap.invalidateSize();
                    if (window.geogameContinentFilter && typeof focusMapToRegion === 'function') {
                        focusMapToRegion(window.geogameContinentFilter);
                    }
                }
            }, 100);
		}
		if (typeof startGame === 'function') startGame();
	});

	// Enhanced hint system for Easy mode
	if (hintBtn) hintBtn.addEventListener('click', async () => {
		if (window.currentMode === 'easy' && window.currentCountry) {
			const capitalInitial = await fetchCapitalInitial(window.currentCountry);
			const hints = [
				`This country is in ${getContinent(window.currentCountry)}`,
				`It's located in the ${getHemisphere(window.currentCountry)} hemisphere`,
				`This is a ${getCountrySize(window.currentCountry)} country`,
				capitalInitial ? `The capital starts with "${capitalInitial}"` : null,
				`This country has a population of about ${getPopulationHint(window.currentCountry)} million`
			].filter(Boolean);
			const randomHint = hints[Math.floor(Math.random() * hints.length)];
			document.getElementById('feedback').textContent = `Hint: ${randomHint}`;
			document.getElementById('feedback').className = 'feedback';
		}
	});

	// Enhanced hint functions
	function getContinent(country) {
		const continents = {
			// North America
			'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
			'Guatemala': 'North America', 'Belize': 'North America', 'Honduras': 'North America',
			'El Salvador': 'North America', 'Nicaragua': 'North America', 'Costa Rica': 'North America',
			'Panama': 'North America', 'Cuba': 'North America', 'Jamaica': 'North America',
			'Haiti': 'North America', 'Dominican Republic': 'North America', 'Bahamas': 'North America',
			'Trinidad and Tobago': 'North America', 'Barbados': 'North America', 'Grenada': 'North America',
			'St. Lucia': 'North America', 'St. Vincent and the Grenadines': 'North America', 'Antigua and Barbuda': 'North America',
			'St. Kitts and Nevis': 'North America', 'Dominica': 'North America',
			
			// South America
			'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
			'Peru': 'South America', 'Colombia': 'South America', 'Venezuela': 'South America',
			'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
			'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
			'French Guiana': 'South America',
			
			// Europe
			'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe',
			'Italy': 'Europe', 'Spain': 'Europe', 'Portugal': 'Europe',
			'Netherlands': 'Europe', 'Belgium': 'Europe', 'Switzerland': 'Europe',
			'Austria': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe',
			'Slovakia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe',
			'Bulgaria': 'Europe', 'Greece': 'Europe', 'Albania': 'Europe',
			'Macedonia': 'Europe', 'Serbia': 'Europe', 'Croatia': 'Europe',
			'Slovenia': 'Europe', 'Bosnia and Herzegovina': 'Europe', 'Montenegro': 'Europe',
			'Kosovo': 'Europe', 'Moldova': 'Europe', 'Ukraine': 'Europe',
			'Belarus': 'Europe', 'Lithuania': 'Europe', 'Latvia': 'Europe',
			'Estonia': 'Europe', 'Finland': 'Europe', 'Sweden': 'Europe',
			'Norway': 'Europe', 'Denmark': 'Europe', 'Iceland': 'Europe',
			'Ireland': 'Europe', 'Luxembourg': 'Europe', 'Liechtenstein': 'Europe',
			'Monaco': 'Europe', 'Andorra': 'Europe', 'San Marino': 'Europe',
			'Vatican City': 'Europe', 'Malta': 'Europe', 'Cyprus': 'Europe',
			
			// Asia
			'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia',
			'South Korea': 'Asia', 'North Korea': 'Asia', 'Vietnam': 'Asia',
			'Thailand': 'Asia', 'Cambodia': 'Asia', 'Laos': 'Asia',
			'Myanmar': 'Asia', 'Malaysia': 'Asia', 'Singapore': 'Asia',
			'Indonesia': 'Asia', 'Philippines': 'Asia', 'Brunei': 'Asia',
			'East Timor': 'Asia', 'Mongolia': 'Asia', 'Kazakhstan': 'Asia',
			'Uzbekistan': 'Asia', 'Kyrgyzstan': 'Asia', 'Tajikistan': 'Asia',
			'Turkmenistan': 'Asia', 'Afghanistan': 'Asia', 'Pakistan': 'Asia',
			'Nepal': 'Asia', 'Bhutan': 'Asia', 'Bangladesh': 'Asia',
			'Sri Lanka': 'Asia', 'Maldives': 'Asia', 'Iran': 'Asia',
			'Iraq': 'Asia', 'Syria': 'Asia', 'Lebanon': 'Asia',
			'Jordan': 'Asia', 'Israel': 'Asia', 'Palestine': 'Asia',
			'Saudi Arabia': 'Asia', 'Yemen': 'Asia', 'Oman': 'Asia',
			'United Arab Emirates': 'Asia', 'Qatar': 'Asia', 'Kuwait': 'Asia',
			'Bahrain': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia',
			'Georgia': 'Asia', 'Turkey': 'Asia',
			
			// Africa
			'Egypt': 'Africa', 'South Africa': 'Africa', 'Nigeria': 'Africa',
			'Ethiopia': 'Africa', 'Kenya': 'Africa', 'Tanzania': 'Africa',
			'Uganda': 'Africa', 'Sudan': 'Africa', 'South Sudan': 'Africa',
			'Somalia': 'Africa', 'Djibouti': 'Africa', 'Eritrea': 'Africa',
			'Chad': 'Africa', 'Niger': 'Africa', 'Mali': 'Africa',
			'Burkina Faso': 'Africa', 'Senegal': 'Africa', 'Gambia': 'Africa',
			'Guinea-Bissau': 'Africa', 'Guinea': 'Africa', 'Sierra Leone': 'Africa',
			'Liberia': 'Africa', 'Ivory Coast': 'Africa', 'Ghana': 'Africa',
			'Togo': 'Africa', 'Benin': 'Africa', 'Cameroon': 'Africa',
			'Central African Republic': 'Africa', 'Gabon': 'Africa', 'Congo': 'Africa',
			'Democratic Republic of the Congo': 'Africa', 'Angola': 'Africa',
			'Zambia': 'Africa', 'Zimbabwe': 'Africa', 'Botswana': 'Africa',
			'Namibia': 'Africa', 'Lesotho': 'Africa', 'Eswatini': 'Africa',
			'Madagascar': 'Africa', 'Mauritius': 'Africa', 'Seychelles': 'Africa',
			'Comoros': 'Africa', 'Morocco': 'Africa', 'Algeria': 'Africa',
			'Tunisia': 'Africa', 'Libya': 'Africa', 'Mauritania': 'Africa',
			'Western Sahara': 'Africa', 'Cape Verde': 'Africa', 'São Tomé and Príncipe': 'Africa',
			'Equatorial Guinea': 'Africa', 'Rwanda': 'Africa', 'Burundi': 'Africa',
			'Malawi': 'Africa', 'Mozambique': 'Africa',
			
			// Oceania
			'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
			'Fiji': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
			'New Caledonia': 'Oceania', 'Samoa': 'Oceania', 'Tonga': 'Oceania',
			'Kiribati': 'Oceania', 'Tuvalu': 'Oceania', 'Nauru': 'Oceania',
			'Palau': 'Oceania', 'Micronesia': 'Oceania', 'Marshall Islands': 'Oceania'
		};
		return continents[country] || 'a continent';
	}

	function getCountrySize(country) {
		const largeCountries = ['Russia', 'Canada', 'China', 'United States', 'Brazil', 'Australia', 'India', 'Argentina', 'Kazakhstan', 'Algeria'];
		const smallCountries = ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein', 'Malta', 'Andorra', 'Luxembourg', 'Singapore', 'Bahrain', 'Maldives'];
		
		if (largeCountries.includes(country)) return 'large';
		if (smallCountries.includes(country)) return 'small';
		return 'medium-sized';
	}

	function getPopulationHint(country) {
		const populations = {
			'China': '1400', 'India': '1400', 'United States': '330',
			'Indonesia': '270', 'Pakistan': '220', 'Brazil': '210',
			'Nigeria': '200', 'Bangladesh': '160', 'Russia': '140',
			'Mexico': '130', 'Japan': '125', 'Ethiopia': '110',
			'Philippines': '110', 'Egypt': '100', 'Vietnam': '95',
			'Democratic Republic of the Congo': '90', 'Turkey': '85',
			'Iran': '85', 'Germany': '83', 'Thailand': '70',
			'United Kingdom': '67', 'France': '67', 'Italy': '60',
			'Tanzania': '60', 'South Africa': '60', 'Myanmar': '55',
			'Kenya': '55', 'South Korea': '51', 'Colombia': '50',
			'Spain': '47', 'Uganda': '45', 'Argentina': '45',
			'Algeria': '44', 'Sudan': '44', 'Iraq': '40',
			'Afghanistan': '40', 'Poland': '38', 'Canada': '38',
			'Morocco': '37', 'Saudi Arabia': '35', 'Ukraine': '44',
			'Angola': '33', 'Uzbekistan': '33', 'Peru': '33',
			'Malaysia': '32', 'Mozambique': '31', 'Ghana': '31',
			'Yemen': '30', 'Nepal': '29', 'Venezuela': '28',
			'Madagascar': '27', 'Cameroon': '27', 'Ivory Coast': '26',
			'North Korea': '26', 'Australia': '25', 'Niger': '24',
			'Sri Lanka': '21', 'Burkina Faso': '21', 'Mali': '20',
			'Romania': '19', 'Malawi': '19', 'Chile': '19',
			'Kazakhstan': '18', 'Zambia': '18', 'Guatemala': '18',
			'Ecuador': '17', 'Syria': '17', 'Netherlands': '17',
			'Senegal': '16', 'Cambodia': '16', 'Chad': '16',
			'Somalia': '15', 'Zimbabwe': '15', 'Guinea': '13',
			'Rwanda': '13', 'Benin': '12', 'Burundi': '12',
			'Tunisia': '12', 'Bolivia': '12', 'Belgium': '11',
			'Haiti': '11', 'Cuba': '11', 'South Sudan': '11',
			'Dominican Republic': '11', 'Czech Republic': '10',
			'Greece': '10', 'Jordan': '10', 'Portugal': '10',
			'Azerbaijan': '10', 'Sweden': '10', 'Honduras': '10',
			'United Arab Emirates': '10', 'Hungary': '10', 'Belarus': '9',
			'Tajikistan': '9', 'Austria': '9', 'Papua New Guinea': '9',
			'Serbia': '9', 'Switzerland': '8', 'Israel': '8',
			'Togo': '8', 'Sierra Leone': '8', 'Hong Kong': '7',
			'Laos': '7', 'Paraguay': '7', 'Bulgaria': '7',
			'Libya': '7', 'Lebanon': '7', 'Nicaragua': '6',
			'Kyrgyzstan': '6', 'El Salvador': '6', 'Turkmenistan': '6',
			'Singapore': '6', 'Denmark': '6', 'Finland': '6',
			'Congo': '5', 'Slovakia': '5', 'Norway': '5',
			'Costa Rica': '5', 'Central African Republic': '5',
			'New Zealand': '5', 'Ireland': '5', 'Mauritania': '4',
			'Oman': '4', 'Panama': '4', 'Kuwait': '4',
			'Croatia': '4', 'Georgia': '4', 'Eritrea': '4',
			'Uruguay': '3', 'Bosnia and Herzegovina': '3', 'Mongolia': '3',
			'Armenia': '3', 'Jamaica': '3', 'Albania': '3',
			'Qatar': '3', 'Lithuania': '3', 'Namibia': '3',
			'Botswana': '2', 'Lesotho': '2', 'Gambia': '2',
			'Gabon': '2', 'Guinea-Bissau': '2', 'Mauritius': '1',
			'Eswatini': '1', 'East Timor': '1', 'Fiji': '1',
			'Comoros': '1', 'Guyana': '1', 'Bhutan': '1',
			'Solomon Islands': '1', 'Montenegro': '1', 'Cape Verde': '1',
			'Luxembourg': '1', 'Suriname': '1', 'Malta': '1',
			'Maldives': '1', 'Brunei': '1', 'Bahamas': '1',
			'Belize': '1', 'Iceland': '1', 'Vanuatu': '1',
			'Barbados': '1', 'New Caledonia': '1', 'French Polynesia': '1',
			'Sao Tome and Principe': '1', 'Samoa': '1', 'Saint Lucia': '1',
			'Kiribati': '1', 'Micronesia': '1', 'Saint Vincent and the Grenadines': '1',
			'Tonga': '1', 'Grenada': '1', 'Seychelles': '1',
			'Antigua and Barbuda': '1', 'Andorra': '1', 'Dominica': '1',
			'Marshall Islands': '1', 'Saint Kitts and Nevis': '1', 'Monaco': '1',
			'Liechtenstein': '1', 'San Marino': '1', 'Palau': '1',
			'Tuvalu': '1', 'Nauru': '1', 'Vatican City': '1'
		};
		return populations[country] || 'several';
	}

	function getHemisphere(country) {
		const northern = [
			// North America
			'United States', 'Canada', 'Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 
			'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 
			'Bahamas', 'Trinidad and Tobago', 'Barbados', 'Grenada', 'St. Lucia', 'St. Vincent and the Grenadines', 
			'Antigua and Barbuda', 'St. Kitts and Nevis', 'Dominica',
			
			// Europe
			'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 
			'Belgium', 'Switzerland', 'Austria', 'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 
			'Romania', 'Bulgaria', 'Greece', 'Albania', 'Macedonia', 'Serbia', 'Croatia', 'Slovenia', 
			'Bosnia and Herzegovina', 'Montenegro', 'Kosovo', 'Moldova', 'Ukraine', 'Belarus', 
			'Lithuania', 'Latvia', 'Estonia', 'Finland', 'Sweden', 'Norway', 'Denmark', 'Iceland', 
			'Ireland', 'Luxembourg', 'Liechtenstein', 'Monaco', 'Andorra', 'San Marino', 'Vatican City', 
			'Malta', 'Cyprus',
			
			// Asia
			'China', 'Japan', 'South Korea', 'North Korea', 'Mongolia', 'Kazakhstan', 'Uzbekistan', 
			'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Afghanistan', 'Pakistan', 'Nepal', 'Bhutan', 
			'Iran', 'Iraq', 'Syria', 'Lebanon', 'Jordan', 'Israel', 'Palestine', 'Saudi Arabia', 
			'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Armenia', 
			'Azerbaijan', 'Georgia', 'Turkey', 'Vietnam', 'Thailand', 'Cambodia', 'Laos', 'Myanmar', 
			'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Brunei', 'East Timor',
			
			// Northern Africa
			'Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Mauritania', 'Western Sahara', 
			'Sudan', 'South Sudan', 'Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'Uganda', 
			'Rwanda', 'Burundi', 'Chad', 'Niger', 'Mali', 'Burkina Faso', 'Senegal', 'Gambia', 
			'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', 'Ivory Coast', 'Ghana', 'Togo', 
			'Benin', 'Nigeria', 'Cameroon', 'Central African Republic', 'Cape Verde', 'São Tomé and Príncipe', 
			'Equatorial Guinea', 'Gabon', 'Congo', 'Democratic Republic of the Congo',
			
			// Northern Oceania
			'Marshall Islands', 'Micronesia', 'Palau', 'Northern Mariana Islands', 'Guam'
		];
		
		const southern = [
			// South America
			'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia', 
			'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana',
			
			// Southern Africa
			'Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 
			'Lesotho', 'Eswatini', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 
			'Mayotte', 'Réunion',
			
			// Southern Oceania
			'Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 
			'New Caledonia', 'Samoa', 'Tonga', 'Kiribati', 'Tuvalu', 'Nauru', 'Cook Islands', 
			'French Polynesia', 'Wallis and Futuna', 'Norfolk Island', 'Christmas Island', 'Cocos Islands', 
			'Heard Island', 'Macquarie Island', 'Bouvet Island', 'South Georgia', 'Falkland Islands', 
			'Antarctica', 'Greenland'
		];
		
		if (northern.includes(country)) return 'northern';
		if (southern.includes(country)) return 'southern';
		return 'equatorial'; // For countries near the equator
	}

	// Global Statistics Map
	let statsMap;
	let statsLayer;
	const statsTooltip = document.getElementById('statsTooltip');
	const statsPanelContent = document.getElementById('statsPanelContent');

	async function initStatsMap() {
		if (statsMap) return;
		statsMap = L.map('statsMap', { zoomControl: true, attributionControl: false, center: [20, 0], zoom: 2 });
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(statsMap);

		let data;
		try {
			const resp = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', { cache: 'no-store' });
			data = await resp.json();
		} catch (e) {
			const local = await fetch('world-countries.json');
			data = await local.json();
		}

		function extractName(feature) {
			const p = feature.properties || {};
			return p.name || p.NAME || p.ADMIN || p.admin || p.Country || p.country || 'Unknown';
		}

		statsLayer = L.geoJSON(data.features, {
			style: { color: '#10B981', weight: 1, opacity: 0.6, fillOpacity: 0.1 },
			onEachFeature: (feature, layer) => {
				const name = extractName(feature);
				layer.on('mouseover', async (e) => {
					layer.setStyle({ fillOpacity: 0.25 });
					const info = await fetchCountryInfo(name);
					showTooltip(e.originalEvent, name, info);
				});
				layer.on('mousemove', (e) => {
					moveTooltip(e.originalEvent);
				});
				layer.on('mouseout', () => {
					layer.setStyle({ fillOpacity: 0.1 });
					hideTooltip();
				});
				layer.on('click', async (e) => {
					const info = await fetchCountryInfo(name);
					populateSidebar(name, info);
				});
			}
		}).addTo(statsMap);
	}

	async function fetchCountryInfo(name) {
		try {
			const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`);
			const json = await resp.json();
			const country = Array.isArray(json) ? json[0] : null;
			if (!country) return null;
			return {
				flag: country.flags && (country.flags.svg || country.flags.png),
				capital: Array.isArray(country.capital) ? country.capital[0] : country.capital,
				population: country.population,
				area: country.area,
				region: country.region,
				subregion: country.subregion,
				currencies: country.currencies,
				languages: country.languages
			};
		} catch (_) {
			return null;
		}
	}

	function showTooltip(evt, name, info) {
		if (!statsTooltip) return;
		const parts = [];
		parts.push(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">${info && info.flag ? `<img src="${info.flag}" alt="${name} flag" style="width:28px;height:18px;object-fit:cover;border:1px solid #e5e7eb;border-radius:4px;"/>` : ''}<strong>${name}</strong></div>`);
		parts.push(`<div class=\"row\"><span>Capital</span><span>${info?.capital || '—'}</span></div>`);
		parts.push(`<div class=\"row\"><span>Population</span><span>${info?.population?.toLocaleString?.() || '—'}</span></div>`);
		parts.push(`<div class=\"row\"><span>Area</span><span>${info?.area ? info.area.toLocaleString() + ' km²' : '—'}</span></div>`);
		statsTooltip.innerHTML = parts.join('');
		statsTooltip.style.display = 'block';
		
		// Force a reflow to ensure dimensions are calculated
		statsTooltip.offsetHeight;
		
		moveTooltip(evt);
	}

	function moveTooltip(evt) {
		if (!statsTooltip) return;
		const offset = 14;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		// Get tooltip dimensions, with fallback estimates if not available
		const tooltipRect = statsTooltip.getBoundingClientRect();
		const tooltipWidth = tooltipRect.width || 200; // Fallback width
		const tooltipHeight = tooltipRect.height || 120; // Fallback height
		
		// Try different positions in order of preference
		const positions = [
			// Bottom-right (default)
			{ left: evt.clientX + offset, top: evt.clientY + offset },
			// Bottom-left
			{ left: evt.clientX - tooltipWidth - offset, top: evt.clientY + offset },
			// Top-right
			{ left: evt.clientX + offset, top: evt.clientY - tooltipHeight - offset },
			// Top-left
			{ left: evt.clientX - tooltipWidth - offset, top: evt.clientY - tooltipHeight - offset },
			// Center-right
			{ left: evt.clientX + offset, top: evt.clientY - tooltipHeight / 2 },
			// Center-left
			{ left: evt.clientX - tooltipWidth - offset, top: evt.clientY - tooltipHeight / 2 }
		];
		
		// Find the first position that fits within the viewport
		let bestPosition = positions[0];
		for (const pos of positions) {
			if (pos.left >= 0 && 
				pos.left + tooltipWidth <= viewportWidth && 
				pos.top >= 0 && 
				pos.top + tooltipHeight <= viewportHeight) {
				bestPosition = pos;
				break;
			}
		}
		
		// Apply the best position
		statsTooltip.style.left = `${bestPosition.left}px`;
		statsTooltip.style.top = `${bestPosition.top}px`;
		
		// Final safety check after a brief delay
		setTimeout(() => {
			const finalRect = statsTooltip.getBoundingClientRect();
			let needsAdjustment = false;
			let newLeft = finalRect.left;
			let newTop = finalRect.top;
			
			// Adjust if still off-screen
			if (finalRect.right > viewportWidth) {
				newLeft = viewportWidth - finalRect.width - offset;
				needsAdjustment = true;
			}
			if (finalRect.bottom > viewportHeight) {
				newTop = viewportHeight - finalRect.height - offset;
				needsAdjustment = true;
			}
			if (finalRect.left < 0) {
				newLeft = offset;
				needsAdjustment = true;
			}
			if (finalRect.top < 0) {
				newTop = offset;
				needsAdjustment = true;
			}
			
			if (needsAdjustment) {
				statsTooltip.style.left = `${newLeft}px`;
				statsTooltip.style.top = `${newTop}px`;
			}
		}, 10);
	}

	function hideTooltip() {
		if (statsTooltip) statsTooltip.style.display = 'none';
	}

	function populateSidebar(name, info) {
		if (!statsPanelContent) return;
		const currencyList = info?.currencies ? Object.values(info.currencies).map(c => c.name).join(', ') : '—';
		const languageList = info?.languages ? Object.values(info.languages).join(', ') : '—';
		statsPanelContent.innerHTML = `
			<div style="display:flex;align-items:center;margin-bottom:10px;">
				${info && info.flag ? `<img class="flag" src="${info.flag}" alt="${name} flag"/>` : ''}
				<h2 style="margin:0 0 0 8px;">${name}</h2>
			</div>
			<div class="panel-row"><span>Capital</span><span>${info?.capital || '—'}</span></div>
			<div class="panel-row"><span>Population</span><span>${info?.population?.toLocaleString?.() || '—'}</span></div>
			<div class="panel-row"><span>Area</span><span>${info?.area ? info.area.toLocaleString() + ' km²' : '—'}</span></div>
			<div class="panel-row"><span>Region</span><span>${info?.region || '—'}</span></div>
			<div class="panel-row"><span>Subregion</span><span>${info?.subregion || '—'}</span></div>
			<div class="panel-row"><span>Currencies</span><span>${currencyList}</span></div>
			<div class="panel-row"><span>Languages</span><span>${languageList}</span></div>
		`;
	}

	if (btnGlobalStats) btnGlobalStats.addEventListener('click', async () => {
		show(statsView);
		await initStatsMap();
		setTimeout(() => { if (statsMap) statsMap.invalidateSize(); }, 100);
	});

	if (btnYourStats) btnYourStats.addEventListener('click', () => {
		showYourStats();
	});

	function showYourStats() {
		const statsHtml = `
			<div class="stats-container your-stats-bg">
				<div class="header stats-header">
					<h1>Your Statistics</h1>
					<div>
						<button id="yourStatsBack" class="btn-outline">Back</button>
					</div>
				</div>
				<div class="stats-grid">
					<div class="stat-card">
						<h3>Easy Mode</h3>
						<p>Games Played: ${gameStats.easy.gamesPlayed}</p>
						<p>Countries Guessed: ${gameStats.easy.countriesGuessed}</p>
						<p>Total Countries: ${gameStats.easy.totalCountries}</p>
						<p>Best Time: ${gameStats.easy.bestTime || 'N/A'}</p>
					</div>
					<div class="stat-card">
						<h3>Medium Mode</h3>
						<p>Games Played: ${gameStats.medium.gamesPlayed}</p>
						<p>Countries Guessed: ${gameStats.medium.countriesGuessed}</p>
						<p>Total Countries: ${gameStats.medium.totalCountries}</p>
						<p>Best Time: ${gameStats.medium.bestTime || 'N/A'}</p>
					</div>
					<div class="stat-card">
						<h3>Hard Mode</h3>
						<p>Games Played: ${gameStats.hard.gamesPlayed}</p>
						<p>Countries Guessed: ${gameStats.hard.countriesGuessed}</p>
						<p>Total Countries: ${gameStats.hard.totalCountries}</p>
						<p>Best Time: ${gameStats.hard.bestTime || 'N/A'}</p>
					</div>
				</div>
			</div>
		`;
		
		// Create a temporary view for Your Statistics
		const tempView = document.createElement('div');
		tempView.id = 'yourStatsView';
		tempView.innerHTML = statsHtml;
		tempView.style.display = 'block';
		document.body.appendChild(tempView);
		
		// Add event listener for the back button
		setTimeout(() => {
			const backBtn = document.getElementById('yourStatsBack');
			if (backBtn) {
				backBtn.addEventListener('click', () => {
					document.body.removeChild(tempView);
					show(statsMenuView);
				});
			}
		}, 100);
		
		// Hide other views
		homeView.style.display = 'none';
		modeView.style.display = 'none';
		gameView.style.display = 'none';
		statsMenuView.style.display = 'none';
		statsView.style.display = 'none';
	};

	// Start at Home view
	show(homeView);
})();
