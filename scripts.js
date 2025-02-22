// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById('scene-container');
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 1000;
camera.position.set(0, 100, 200);
controls.update();

// Audio
const audio = document.getElementById('interstellarAudio');
let audioStarted = false;
document.body.addEventListener('click', () => {
    if (!audioStarted) {
        audio.play().catch(error => console.log('Audio play failed:', error));
        audioStarted = true;
    }
});

// UI elements
const infoPanel = document.getElementById('infoPanel');
const bodyName = document.getElementById('bodyName');
const bodyInfo = document.getElementById('bodyInfo');
const moreInfoBtn = document.getElementById('moreInfoBtn');
const moreInfoPanel = document.getElementById('moreInfoPanel');
const overviewTab = document.getElementById('overview');
const statsTab = document.getElementById('stats');
const historyTab = document.getElementById('history');
const closeMoreInfoBtn = document.getElementById('closeMoreInfoBtn');
const zoomToBodyBtn = document.getElementById('zoomToBodyBtn');
const stopFollowingBtn = document.getElementById('stopFollowingBtn');
const followStatus = document.getElementById('followStatus');
const eventNotification = document.getElementById('eventNotification');
const helpTooltip = document.getElementById('helpTooltip');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const menuContent = document.querySelector('.menu-content');
const bodiesBtn = document.querySelector('.bodies-btn');
const bodiesContent = document.querySelector('#bodiesList');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Simulation parameters
let time = 0;
const sizeScale = 0.000005;
const distanceScale = 50;
let orbitSpeedScale = 0.00125;
let speedMultiplier = 1.0;
let timeSpeed = 1;
let isPaused = false;
let selectedBody = null;
let followedBody = null;
let isFollowing = false;
let cameraOffset = new THREE.Vector3(0, 20, 50);
let isMenuOpen = false;
let isBodiesMenuOpen = false;
let showTrails = false;
let showLabels = false;

