// ====== Versión POO con arreglos [x,y,z] para vectores y matrices ======
// Comentario: cabecera que indica que este archivo contiene una versión orientada
// a objetos (POO) del juego usando arrays [x,y,z] para representar vectores.

// Mantiene el mismo look & feel y mecánicas que tu versión funcional,
// pero encapsulado en clases y con operaciones vectoriales hechas sobre arrays.

// ====== UI ======
// Objeto que guarda referencias a elementos del DOM usados por la UI.
const UI = {
    // Referencia al contenedor del menú principal en el DOM
    menu: document.getElementById('menu'),
    // Referencia al panel de instrucciones
    instrucciones: document.getElementById('instructions'),
    // Referencia al HUD (información durante el juego)
    hud: document.getElementById('hud'),
    // Botón para iniciar el juego
    btnJugar: document.getElementById('playBtn'),
    // Botón para mostrar instrucciones
    btnInstrucciones: document.getElementById('instructionsBtn'),
    // Botón para volver desde instrucciones al menú
    btnVolver: document.getElementById('backBtn'),
    // Botón para reiniciar la partida
    btnReiniciar: document.getElementById('restartBtn'),
    // Botón para alternar visibilidad de ejes
    btnEjes: document.getElementById('toggleAxesBtn'),
    // Botón para alternar cámara dinámica/fija
    btnCamara: document.getElementById('cameraBtn'),
    // Elemento donde se muestra el puntaje
    score: document.getElementById('score'),
    // Elemento donde se muestra la dificultad
    difficulty: document.getElementById('difficulty'),
    // Elemento donde se muestra el tamaño del plato
    plateSize: document.getElementById('plateSize'),
    // Elemento que actúa como "anillo" animado para el temporizador
    anillo: document.getElementById('ringTimer'),
    // Texto dentro del anillo que muestra segundos
    textoAnillo: document.getElementById('ringText'),
    // Contenedor donde se insertará el canvas de three.js
    contenedor: document.getElementById('gameContainer'),
};

