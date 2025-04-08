// Spotify API Configuration
const clientId = '0dc72c6d704a4ed6a04eee09782dc1eb'; // Updated client ID
const redirectUri = 'https://spotify-analystics.vercel.app/'; // Updated redirect URI

// State variables
let accessToken = '';
let currentTimeRange = 'medium_term';
let refreshInterval;
let playerInterval;

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login-section');
const statsSection = document.getElementById('stats-section');
const timeRangeButtons = document.querySelectorAll('.time-btn');
const topArtistsDiv = document.getElementById('top-artists');
const topTracksDiv = document.getElementById('top-tracks');
const audioFeaturesDiv = document.getElementById('audio-features');
const moodGraphDiv = document.getElementById('mood-graph');
const nowPlayingDiv = document.getElementById('now-playing');
const nowPlayingImg = document.getElementById('now-playing-img');
const nowPlayingTitle = document.getElementById('now-playing-title');
const nowPlayingArtist = document.getElementById('now-playing-artist');
const nowPlayingProgressBar = document.getElementById('now-playing-progress-bar');
const nowPlayingCurrentTime = document.getElementById('now-playing-current-time');
const nowPlayingDuration = document.getElementById('now-playing-duration');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Initialize the app
function init() {
    initBackground();
    checkForAccessToken();
    setupEventListeners();
}

// Initialize background circles
function initBackground() {
    const bgAnimation = document.querySelector('.bg-animation');
    for (let i = 0; i < 8; i++) {
        const circle = document.createElement('div');
        circle.className = 'bg-circle';
        circle.style.width = `${Math.random() * 300 + 100}px`;
        circle.style.height = circle.style.width;
        circle.style.top = `${Math.random() * 100}%`;
        circle.style.left = `${Math.random() * 100}%`;
        circle.style.animationDelay = `${Math.random() * 10}s`;
        circle.style.opacity = Math.random() * 0.2 + 0.05;
        bgAnimation.appendChild(circle);
    }
}

// Setup event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    timeRangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeRangeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTimeRange = btn.dataset.range;
            fetchData();
        });
    });
    
    playBtn.addEventListener('click', togglePlayback);
    prevBtn.addEventListener('click', skipToPrevious);
    nextBtn.addEventListener('click', skipToNext);
}

// Spotify Login Flow
function handleLogin() {
    const scope = [
        'user-top-read',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-recently-played'
    ].join(' ');
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
        client_id: clientId,
        response_type: 'token',
        redirect_uri: redirectUri,
        scope: scope,
        show_dialog: true
    };
    
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl;
}

// Check for access token in URL or localStorage
function checkForAccessToken() {
    // Check URL hash first
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.has('access_token')) {
        accessToken = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in')) * 1000;
        
        // Store token and expiry
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_token_expiry', Date.now() + expiresIn);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show app content
        showAppContent();
    }
    // Check localStorage for existing token
    else {
        const storedToken = localStorage.getItem('spotify_access_token');
        const expiry = localStorage.getItem('spotify_token_expiry');
        
        if (storedToken && expiry && Date.now() < expiry) {
            accessToken = storedToken;
            showAppContent();
        }
    }
}

function showAppContent() {
    loginSection.style.display = 'none';
    statsSection.style.display = 'block';
    fetchData();
    startPlayerUpdates();
}

// Logout function
function handleLogout() {
    accessToken = '';
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    loginSection.style.display = 'flex';
    statsSection.style.display = 'none';
    clearInterval(refreshInterval);
    clearInterval(playerInterval);
}

// Fetch data from Spotify API
async function fetchData() {
    if (!accessToken) return;
    
    try {
        // Fetch top artists
        await fetchTopArtists();
        
        // Fetch top tracks
        await fetchTopTracks();
        
        // Fetch currently playing
        await fetchCurrentlyPlaying();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        if (error.status === 401) {
            handleLogout();
        }
    }
}