// Planet data with rotation periods (in Earth days) and more info
const solarSystem = {
    sun: { 
        radius: 696000, 
        color: 0xffeb3b, 
        name: 'Sun', 
        info: 'G-type main-sequence star, 4.6 billion years old.',
        moreInfo: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, with a diameter of about 1.391 million kilometers (864,000 miles). It constitutes about 99.86% of the total mass of the Solar System.',
        stats: 'Diameter: 1.391 million km\nMass: 1.989 × 10³⁰ kg\nSurface Temp: ~5,500°C',
        history: 'Formed 4.6 billion years ago from a collapsing molecular cloud.'
    },
    planets: [
        { 
            name: 'Mercury', 
            radius: 2439, 
            distance: 0.39, 
            period: 87.97, 
            rotationPeriod: 58.65, 
            color: 0x9e9e9e, 
            info: 'Smallest planet, closest to the Sun.',
            moreInfo: 'Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 days, the shortest of all the planets. It has no significant atmosphere and a heavily cratered surface resembling the Moon.',
            stats: 'Diameter: 4,879 km\nMass: 3.301 × 10²³ kg\nSurface Temp: -173 to 427°C',
            history: 'Named after the Roman messenger god due to its fast orbit.'
        },
        { 
            name: 'Venus', 
            radius: 6051, 
            distance: 0.72, 
            period: 224.7, 
            rotationPeriod: 243, 
            color: 0xffcc80, 
            info: 'Second planet, hottest due to greenhouse effect.',
            moreInfo: 'Venus is the second planet from the Sun and is similar in size to Earth. It has a thick, toxic atmosphere filled with carbon dioxide and clouds of sulfuric acid, causing an extreme greenhouse effect that makes it the hottest planet, with surface temperatures over 460°C (860°F).',
            stats: 'Diameter: 12,104 km\nMass: 4.867 × 10²⁴ kg\nSurface Temp: ~460°C',
            history: 'Named after the Roman goddess of love and beauty.'
        },
        { 
            name: 'Earth', 
            radius: 6371, 
            distance: 1, 
            period: 365.25, 
            rotationPeriod: 1, 
            color: 0x42a5f5, 
            info: 'Third planet, supports life.',
            moreInfo: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has a diameter of about 12,742 kilometers (7,918 miles) and is covered by 71% water. Its atmosphere is rich in oxygen, supporting a diverse biosphere.',
            stats: 'Diameter: 12,742 km\nMass: 5.972 × 10²⁴ kg\nSurface Temp: -88 to 58°C',
            history: 'Formed 4.54 billion years ago, life emerged ~3.5 billion years ago.',
            texture: 'earthtexture.jpg',
            moons: [
                { 
                    radius: 1737, 
                    distance: 0.00257, 
                    period: 27.32, 
                    rotationPeriod: 27.32, 
                    color: 0xbdbdbd, 
                    name: 'Moon', 
                    info: 'Earth\'s satellite.',
                    moreInfo: 'The Moon is Earth\'s only natural satellite, with a diameter of about 3,474 kilometers (2,159 miles). It is the fifth-largest moon in the Solar System and affects Earth\'s tides. Its surface is marked by craters and maria (basaltic plains).',
                    stats: 'Diameter: 3,474 km\nMass: 7.342 × 10²² kg\nSurface Temp: -233 to 123°C',
                    history: 'Likely formed from debris after a collision with a Mars-sized body.'
                }
            ]
        },
        { 
            name: 'Mars', 
            radius: 3389, 
            distance: 1.52, 
            period: 686.98, 
            rotationPeriod: 1.03, 
            color: 0xef5350, 
            info: 'Red planet, Olympus Mons.',
            moreInfo: 'Mars is the fourth planet from the Sun, known as the "Red Planet" due to its reddish appearance from iron oxide (rust) on its surface. It has the largest volcano in the Solar System, Olympus Mons, and a thin atmosphere primarily of carbon dioxide.',
            stats: 'Diameter: 6,792 km\nMass: 6.417 × 10²³ kg\nSurface Temp: -153 to 20°C',
            history: 'Named after the Roman god of war; explored by numerous missions.',
            moons: [
                { 
                    radius: 11, 
                    distance: 0.0000626, 
                    period: 0.32, 
                    rotationPeriod: 0.32, 
                    color: 0x757575, 
                    name: 'Phobos', 
                    info: 'Larger Mars moon.',
                    moreInfo: 'Phobos is the larger and closer of Mars\'s two moons, with a mean radius of 11 kilometers (6.8 miles). It orbits Mars closely and is gradually spiraling inward, expected to either crash into Mars or break apart in about 50 million years.',
                    stats: 'Diameter: 22 km\nMass: 1.065 × 10¹⁶ kg\nSurface Temp: -112 to -4°C',
                    history: 'Discovered by Asaph Hall in 1877.'
                },
                { 
                    radius: 6, 
                    distance: 0.000157, 
                    period: 1.26, 
                    rotationPeriod: 1.26, 
                    color: 0x616161, 
                    name: 'Deimos', 
                    info: 'Smaller Mars moon.',
                    moreInfo: 'Deimos is the smaller and farther of Mars\'s two moons, with a mean radius of 6 kilometers (3.7 miles). It has a smoother surface than Phobos and is likely a captured asteroid. It orbits Mars every 30.3 hours.',
                    stats: 'Diameter: 12 km\nMass: 1.476 × 10¹⁵ kg\nSurface Temp: -112 to -4°C',
                    history: 'Discovered by Asaph Hall in 1877.'
                }
            ]
        },
        { 
            name: 'Jupiter', 
            radius: 69911, 
            distance: 5.2, 
            period: 4332.59, 
            rotationPeriod: 0.41, 
            color: 0xd9b38c, 
            info: 'Largest planet.',
            moreInfo: 'Jupiter is the fifth planet from the Sun and the largest in the Solar System, with a diameter of about 139,820 kilometers (86,881 miles). It is a gas giant primarily composed of hydrogen and helium, featuring the famous Great Red Spot, a massive storm.',
            stats: 'Diameter: 139,820 km\nMass: 1.898 × 10²⁷ kg\nSurface Temp: -145°C (cloud tops)',
            history: 'Known since ancient times; Galileo discovered its major moons in 1610.',
            moons: [
                { 
                    radius: 1821, 
                    distance: 0.00282, 
                    period: 1.77, 
                    rotationPeriod: 1.77, 
                    color: 0xbcaaa4, 
                    name: 'Io', 
                    info: 'Volcanic moon.',
                    moreInfo: 'Io is the innermost of Jupiter\'s four Galilean moons, with a diameter of 3,643 kilometers (2,263 miles). It is the most volcanically active body in the Solar System, driven by tidal heating from Jupiter\'s gravitational pull.',
                    stats: 'Diameter: 3,643 km\nMass: 8.932 × 10²² kg\nSurface Temp: -143 to 1,500°C',
                    history: 'Discovered by Galileo Galilei in 1610.'
                },
                { 
                    radius: 1560, 
                    distance: 0.00449, 
                    period: 3.55, 
                    rotationPeriod: 3.55, 
                    color: 0xffccbc, 
                    name: 'Europa', 
                    info: 'Icy moon.',
                    moreInfo: 'Europa, one of Jupiter\'s Galilean moons, has a diameter of 3,121 kilometers (1,939 miles). It is covered in a thick layer of ice over a possible subsurface ocean, making it a prime candidate for potential extraterrestrial life.',
                    stats: 'Diameter: 3,121 km\nMass: 4.8 × 10²² kg\nSurface Temp: -171°C',
                    history: 'Discovered by Galileo Galilei in 1610.'
                },
                { 
                    radius: 2631, 
                    distance: 0.00714, 
                    period: 7.15, 
                    rotationPeriod: 7.15, 
                    color: 0xffab91, 
                    name: 'Ganymede', 
                    info: 'Largest moon.',
                    moreInfo: 'Ganymede is the largest moon in the Solar System, with a diameter of 5,262 kilometers (3,269 miles), even larger than Mercury. It has a magnetic field and a mix of cratered and grooved terrain, suggesting a complex geological history.',
                    stats: 'Diameter: 5,262 km\nMass: 1.481 × 10²³ kg\nSurface Temp: -183 to -113°C',
                    history: 'Discovered by Galileo Galilei in 1610.'
                },
                { 
                    radius: 2410, 
                    distance: 0.0126, 
                    period: 16.69, 
                    rotationPeriod: 16.69, 
                    color: 0xff8a65, 
                    name: 'Callisto', 
                    info: 'Cratered moon.',
                    moreInfo: 'Callisto, a Galilean moon of Jupiter, has a diameter of 4,821 kilometers (2,995 miles). It is the most heavily cratered object in the Solar System, with a surface that has remained largely unchanged for billions of years.',
                    stats: 'Diameter: 4,821 km\nMass: 1.076 × 10²³ kg\nSurface Temp: -193 to -108°C',
                    history: 'Discovered by Galileo Galilei in 1610.'
                }
            ]
        },
        { 
            name: 'Saturn', 
            radius: 58232, 
            distance: 9.58, 
            period: 10759.22, 
            rotationPeriod: 0.44, 
            color: 0xf5d796, 
            info: 'Gas giant with rings.',
            moreInfo: 'Saturn is the sixth planet from the Sun and the second-largest in the Solar System, with a diameter of about 116,460 kilometers (72,367 miles). It is famous for its extensive ring system, composed mostly of ice particles with some rocky material.',
            stats: 'Diameter: 116,460 km\nMass: 5.683 × 10²⁶ kg\nSurface Temp: -184°C (cloud tops)',
            history: 'Known since antiquity; rings first observed by Galileo in 1610.',
            moons: [
                { 
                    radius: 2575, 
                    distance: 0.00831, 
                    period: 15.95, 
                    rotationPeriod: 15.95, 
                    color: 0xfff9c4, 
                    name: 'Titan', 
                    info: 'Moon with atmosphere.',
                    moreInfo: 'Titan is Saturn\'s largest moon and the second-largest in the Solar System, with a diameter of 5,150 kilometers (3,200 miles). It is unique for having a substantial atmosphere, denser than Earth\'s, and surface lakes of methane and ethane.',
                    stats: 'Diameter: 5,150 km\nMass: 1.346 × 10²³ kg\nSurface Temp: -179°C',
                    history: 'Discovered by Christiaan Huygens in 1655.'
                }
            ],
            hasRings: true
        },
        { 
            name: 'Uranus', 
            radius: 25362, 
            distance: 19.2, 
            period: 30688.5, 
            rotationPeriod: 0.72, 
            color: 0x80deea, 
            info: 'Ice giant.',
            moreInfo: 'Uranus is the seventh planet from the Sun, with a diameter of about 50,724 kilometers (31,518 miles). It is an ice giant with a pale cyan color due to methane in its atmosphere and a unique feature: it rotates on its side, likely from a past collision.',
            stats: 'Diameter: 50,724 km\nMass: 8.681 × 10²⁵ kg\nSurface Temp: -224°C',
            history: 'Discovered by William Herschel in 1781.'
        },
        { 
            name: 'Neptune', 
            radius: 24622, 
            distance: 30.1, 
            period: 59800, 
            rotationPeriod: 0.67, 
            color: 0x42a5f5, 
            info: 'Farthest planet.',
            moreInfo: 'Neptune is the eighth and farthest planet from the Sun, with a diameter of about 49,244 kilometers (30,598 miles). It is an ice giant known for its deep blue color, caused by methane, and has the strongest winds in the Solar System, up to 2,100 km/h (1,300 mph).',
            stats: 'Diameter: 49,244 km\nMass: 1.024 × 10²⁶ kg\nSurface Temp: -201°C',
            history: 'Discovered by Johann Galle in 1846 based on predictions.'
        }
    ]
};

