// ===== Config =====
const WOOD_URL = "https://threejs.org/examples/textures/hardwood2_diffuse.jpg";
const RADIUS = 5;
const THICK = 0.5;
const ROTATION_SPEED = 0.01; // velocidad lenta
const MAX_ANGLE = Math.PI / 4; // 45 grados en radianes

// ===== Estado de rotación =====
let targetTiltX = 0; // objetivo de inclinación X
let targetTiltZ = 0; // objetivo de inclinación Z
let targetTiltY = 0; // objetivo de inclinación Y

// Matriz identidad 4x4
function identityMatrix() {
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

// Multiplicación de matrices 4x4
function multiplyMatrices(a, b) {
    let result = [];
    for (let i = 0; i < 4; ++i) {
        result[i] = [];
        for (let j = 0; j < 4; ++j) {
            let sum = 0;
            for (let k = 0; k < 4; ++k) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

// Matriz de rotación en X
function rotationMatrixX(angle) {
    let c = Math.cos(angle),
        s = Math.sin(angle);
    return [
        [1, 0, 0, 0],
        [0, c, -s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1]
    ];
}

// Matriz de rotación en Z
function rotationMatrixZ(angle) {
    let c = Math.cos(angle),
        s = Math.sin(angle);
    return [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

function rotationMatrixY(angle) {
    let c = Math.cos(angle),
        s = Math.sin(angle);
    return [
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s, 0, c, 0],
        [0, 0, 0, 1]
    ];
}

// Convierte matriz 4x4 (array) a Float32Array columna mayor para Three.js
function arrayToThreeMatrix(m) {
    // Three.js espera columna mayor: [m00, m10, m20, m30, ...]
    let arr = new Float32Array(16);
    let idx = 0;
    for (let j = 0; j < 4; ++j) {
        for (let i = 0; i < 4; ++i) {
            arr[idx++] = m[i][j];
        }
    }
    return arr;
}

// ===== Contador de tiempo y récord =====
let timer = 0;
let timerInterval = null;
let record = 0;
let gameRunning = false;

// Elementos
const startPanel = document.getElementById('startPanel');
const timerHud = document.getElementById('timerHud');
const timerVal = document.getElementById('timerVal');
const recordVal = document.getElementById('recordVal');
const startBtn = document.getElementById('startBtn');

// Iniciar el juego
function startGame() {
    if (!waitingStart) return; // Solo inicia si espera
    waitingStart = false;
    gameRunning = true;
    timer = 0;
    startPanel.classList.remove('visible');
    startPanel.classList.add('hidden');
    timerHud.style.display = 'grid';
    timerVal.textContent = '0.00';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameRunning) {
            timer += 0.01;
            timerVal.textContent = timer.toFixed(2);
        }
    }, 10);
}

// Mostrar panel de inicio
function showStartPanel() {
    waitingStart = true;
    gameRunning = false;
    timerHud.style.display = 'none';
    startPanel.classList.remove('hidden');
    startPanel.classList.add('visible');
    recordVal.textContent = record.toFixed(2);
    if (timerInterval) clearInterval(timerInterval);

    keys = {};
}

// Botón y tecla para iniciar
let waitingStart = true;

startBtn.onclick = () => {
    if (waitingStart) startGame();
};
window.addEventListener('keydown', (e) => {
    if (waitingStart && (
            e.code === 'ArrowUp' ||
            e.code === 'ArrowDown' ||
            e.code === 'ArrowLeft' ||
            e.code === 'ArrowRight'
        )) {
        startGame();
    }
});

// ===== Fin de contador =====

// ===== Escena =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 10, 20); // un poco arriba y lejos
camera.lookAt(0, 0, 0); // mirar al centro (plato)

// ===== Render =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = "block";
renderer.domElement.style.margin = "0 auto"; // centrar canvas
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// ===== Luces =====
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 12, 8);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x666666));

// ===== Textura madera =====
const loader = new THREE.TextureLoader();
const woodTex = loader.load(WOOD_URL, tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
});

// ===== Plato =====
const platoGeom = new THREE.CylinderGeometry(RADIUS, RADIUS, THICK, 96);
const platoMat = new THREE.MeshPhongMaterial({ map: woodTex });
const plato = new THREE.Mesh(platoGeom, platoMat);
scene.add(plato);

// ===== Pelota =====
const BALL_RADIUS = 0.5;
const ballGeom = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
const ballMat = new THREE.MeshPhongMaterial({ color: 0xff3333 });
const ball = new THREE.Mesh(ballGeom, ballMat);
scene.add(ball);

