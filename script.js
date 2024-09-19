// script.js
$(document).ready(function() {
    const clientId = '16fdc819e5804fb08562c41677a6c9a4';
    const clientSecret = 'YOUR_CLIENT_SECRET'; // Reemplaza 'YOUR_CLIENT_SECRET' con el valor correcto
    const redirectUri = 'http://localhost:5500/index.html';
    
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state',
    ];
    
    let token = null;
    let deviceId = null;
    let player = null;
    let isPaused = true;
    
    const customTracks = [
        {
            name: 'Feliz Cumpleaños',
            artist: 'Emanuel Frias',
            uri: 'spotify:track:0CXK2VzFuxmkyD0CFg00LJ?si=031eb188c0e84bed',
            description: 'Dios me bendijo cuando te trajo a mi vida,Qué paz inmensa tengo este día',
        },
        {
            name: 'Un mundo diferente',
            artist: 'Ariel Camacho',
            uri: 'spotify:track:3IuoWJJ4HMbpSt82OKV2A4?si=8a39982fa26d4119',
            description: 'Dios me bendijo cuando te trajo a mi vida,Qué paz inmensa tengo este día',
        },
        {
            name: 'Vida Mía',
            artist: 'Jaci Velazquez',
            uri: 'spotify:track:55vAyatdUO6T7WzFCgQPKZ?si=a1ad2e73df4d4f0d',
            description: 'Al mirar al cielo, le doy gracias al creador, Que somos un corazón',
        },
        {
            name: 'Tu Poeta',
            artist: 'Alex Campos',
            uri: 'spotify:track:2kPwXXAHAThgUHUYUH9maK?si=85cc89d2da7e403e',
            description: 'Tú serás mi aliento, serás mi Edén, Mi eterno romance, confidente fiel',
        },
        {
            name: 'Mi historia de amor',
            artist: 'Daniel Calveti',
            uri: 'spotify:track:4Io9nq91YUZNcCeQ0zDcID?si=10da23f158f64819',
            description: 'Bendito aquel día en medianoche cuando oré por ti, Bendito el recuerdo aquí en mi mente el día en que te conocí',
        },
        {
            name: 'Mi gran tesoro',
            artist: 'Os almirantes',
            uri: 'spotify:track:3s7srBsvzIqwcXz2SFfP8g?si=26711974d46e4b8e',
            description: 'Grande es el que nos unió y nos dio la vida, No hay mujer más hermosa que tu mi niña',
        },
    ];

    function initialize() {
        token = localStorage.getItem('spotify_token');
        if (token) {
            setupSpotifyPlayer();
            loadTrackList();
            $('#loginButton').hide();
        } else {
            const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
            token = urlParams.get('access_token');

            if (token) {
                localStorage.setItem('spotify_token', token);
                setupSpotifyPlayer();
                loadTrackList();
                $('#loginButton').hide();
            } else {
                $('#loginButton').show();
            }
        }
    }

    function loadTrackList() {
        $('#songList').empty();
        // Omitimos el primer track al listar las canciones
        customTracks.slice(1).forEach((track, index) => {
            $('#songList').append(`<li data-index="${index + 1}">${track.name} - ${track.artist}</li>`);
        });
    }

    function setupSpotifyPlayer() {
        window.onSpotifyWebPlaybackSDKReady = () => {
            player = new Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(token); },
            });

            player.addListener('ready', ({ device_id }) => {
                console.log('Device ID is ready:', device_id);
                deviceId = device_id;

                // Reproducir una canción automáticamente al iniciar sesión o cargar la página
                const firstTrack = customTracks[0]; // Aquí seleccionas la canción inicial, en este caso la primera de la lista
                playTrack(firstTrack);
            });

            player.addListener('player_state_changed', (state) => {
                if (!state) return;
                isPaused = state.paused;
            });

            player.connect();
        };

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        document.body.appendChild(script);
    }

    function playTrack(track) {
        if (!deviceId) return;

        $.ajax({
            url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            type: 'PUT',
            data: JSON.stringify({ uris: [track.uri] }),
            beforeSend: (xhr) => {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            },
            success: () => {
                $('#trackName').text(track.name);
                $('#trackDescription').text(track.description);
            },
        });
    }

    function pausePlayback() {
        player.pause();
    }

    function resumePlayback() {
        player.resume();
    }

    function nextTrack() {
        $.ajax({
            url: `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`,
            type: 'POST',
            beforeSend: (xhr) => {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        });
    }

    function previousTrack() {
        $.ajax({
            url: `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`,
            type: 'POST',
            beforeSend: (xhr) => {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        });
    }

    // Manejar el intercambio de código por token
    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        })
        .then(response => response.json())
        .then(data => {
            const accessToken = data.access_token;
            localStorage.setItem('spotify_token', accessToken);
            token = accessToken;
            setupSpotifyPlayer();
            loadTrackList();
            $('#loginButton').hide();
        })
        .catch(error => console.error('Error al obtener el token de acceso:', error));
    }

    // Eventos
    $('#loginButton').on('click', function() {
        window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
    });

    $('#songList').on('click', 'li', function() {
        const index = $(this).data('index');
        playTrack(customTracks[index]);
    });

    $('#playPause').on('click', function() {
        isPaused ? resumePlayback() : pausePlayback();
        $(this).text(isPaused ? '⏸ Pausar' : '▶️ Reproducir');
    });

    $('#prevTrack').on('click', function() {
        previousTrack();
    });

    $('#nextTrack').on('click', function() {
        nextTrack();
    });

    // Inicialización
    initialize();
});
