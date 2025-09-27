// ================================
// Aplicación 3D: Perspectiva Cónica (Refactorizada y Mejorada)
// ================================

// ==== ViewCube optimizado ====
function ViewCube(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error("No se encontró el contenedor ViewCube");
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'viewcube-canvas';
    this.canvas.width = 100;
    this.canvas.height = 100;
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.camaraAngulo = { x: 0, y: 0 };
    this.necesitaRedibujo = true;
    this.dibujar();
    this.agregarEventos();
}
ViewCube.prototype.dibujar = function() {
    if (!this.necesitaRedibujo) return;
    var ctx = this.ctx;
    var w = this.canvas.width,
        h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4abaff';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(74, 186, 255, 0.1)';
    var centroX = w / 2,
        centroY = h / 2,
        tamaño = 30;
    var rotX = this.camaraAngulo.x,
        rotY = this.camaraAngulo.y;
    var puntos3D = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1]
    ];
    var puntos2D = puntos3D.map(function(p) {
        var x = p[0],
            y = p[1] * Math.cos(rotX) - p[2] * Math.sin(rotX),
            z = p[1] * Math.sin(rotX) + p[2] * Math.cos(rotX);
        var x2 = x * Math.cos(rotY) - z * Math.sin(rotY),
            z2 = x * Math.sin(rotY) + z * Math.cos(rotY),
            y2 = y;
        var factor = 200 / (200 + z2);
        return { x: centroX + x2 * tamaño * factor, y: centroY + y2 * tamaño * factor };
    });
    var caras = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 4, 7, 3],
        [1, 5, 6, 2],
        [0, 1, 5, 4],
        [3, 2, 6, 7]
    ];
    caras.forEach(function(cara) {
        var puntosCara = cara.map(function(idx) { return puntos2D[idx]; });
        ctx.beginPath();
        ctx.moveTo(puntosCara[0].x, puntosCara[0].y);
        for (var j = 1; j < puntosCara.length; j++) ctx.lineTo(puntosCara[j].x, puntosCara[j].y);
        ctx.closePath();
        ctx.stroke();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rotY > 0 ? 'F' : 'T', centroX, centroY);
    this.necesitaRedibujo = false;
};
ViewCube.prototype.actualizarDesdeCamara = function(camara) {
    var dx = camara.position.x,
        dy = camara.position.y,
        dz = camara.position.z;
    var nuevoAnguloY = Math.atan2(dx, dz);
    var nuevoAnguloX = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    if (Math.abs(nuevoAnguloX - this.camaraAngulo.x) > 0.01 || Math.abs(nuevoAnguloY - this.camaraAngulo.y) > 0.01) {
        this.camaraAngulo.x = nuevoAnguloX;
        this.camaraAngulo.y = nuevoAnguloY;
        this.necesitaRedibujo = true;
        this.dibujar();
    }
};
ViewCube.prototype.agregarEventos = function() {
    this.canvas.addEventListener('click', function(e) {
        // puedes agregar lógica aquí si lo necesitas
    });
};