// Starry background
const starGeometry = new THREE.BufferGeometry();
const starCount = 10000;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2000;
    positions[i + 1] = (Math.random() - 0.5) * 2000;
    positions[i + 2] = (Math.random() - 0.5) * 2000;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Create 3D objects
const bodies = [];
const orbits = [];
const trails = [];
const labels = [];

const sunGeometry = new THREE.SphereGeometry(solarSystem.sun.radius * sizeScale, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: solarSystem.sun.color });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = true;
scene.add(sun);
bodies.push({ mesh: sun, data: solarSystem.sun });

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(0, 0, 0);
sunLight.target.position.set(100, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 2000;
sunLight.shadow.camera.left = -1500;
sunLight.shadow.camera.right = 1500;
sunLight.shadow.camera.top = 1500;
sunLight.shadow.camera.bottom = -1500;
scene.add(sunLight);
scene.add(sunLight.target);

const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
scene.add(ambientLight);

// Asteroid Belt
const asteroidCount = 1000;
const asteroidGeometry = new THREE.BufferGeometry();
const asteroidPositions = new Float32Array(asteroidCount * 3);
for (let i = 0; i < asteroidCount * 3; i += 3) {
    const r = 2.5 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    asteroidPositions[i] = r * distanceScale * Math.cos(theta);
    asteroidPositions[i + 1] = (Math.random() - 0.5) * 5;
    asteroidPositions[i + 2] = r * distanceScale * Math.sin(theta);
}
asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
const asteroidMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.5 });
const asteroidBelt = new THREE.Points(asteroidGeometry, asteroidMaterial);
scene.add(asteroidBelt);