async function fetchTopArtists() {
    topArtistsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Scanning your music taste...
        </div>
    `;
    
    const res = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${currentTimeRange}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!res.ok) throw res;
    
    const data = await res.json();
    displayTopArtists(data.items);
}

function displayTopArtists(artists) {
    if (!artists || artists.length === 0) {
        topArtistsDiv.innerHTML = '<div class="empty-state">No artist data available</div>';
        return;
    }
    
    topArtistsDiv.innerHTML = '';
    
    artists.forEach((artist, index) => {
        const artistDiv = document.createElement('div');
        artistDiv.className = 'item';
        artistDiv.innerHTML = `
            <div class="item-rank">${index + 1}</div>
            <img src="${artist.images[0]?.url || 'https://via.placeholder.com/56'}" 
                 alt="${artist.name}" 
                 class="item-img artist-img">
            <div class="item-info">
                <div class="item-title">${artist.name}</div>
                <div class="item-subtitle">${artist.genres.slice(0, 2).join(', ') || 'Various genres'}</div>
            </div>
        `;
        artistDiv.addEventListener('click', () => {
            window.open(artist.external_urls.spotify, '_blank');
        });
        topArtistsDiv.appendChild(artistDiv);
    });
}

async function fetchTopTracks() {
    topTracksDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Analyzing your listening patterns...
        </div>
    `;
    
    const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${currentTimeRange}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!res.ok) throw res;
    
    const data = await res.json();
    displayTopTracks(data.items);
    
    // Fetch audio features for these tracks
    if (data.items.length > 0) {
        const trackIds = data.items.map(track => track.id).join(',');
        await fetchAudioFeatures(trackIds);
    }
}

function displayTopTracks(tracks) {
    if (!tracks || tracks.length === 0) {
        topTracksDiv.innerHTML = '<div class="empty-state">No track data available</div>';
        return;
    }
    
    topTracksDiv.innerHTML = '';
    
    tracks.forEach((track, index) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'item';
        trackDiv.innerHTML = `
            <div class="item-rank">${index + 1}</div>
            <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/56'}" 
                 alt="${track.name}" 
                 class="item-img">
            <div class="item-info">
                <div class="item-title">${track.name}</div>
                <div class="item-subtitle">${track.artists.map(a => a.name).join(', ')}</div>
            </div>
        `;
        trackDiv.addEventListener('click', () => {
            window.open(track.external_urls.spotify, '_blank');
        });
        topTracksDiv.appendChild(trackDiv);
    });
}