// ==== Figura3D optimizada ====
function Figura3D(tipo) {
    this.tipo = tipo || "cubo";
    this.objeto3D = this.crearFigura(this.tipo);
    this.bordes = this.crearBordes(this.objeto3D.geometry);
    this.vertices = this.crearVertices(this.objeto3D.geometry);
}
Figura3D.prototype.crearFigura = function(tipo) {
    var geometria, material = new THREE.MeshPhongMaterial({
        color: 0xf5f5f5,
        shininess: 70,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
    });
    switch (tipo) {
        case "cubo":
            geometria = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            break;
        case "piramide":
            geometria = new THREE.ConeGeometry(1, 1.5, 4);
            break;
        case "esfera":
            geometria = new THREE.SphereGeometry(0.85, 32, 32);
            break;
        default:
            geometria = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    }
    var mesh = new THREE.Mesh(geometria, material);
    mesh.position.set(0, 1, 0);
    return mesh;
};
Figura3D.prototype.crearBordes = function(geometria) {
    var edges = (this.tipo === "esfera") ? new THREE.WireframeGeometry(geometria) : new THREE.EdgesGeometry(geometria);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    line.position.copy(this.objeto3D.position);
    return line;
};
Figura3D.prototype.crearVertices = function(geometria) {
    var positions = [];
    if (this.tipo === "cubo") {
        geometria.computeBoundingBox();
        var min = geometria.boundingBox.min,
            max = geometria.boundingBox.max;
        for (var i = 0; i < 8; i++) positions.push(new THREE.Vector3(
            i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z
        ).add(this.objeto3D.position));
    } else if (this.tipo === "piramide") {
        for (var i = 0; i < 4; i++) {
            var ang = (Math.PI / 2) * i;
            positions.push(new THREE.Vector3(Math.cos(ang), -0.75, Math.sin(ang)).add(this.objeto3D.position));
        }
        positions.push(new THREE.Vector3(0, 0.75, 0).add(this.objeto3D.position));
    } else if (this.tipo === "esfera") {
        var r = 0.85,
            pos = this.objeto3D.position;
        positions = [
            new THREE.Vector3(pos.x + r, pos.y, pos.z),
            new THREE.Vector3(pos.x - r, pos.y, pos.z),
            new THREE.Vector3(pos.x, pos.y + r, pos.z),
            new THREE.Vector3(pos.x, pos.y - r, pos.z),
            new THREE.Vector3(pos.x, pos.y, pos.z + r),
            new THREE.Vector3(pos.x, pos.y, pos.z - r),
        ];
    }
    return positions.map(function(v) {
        var esfera = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 14, 14),
            new THREE.MeshBasicMaterial({ color: 0x00eaff })
        );
        esfera.position.copy(v);
        return esfera;
    });
};
Figura3D.prototype.cambiarFigura = function(nuevoTipo) {
    this.tipo = nuevoTipo;
    this.objeto3D = this.crearFigura(nuevoTipo);
    this.bordes = this.crearBordes(this.objeto3D.geometry);
    this.vertices = this.crearVertices(this.objeto3D.geometry);
};
Figura3D.prototype.moverFigura = function(dx, dy, dz) {
    this.objeto3D.position.x += dx;
    this.objeto3D.position.y += dy;
    this.objeto3D.position.z += dz;
    this.bordes.position.copy(this.objeto3D.position);
    this.vertices.forEach(function(v) {
        v.position.add(new THREE.Vector3(dx, dy, dz));
    });
};
Figura3D.prototype.obtenerVertices = function() {
    return this.vertices.map(function(esfera) { return esfera.position.clone(); });
};
Figura3D.prototype.agregarComponentes = function(escena) {
    escena.add(this.objeto3D);
    escena.add(this.bordes);
    this.vertices.forEach(function(v) { escena.add(v); });
};
Figura3D.prototype.removerComponentes = function(escena) {
    escena.remove(this.objeto3D);
    escena.remove(this.bordes);
    this.vertices.forEach(function(v) { escena.remove(v); });
};

// ==== ProyeccionesCónicas mejorada (vanishing points correctos) ====
function ProyeccionesConicas(tipo, camera, foco) {
    // tipo: 1,2,3 puntos de fuga
    this.tipo = tipo || 1;
    this.camera = camera;
    // foco: punto de referencia para calcular direcciones (por defecto centro de la figura)
    this.foco = foco || new THREE.Vector3(0, 1, 0);
    this.puntosFuga = [];
    this.lineasProyeccion = [];
    this.grupoLineas = new THREE.Group();
    this.puntoFugaSeleccionado = null;
    this.crearPuntosDeFuga();
}

/*
  Estrategia para calcular puntos de fuga:
  - Para cada dirección (por ejemplo, eje X, eje Z, eje Y) tomamos un punto muy lejano
    en esa dirección respecto del foco de la figura (p = foco + dir * large).
  - Proyectamos ese punto con camera.project() para obtener sus coordenadas NDC.
  - Unproject de esas coordenadas NDC (con z fijo en 0.5) nos devuelve una posición finita en el mundo
    que corresponde al punto de fuga visible en la pantalla. Esto hace que los puntos de fuga
    aparezcan en la imagen en la posición correcta independientemente del FOV o aspect.
*/
ProyeccionesConicas.prototype._calcularPuntoFuga = function(dir) {
    var cam = this.camera;
    var foco = this.foco || new THREE.Vector3(0, 1, 0);
    var muyLejano = foco.clone().add(dir.clone().normalize().multiplyScalar(1e6));
    // proyectar a NDC
    var ndc = muyLejano.clone().project(cam);
    // Si no es finito (dir casi paralelo a la cámara), devolvemos fallback en la dirección de la cámara
    if (!isFinite(ndc.x) || !isFinite(ndc.y)) {
        var fallback = cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(1000));
        return fallback;
    }
    // unproject en un punto intermedio del frustum para obtener una posición en el mundo
    var worldPoint = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(cam);
    return worldPoint;
};