// Planets and moons
solarSystem.planets.forEach(planet => {
    const planetGeometry = new THREE.SphereGeometry(planet.radius * sizeScale, 32, 32);
    const planetMaterial = planet.texture 
        ? new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load(planet.texture) })
        : new THREE.MeshPhongMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);
    bodies.push({ mesh: planetMesh, data: planet });

    const highlightMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0xffff00) },
            intensity: { value: 0.5 }
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float intensity;
            varying vec3 vNormal;
            void main() {
                float glow = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0) * intensity;
                gl_FragColor = vec4(glowColor * glow, glow);
            }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const highlightMesh = new THREE.Mesh(planetGeometry.clone().scale(1.02, 1.02, 1.02), highlightMaterial);
    highlightMesh.visible = false;
    planetMesh.add(highlightMesh);

    if (planet.name === 'Earth') {
        const atmosphereGeometry = new THREE.SphereGeometry(planet.radius * sizeScale * 1.01, 32, 32);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00ccff) },
                intensity: { value: 0.5 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float intensity;
                varying vec3 vNormal;
                void main() {
                    float glow = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0) * intensity;
                    gl_FragColor = vec4(glowColor * glow, glow);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planetMesh.add(atmosphere);
    }

    const orbitGeometry = new THREE.RingGeometry(planet.distance * distanceScale - 0.1, planet.distance * distanceScale + 0.1, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: planet.color, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitMesh.rotation.x = Math.PI / 2;
    scene.add(orbitMesh);
    orbits.push(orbitMesh);

    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(100 * 3);
    const trailMaterial = new THREE.LineBasicMaterial({ color: planet.color, transparent: true, opacity: 0.5 });
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    trail.visible = false;
    scene.add(trail);
    trails.push({ mesh: trail, positions: [], body: planetMesh });

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(createLabelCanvas(`${planet.name} - ${planet.radius} km`)),
        transparent: true
    }));
    sprite.scale.set(10, 5, 1);
    sprite.visible = false;
    sprite.userData = { bodyName: planet.name };
    planetMesh.add(sprite);
    sprite.position.y = planet.radius * sizeScale * 1.5;
    labels.push(sprite);

    if (planet.hasRings) {
        const ringGeometry = new THREE.RingGeometry(planet.radius * sizeScale * 1.2, planet.radius * sizeScale * 1.5, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.receiveShadow = true;
        planetMesh.add(ringMesh);
        ringMesh.rotation.x = Math.PI / 2;
    }

    if (planet.moons) {
        planet.moons.forEach(moon => {
            const moonGeometry = new THREE.SphereGeometry(moon.radius * sizeScale, 16, 16);
            const moonMaterial = new THREE.MeshPhongMaterial({ color: moon.color });
            const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            moonMesh.castShadow = true;
            moonMesh.receiveShadow = true;
            planetMesh.add(moonMesh);
            bodies.push({ mesh: moonMesh, data: moon });

            const moonHighlightMesh = new THREE.Mesh(moonGeometry.clone().scale(1.02, 1.02, 1.02), highlightMaterial);
            moonHighlightMesh.visible = false;
            moonMesh.add(moonHighlightMesh);

            const moonOrbitGeometry = new THREE.RingGeometry(moon.distance * distanceScale * 100 - 0.05, moon.distance * distanceScale * 100 + 0.05, 32);
            const moonOrbitMaterial = new THREE.MeshBasicMaterial({ color: moon.color, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
            const moonOrbitMesh = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
            moonOrbitMesh.rotation.x = Math.PI / 2;
            planetMesh.add(moonOrbitMesh);

            const moonTrailGeometry = new THREE.BufferGeometry();
            const moonTrailPositions = new Float32Array(100 * 3);
            const moonTrailMaterial = new THREE.LineBasicMaterial({ color: moon.color, transparent: true, opacity: 0.5 });
            const moonTrail = new THREE.Line(moonTrailGeometry, moonTrailMaterial);
            moonTrail.visible = false;
            planetMesh.add(moonTrail);
            trails.push({ mesh: moonTrail, positions: [], body: moonMesh });

            const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(createLabelCanvas(`${moon.name} - ${moon.radius} km`)),
                transparent: true
            }));
            moonSprite.scale.set(5, 2.5, 1);
            moonSprite.visible = false;
            moonSprite.userData = { bodyName: moon.name };
            moonMesh.add(moonSprite);
            moonSprite.position.y = moon.radius * sizeScale * 1.5;
            labels.push(moonSprite);
        });
    }
});

