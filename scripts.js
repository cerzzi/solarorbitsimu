// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1600 / 800, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById('scene-container');
renderer.setSize(1600, 800);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const followStatus = document.getElementById('followStatus');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const menuContent = document.querySelector('.menu-content');
const bodiesBtn = document.querySelector('.bodies-btn');
const bodiesContent = document.getElementById('bodiesList');

// Simulation parameters
let time = 0;
const sizeScale = 0.000005;
const distanceScale = 50;
let orbitSpeedScale = 0.00125; // 25% of original 0.005
let speedMultiplier = 1.0;
let isPaused = false;
let selectedBody = null;
let followedBody = null;
let isFollowing = false; // Toggleable follow mode
let cameraOffset = new THREE.Vector3(0, 20, 50);
let isMenuOpen = false;
let isBodiesMenuOpen = false;

// Planet data
const solarSystem = {
    sun: { radius: 696000, color: 0xffeb3b, name: 'Sun', info: 'G-type main-sequence star, 4.6 billion years old.' },
    planets: [
        { name: 'Mercury', radius: 2439, distance: 0.39, period: 87.97, color: 0x9e9e9e, info: 'Smallest planet, closest to the Sun.' },
        { name: 'Venus', radius: 6051, distance: 0.72, period: 224.7, color: 0xffcc80, info: 'Second planet, hottest due to greenhouse effect.' },
        { name: 'Earth', radius: 6371, distance: 1, period: 365.25, color: 0x42a5f5, info: 'Third planet, supports life.', moons: [
            { radius: 1737, distance: 0.00257, period: 27.32, color: 0xbdbdbd, name: 'Moon', info: 'Earth\'s satellite.' }
        ]},
        { name: 'Mars', radius: 3389, distance: 1.52, period: 686.98, color: 0xef5350, info: 'Red planet, Olympus Mons.', moons: [
            { radius: 11, distance: 0.0000626, period: 0.32, color: 0x757575, name: 'Phobos', info: 'Larger Mars moon.' },
            { radius: 6, distance: 0.000157, period: 1.26, color: 0x616161, name: 'Deimos', info: 'Smaller Mars moon.' }
        ]},
        { name: 'Jupiter', radius: 69911, distance: 5.2, period: 4332.59, color: 0xd9b38c, info: 'Largest planet.', moons: [
            { radius: 1821, distance: 0.00282, period: 1.77, color: 0xbcaaa4, name: 'Io', info: 'Volcanic moon.' },
            { radius: 1560, distance: 0.00449, period: 3.55, color: 0xffccbc, name: 'Europa', info: 'Icy moon.' },
            { radius: 2631, distance: 0.00714, period: 7.15, color: 0xffab91, name: 'Ganymede', info: 'Largest moon.' },
            { radius: 2410, distance: 0.0126, period: 16.69, color: 0xff8a65, name: 'Callisto', info: 'Cratered moon.' }
        ]},
        { name: 'Saturn', radius: 58232, distance: 9.58, period: 10759.22, color: 0xf5d796, info: 'Gas giant with rings.', moons: [
            { radius: 2575, distance: 0.00831, period: 15.95, color: 0xfff9c4, name: 'Titan', info: 'Moon with atmosphere.' }
        ], hasRings: true},
        { name: 'Uranus', radius: 25362, distance: 19.2, period: 30688.5, color: 0x80deea, info: 'Ice giant.' },
        { name: 'Neptune', radius: 24622, distance: 30.1, period: 59800, color: 0x42a5f5, info: 'Farthest planet.' }
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
sunLight.shadow.camera.left = -1000;
sunLight.shadow.camera.right = 1000;
sunLight.shadow.camera.top = 1000;
sunLight.shadow.camera.bottom = -1000;
scene.add(sunLight);
scene.add(sunLight.target);

const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
scene.add(ambientLight);

solarSystem.planets.forEach(planet => {
    const planetGeometry = new THREE.SphereGeometry(planet.radius * sizeScale, 32, 32);
    const planetMaterial = new THREE.MeshPhongMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);
    bodies.push({ mesh: planetMesh, data: planet });

    const orbitGeometry = new THREE.RingGeometry(planet.distance * distanceScale - 0.1, planet.distance * distanceScale + 0.1, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: planet.color, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitMesh.rotation.x = Math.PI / 2;
    scene.add(orbitMesh);
    orbits.push(orbitMesh);

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

            const moonOrbitGeometry = new THREE.RingGeometry(moon.distance * distanceScale * 100 - 0.05, moon.distance * distanceScale * 100 + 0.05, 32);
            const moonOrbitMaterial = new THREE.MeshBasicMaterial({ color: moon.color, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
            const moonOrbitMesh = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
            moonOrbitMesh.rotation.x = Math.PI / 2;
            planetMesh.add(moonOrbitMesh);
        });
    }
});

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
    speedMultiplier = multiplier;
};

window.pauseOrbit = function() {
    isPaused = true;
};

window.unpauseOrbit = function() {
    isPaused = false;
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
        isFollowing = true; // Enable follow mode
        followStatus.textContent = "Follow Mode: On";
        const targetPos = body.mesh.getWorldPosition(new THREE.Vector3());
        cameraOffset = new THREE.Vector3(0, 20, 50);
        camera.position.copy(targetPos.clone().add(cameraOffset));
        controls.target.copy(targetPos);
        controls.update();
    }
}

// Toggle follow mode with 'E' key
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'e' && followedBody) {
        isFollowing = !isFollowing;
        followStatus.textContent = isFollowing ? "Follow Mode: On" : "Follow Mode: Off";
    }
});

// Raycaster for clicking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener('click', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(bodies.map(b => b.mesh));

    if (intersects.length > 0) {
        const clickedBody = bodies.find(b => b.mesh === intersects[0].object);
        followBody(clickedBody.data.name);
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
function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        time += 1;

        solarSystem.planets.forEach((planet) => {
            const angle = (time * orbitSpeedScale * speedMultiplier * 365.25 / planet.period) * Math.PI * 2;
            const planetMesh = bodies.find(b => b.data.name === planet.name).mesh;
            planetMesh.position.x = planet.distance * distanceScale * Math.cos(angle);
            planetMesh.position.z = planet.distance * distanceScale * Math.sin(angle);

            if (planet.moons) {
                planet.moons.forEach(moon => {
                    const moonMesh = bodies.find(b => b.data.name === moon.name).mesh;
                    const moonAngle = (time * orbitSpeedScale * speedMultiplier * 365.25 / moon.period) * Math.PI * 2;
                    moonMesh.position.x = moon.distance * distanceScale * 100 * Math.cos(moonAngle);
                    moonMesh.position.z = moon.distance * distanceScale * 100 * Math.sin(moonAngle);
                });
            }
        });
    }

    // Follow selected body with adjustable zoom
    if (followedBody && isFollowing) {
        const targetPos = followedBody.mesh.getWorldPosition(new THREE.Vector3());
        controls.target.copy(targetPos);
        const zoomDistance = camera.position.distanceTo(targetPos);
        const direction = cameraOffset.clone().normalize();
        camera.position.copy(targetPos.clone().add(direction.multiplyScalar(zoomDistance)));
        controls.update();
    }

    // WASD movement (only if not following)
    if (!isFollowing) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
        if (keys.w) camera.position.addScaledVector(direction, moveSpeed);
        if (keys.s) camera.position.addScaledVector(direction, -moveSpeed);
        if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
        if (keys.d) camera.position.addScaledVector(right, moveSpeed);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});