ProyeccionesConicas.prototype.crearPuntosDeFuga = function() {
    // eliminar antiguos
    this.puntosFuga = [];
    // remover children del grupo (compatibilidad)
    while (this.grupoLineas.children.length > 0) this.grupoLineas.remove(this.grupoLineas.children[0]);

    var coloresFuga = [0xff4a4a, 0x34e56a, 0x4abaff];
    var foco = this.foco.clone();

    // direcciones base en sistema de coordenadas del mundo (la figura está alineada con el mundo)
    var direcciones = [];
    if (this.tipo === 1) {
        // un solo punto de fuga: dirección del eje de la vista (donde mira la cámara)
        var frente = new THREE.Vector3();
        this.camera.getWorldDirection(frente);
        direcciones.push(frente.clone());
    } else {
        // 2 o 3 puntos: dos en el horizonte (ejes X y Z relativos al mundo)
        direcciones.push(new THREE.Vector3(1, 0, 0)); // eje X positivo
        direcciones.push(new THREE.Vector3(0, 0, -1)); // eje Z negativo (hacia delante)
    }
    if (this.tipo === 3) {
        // tercer punto: eje Y (arriba o abajo). Elegimos la dirección vertical que hace converger
        // hacia arriba o hacia abajo según la posición de la cámara relativa al foco.
        var vertical = (this.camera.position.y > foco.y) ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0);
        direcciones.push(vertical);
    }

    for (var i = 0; i < direcciones.length; i++) {
        var dir = direcciones[i];
        var posFuga = this._calcularPuntoFuga(dir);
        this.puntosFuga.push(this.crearPuntoFuga(posFuga, coloresFuga[i], i));
    }
};

ProyeccionesConicas.prototype.crearPuntoFuga = function(posicion, color, idx) {
    var esfera = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), new THREE.MeshBasicMaterial({ color: color }));
    esfera.position.copy(posicion);
    esfera.userData.indiceFuga = idx;
    this.grupoLineas.add(esfera);
    return esfera;
};

ProyeccionesConicas.prototype.actualizar = function(verticesFig, tipoFigura) {
    var self = this;
    // remover lineas anteriores
    this.lineasProyeccion.forEach(function(l) { self.grupoLineas.remove(l); });
    this.lineasProyeccion = [];

    // si no hay puntos de fuga (por ejemplo tipo cambiado y aún no recreados), recreamos
    if (this.puntosFuga.length === 0) this.crearPuntosDeFuga();

    // crear líneas guía desde cada vértice hasta cada punto de fuga calculado
    verticesFig.forEach(function(vertice) {
        self.puntosFuga.forEach(function(pFuga) {
            var geometry = new THREE.BufferGeometry().setFromPoints([vertice.clone(), pFuga.position.clone()]);
            var linea = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                color: pFuga.material.color.getHex(),
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            }));
            self.lineasProyeccion.push(linea);
            self.grupoLineas.add(linea);
        });
    });

    // realzar punto seleccionado
    self.puntosFuga.forEach(function(punto, i) {
        punto.material.opacity = (i === self.puntoFugaSeleccionado) ? 1 : 0.6;
        punto.material.transparent = true;
        punto.scale.set(i === self.puntoFugaSeleccionado ? 1.6 : 1, i === self.puntoFugaSeleccionado ? 1.6 : 1, i === self.puntoFugaSeleccionado ? 1.6 : 1);
    });
};