// Function to create label canvas
function createLabelCanvas(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas;
}

// Populate bodies menu
const bodyList = [solarSystem.sun, ...solarSystem.planets, ...solarSystem.planets.flatMap(p => p.moons || [])];
bodyList.forEach(body => {
    const button = document.createElement('button');
    button.textContent = body.name;
    button.onclick = () => followBody(body.name);
    bodiesContent.appendChild(button);
});

// Speed control functions
window.setSpeed = function(multiplier) {
    speedMultiplier = parseFloat(multiplier);
    speedValue.textContent = `${Math.round(speedMultiplier * 100)}%`;
};

window.pauseOrbit = function() {
    isPaused = true;
};

window.unpauseOrbit = function() {
    isPaused = false;
};

window.setTimeSpeed = function(speed) {
    timeSpeed = speed;
};

// Settings functions
window.toggleTrails = function() {
    showTrails = !showTrails;
    trails.forEach(trail => trail.mesh.visible = showTrails);
};

window.toggleLabels = function() {
    showLabels = !showLabels;
    labels.forEach(label => label.visible = showLabels);
};

window.resetCamera = function() {
    camera.position.set(0, 100, 200);
    controls.target.set(0, 0, 0);
    controls.enabled = true;
    controls.update();
    isFollowing = false;
    followedBody = null;
    selectedBody = null;
    infoPanel.style.display = 'none';
    moreInfoPanel.style.display = 'none';
    followStatus.textContent = "Follow Mode: Off";
    bodies.forEach(b => b.mesh.children.forEach(c => { if (c.type === 'Mesh' && c.material.type === 'ShaderMaterial') c.visible = false; }));
};

window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
};