// ====== Utilidades de vectores sobre arrays ======
// Operaciones vectoriales simples que trabajan con arrays [x,y,z].
const Vec = {
    // Suma vectorial componente a componente
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    // Resta vectorial componente a componente
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    // Escala un vector por un escalar s
    scale: (v, s) => [v[0] * s, v[1] * s, v[2] * s],
    // Producto punto entre dos vectores
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    // Longitud (norma euclidiana) de un vector
    len: (v) => Math.hypot(v[0], v[1], v[2]),
    // Normaliza un vector (devuelve vector unitario). Si la longitud es 0 evita división por cero.
    norm: (v) => {
        const L = Math.hypot(v[0], v[1], v[2]) || 1; // L = longitud o 1 si es 0
        return [v[0] / L, v[1] / L, v[2] / L]; // devuelve vector normalizado
    },
    // Interpolación lineal (lerp) entre a y b con parámetro t en [0,1]
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

// Rotación de un vector por ángulos de Euler (orden XYZ) usando matrices de rotación básicas.
function rotateXYZ(v, rx, ry, rz) {
    // Calcula cosenos y senos de cada ángulo para construir las rotaciones
    const cx = Math.cos(rx),
        sx = Math.sin(rx);
    const cy = Math.cos(ry),
        sy = Math.sin(ry);
    const cz = Math.cos(rz),
        sz = Math.sin(rz);

    // Rotación alrededor del eje X: aplica a y,z
    let y = v[1] * cx - v[2] * sx;
    let z = v[1] * sx + v[2] * cx;
    let x = v[0]; // x no cambia en rotación X

    // Rotación alrededor del eje Y: aplica a x,z
    let x2 = x * cy + z * sy;
    let z2 = -x * sy + z * cy;
    let y2 = y; // y no cambia en rotación Y

    // Rotación alrededor del eje Z: aplica a x,y
    let x3 = x2 * cz - y2 * sz;
    let y3 = x2 * sz + y2 * cz;
    let z3 = z2; // z no cambia en rotación Z

    // Devuelve el vector rotado [x3,y3,z3]
    return [x3, y3, z3];
}

// ====== Ruido suavizado (para viento) ======
// Generador pseudoaleatorio determinista a partir de un número (valor entre -1 y 1)
function pseudoAleatorio(n) {
    // Usa sin para obtener pseudorandom y escala
    let x = Math.sin(n * 127.1) * 43758.5453;
    // Extrae la fracción y mapea a [-1,1]
    return (x - Math.floor(x)) * 2 - 1;
}
// Interpolación suavizada (Perlin-like) entre valores pseudoaleatorios en enteros
function ruidoSuave(t) {
    const i = Math.floor(t); // entero base
    const f = t - i; // fracción
    const a = pseudoAleatorio(i); // valor en i
    const b = pseudoAleatorio(i + 1); // valor en i+1
    const u = f * f * (3 - 2 * f); // función de suavizado (smoothstep)
    return a * (1 - u) + b * u; // mezcla suavizada
}

// ====== Textura de madera procedural (igual que antes) ======
// Crea una textura tipo madera usando un canvas 2D y la convierte a CanvasTexture de THREE.js
function crearTexturaMadera(w, h) {
    const canvas = document.createElement('canvas'); // crea canvas en memoria
    canvas.width = w; // ancho
    canvas.height = h; // alto
    const ctx = canvas.getContext('2d'); // contexto 2D para dibujar

    // Relleno base marrón oscuro
    ctx.fillStyle = '#7b5428';
    ctx.fillRect(0, 0, w, h);

    // Genera vetas horizontales variando color por cada fila
    for (let y = 0; y < h; y++) {
        const t = y / h; // t en [0,1] según la altura
        // Combina varias sinusoidales para simular vetas
        const ruido = (Math.sin(t * 40) + Math.sin(t * 9 + 1.7) * .5 + Math.sin(t * 3.2 + .6) * .25) * 6;
        // Calcula un tono base y lo ajusta
        const tono = Math.floor(25 + 18 * (Math.sin(t * 18 + ruido * 0.2) + 1));
        // Color RGBA con transparencia baja para superponer vetas
        ctx.fillStyle = `rgba(${90+tono}, ${55+tono*0.6}, ${30+tono*0.4}, 0.18)`;
        ctx.fillRect(0, y, w, 1); // dibuja una línea horizontal
    }

    // Añade algunas líneas más oscuras como nudos
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    for (let i = 1; i < 4; i++) {
        const y = Math.round((h / 4) * i + Math.sin(i * 1.7) * 10); // posición con pequeña perturbación
        ctx.fillRect(0, y, w, 1);
    }

    // Convierte el canvas a textura de three.js y mejora anisotropía para calidad
    const textura = new THREE.CanvasTexture(canvas);
    textura.anisotropy = 8;
    return textura; // devuelve la textura lista para usar
}

// ====== Clases de Entidades ======

// Clase Bola: representa la bola física y su malla
class Bola {
    constructor(radio = 0.35) {
            this.radio = radio; // radio físico de la bola
            this.pos = [0, 3, 0]; // posición en el mundo [x,y,z]
            this.vel = [0, 0, 0]; // velocidad [vx,vy,vz]
            this.malla = null; // referencia a THREE.Mesh que la representa (se asigna luego)
        }
        // Aplica gravedad reduciendo vy (se resta g)
    aplicarGravedad(g) { this.vel[1] -= g; }
        // Mueve la bola integrando la velocidad (posición += velocidad)
    mover() {
            this.pos[0] += this.vel[0];
            this.pos[1] += this.vel[1];
            this.pos[2] += this.vel[2];
        }
        // Sincroniza la malla 3D con la posición física actual (si existe)
    sincronizarMalla() {
        if (!this.malla) return; // si no hay malla no hace nada
        this.malla.position.set(this.pos[0], this.pos[1], this.pos[2]); // actualiza posición de la malla
    }
}

// Clase Plato: representa el disco/plato sobre el que rueda la bola
class Plato {
    constructor(radio = 3.0) {
            this.radio = radio; // radio del plato
            this.pos = [0, 3, 0]; // posición del centro del plato
            this.rot = [0, 0, 0]; // rotaciones en ángulos [rx, ry, rz]
            this.malla = null; // malla THREE.Mesh que representa el plato
        }
        // Cambia el radio y actualiza la geometría de la malla si existe
    setRadio(nuevo) {
            this.radio = nuevo;
            if (this.malla) {
                const nuevaGeo = new THREE.CylinderGeometry(this.radio, this.radio, 0.25, 48); // nueva geometría
                this.malla.geometry.dispose(); // libera la geometría antigua
                this.malla.geometry = nuevaGeo; // asigna la nueva
            }
        }
        // Devuelve la normal del plato en coordenadas del mundo,
        // partiendo de la normal local (0,1,0) y aplicando la rotación
    normalMundo() {
            // Normal local del plato es (0,1,0). La llevamos al mundo con la rotación.
            const n = rotateXYZ([0, 1, 0], this.rot[0], this.rot[1], this.rot[2]);
            return Vec.norm(n); // se normaliza y se devuelve
        }
        // Sincroniza la malla con posición y rotación actuales
    sincronizarMalla() {
        if (!this.malla) return;
        this.malla.position.set(this.pos[0], this.pos[1], this.pos[2]); // set position
        this.malla.rotation.set(this.rot[0], this.rot[1], this.rot[2]); // set rotation
    }
}

// Clase Fisica: contiene constantes y métodos para resolver colisiones/físicas
class Fisica {
    constructor(G = 0.01) {
        this.G = G; // gravedad base del juego (valor usado en integración)
    }

    // Aplica fricción a la velocidad horizontal (vx y vz)
    aplicarFriccion(vel, factor) {
        vel[0] *= factor; // escala vx
        vel[2] *= factor; // escala vz
        // vy no se modifica aquí porque la fricción está pensada como horizontal
    }

    // Colisión bola-plato (plano): corrige interpenetración y aplica componente tangencial de gravedad
    resolverContactoConPlato(bola, plato) {
        const n = plato.normalMundo(); // normal del plano en mundo
        const pBola = bola.pos; // posición de la bola
        const pPlato = plato.pos; // posición del plato (centro)

        // v = p_bola - p_plato (vector desde centro del plato hacia la bola)
        const v = Vec.sub(pBola, pPlato);
        // d = v · n (distancia desde el punto al plano a lo largo de la normal)
        const d = Vec.dot(v, n);

        // Proyección de v sobre el plano: vEnPlano = v - n*d
        const vEnPlano = Vec.sub(v, Vec.scale(n, d));
        // rEnPlano = longitud de la proyección en el plano (distancia radial sobre el plato)
        const rEnPlano = Vec.len(vEnPlano);

        // Borde: si la proyección radial supera el radio del plato => fuera del borde
        if (rEnPlano > plato.radio + 1e-6) {
            // caída libre: baja la bola lentamente simulando que cae fuera
            bola.pos[1] -= 0.12;
            // devuelve objeto indicando si cayó bajo 0 (para terminar)
            return { cayo: (bola.pos[1] <= 0) };
        }

        // Si intersecta el plano (d <= radio de la bola) corregir penetración
        if (d <= bola.radio) {
            const penetracion = bola.radio - d; // cuánto se hundió la bola en el plano
            // corrige la posición sacándola a lo largo de la normal
            bola.pos = Vec.add(bola.pos, Vec.scale(n, penetracion));

            // gravedad como vector hacia abajo
            const gVec = [0, -this.G, 0];
            // componente tangencial de la gravedad: gTang = gVec - (gVec·n) n
            const dot = Vec.dot(gVec, n);
            const gTang = Vec.sub(gVec, Vec.scale(n, dot));

            // aplica sólo las componentes tangenciales a la velocidad (x,z)
            bola.vel[0] += gTang[0];
            bola.vel[2] += gTang[2];

            // fricción tangencial ligera para simular rozamiento sobre el plato
            bola.vel[0] *= 0.995;
            bola.vel[2] *= 0.995;

            // anular componente vertical mientras está apoyada (evita que rebote verticalmente)
            bola.vel[1] = 0;
        } else {
            // Si no hay contacto, amortigua un poco vy para evitar oscilaciones numéricas
            bola.vel[1] *= 0.98;
        }
        // retorna objeto indicando que no cayó fuera
        return { cayo: false };
    }
}

// Clase Entrada: gestiona teclado y aplica aceleraciones a la bola
class Entrada {
    constructor() {
            this.aceleracion = 0.07; // cuanto se suma a la velocidad por tecla
            this.activa = true; // flag para habilitar/deshabilitar entrada
            // handler enlazado para keydown
            this._handler = (e) => {
                if (!this.activa) return; // si entrada desactivada no hace nada
                // evita errores si window.__game no está listo
                const g = window.__game;
                if (!g || !g.bola || !g.bola.vel) return;
                const v = g.bola.vel;
                // lee la tecla y modifica la velocidad de la bola
                if (e.key === 'ArrowLeft') v[0] -= this.aceleracion;
                else if (e.key === 'ArrowRight') v[0] += this.aceleracion;
                else if (e.key === 'ArrowUp') v[2] -= this.aceleracion;
                else if (e.key === 'ArrowDown') v[2] += this.aceleracion;
            };
            // agrega el listener al documento
            document.addEventListener('keydown', this._handler);
        }
        // Método para remover el listener y limpiar
    destruir() {
        document.removeEventListener('keydown', this._handler);
    }
}

// Clase Juego: orquesta todo (estado, entidades, escena three.js, loop)
class Juego {
    constructor() {
        // Estado del juego (inicial)
        this.jugando = false; // si hay una partida en curso
        this.puntaje = 0; // puntaje en segundos
        this.dificultad = 1; // nivel de dificultad inicial
        this.camaraDinamica = true; // si la cámara sigue la bola
        this.ejesVisibles = false; // visibilidad del helper de ejes

        // Entidades físicas
        this.bola = new Bola(0.35); // instancia de Bola
        this.plato = new Plato(3.0); // instancia de Plato
        this.fisica = new Fisica(0.01); // instancia de Fisica con gravedad
        this.viento = [0, 0, 0]; // vector de viento actual
        this.tiempoViento = 0; // acumulador para ruido de viento

        // THREE.js: referencias a escena, cámara y renderizador
        this.escena = null;
        this.camara = null;
        this.renderizador = null;
        this.ejes = null; // AxesHelper

        // timers y referencias a intervalos
        this._intPuntaje = null;
        this._intDificultad = null;

        // entrada de usuario
        this.entrada = new Entrada();

        // Eventos UI: asigna callbacks a botones del DOM
        UI.btnJugar.onclick = () => this.iniciar(); // iniciar partida
        UI.btnInstrucciones.onclick = () => {
            mostrar(UI.instrucciones);
            ocultar(UI.menu);
        }; // mostrar instrucciones
        UI.btnVolver.onclick = () => {
            ocultar(UI.instrucciones);
            mostrar(UI.menu);
        }; // volver al menú
        UI.btnReiniciar.onclick = () => this.reiniciar(); // reiniciar partida
        UI.btnEjes.onclick = () => {
            // alterna visibilidad de ejes y actualiza la propiedad visible si existe
            this.ejesVisibles = !this.ejesVisibles;
            if (this.ejes) this.ejes.visible = this.ejesVisibles;
        };
        UI.btnCamara.onclick = () => {
            // alterna el modo de cámara y actualiza el texto del botón
            this.camaraDinamica = !this.camaraDinamica;
            UI.btnCamara.textContent = `Cámara: ${this.camaraDinamica ? 'Dinámica' : 'Fija'}`;
        };

        // Mostrar menú al cargar la página: esconder instrucciones y HUD
        window.addEventListener('load', () => {
            mostrar(UI.menu);
            ocultar(UI.instrucciones);
            ocultar(UI.hud);
        });
    }

    // Configura la escena de three.js (cámaras, luces, mallas, renderizador)
    configurarEscena() {
        this.escena = new THREE.Scene(); // nueva escena
        this.escena.fog = new THREE.FogExp2(0x0b1020, 0.03); // niebla para profundidad

        // Cámara perspectiva con frustum cercano y lejano
        const aspecto = window.innerWidth / window.innerHeight;
        this.camara = new THREE.PerspectiveCamera(60, aspecto, 0.1, 100);
        this.camara.position.set(0, 6, 12); // posición inicial de la cámara
        this.camara.lookAt(0, 3, 0); // mira al centro del juego

        // Renderizador WebGL con antialias y transparencia
        this.renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderizador.setSize(window.innerWidth, window.innerHeight); // ajusta tamaño
        this.renderizador.shadowMap.enabled = true; // habilita sombras
        this.renderizador.shadowMap.type = THREE.PCFSoftShadowMap; // tipo de sombras
        UI.contenedor.innerHTML = ''; // limpia contenedor DOM
        UI.contenedor.appendChild(this.renderizador.domElement); // inserta canvas

        // Luces: ambiente suave
        const luzAmbiente = new THREE.AmbientLight(0xffe7c5, 0.35);
        this.escena.add(luzAmbiente);

        // Luz puntual para dar brillo y sombras
        const luzPunto = new THREE.PointLight(0xffffff, 1.1, 100);
        luzPunto.position.set(5, 9, 5);
        luzPunto.castShadow = true; // lanza sombras
        this.escena.add(luzPunto);

        // Spotlight para iluminación direccional con target
        const luzSpot = new THREE.SpotLight(0x7fb5ff, 0.7, 40, Math.PI / 5, 0.3, 1.5);
        luzSpot.position.set(-6, 10, -2);
        luzSpot.target = new THREE.Object3D();
        luzSpot.target.position.set(0, 3, 0); // apunta al centro del plato
        luzSpot.castShadow = true;
        this.escena.add(luzSpot.target, luzSpot);

        // Geometrías y materiales
        const texMadera = crearTexturaMadera(512, 512); // textura madera procedural
        texMadera.wrapS = texMadera.wrapT = THREE.RepeatWrapping; // repetición de textura
        const matPlato = new THREE.MeshStandardMaterial({ map: texMadera, roughness: .5, metalness: .05 });
        // crea malla del plato (cilindro)
        this.plato.malla = new THREE.Mesh(new THREE.CylinderGeometry(this.plato.radio, this.plato.radio, 0.25, 48), matPlato);
        this.plato.malla.castShadow = true; // proyecta sombra
        this.plato.malla.receiveShadow = true; // recibe sombra
        this.escena.add(this.plato.malla);

        // Material y malla para la bola
        const matBola = new THREE.MeshStandardMaterial({ color: 0x4caf50, metalness: 0.65, roughness: 0.2 });
        this.bola.malla = new THREE.Mesh(new THREE.SphereGeometry(this.bola.radio, 32, 32), matBola);
        this.bola.malla.castShadow = true;
        this.bola.malla.receiveShadow = true;
        this.escena.add(this.bola.malla);

        // Helper de ejes para debug (opcional)
        this.ejes = new THREE.AxesHelper(5);
        this.ejes.visible = this.ejesVisibles; // visibilidad inicial según flag
        this.escena.add(this.ejes);

        // Animación inicial del plato: rota un poco y vuelve a 0 suavemente
        this.plato.rot[0] = 0.15; // rot X inicial
        this.plato.rot[2] = -0.12; // rot Z inicial
        this.plato.sincronizarMalla(); // aplica rotaciones a la malla
        setTimeout(() => {
            const pasos = 30; // frames de animación
            let i = 0;
            const rx0 = this.plato.rot[0],
                rz0 = this.plato.rot[2]; // valores iniciales
            const anim = setInterval(() => {
                i++;
                const t = i / pasos; // progreso [0,1]
                const suav = 1 - Math.pow(1 - t, 3); // easing cúbico de salida
                this.plato.rot[0] = rx0 * (1 - suav); // interpola a 0
                this.plato.rot[2] = rz0 * (1 - suav);
                this.plato.sincronizarMalla(); // actualiza malla en cada paso
                if (i >= pasos) clearInterval(anim); // termina animación
            }, 16); // ~60 FPS
        }, 300);

        // Listeners de tamaño: ajusta cámara y renderizador cuando cambia la ventana
        this._resize = () => {
            if (!this.renderizador || !this.camara) return;
            this.camara.aspect = window.innerWidth / window.innerHeight; // actualiza aspect
            this.camara.updateProjectionMatrix(); // actualiza matriz de proyección
            this.renderizador.setSize(window.innerWidth, window.innerHeight); // resize canvas
        };
        window.addEventListener('resize', this._resize);
    }

    // Inicia una partida: resetea estado, crea escena y arranca bucles
    iniciar() {
        ocultar(UI.menu); // oculta menú
        ocultar(UI.instrucciones); // oculta instrucciones
        mostrar(UI.hud); // muestra HUD

        // estado inicial de la partida
        this.jugando = true;
        this.puntaje = 0;
        this.dificultad = 1;
        this.plato.setRadio(3.0); // radio inicial del plato
        this.bola.pos = [0, 3, 0]; // posición inicial de la bola
        this.bola.vel = [0, 0, 0]; // velocidad inicial
        UI.score.textContent = String(this.puntaje); // muestra puntaje
        UI.difficulty.textContent = String(this.dificultad); // muestra dificultad
        UI.plateSize.textContent = this.plato.radio.toFixed(1); // muestra tamaño del plato
        UI.anillo.style.setProperty('--progress', `0deg`); // resetea anillo
        UI.textoAnillo.textContent = `0s`; // resetea texto del anillo

        // configura escena three.js
        this.configurarEscena();
        this.actualizarUI(); // sincroniza mallas con estado inicial

        // timers: puntaje incrementa cada segundo
        clearInterval(this._intPuntaje); // limpia si había uno anterior
        this._intPuntaje = setInterval(() => {
            if (!this.jugando) return; // si no está jugando no cuenta
            this.puntaje += 1; // suma 1 segundo
            UI.score.textContent = String(this.puntaje); // actualiza UI
            const grados = Math.min(360, (this.puntaje % 60) * 6); // calcula grados para el anillo
            UI.anillo.style.setProperty('--progress', `${grados}deg`);
            UI.textoAnillo.textContent = `${this.puntaje}s`;
        }, 1000);

        // cada 20s sube la dificultad y reduce el radio del plato
        clearInterval(this._intDificultad);
        this._intDificultad = setInterval(() => {
            if (!this.jugando) return;
            this.dificultad += 1; // aumenta dificultad
            UI.difficulty.textContent = String(this.dificultad);
            this.plato.setRadio(Math.max(1.6, this.plato.radio - 0.2)); // reduce el radio hasta un mínimo
            UI.plateSize.textContent = this.plato.radio.toFixed(1);
        }, 20000);

        // bucle de animación principal: asigna función y solicita frame
        this._anim = () => this.animar(); // bind del loop
        requestAnimationFrame(this._anim); // inicia loop de render
        window.__game = this; // referencia global para Entrada u otras utilidades
    }

    // Reinicia el juego: limpia recursos y vuelve a iniciar
    reiniciar() {
        clearInterval(this._intPuntaje); // limpia intervalos
        clearInterval(this._intDificultad);
        this.jugando = false;

        if (this._resize) window.removeEventListener('resize', this._resize); // remueve listener resize
        if (this.renderizador) this.renderizador.dispose(); // libera renderizador
        if (UI.contenedor) UI.contenedor.innerHTML = ''; // limpia DOM del canvas
        this.iniciar(); // vuelve a iniciar una nueva partida
    }

    // Lógica al perder: muestra alerta con puntaje y reinicia
    perder() {
        if (!this.jugando) return; // si ya no está jugando no hace nada
        this.jugando = false;
        clearInterval(this._intPuntaje);
        clearInterval(this._intDificultad);
        setTimeout(() => {
            alert(`¡Perdiste!\nPuntaje: ${this.puntaje}s\nDificultad alcanzada: ${this.dificultad}`);
            this.reiniciar(); // reinicia después de cerrar alerta
        }, 100);
    }

    // Sincroniza mallas 3D con entidades físicas
    actualizarUI() {
        this.plato.sincronizarMalla();
        this.bola.sincronizarMalla();
    }

    // Bucle principal de animación y física — se ejecuta cada frame
    animar() {
        if (!this.jugando) return; // si la partida terminó no continuar

        // --- Física base ---
        this.bola.vel[1] -= this.fisica.G; // aplica gravedad directamente a vy

        // fricción horizontal (dependiente de dificultad)
        const friccion = 0.985 - Math.min(0.004 * (this.dificultad - 1), 0.01);
        this.fisica.aplicarFriccion(this.bola.vel, friccion); // aplica fricción a vx/vz

        // --- Viento ---
        // incrementa tiempo de viento en cada frame (afecta ruido)
        this.tiempoViento += 0.01 + this.dificultad * 0.001;
        // genera componente x y z del viento usando ruido suave y escala con dificultad
        this.viento[0] = ruidoSuave(this.tiempoViento) * (0.02 + 0.004 * this.dificultad);
        this.viento[2] = ruidoSuave(this.tiempoViento + 100) * (0.02 + 0.004 * this.dificultad);
        // aplica efecto suave del viento a la velocidad de la bola (pequeña influencia)
        this.bola.vel[0] += this.viento[0] * 0.05;
        this.bola.vel[2] += this.viento[2] * 0.05;

        // Integración de movimiento: actualiza posición según velocidad
        this.bola.mover();

        // --- Colisión con plato / borde ---
        const res = this.fisica.resolverContactoConPlato(this.bola, this.plato);
        if (res.cayo) return this.perder(); // si la bola cayó fuera termina la partida

        // --- El plato sigue a la bola ---
        // calcula rotaciones objetivo basadas en posición de la bola (inclinación para seguirla)
        const factor = 0.15 + 0.02 * (this.dificultad - 1);
        const rotX = this.bola.pos[2] * factor; // rotación en X proporcional a z de la bola
        const rotZ = -this.bola.pos[0] * factor; // rotación en Z proporcional a x de la bola (signo invertido)
        // Lerp suave: interpola rotaciones actuales hacia las deseadas (suavizado)
        this.plato.rot[0] += (rotX - this.plato.rot[0]) * 0.15;
        this.plato.rot[2] += (rotZ - this.plato.rot[2]) * 0.15;

        // Sincroniza mallas con nuevas posiciones/rotaciones
        this.actualizarUI();

        // --- Cámara ---
        if (this.camaraDinamica) {
            // si la cámara es dinámica interpola su posición hacia una posición deseada relativa a la bola
            const deseado = [this.bola.pos[0], 6, this.bola.pos[2] + 12];
            const actual = [this.camara.position.x, this.camara.position.y, this.camara.position.z];
            const nuevo = Vec.lerp(actual, deseado, 0.06); // interpolación suave
            this.camara.position.set(nuevo[0], nuevo[1], nuevo[2]); // aplica nueva posición
            this.camara.lookAt(this.bola.pos[0], 3, this.bola.pos[2]); // mira hacia la bola
        } else {
            // cámara fija: posición por defecto
            this.camara.position.set(0, 6, 12);
            this.camara.lookAt(0, 3, 0);
        }

        // Renderiza escena con la cámara actual
        this.renderizador.render(this.escena, this.camara);

        // Solicita el siguiente frame del loop
        requestAnimationFrame(this._anim);
    }
}

// ====== Helpers de UI ======
// Muestra un elemento (gestiona clases CSS)
function mostrar(el) {
    el.classList.remove('hidden');
    el.classList.add('visible');
}
// Oculta un elemento (gestiona clases CSS)
function ocultar(el) {
    el.classList.add('hidden');
    el.classList.remove('visible');
}

// ====== Arranque ======
// Crea la instancia del juego. El constructor ya deja preparado los handlers UI.
new Juego();