ProyeccionesConicas.prototype.agregarALaEscena = function(escena) { escena.add(this.grupoLineas); };
ProyeccionesConicas.prototype.eliminarDeEscena = function(escena) { escena.remove(this.grupoLineas); };
ProyeccionesConicas.prototype.cambiarTipo = function(nuevoTipo) {
    this.tipo = nuevoTipo;
    this.puntoFugaSeleccionado = null;
    this.crearPuntosDeFuga();
};
ProyeccionesConicas.prototype.seleccionarPuntoFuga = function(mouseX, mouseY, camera, canvas) {
    var rect = canvas.getBoundingClientRect();
    var x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    var y = -((mouseY - rect.top) / rect.height) * 2 + 1;
    var minDist = 0.09;
    var seleccionado = null;
    this.puntosFuga.forEach(function(punto, i) {
        var vector = punto.position.clone().project(camera);
        var dx = vector.x - x;
        var dy = vector.y - y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            seleccionado = i;
        }
    });
    this.puntoFugaSeleccionado = seleccionado;
    // actualizar apariencia
    this.actualizar([], "cubo");
    return seleccionado;
};
ProyeccionesConicas.prototype.moverPuntoSeleccionado = function(dx, dy, dz) {
    if (this.puntoFugaSeleccionado !== null) {
        var punto = this.puntosFuga[this.puntoFugaSeleccionado];
        punto.position.x += dx;
        punto.position.y += dy;
        punto.position.z += dz;
    }
};