window.toggleHelp = function() {
    helpTooltip.style.display = helpTooltip.style.display === 'block' ? 'none' : 'block';
};

// Hamburger menu toggle
hamburgerBtn.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    menuContent.style.display = isMenuOpen ? 'block' : 'none';
});

// Bodies menu toggle
bodiesBtn.addEventListener('click', () => {
    isBodiesMenuOpen = !isBodiesMenuOpen;
    bodiesContent.style.display = isBodiesMenuOpen ? 'block' : 'none';
});

// Follow body function
function followBody(bodyName) {
    const body = bodies.find(b => b.data.name === bodyName);
    if (body) {
        followedBody = body;
        selectedBody = body.data;
        bodyName.textContent = selectedBody.name;
        bodyInfo.textContent = selectedBody.info;
        infoPanel.style.display = 'block';
        isFollowing = true;
        followStatus.textContent = "Follow Mode: On";
        const targetPos = body.mesh.getWorldPosition(new THREE.Vector3());
        cameraOffset = new THREE.Vector3(0, 20, 50); // Reset offset on new follow
        camera.position.copy(targetPos.clone().add(cameraOffset));
        controls.target.copy(targetPos);
        controls.enabled = true; // Enable controls for zoom/pan
        controls.update();
        bodies.forEach(b => b.mesh.children.forEach(c => { if (c.type === 'Mesh' && c.material.type === 'ShaderMaterial') c.visible = false; }));
        body.mesh.children.forEach(c => { if (c.type === 'Mesh' && c.material.type === 'ShaderMaterial' && c !== body.mesh.children.find(m => m.material.type === 'ShaderMaterial' && m.geometry.type === 'SphereGeometry')) c.visible = true; });
    }
}

// Info panel button handlers
moreInfoBtn.addEventListener('click', () => {
    if (selectedBody) {
        overviewTab.textContent = selectedBody.moreInfo;
        statsTab.textContent = selectedBody.stats;
        historyTab.textContent = selectedBody.history;
        moreInfoPanel.style.display = 'block';
        showTab('overview');
    }
});

closeMoreInfoBtn.addEventListener('click', () => {
    infoPanel.style.display = 'none';
    moreInfoPanel.style.display = 'none';
    selectedBody = null;
    followedBody = null;
    isFollowing = false;
    controls.enabled = true;
    controls.update();
    followStatus.textContent = "Follow Mode: Off";
    bodies.forEach(b => b.mesh.children.forEach(c => { if (c.type === 'Mesh' && c.material.type === 'ShaderMaterial') c.visible = false; }));
});

stopFollowingBtn.addEventListener('click', () => {
    isFollowing = false;
    followedBody = null;
    controls.enabled = true;
    controls.update();
    followStatus.textContent = "Follow Mode: Off";
    bodies.forEach(b => b.mesh.children.forEach(c => { if (c.type === 'Mesh' && c.material.type === 'ShaderMaterial') c.visible = false; }));
});

zoomToBodyBtn.addEventListener('click', () => {
    if (selectedBody) {
        const targetPos = followedBody.mesh.getWorldPosition(new THREE.Vector3());
        const direction = cameraOffset.clone().normalize();
        const baseDistance = selectedBody.radius > 10000 ? 10 : 15;
        const zoomTarget = targetPos.clone().add(direction.multiplyScalar(baseDistance));
        const zoomStep = () => {
            camera.position.lerp(zoomTarget, 0.05);
            controls.target.lerp(targetPos, 0.05);
            controls.update();
            if (camera.position.distanceTo(zoomTarget) > 0.1) requestAnimationFrame(zoomStep);
            else if (!isFollowing) controls.enabled = true;
        };
        zoomStep();
    }
});

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// Toggle follow mode with 'E' key
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'e':
            if (followedBody) {
                isFollowing = !isFollowing;
                controls.enabled = true; // Always enabled, adjusted in animation loop
                followStatus.textContent = isFollowing ? "Follow Mode: On" : "Follow Mode: Off";
            }
            break;
        case 't': toggleTrails(); break;
        case 'l': toggleLabels(); break;
        case 'r': resetCamera(); break;
    }
});