// Estado de la pelota
let ballPos = { x: 0, y: THICK / 2 + BALL_RADIUS, z: 0 }; // sobre el plato
let ballVel = { x: 0, y: 0, z: 0 };
let ballOnPlate = true;

// Parámetros de física
const BALL_SPEED = 0.005; // mayor que la velocidad del plato
const GRAVITY = 0.01;

//Para usar las matrices
plato.matrixAutoUpdate = false;

// ===== Teclado =====
let keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

function getTiltNormal(rotMatrix) {
    // El vector normal del plato está en [0,1,0] en local. Lo transformamos por la matriz.
    let nx = rotMatrix[0][1];
    let ny = rotMatrix[1][1];
    let nz = rotMatrix[2][1];
    return { x: nx, y: ny, z: nz };
}

// ===== Animación =====
function animate() {
    // Control de inclinación con flechas
    if (keys["ArrowUp"]) targetTiltX -= ROTATION_SPEED;
    if (keys["ArrowDown"]) targetTiltX += ROTATION_SPEED;
    if (keys["ArrowLeft"]) targetTiltZ += ROTATION_SPEED;
    if (keys["ArrowRight"]) targetTiltZ -= ROTATION_SPEED;
    if (keys["KeyA"]) targetTiltY -= ROTATION_SPEED;
    if (keys["KeyD"]) targetTiltY += ROTATION_SPEED;

    // Limitar ángulos
    targetTiltX = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, targetTiltX));
    targetTiltZ = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, targetTiltZ));

    //Todo lo que respecta al plato
    // Rotación suave
    let displayTiltX = targetTiltX;
    let displayTiltZ = targetTiltZ;
    let displayTiltY = targetTiltY;

    // Matrices de rotación
    let rotX = rotationMatrixX(displayTiltX);
    let rotY = rotationMatrixY(displayTiltY);
    let rotZ = rotationMatrixZ(displayTiltZ);

    // Orden: Y (giro), luego X/Z (inclinación); puedes experimentar
    let tmp = multiplyMatrices(rotY, rotX); // Y*X
    let finalMatrix = multiplyMatrices(tmp, rotZ); // (Y*X)*Z

    plato.matrix.fromArray(arrayToThreeMatrix(finalMatrix));

    // --- Pelota física ---
    if (ballOnPlate) {
        let n = getTiltNormal(finalMatrix);
        // La bola se mueve hacia donde se inclina el plato (usa el signo positivo)
        ballVel.x += n.x * BALL_SPEED;
        ballVel.z += n.z * BALL_SPEED;
        ballVel.x *= 0.97;
        ballVel.z *= 0.97;
        // Límite de velocidad
        const BALL_VEL_MAX = 0.2;
        ballVel.x = Math.max(-BALL_VEL_MAX, Math.min(BALL_VEL_MAX, ballVel.x));
        ballVel.z = Math.max(-BALL_VEL_MAX, Math.min(BALL_VEL_MAX, ballVel.z));
        ballPos.x += ballVel.x;
        ballPos.z += ballVel.z;
        ballPos.y = THICK / 2 + BALL_RADIUS;

        const dist = Math.sqrt(ballPos.x * ballPos.x + ballPos.z * ballPos.z);
        if (dist > RADIUS - BALL_RADIUS * 1.05) {
            ballOnPlate = false;
            ballVel.y = 0;
        }
    } else {
        // Pelota cae (simular gravedad vertical)
        ballVel.y -= GRAVITY;
        ballPos.y += ballVel.y;
        if (ballPos.y < -3) {
            ballPos.y = -3;
            ballVel.y = 0;
        }
    }

    // --- Aplica la transformación del plato a la bola ---
    let localBall = [ballPos.x, ballPos.y, ballPos.z, 1];
    let rotatedBall = [0, 0, 0, 0];
    for (let i = 0; i < 4; ++i) {
        let sum = 0;
        for (let j = 0; j < 4; ++j) {
            sum += finalMatrix[i][j] * localBall[j];
        }
        rotatedBall[i] = sum;
    }
    ball.position.set(rotatedBall[0], rotatedBall[1], rotatedBall[2]);

    // Cuando la pelota cae:
    if (!ballOnPlate && ballPos.y < -3 && gameRunning) {
        //Actualiza Record
        if (timer > record) record = timer;
        showStartPanel();
        //Reinicia las posiciones
        ballPos = { x: 0, y: THICK / 2 + BALL_RADIUS, z: 0 };
        ballVel = { x: 0, y: 0, z: 0 };
        ballOnPlate = true;

    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// ===== Resize =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});