// ==== Escena3D modular ====
function Escena3D(idCanvas) {
    this.canvas = document.getElementById(idCanvas);
    if (!this.canvas) throw new Error("No se encontró el canvas principal");
    this.escena = new THREE.Scene();
    this.camara = new THREE.PerspectiveCamera(60, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.camara.position.set(4, 4, 8);
    this.camara.lookAt(0, 1, 0);

    this.renderizador = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderizador.setClearColor(0x202124, 1);
    this.renderizador.setPixelRatio(window.devicePixelRatio);
    this.renderizador.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);

    this.escena.add(new THREE.AmbientLight(0xffffff, 0.7));
    var luzDireccional = new THREE.DirectionalLight(0xffffff, 0.7);
    luzDireccional.position.set(8, 14, 8);
    this.escena.add(luzDireccional);

    this.ejes = this.crearEjesReferencia();
    this.escena.add(this.ejes);

    this.figuraActual = null;
    this.proyecciones = null;
    this.viewCube = new ViewCube('viewcube-container');
    this.arrastrando = false;
    this.mouseAnterior = { x: 0, y: 0 };
    this.rotacionCamara = { x: 0, y: 0 };

    this.agregarEventosCamara();
    var self = this;
    window.addEventListener('resize', function() { self.redimensionar(); });
    this.redimensionar();
}
Escena3D.prototype.agregarEventosCamara = function() {
    var self = this;
    this.canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        var factor = e.deltaY > 0 ? 1.1 : 0.9;
        self.camara.position.multiplyScalar(factor);
        self.camara.updateProjectionMatrix();
        self.actualizarViewCube();
    });
    this.canvas.addEventListener('mousedown', function(e) {
        if (e.button === 0) {
            self.arrastrando = true;
            self.mouseAnterior.x = e.clientX;
            self.mouseAnterior.y = e.clientY;
        }
    });
    this.canvas.addEventListener('mousemove', function(e) {
        if (self.arrastrando) {
            var dx = e.clientX - self.mouseAnterior.x;
            var dy = e.clientY - self.mouseAnterior.y;
            self.rotacionCamara.y += dx * 0.01;
            self.rotacionCamara.x += dy * 0.01;
            self.rotacionCamara.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, self.rotacionCamara.x));
            var radio = self.camara.position.distanceTo(new THREE.Vector3(0, 1, 0));
            self.camara.position.x = Math.sin(self.rotacionCamara.y) * Math.cos(self.rotacionCamara.x) * radio;
            self.camara.position.y = Math.sin(self.rotacionCamara.x) * radio + 1;
            self.camara.position.z = Math.cos(self.rotacionCamara.y) * Math.cos(self.rotacionCamara.x) * radio;
            self.camara.lookAt(0, 1, 0);
            self.camara.updateProjectionMatrix();
            self.actualizarViewCube();
            self.mouseAnterior.x = e.clientX;
            self.mouseAnterior.y = e.clientY;
        }
    });
    this.canvas.addEventListener('mouseup', function() { self.arrastrando = false; });
    this.canvas.addEventListener('mouseleave', function() { self.arrastrando = false; });
};
Escena3D.prototype.crearEjesReferencia = function() {
    var grupoEjes = new THREE.Group();
    grupoEjes.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3, 0xff4a4a));
    grupoEjes.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 3, 0x34e56a));
    grupoEjes.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 3, 0x4abaff));
    return grupoEjes;
};
Escena3D.prototype.agregarFigura = function(figura) {
    if (this.figuraActual) this.figuraActual.removerComponentes(this.escena);
    this.figuraActual = figura;
    this.figuraActual.agregarComponentes(this.escena);
    this.actualizarInfoCoordenadas();
};
Escena3D.prototype.eliminarFigura = function() {
    if (this.figuraActual) {
        this.figuraActual.removerComponentes(this.escena);
        this.figuraActual = null;
        this.actualizarInfoCoordenadas();
    }
};
Escena3D.prototype.agregarProyecciones = function(proyecciones) {
    if (this.proyecciones) this.proyecciones.eliminarDeEscena(this.escena);
    this.proyecciones = proyecciones;
    proyecciones.agregarALaEscena(this.escena);
};
Escena3D.prototype.renderizar = function() {
    this.renderizador.render(this.escena, this.camara);
};
Escena3D.prototype.actualizarProyecciones = function() {
    if (this.proyecciones && this.figuraActual) {
        // actualizar foco (centro de la figura) antes de recalcular puntos
        this.proyecciones.foco = this.figuraActual.objeto3D.position.clone();
        // recalcular puntos de fuga (los colocamos según la cámara actual y el foco)
        this.proyecciones.crearPuntosDeFuga();
        this.proyecciones.actualizar(this.figuraActual.obtenerVertices(), this.figuraActual.tipo);
    }
};
Escena3D.prototype.redimensionar = function() {
    var ancho = this.canvas.clientWidth;
    var alto = this.canvas.clientHeight;
    this.camara.aspect = ancho / alto;
    this.camara.updateProjectionMatrix();
    this.renderizador.setSize(ancho, alto, false);
    this.actualizarViewCube();
};
Escena3D.prototype.cambiarPerspectiva = function(puntosFuga) {
    if (this.proyecciones && this.proyecciones.puntoFugaSeleccionado !== null) {
        var punto = this.proyecciones.puntosFuga[this.proyecciones.puntoFugaSeleccionado].position;
        this.camara.position.set(punto.x, punto.y, punto.z + 18);
        this.camara.lookAt(0, 1, 0);
    } else {
        if (puntosFuga === 1) {
            this.camara.position.set(4, 4, 8);
            this.camara.lookAt(0, 1, -12);
        } else if (puntosFuga === 2) {
            this.camara.position.set(8, 4, 8);
            this.camara.lookAt(0, 1, -12);
        } else if (puntosFuga === 3) {
            this.camara.position.set(7, 7, 7);
            this.camara.lookAt(0, 8, -12);
        }
    }
    var direccion = new THREE.Vector3();
    this.camara.getWorldDirection(direccion);
    this.rotacionCamara.y = Math.atan2(direccion.x, direccion.z);
    this.rotacionCamara.x = Math.asin(direccion.y);
    this.camara.updateProjectionMatrix();
    this.actualizarViewCube();
};
Escena3D.prototype.actualizarViewCube = function() {
    if (this.viewCube) {
        this.viewCube.actualizarDesdeCamara(this.camara);
    }
};
Escena3D.prototype.resetearCamara = function() {
    this.camara.position.set(4, 4, 8);
    this.camara.lookAt(0, 1, 0);
    this.rotacionCamara = { x: 0, y: 0 };
    this.camara.updateProjectionMatrix();
    this.actualizarViewCube();
};
Escena3D.prototype.actualizarInfoCoordenadas = function() {
    var infoElement = document.getElementById('info-coordenadas');
    if (!infoElement) return;
    if (this.figuraActual) {
        var pos = this.figuraActual.objeto3D.position;
        infoElement.textContent = 'X: ' + pos.x.toFixed(2) + ', Y: ' + pos.y.toFixed(2) + ', Z: ' + pos.z.toFixed(2);
        infoElement.classList.remove('coordenadas-vacias');
    } else {
        infoElement.textContent = 'X: --, Y: --, Z: --';
        infoElement.classList.add('coordenadas-vacias');
    }
};

