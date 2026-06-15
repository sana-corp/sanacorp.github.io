/* ==========================================================================
   THREE.JS INTERACTIVE 3D WEBGL HERO QUANTUM ENERGY CORE
   ========================================================================== */

(function() {
    let container, scene, camera, renderer, animationFrameId;
    let group, orbitGroup;
    let innerGeom, outerGeom;
    let envMap;
    
    // Mouse tracking variables
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    
    let isPageActive = false;

    // Procedural HDR EnvMap Generator for realistic metal/glass reflections
    function createProceduralEnvMap(renderer) {
        if (!renderer) return null;
        try {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Gradient background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#000714');
            bgGrad.addColorStop(0.5, '#05152f');
            bgGrad.addColorStop(1, '#000814');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add softbox highlights
            const addSoftbox = (x, y, w, h, color, rotation = 0) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.5, color);
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(-w/2, -h/2, w, h);
                ctx.restore();
            };

            // Studio light setups for bright reflections
            addSoftbox(128, 128, 140, 200, 'rgba(255, 255, 255, 0.95)', Math.PI / 6);
            addSoftbox(384, 120, 100, 160, 'rgba(255, 94, 0, 0.75)', -Math.PI / 4);
            addSoftbox(256, 40, 320, 40, 'rgba(255, 255, 255, 0.9)', 0);

            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const map = pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            pmremGenerator.dispose();
            return map;
        } catch (e) {
            console.error("Failed to generate EnvMap for Hero:", e);
            return null;
        }
    }

    function init() {
        if (window.innerWidth <= 768) return;
        container = document.getElementById('hero-3d-canvas-container');
        if (!container) return;

        // 1. Create Scene
        scene = new THREE.Scene();

        // 2. Create Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
        camera.position.z = 6.2;

        // 3. Create Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        
        // Remove any previous canvas
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // 4. Create reflections envMap
        envMap = createProceduralEnvMap(renderer);
        if (envMap) {
            scene.environment = envMap;
        }

        // 5. Create 3D Object Group
        group = new THREE.Group();
        scene.add(group);

        // Geometries for Core & Shell
        innerGeom = new THREE.IcosahedronGeometry(1.8, 2); // Faceted core
        outerGeom = new THREE.IcosahedronGeometry(2.2, 3); // Glass shield & particles

        // Save initial positions for wave-displacement morphing
        const saveInitialPositions = (geom) => {
            const posAttr = geom.getAttribute('position');
            const arr = new Float32Array(posAttr.count * 3);
            for (let i = 0; i < posAttr.count * 3; i++) {
                arr[i] = posAttr.array[i];
            }
            geom.userData = { initialPositions: arr };
        };
        saveInitialPositions(innerGeom);
        saveInitialPositions(outerGeom);

        // Enterprise Style: Polished faceted metal core (Orange Gold)
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0xFF5E00,
            metalness: 0.95,
            roughness: 0.12,
            flatShading: true,
            envMapIntensity: 1.6
        });
        const innerMesh = new THREE.Mesh(innerGeom, innerMat);
        group.add(innerMesh);

        // Refractive Glass Shield wrapping around the core
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            transmission: 0.92,
            thickness: 1.0,
            ior: 1.48,
            roughness: 0.08,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            side: THREE.DoubleSide
        });
        const glassMesh = new THREE.Mesh(outerGeom, glassMat);
        group.add(glassMesh);

        // Outer particles system
        const pointsMat = new THREE.PointsMaterial({
            color: 0xFF7700,
            size: 0.055,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        const pointsObj = new THREE.Points(outerGeom, pointsMat);
        group.add(pointsObj);

        // Create Holographic Orbit Rings Group (Awwwards feel)
        orbitGroup = new THREE.Group();
        scene.add(orbitGroup);

        const numSegments = 128;
        const orbitRadius = 2.8;
        const orbitPoints = [];
        for (let i = 0; i <= numSegments; i++) {
            const theta = (i / numSegments) * Math.PI * 2;
            orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
        }
        
        const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        
        // Thin Orange Ring
        const ring1 = new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({ color: 0xFF5E00, transparent: true, opacity: 0.35 }));
        ring1.rotation.x = Math.PI / 4.5;
        ring1.rotation.y = Math.PI / 6;
        orbitGroup.add(ring1);

        // Thin Cyan Ring for high-tech color accent
        const ring2 = new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({ color: 0x00D2FF, transparent: true, opacity: 0.25 }));
        ring2.rotation.x = -Math.PI / 3;
        ring2.rotation.z = Math.PI / 4;
        orbitGroup.add(ring2);

        // 6. Add Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xFF5E00, 1.5, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Direct blue light from opposite side
        const dirLight = new THREE.DirectionalLight(0x00D2FF, 1.0);
        dirLight.position.set(-5, 3, -5);
        scene.add(dirLight);

        // 7. Listeners
        window.addEventListener('resize', onWindowResize);
        container.addEventListener('mousemove', onMouseMove);
        
        // Touch supports
        container.addEventListener('touchmove', onTouchMove, { passive: true });
        
        isPageActive = true;
        animate();
    }

    function onWindowResize() {
        if (!container || !renderer || !camera) return;
        
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function onMouseMove(event) {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            const rect = container.getBoundingClientRect();
            mouseX = ((event.touches[0].clientX - rect.left) / container.clientWidth) * 2 - 1;
            mouseY = -((event.touches[0].clientY - rect.top) / container.clientHeight) * 2 + 1;
        }
    }

    function animate() {
        if (!isPageActive) return;

        animationFrameId = requestAnimationFrame(animate);

        // 1. Gentle auto rotation
        group.rotation.y += 0.003;
        group.rotation.x += 0.001;

        // 2. Mouse physics inertia (lerp)
        targetX = mouseX * 0.8;
        targetY = mouseY * 0.8;

        group.rotation.y += (targetX - group.rotation.y) * 0.05;
        group.rotation.x += (targetY - group.rotation.x) * 0.05;

        // 3. Wave-displacement morphing for organic, fluid feel
        const time = performance.now() * 0.0015;
        const waveFreq = 2.0;
        const waveAmp = 0.12;

        const morphGeom = (geom) => {
            if (!geom) return;
            const posAttr = geom.getAttribute('position');
            const initial = geom.userData.initialPositions;
            if (!initial || !posAttr) return;
            
            for (let i = 0; i < posAttr.count; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;
                const x = initial[ix];
                const y = initial[iy];
                const z = initial[iz];
                
                const len = Math.sqrt(x*x + y*y + z*z);
                if (len === 0) continue;
                const nx = x / len;
                const ny = y / len;
                const nz = z / len;
                
                // Organic breathing wavy displacement
                const offset = Math.sin(x * waveFreq + time) * 
                               Math.cos(y * waveFreq + time) * 
                               Math.sin(z * waveFreq + time) * waveAmp;
                
                posAttr.array[ix] = x + nx * offset;
                posAttr.array[iy] = y + ny * offset;
                posAttr.array[iz] = z + nz * offset;
            }
            posAttr.needsUpdate = true;
        };
        
        morphGeom(innerGeom);
        morphGeom(outerGeom);

        // 4. Rotate independently rotating orbit rings
        if (orbitGroup) {
            orbitGroup.rotation.y -= 0.004;
            orbitGroup.rotation.z += 0.002;
        }

        renderer.render(scene, camera);
    }

    function stop() {
        isPageActive = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    // 7. Watch for routing swap events to handle CPU footprint
    window.addEventListener('page-swapped', (e) => {
        if (window.innerWidth <= 768) {
            stop();
            return;
        }
        if (e.detail.page === 'home') {
            if (!renderer) {
                init();
            } else {
                isPageActive = true;
                animate();
                onWindowResize(); // Force layout check
            }
        } else {
            stop();
        }
    });

    // Run immediately if index is loaded at home
    setTimeout(() => {
        if (window.innerWidth <= 768) return;
        const hash = window.location.hash || '#/';
        if (hash === '#/' && !renderer) {
            init();
        }
    }, 100);

})();