// Raycaster for clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default to ensure clicks register
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    // Check for body clicks
    const bodyIntersects = raycaster.intersectObjects(bodies.map(b => b.mesh), true); // Recursive to include children
    if (bodyIntersects.length > 0) {
        const clickedBody = bodies.find(b => b.mesh === bodyIntersects[0].object || b.mesh.children.includes(bodyIntersects[0].object));
        if (clickedBody) {
            followBody(clickedBody.data.name);
            return;
        }
    }

    // Check for label clicks
    const labelIntersects = raycaster.intersectObjects(labels.filter(label => label.visible));
    if (labelIntersects.length > 0) {
        const clickedLabel = labelIntersects[0].object;
        followBody(clickedLabel.userData.bodyName);
    }
});

// WASD camera movement
const moveSpeed = 5;
const keys = { w: false, a: false, s: false, d: false };
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
    }
});
document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
    }
});

// Animation
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (!isPaused) {
        time += timeSpeed;

        solarSystem.planets.forEach((planet) => {
            const angle = (time * orbitSpeedScale * speedMultiplier * 365.25 / planet.period) * Math.PI * 2;
            const planetMesh = bodies.find(b => b.data.name === planet.name).mesh;
            planetMesh.position.x = planet.distance * distanceScale * Math.cos(angle);
            planetMesh.position.z = planet.distance * distanceScale * Math.sin(angle);
            if (planet.rotationPeriod) {
                planetMesh.rotation.y += (2 * Math.PI / (planet.rotationPeriod * 86400)) * timeSpeed * deltaTime;
            }

            if (showTrails) {
                const trail = trails.find(t => t.body === planetMesh);
                trail.positions.push(planetMesh.position.clone());
                if (trail.positions.length > 100) trail.positions.shift();
                trail.mesh.geometry.setFromPoints(trail.positions);
            }

            if (planet.name === 'Earth' && planet.moons) {
                const moon = bodies.find(b => b.data.name === 'Moon').mesh;
                const sunPos = sun.position;
                const earthPos = planetMesh.position;
                const moonPos = moon.getWorldPosition(new THREE.Vector3());
                const sunToEarth = earthPos.clone().sub(sunPos).normalize();
                const earthToMoon = moonPos.clone().sub(earthPos).normalize();
                const dot = sunToEarth.dot(earthToMoon);
                if (dot > 0.999 && moonPos.distanceTo(earthPos) < planet.radius * sizeScale * 100) {
                    showNotification("Earth-Moon Eclipse Detected!");
                }
            }

            if (planet.moons) {
                planet.moons.forEach(moon => {
                    const moonMesh = bodies.find(b => b.data.name === moon.name).mesh;
                    const moonAngle = (time * orbitSpeedScale * speedMultiplier * 365.25 / moon.period) * Math.PI * 2;
                    moonMesh.position.x = moon.distance * distanceScale * 100 * Math.cos(moonAngle);
                    moonMesh.position.z = moon.distance * distanceScale * 100 * Math.sin(moonAngle);
                    if (moon.rotationPeriod) {
                        moonMesh.rotation.y += (2 * Math.PI / (moon.rotationPeriod * 86400)) * timeSpeed * deltaTime;
                    }

                    if (showTrails) {
                        const moonTrail = trails.find(t => t.body === moonMesh);
                        moonTrail.positions.push(moonMesh.position.clone());
                        if (moonTrail.positions.length > 100) moonTrail.positions.shift();
                        moonTrail.mesh.geometry.setFromPoints(moonTrail.positions);
                    }
                });
            }
        });
    }

    if (followedBody && isFollowing) {
        const targetPos = followedBody.mesh.getWorldPosition(new THREE.Vector3());
        controls.target.copy(targetPos);
        const currentDistance = camera.position.distanceTo(targetPos);
        const direction = camera.position.clone().sub(targetPos).normalize();
        cameraOffset.copy(direction.multiplyScalar(currentDistance)); // Update offset dynamically
        camera.position.copy(targetPos.clone().add(cameraOffset));
        controls.update(); // Allow zoom/pan with mouse
    } else {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
        if (keys.w) camera.position.addScaledVector(direction, moveSpeed);
        if (keys.s) camera.position.addScaledVector(direction, -moveSpeed);
        if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
        if (keys.d) camera.position.addScaledVector(right, moveSpeed);
        controls.update();
    }

    renderer.render(scene, camera);
}

// Show notification
function showNotification(message) {
    eventNotification.textContent = message;
    eventNotification.style.display = 'block';
    setTimeout(() => {
        eventNotification.style.display = 'none';
    }, 5000);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});