// ====== UI & Controladores ======
function exportarImagen() {
    var canvas = document.getElementById('lienzo3d');
    if (!canvas) return;
    var enlace = document.createElement('a');
    enlace.download = 'perspectiva-conica-3d.png';
    enlace.href = canvas.toDataURL('image/png');
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

function actualizarIndicadorModo(proyecciones) {
    var indicador = document.getElementById('modo-indicador');
    if (!indicador) return;
    if (proyecciones && proyecciones.puntoFugaSeleccionado !== null) {
        indicador.textContent = 'Modo: Mover Punto de Fuga';
        indicador.className = 'modo-punto';
    } else {
        indicador.textContent = 'Modo: Mover Figura';
        indicador.className = 'modo-figura';
    }
}

function crearControladorMovimiento(callbackMovimiento) {
    return {
        mover: function(dx, dy, dz) {
            callbackMovimiento(dx, dy, dz);
            ocultarMenus();
        },
        configurarBotones: function(configBotones) {
            var self = this;
            configBotones.forEach(function(config) {
                var btn = document.getElementById(config.id);
                if (btn) {
                    btn.addEventListener('click', function() { self.mover(config.dx, config.dy, config.dz); });
                }
            });
        }
    };
}

function configurarEventosGlobales(proyecciones, escena3d, figura3d) {
    document.body.removeEventListener('click', manejarClicExterno);
    document.removeEventListener('keydown', manejarTecladoGlobal);

    document.body.addEventListener('click', manejarClicExterno);
    document.addEventListener('keydown', function(e) { manejarTecladoGlobal(e, proyecciones, escena3d, figura3d); });
}

function manejarClicExterno(e) {
    if (!e.target.classList.contains('tool-btn') &&
        !e.target.closest('.menu-desplegable') &&
        !e.target.closest('.submenu') &&
        e.target.id !== 'viewcube-canvas') {
        ocultarMenus();
    }
}

function manejarTecladoGlobal(e, proyecciones, escena3d, figura3d) {
    if (proyecciones && proyecciones.puntoFugaSeleccionado !== null) {
        switch (e.key.toLowerCase()) {
            case "w":
                moverPuntoFuga(0, 0.4, 0, proyecciones, escena3d);
                break;
            case "s":
                moverPuntoFuga(0, -0.4, 0, proyecciones, escena3d);
                break;
            case "a":
                moverPuntoFuga(-0.4, 0, 0, proyecciones, escena3d);
                break;
            case "d":
                moverPuntoFuga(0.4, 0, 0, proyecciones, escena3d);
                break;
            case "q":
                moverPuntoFuga(0, 0, -0.4, proyecciones, escena3d);
                break;
            case "e":
                moverPuntoFuga(0, 0, 0.4, proyecciones, escena3d);
                break;
            case "escape":
                proyecciones.puntoFugaSeleccionado = null;
                actualizarBotonesMoverPunto();
                escena3d.actualizarProyecciones();
                break;
        }
    } else if (escena3d.figuraActual) {
        switch (e.key.toLowerCase()) {
            case "arrowup":
                moverFigura(0, 0.2, 0, escena3d, figura3d);
                break;
            case "arrowdown":
                moverFigura(0, -0.2, 0, escena3d, figura3d);
                break;
            case "arrowleft":
                moverFigura(-0.2, 0, 0, escena3d, figura3d);
                break;
            case "arrowright":
                moverFigura(0.2, 0, 0, escena3d, figura3d);
                break;
            case "w":
                moverFigura(0, 0, -0.2, escena3d, figura3d);
                break;
            case "s":
                moverFigura(0, 0, 0.2, escena3d, figura3d);
                break;
        }
    }
    if (e.key.toLowerCase() === "r") {
        escena3d.resetearCamara();
    }
}

function moverFigura(dx, dy, dz, escena3d, figura3d) {
    if (!escena3d.figuraActual) return;
    escena3d.figuraActual.moverFigura(dx, dy, dz);
    escena3d.actualizarProyecciones();
    escena3d.actualizarInfoCoordenadas();
}

function moverPuntoFuga(dx, dy, dz, proyecciones, escena3d) {
    proyecciones.moverPuntoSeleccionado(dx, dy, dz);
    escena3d.cambiarPerspectiva(proyecciones.tipo);
    escena3d.actualizarProyecciones();
    actualizarBotonesMoverPunto();
}

function toggleMenu(id, btnId) {
    ocultarMenus();
    var menu = document.getElementById(id);
    if (menu) {
        menu.classList.toggle('oculto');
        menu.style.left = "70px";
        menu.style.top = "70px";
    }
    activarBoton(btnId);
}

function activarBoton(btnId) {
    var btns = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('activa');
    var btn = document.getElementById(btnId);
    if (btn) btn.classList.add('activa');
}

function ocultarMenus() {
    var ms = document.querySelectorAll('.menu-desplegable');
    for (var i = 0; i < ms.length; i++) ms[i].classList.add('oculto');
    var btns = document.querySelectorAll('.tool-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('activa');
}

function mostrarModal(titulo, contenido) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-texto').innerHTML = contenido;
    document.getElementById('modal-info').classList.remove('oculto');
}

function ocultarModal() {
    document.getElementById('modal-info').classList.add('oculto');
}

function mostrarGuia() {
    var contenido = "<h3>Controles de la Aplicación</h3><ul>" +
        "<li><strong>Movimiento de Figura:</strong> Flechas, W/S, arrastre</li>" +
        "<li><strong>Movimiento de Puntos de Fuga:</strong> W/S, A/D, Q/E, Escape</li>" +
        "<li><strong>Controles de Cámara:</strong> Rueda, arrastre, R</li>" +
        "<li><strong>Selección:</strong> Click en punto, Escape para deseleccionar</li></ul>";
    mostrarModal('Guía de Uso', contenido);
}

function mostrarAcercaDe() {
    var contenido = "<p><strong>Aplicación de Perspectiva Cónica 3D</strong></p>" +
        "<p>Desarrollada como herramienta educativa para el estudio de la perspectiva en gráficos por computadora.</p>" +
        "<p><strong>Integrantes del proyecto:</strong></p><ul>" +
        "<li>Javier Orlando Amado Orozco</li><li>Lina Sofia Vega</li></ul>" +
        "<p><strong>Tecnologías utilizadas:</strong></p><ul>" +
        "<li>Three.js, HTML5, CSS3, JavaScript</li></ul>" +
        "<p style='margin-top: 15px; font-style: italic;'>© 2023 - Todos los derechos reservados</p>";
    mostrarModal('Acerca de', contenido);
}

// ==== Inicialización principal ====
var CONFIG_BOTONES_FIGURA = [
    { id: 'flecha-arriba', dx: 0, dy: 0.2, dz: 0 },
    { id: 'flecha-abajo', dx: 0, dy: -0.2, dz: 0 },
    { id: 'flecha-izq', dx: -0.2, dy: 0, dz: 0 },
    { id: 'flecha-der', dx: 0.2, dy: 0, dz: 0 },
    { id: 'flecha-adelante', dx: 0, dy: 0, dz: -0.2 },
    { id: 'flecha-atras', dx: 0, dy: 0, dz: 0.2 }
];
var CONFIG_BOTONES_PUNTO = [
    { id: 'punto-arriba', dx: 0, dy: 0.4, dz: 0 },
    { id: 'punto-abajo', dx: 0, dy: -0.4, dz: 0 },
    { id: 'punto-izq', dx: -0.4, dy: 0, dz: 0 },
    { id: 'punto-der', dx: 0.4, dy: 0, dz: 0 },
    { id: 'punto-adelante', dx: 0, dy: 0, dz: -0.4 },
    { id: 'punto-atras', dx: 0, dy: 0, dz: 0.4 }
];

function iniciarAplicacion() {
    var escena3d = new Escena3D('lienzo3d');
    var figura3d = new Figura3D('cubo');
    escena3d.agregarFigura(figura3d);

    var proyecciones = new ProyeccionesConicas(1, escena3d.camara, figura3d.objeto3D.position.clone());
    escena3d.agregarProyecciones(proyecciones);
    escena3d.actualizarProyecciones();

    configurarEventosGlobales(proyecciones, escena3d, figura3d);
    escena3d.redimensionar();
    escena3d.renderizar();

    // Controladores de movimiento
    var controladorFigura = crearControladorMovimiento(function(dx, dy, dz) {
        moverFigura(dx, dy, dz, escena3d, figura3d);
    });
    controladorFigura.configurarBotones(CONFIG_BOTONES_FIGURA);

    var controladorPunto = crearControladorMovimiento(function(dx, dy, dz) {
        moverPuntoFuga(dx, dy, dz, proyecciones, escena3d);
    });
    controladorPunto.configurarBotones(CONFIG_BOTONES_PUNTO);

    document.getElementById('btn-figura') && document.getElementById('btn-figura').addEventListener('click', function() { toggleMenu('menu-figura', 'btn-figura'); });
    document.getElementById('btn-perspectiva') && document.getElementById('btn-perspectiva').addEventListener('click', function() { toggleMenu('menu-perspectiva', 'btn-perspectiva'); });
    document.getElementById('btn-movimiento') && document.getElementById('btn-movimiento').addEventListener('click', function() { toggleMenu('menu-movimiento', 'btn-movimiento'); });
    document.getElementById('btn-reset') && document.getElementById('btn-reset').addEventListener('click', function() { escena3d.resetearCamara();
        ocultarMenus(); });

    document.getElementById('menu-btn-figura') && document.getElementById('menu-btn-figura').addEventListener('click', function() { toggleMenu('menu-figura', 'menu-btn-figura'); });
    document.getElementById('menu-btn-perspectiva') && document.getElementById('menu-btn-perspectiva').addEventListener('click', function() { toggleMenu('menu-perspectiva', 'menu-btn-perspectiva'); });
    document.getElementById('menu-btn-movimiento') && document.getElementById('menu-btn-movimiento').addEventListener('click', function() { toggleMenu('menu-movimiento', 'menu-btn-movimiento'); });

    var opcionesFigura = document.querySelectorAll('.opcion-figura');
    for (var i = 0; i < opcionesFigura.length; i++) {
        opcionesFigura[i].addEventListener('click', function() {
            figura3d.cambiarFigura(this.dataset.figura);
            escena3d.agregarFigura(figura3d);
            escena3d.actualizarProyecciones();
            ocultarMenus();
        });
    }
    document.getElementById('btn-eliminar-figura') && document.getElementById('btn-eliminar-figura').addEventListener('click', function() {
        escena3d.eliminarFigura();
        escena3d.actualizarProyecciones();
        actualizarIndicadorModo(proyecciones);
        ocultarMenus();
    });

    var opcionesPerspectiva = document.querySelectorAll('.opcion-perspectiva');
    for (var i = 0; i < opcionesPerspectiva.length; i++) {
        opcionesPerspectiva[i].addEventListener('click', function() {
            var puntos = Number(this.dataset.puntos);
            proyecciones.cambiarTipo(puntos);
            // actualizar foco en caso de que la figura se mueva
            proyecciones.foco = figura3d.objeto3D.position.clone();
            escena3d.agregarProyecciones(proyecciones);
            escena3d.cambiarPerspectiva(puntos);
            escena3d.actualizarProyecciones();
            actualizarIndicadorModo(proyecciones);
            ocultarMenus();
        });
    }

    function mostrarBotonesMoverPunto(mostrar) {
        var grupoMover = document.getElementById("grupo-mover-punto");
        if (grupoMover) grupoMover.classList.toggle("oculto", !mostrar);
    }

    function actualizarBotonesMoverPunto() {
        mostrarBotonesMoverPunto(proyecciones.puntoFugaSeleccionado !== null);
        actualizarIndicadorModo(proyecciones);
    }

    escena3d.canvas.addEventListener('click', function(evt) {
        var seleccionado = proyecciones.seleccionarPuntoFuga(evt.clientX, evt.clientY, escena3d.camara, escena3d.canvas);
        actualizarBotonesMoverPunto();
        escena3d.cambiarPerspectiva(proyecciones.tipo);
        escena3d.actualizarProyecciones();
    });

    document.querySelector('.cerrar-modal') && document.querySelector('.cerrar-modal').addEventListener('click', ocultarModal);
    document.getElementById('modal-info') && document.getElementById('modal-info').addEventListener('click', function(e) {
        if (e.target === this) ocultarModal();
    });
    document.getElementById('modal-info') && document.getElementById('modal-info').addEventListener('keydown', function(e) {
        if (e.key === "Escape") ocultarModal();
    });

    window.exportarImagen = exportarImagen;
    window.mostrarGuia = mostrarGuia;
    window.mostrarAcercaDe = mostrarAcercaDe;

    actualizarIndicadorModo(proyecciones);

    function animar() {
        requestAnimationFrame(animar);
        escena3d.renderizar();
    }
    animar();
}

window.onload = iniciarAplicacion;