async function fetchAudioFeatures(trackIds) {
    audioFeaturesDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Decoding your audio preferences...
        </div>
    `;
    
    const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!res.ok) throw res;
    
    const data = await res.json();
    displayAudioFeatures(data.audio_features);
    displayMoodGraph(data.audio_features);
}

function displayAudioFeatures(features) {
    if (!features || features.length === 0) {
        audioFeaturesDiv.innerHTML = '<div class="empty-state">No audio features available</div>';
        return;
    }
    
    // Calculate averages
    const avg = {
        danceability: 0,
        energy: 0,
        speechiness: 0,
        acousticness: 0,
        instrumentalness: 0,
        liveness: 0,
        valence: 0
    };
    
    features.forEach(f => {
        avg.danceability += f.danceability;
        avg.energy += f.energy;
        avg.speechiness += f.speechiness;
        avg.acousticness += f.acousticness;
        avg.instrumentalness += f.instrumentalness;
        avg.liveness += f.liveness;
        avg.valence += f.valence;
    });
    
    Object.keys(avg).forEach(k => avg[k] = (avg[k] / features.length).toFixed(3));
    
    audioFeaturesDiv.innerHTML = `
        <div class="feature">
            <div class="feature-name">Danceability</div>
            <div class="feature-value">${(avg.danceability * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.danceability * 100}%"></div>
            </div>
        </div>
        <div class="feature">
            <div class="feature-name">Energy</div>
            <div class="feature-value">${(avg.energy * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.energy * 100}%"></div>
            </div>
        </div>
        <div class="feature">
            <div class="feature-name">Positivity</div>
            <div class="feature-value">${(avg.valence * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.valence * 100}%"></div>
            </div>
        </div>
        <div class="feature">
            <div class="feature-name">Acoustic</div>
            <div class="feature-value">${(avg.acousticness * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.acousticness * 100}%"></div>
            </div>
        </div>
        <div class="feature">
            <div class="feature-name">Instrumental</div>
            <div class="feature-value">${(avg.instrumentalness * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.instrumentalness * 100}%"></div>
            </div>
        </div>
        <div class="feature">
            <div class="feature-name">Liveness</div>
            <div class="feature-value">${(avg.liveness * 100).toFixed(0)}%</div>
            <div class="feature-bar">
                <div class="feature-progress" style="width: ${avg.liveness * 100}%"></div>
            </div>
        </div>
    `;
}

function displayMoodGraph(features) {
    if (!features || features.length === 0) {
        moodGraphDiv.innerHTML = '<div class="empty-state">No mood data available</div>';
        return;
    }
    
    moodGraphDiv.innerHTML = `
        <div class="mood-axis">
            <div class="mood-line" style="top: 25%"></div>
            <div class="mood-line" style="top: 50%"></div>
            <div class="mood-line" style="top: 75%"></div>
        </div>
        <svg class="mood-path" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${features.map((f, i) => 
                `${(i / (features.length - 1)) * 100},${100 - (f.valence * 100)}`).join(' ')}" />
        </svg>
        <div class="mood-labels">
            <span>Sad</span>
            <span>Happy</span>
        </div>
    `;
    
    // Add points for each track
    features.forEach((feature, i) => {
        const point = document.createElement('div');
        point.className = 'mood-point';
        point.style.left = `${(i / (features.length - 1)) * 100}%`;
        point.style.top = `${100 - (feature.valence * 100)}%`;
        point.setAttribute('data-energy', feature.energy);
        point.setAttribute('data-valence', feature.valence);
        
        moodGraphDiv.appendChild(point);
    });
}

async function fetchCurrentlyPlaying() {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.status === 200) {
        const data = await res.json();
        displayNowPlaying(data.item, data.progress_ms, data.item.duration_ms);
    } else {
        nowPlayingDiv.style.display = 'none';
    }
}

function displayNowPlaying(track, progressMs, durationMs) {
    if (!track) {
        nowPlayingDiv.style.display = 'none';
        return;
    }
    
    nowPlayingDiv.style.display = 'flex';
    nowPlayingImg.src = track.album.images[0]?.url || 'https://via.placeholder.com/160';
    nowPlayingTitle.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(a => a.name).join(', ');
    
    // Update progress bar
    updateProgressBar(progressMs, durationMs);
    
    // Start updating progress
    clearInterval(playerInterval);
    playerInterval = setInterval(() => {
        if (progressMs < durationMs) {
            progressMs += 1000;
            updateProgressBar(progressMs, durationMs);
        }
    }, 1000);
}

function updateProgressBar(progressMs, durationMs) {
    const progressPercent = (progressMs / durationMs) * 100;
    nowPlayingProgressBar.style.width = `${progressPercent}%`;
    nowPlayingCurrentTime.textContent = formatTime(progressMs);
    nowPlayingDuration.textContent = formatTime(durationMs);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Player controls
async function togglePlayback() {
    try {
        const res = await fetch('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (res.status === 200) {
            const playerState = await res.json();
            
            if (playerState.is_playing) {
                await fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                await fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        }
    } catch (error) {
        console.error('Error toggling playback:', error);
    }
}

async function skipToPrevious() {
    try {
        await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setTimeout(fetchCurrentlyPlaying, 500);
    } catch (error) {
        console.error('Error skipping to previous:', error);
    }
}

async function skipToNext() {
    try {
        await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        setTimeout(fetchCurrentlyPlaying, 500);
    } catch (error) {
        console.error('Error skipping to next:', error);
    }
}

// Start player updates
function startPlayerUpdates() {
    refreshInterval = setInterval(fetchData, 30000); // Refresh every 30 seconds
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginSection = document.getElementById('login-section');
    const statsSection = document.getElementById('stats-section');

    loginBtn.addEventListener('click', () => SpotifyAuth.login());
    logoutBtn.addEventListener('click', () => SpotifyAuth.logout());

    if (SpotifyAuth.checkForAccessToken()) {
        loginSection.style.display = 'none';
        statsSection.style.display = 'block';
        fetchData();
    } else {
        loginSection.style.display = 'flex';
        statsSection.style.display = 'none';
    }

    async function fetchData() {
        const accessToken = SpotifyAuth.getAccessToken();
        if (!accessToken) return;

        // Fetch and display data from Spotify API
        // ...existing fetch logic...
    }
});