/* ==========================================================================
   THREE.JS PROCEDURAL 3D SENSOR MODELS (AWWWARDS-LEVEL GLASS & METALS)
   ========================================================================== */

(function() {
    let teaserRenderer, teaserScene, teaserCamera, teaserSensor, teaserFrameId;
    let productRenderer, productScene, productCamera, productSensor, productFrameId;
    let explodedRenderer, explodedScene, explodedCamera, explodedFrameId;
    
    // Exploded view components
    let expShell, expAntenna, expChip, expBattery, expGroup;
    let expParticles, prodParticles;
    
    let isProductPageActive = false;

    // Procedural HDR EnvMap Generator for studio-grade metallic/glass reflections
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

            // Tech space gradient background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#000612');
            bgGrad.addColorStop(0.5, '#061633');
            bgGrad.addColorStop(1, '#000612');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add softbox highlights for reflections
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

            // Setup professional key, fill, rim reflections
            addSoftbox(128, 128, 140, 200, 'rgba(255, 255, 255, 0.95)', Math.PI / 6);
            addSoftbox(384, 120, 100, 160, 'rgba(255, 94, 0, 0.75)', -Math.PI / 4);
            addSoftbox(256, 40, 320, 40, 'rgba(255, 255, 255, 0.9)', 0);
            addSoftbox(256, 220, 240, 60, 'rgba(0, 180, 255, 0.5)', 0);

            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const map = pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            pmremGenerator.dispose();
            return map;
        } catch (e) {
            console.error("Failed to generate EnvMap for Sensor:", e);
            return null;
        }
    }

    // Helper: Create a procedural industrial sensor mesh assembly
    function createProceduralSensor(isExplodedParts = false) {
        const assembly = {
            group: new THREE.Group(),
            shell: null,
            antenna: null,
            chip: null,
            battery: null
        };

        // Materials (Awwwards-level metallic and physical glass properties)
        const steelMaterial = new THREE.MeshStandardMaterial({
            color: 0xCBD5E1, // Polished titanium-steel
            metalness: 0.95,
            roughness: 0.1,
            envMapIntensity: 1.5
        });
        
        const darkMetalMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E293B, // Slate carbon-steel
            metalness: 0.9,
            roughness: 0.18,
            envMapIntensity: 1.2
        });
        
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xF59E0B, // 24k gold contacts
            metalness: 0.98,
            roughness: 0.08,
            envMapIntensity: 1.8
        });

        const copperMaterial = new THREE.MeshStandardMaterial({
            color: 0xB45309, // Wound copper wire
            metalness: 0.95,
            roughness: 0.15,
            envMapIntensity: 1.4
        });
        
        const orangePlasticMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF5E00,
            metalness: 0.1,
            roughness: 0.25,
            emissive: 0xFF5E00,
            emissiveIntensity: 0.8
        });
        
        const circuitMaterial = new THREE.MeshStandardMaterial({
            color: 0x0C192E, // Premium dark-blue PCB substrate
            roughness: 0.5,
            metalness: 0.2
        });

        // Real Physical Glass cylinder shell displaying internal mechanics
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: isExplodedParts ? 0.22 : 0.58,
            transmission: 0.88,
            ior: 1.5,
            roughness: 0.06,
            metalness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            side: THREE.DoubleSide
        });

        // 1. Physical Glass Casing Shell
        const shellGeom = new THREE.CylinderGeometry(0.78, 0.78, 2.1, 32, 1, true);
        const shellMesh = new THREE.Mesh(shellGeom, glassMaterial);
        shellMesh.position.y = 0;
        assembly.shell = shellMesh;
        assembly.group.add(shellMesh);

        // Flanged Top Cap with Bolts
        const capGroup = new THREE.Group();
        const capGeom = new THREE.CylinderGeometry(0.78, 0.82, 0.18, 32);
        const capMesh = new THREE.Mesh(capGeom, darkMetalMaterial);
        capGroup.add(capMesh);

        const capLipGeom = new THREE.CylinderGeometry(0.82, 0.82, 0.06, 32);
        const capLip = new THREE.Mesh(capLipGeom, steelMaterial);
        capLip.position.y = -0.09;
        capGroup.add(capLip);

        // Add 6 Hex screws around the top lid
        const screwGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 6);
        for (let i = 0; i < 6; i++) {
            const screw = new THREE.Mesh(screwGeom, steelMaterial);
            const angle = (i / 6) * Math.PI * 2;
            screw.position.set(Math.cos(angle) * 0.62, 0.1, Math.sin(angle) * 0.62);
            capGroup.add(screw);
        }
        capGroup.position.y = 1.14;
        assembly.shell.add(capGroup);

        // Flanged Bottom Cap with Mounting Threads
        const baseGroup = new THREE.Group();
        const baseGeom = new THREE.CylinderGeometry(0.82, 0.85, 0.25, 32);
        const baseMesh = new THREE.Mesh(baseGeom, darkMetalMaterial);
        baseGroup.add(baseMesh);

        // Brass Nozzle / Fitting threads at bottom
        const fittingGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 24);
        const fittingMesh = new THREE.Mesh(fittingGeom, goldMaterial);
        fittingMesh.position.y = -0.32;
        baseGroup.add(fittingMesh);

        // Add 3 thread rings around the fitting nozzle
        for (let i = 0; i < 3; i++) {
            const threadGeom = new THREE.TorusGeometry(0.35, 0.03, 8, 24);
            const threadMesh = new THREE.Mesh(threadGeom, goldMaterial);
            threadMesh.rotation.x = Math.PI / 2;
            threadMesh.position.y = -0.2 - (i * 0.09);
            baseGroup.add(threadMesh);
        }
        baseGroup.position.y = -1.15;
        assembly.shell.add(baseGroup);

        // 2. High-gain RF Antenna on top
        const antGroup = new THREE.Group();
        const antBaseGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12);
        const antBase = new THREE.Mesh(antBaseGeom, goldMaterial);
        antGroup.add(antBase);

        const rodGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8);
        const rodMesh = new THREE.Mesh(rodGeom, darkMetalMaterial);
        rodMesh.position.y = 0.4;
        antGroup.add(rodMesh);
        
        const tipGeom = new THREE.SphereGeometry(0.065, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, orangePlasticMaterial);
        tipMesh.position.y = 0.78;
        antGroup.add(tipMesh);
        
        antGroup.position.set(0, 1.2, 0);
        assembly.antenna = antGroup;
        
        if (isExplodedParts) {
            assembly.group.add(antGroup);
        } else {
            assembly.shell.add(antGroup);
        }

        // 3. Inner Microchip Board (PCB with detailed components)
        const chipGroup = new THREE.Group();
        const pcbGeom = new THREE.BoxGeometry(0.48, 1.35, 0.06);
        const pcbMesh = new THREE.Mesh(pcbGeom, circuitMaterial);
        chipGroup.add(pcbMesh);

        // Golden circuit trace lines
        const trace1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.1, 0.07), goldMaterial);
        trace1.position.set(-0.16, 0.05, 0);
        chipGroup.add(trace1);

        const trace2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.07), goldMaterial);
        trace2.position.set(0.16, 0.2, 0);
        chipGroup.add(trace2);

        // CPU Processor with silver cap & gold pins
        const cpuGroup = new THREE.Group();
        const cpuBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.08), darkMetalMaterial);
        cpuGroup.add(cpuBody);
        const cpuCap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.1), steelMaterial);
        cpuCap.position.z = 0.01;
        cpuGroup.add(cpuCap);
        cpuGroup.position.set(0, 0.35, 0.02);
        chipGroup.add(cpuGroup);

        // Capacitors & Resistors (Small shiny cylinders)
        const capacitorGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.18, 12);
        const capacitorMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });
        
        const cap1 = new THREE.Mesh(capacitorGeom, capacitorMat);
        cap1.rotation.x = Math.PI / 2;
        cap1.position.set(-0.12, -0.1, 0.08);
        chipGroup.add(cap1);

        const cap2 = new THREE.Mesh(capacitorGeom, capacitorMat);
        cap2.rotation.x = Math.PI / 2;
        cap2.position.set(-0.12, -0.32, 0.08);
        chipGroup.add(cap2);

        // Bounding copper induction wire coils (stacked toruses)
        const copperCoil = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const turnGeom = new THREE.TorusGeometry(0.22, 0.025, 8, 24);
            const turnMesh = new THREE.Mesh(turnGeom, copperMaterial);
            turnMesh.rotation.x = Math.PI / 2;
            turnMesh.position.y = -0.15 + (i * 0.07);
            copperCoil.add(turnMesh);
        }
        copperCoil.position.set(0, -0.1, 0);
        chipGroup.add(copperCoil);

        // Pulsing diagnostic LED (breathing)
        const ledGeom = new THREE.SphereGeometry(0.045, 12, 12);
        const ledMesh = new THREE.Mesh(ledGeom, orangePlasticMaterial);
        ledMesh.position.set(0.12, -0.22, 0.06);
        chipGroup.add(ledMesh);
        
        // Expose LED reference on chip assembly for smooth breathing animations
        assembly.diagnosticLED = ledMesh;

        chipGroup.position.y = 0.15;
        assembly.chip = chipGroup;
        assembly.group.add(chipGroup);

        // 4. Lithium-ion Battery Cell
        const batGroup = new THREE.Group();
        const batGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.75, 24);
        const batMat = new THREE.MeshStandardMaterial({
            color: 0x0b1329, // Slate black cylinder
            metalness: 0.85,
            roughness: 0.2,
            envMapIntensity: 1.2
        });
        const batMesh = new THREE.Mesh(batGeom, batMat);
        batGroup.add(batMesh);

        // Orange warning stripe wrap
        const wrapGeom = new THREE.CylinderGeometry(0.385, 0.385, 0.35, 24);
        const wrapMesh = new THREE.Mesh(wrapGeom, orangePlasticMaterial);
        batGroup.add(wrapMesh);

        // Metallic poles
        const poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
        const poleCap = new THREE.Mesh(poleGeom, steelMaterial);
        poleCap.position.y = 0.39;
        batGroup.add(poleCap);

        batGroup.position.y = -0.55;
        assembly.battery = batGroup;
        assembly.group.add(batGroup);

        return assembly;
    }

    // ==========================================
    // 1. TEASER ROTATING SENSOR (PAGE 1)
    // ==========================================
    function initTeaserSensor() {
        if (window.innerWidth <= 768) return;
        const container = document.getElementById('teaser-3d-visual-container');
        if (!container) return;

        teaserScene = new THREE.Scene();
        teaserCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        teaserCamera.position.z = 5;

        teaserRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        teaserRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        teaserRenderer.setSize(container.clientWidth, container.clientHeight);
        teaserRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        teaserRenderer.toneMappingExposure = 1.0;
        
        container.innerHTML = '';
        container.appendChild(teaserRenderer.domElement);

        // Add studio environment reflection
        const envMap = createProceduralEnvMap(teaserRenderer);
        if (envMap) {
            teaserScene.environment = envMap;
        }

        const assembly = createProceduralSensor(false);
        teaserSensor = assembly.group;
        teaserScene.add(teaserSensor);

        // Studio lighting parameters
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        teaserScene.add(ambient);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 5, 5);
        teaserScene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.7);
        fillLight.position.set(-5, 3, -2);
        teaserScene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xff5e00, 1.5);
        rimLight.position.set(2, -4, -5);
        teaserScene.add(rimLight);

        animateTeaser();
    }

    function animateTeaser() {
        if (!teaserSensor || !teaserRenderer) return;
        teaserFrameId = requestAnimationFrame(animateTeaser);
        
        const time = performance.now() * 0.001;
        teaserSensor.rotation.y += 0.008;
        teaserSensor.position.y = Math.sin(time * 1.4) * 0.1; // Smooth floating
        
        teaserRenderer.render(teaserScene, teaserCamera);
    }

    // ==========================================
    // 2. PRODUCT MAIN SENSOR 360 DEGREES (PAGE 2)
    // ==========================================
    function initProductSensor() {
        if (window.innerWidth <= 768) return;
        const container = document.getElementById('sensor-3d-view');
        if (!container) return;

        productScene = new THREE.Scene();
        productCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        productCamera.position.z = 6;

        productRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        productRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        productRenderer.setSize(container.clientWidth, container.clientHeight);
        productRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        productRenderer.toneMappingExposure = 1.0;
        
        container.innerHTML = '';
        container.appendChild(productRenderer.domElement);

        // Add studio environment reflection
        const envMap = createProceduralEnvMap(productRenderer);
        if (envMap) {
            productScene.environment = envMap;
        }

        const assembly = createProceduralSensor(false);
        productSensor = assembly.group;
        productSensor.position.x = 0; // Centered inside the right-half canvas
        productSensor.position.y = 0.15;
        productScene.add(productSensor);

        // High-tech Grid Floor
        const gridHelper = new THREE.GridHelper(5, 20, 0xFF5E00, 0x0A1128);
        gridHelper.position.set(0, -1.8, 0);
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;
        productScene.add(gridHelper);

        // Floating Data Particles
        const particleCount = 40;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const dist = 1.0 + Math.random() * 1.5;
            positions[i*3] = Math.sin(phi) * Math.cos(theta) * dist; // Centered (removed + 0.5)
            positions[i*3+1] = Math.cos(phi) * dist + 0.15;
            positions[i*3+2] = Math.sin(phi) * Math.sin(theta) * dist;
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xFF5E00,
            size: 0.035,
            transparent: true,
            opacity: 0.65
        });
        prodParticles = new THREE.Points(particleGeom, particleMat);
        productScene.add(prodParticles);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        productScene.add(ambient);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 5, 5);
        productScene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.7);
        fillLight.position.set(-5, 3, -2);
        productScene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xff5e00, 1.5);
        rimLight.position.set(2, -4, -5);
        productScene.add(rimLight);

        animateProduct();
    }

    function animateProduct() {
        if (!isProductPageActive) return;
        productFrameId = requestAnimationFrame(animateProduct);

        const time = performance.now() * 0.001;

        // Auto float rotation
        if (productSensor) {
            const scrollPos = window.scrollY;
            productSensor.rotation.y = (scrollPos * 0.0025) + (time * 0.25);
            productSensor.position.y = 0.15 + Math.sin(time * 1.1) * 0.12;
        }

        // Animate floating particles
        if (prodParticles) {
            prodParticles.rotation.y += 0.0012;
            prodParticles.rotation.x += 0.0004;
        }

        productRenderer.render(productScene, productCamera);
    }

    // ==========================================
    // 3. EXPLODED HARDWARE MODEL (PAGE 2)
    // ==========================================
    function initExplodedSensor() {
        if (window.innerWidth <= 768) return false;
        const container = document.getElementById('sensor-exploded-view');
        if (!container) return false;

        explodedScene = new THREE.Scene();
        explodedCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        explodedCamera.position.z = 7;

        explodedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        explodedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        explodedRenderer.setSize(container.clientWidth, container.clientHeight);
        explodedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        explodedRenderer.toneMappingExposure = 1.0;
        
        container.innerHTML = '';
        container.appendChild(explodedRenderer.domElement);

        // Add studio environment reflection
        const envMap = createProceduralEnvMap(explodedRenderer);
        if (envMap) {
            explodedScene.environment = envMap;
        }

        const assembly = createProceduralSensor(true);
        expGroup = assembly.group;
        expShell = assembly.shell;
        expAntenna = assembly.antenna;
        expChip = assembly.chip;
        expBattery = assembly.battery;
        
        // Vertical axis guide line (Awwwards blueprint feel)
        const linePoints = [
            new THREE.Vector3(0, -3.2, 0),
            new THREE.Vector3(0, 3.8, 0)
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0xFF5E00,
            dashSize: 0.15,
            gapSize: 0.1,
            transparent: true,
            opacity: 0.35
        });
        const guideLine = new THREE.Line(lineGeom, lineMat);
        guideLine.computeLineDistances();
        expGroup.add(guideLine);

        explodedScene.add(expGroup);

        // High-tech grid floor
        const gridHelper = new THREE.GridHelper(6, 24, 0xFF5E00, 0x0A1128);
        gridHelper.position.y = -3.2;
        gridHelper.material.opacity = 0.28;
        gridHelper.material.transparent = true;
        explodedScene.add(gridHelper);

        // Data particles
        const particleCount = 50;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const dist = 1.2 + Math.random() * 1.8;
            positions[i*3] = Math.sin(phi) * Math.cos(theta) * dist;
            positions[i*3+1] = Math.cos(phi) * dist;
            positions[i*3+2] = Math.sin(phi) * Math.sin(theta) * dist;
        }
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xFF5E00,
            size: 0.04,
            transparent: true,
            opacity: 0.6
        });
        expParticles = new THREE.Points(particleGeom, particleMat);
        explodedScene.add(expParticles);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        explodedScene.add(ambient);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 5, 5);
        explodedScene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.7);
        fillLight.position.set(-5, 3, -2);
        explodedScene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xff5e00, 1.5);
        rimLight.position.set(2, -4, -5);
        explodedScene.add(rimLight);

        // Initialize interactive CAD-configurator explosion
        initInteractiveExplosion();
        return true;
    }

    function initInteractiveExplosion() {
        if (!expGroup) return;

        const slider = document.getElementById('hardware-slider');
        const percentageIndicator = document.getElementById('slider-percentage');
        const tabs = document.querySelectorAll('.hardware-tab-btn');
        const specCards = document.querySelectorAll('.spec-content-card');

        // Reset positions
        expShell.position.y = 0;
        expAntenna.position.y = 1.2;
        expChip.position.y = 0.15;
        expBattery.position.y = -0.55;
        expGroup.rotation.y = 0;

        function updateExplosion(progress) {
            // Apply vertical disassembly matching progress (0 to 1)
            expShell.position.y = progress * 1.95;
            expAntenna.position.y = 1.2 + progress * (3.6 - 1.2);
            expBattery.position.y = -0.55 + progress * (-2.9 - (-0.55));
            expGroup.rotation.y = progress * (Math.PI * 1.5);
            
            if (percentageIndicator) {
                percentageIndicator.textContent = Math.round(progress * 100) + '%';
            }
        }

        if (slider) {
            slider.value = 0;
            slider.oninput = (e) => {
                const val = parseFloat(e.target.value);
                updateExplosion(val);
                
                // Automatically activate tabs based on slider range
                let activeIdx = 0;
                if (val < 0.25) activeIdx = 0; // Корпус
                else if (val >= 0.25 && val < 0.5) activeIdx = 1; // Антенна
                else if (val >= 0.5 && val < 0.75) activeIdx = 2; // Батарея
                else activeIdx = 3; // Плата
                
                setActiveTab(activeIdx, false);
            };
        }

        function setActiveTab(index, animateSliderVal = true) {
            tabs.forEach((tab) => {
                const dataIdx = parseInt(tab.getAttribute('data-index'));
                if (dataIdx === index) {
                    tab.classList.add('active-tab');
                } else {
                    tab.classList.remove('active-tab');
                }
            });

            specCards.forEach((card, idx) => {
                if (idx === index) {
                    card.classList.add('active-card');
                } else {
                    card.classList.remove('active-card');
                }
            });

            if (animateSliderVal && slider) {
                let targetVal = 0;
                if (index === 0) targetVal = 0.1;
                else if (index === 1) targetVal = 0.4;
                else if (index === 2) targetVal = 0.65;
                else targetVal = 0.95;
                
                slider.value = targetVal;
                if (percentageIndicator) {
                    percentageIndicator.textContent = Math.round(targetVal * 100) + '%';
                }
                // Animate to target value smoothly using GSAP
                gsap.to(expShell.position, { y: targetVal * 1.95, duration: 0.5, ease: 'power2.out' });
                gsap.to(expAntenna.position, { y: 1.2 + targetVal * (3.6 - 1.2), duration: 0.5, ease: 'power2.out' });
                gsap.to(expBattery.position, { y: -0.55 + targetVal * (-2.9 - (-0.55)), duration: 0.5, ease: 'power2.out' });
                gsap.to(expGroup.rotation, { y: targetVal * (Math.PI * 1.5), duration: 0.5, ease: 'power2.out' });
            }
        }

        tabs.forEach((tab) => {
            tab.onclick = () => {
                const index = parseInt(tab.getAttribute('data-index'));
                setActiveTab(index, true);
            };
        });

        // Set initial tab active
        setActiveTab(0, true);
    }

    function renderExplodedOnce() {
        const time = performance.now() * 0.001;
        
        if (expGroup) {
            expGroup.rotation.x = Math.sin(time * 0.7) * 0.03;
            expGroup.rotation.z = Math.cos(time * 0.7) * 0.015;
        }
        
        if (expParticles) {
            expParticles.rotation.y += 0.0008;
            expParticles.rotation.x += 0.0003;
        }
        if (explodedRenderer && explodedScene && explodedCamera) {
            explodedRenderer.render(explodedScene, explodedCamera);
        }
    }

    // ==========================================
    // RESIZING & ROUTING WATCHERS
    // ==========================================
    function resizeCanvases() {
        // Teaser resize
        const teaserCont = document.getElementById('teaser-3d-visual-container');
        if (teaserCont && teaserRenderer && teaserCamera) {
            teaserCamera.aspect = teaserCont.clientWidth / teaserCont.clientHeight;
            teaserCamera.updateProjectionMatrix();
            teaserRenderer.setSize(teaserCont.clientWidth, teaserCont.clientHeight);
        }

        // Product resize
        const prodCont = document.getElementById('sensor-3d-view');
        if (prodCont && productRenderer && productCamera) {
            productCamera.aspect = prodCont.clientWidth / prodCont.clientHeight;
            productCamera.updateProjectionMatrix();
            productRenderer.setSize(prodCont.clientWidth, prodCont.clientHeight);
        }

        // Exploded resize
        const expCont = document.getElementById('sensor-exploded-view');
        if (expCont && explodedRenderer && explodedCamera) {
            explodedCamera.aspect = expCont.clientWidth / expCont.clientHeight;
            explodedCamera.updateProjectionMatrix();
            explodedRenderer.setSize(expCont.clientWidth, expCont.clientHeight);
        }
    }

    window.addEventListener('resize', resizeCanvases);
    window.addEventListener('page-swapped', (e) => {
        const activePage = e.detail.page;

        if (window.innerWidth <= 768) {
            isProductPageActive = false;
            if (productFrameId) cancelAnimationFrame(productFrameId);
            if (teaserFrameId) cancelAnimationFrame(teaserFrameId);
            gsap.ticker.remove(renderExplodedOnce);
            return;
        }

        if (activePage === 'home') {
            isProductPageActive = false;
            if (productFrameId) cancelAnimationFrame(productFrameId);
            
            setTimeout(initTeaserSensor, 100);
        } else if (activePage === 'product') {
            isProductPageActive = true;
            if (teaserFrameId) cancelAnimationFrame(teaserFrameId);

            setTimeout(() => {
                initProductSensor();
                if (initExplodedSensor()) {
                    gsap.ticker.add(renderExplodedOnce);
                }
            }, 100);
        } else {
            isProductPageActive = false;
            if (productFrameId) cancelAnimationFrame(productFrameId);
            if (teaserFrameId) cancelAnimationFrame(teaserFrameId);
            gsap.ticker.remove(renderExplodedOnce);
        }
    });

    // Run teaser immediately if index is loaded at home
    setTimeout(() => {
        if (window.innerWidth <= 768) return;
        const hash = window.location.hash || '#/';
        if (hash === '#/') {
            initTeaserSensor();
        } else if (hash === '#/product') {
            isProductPageActive = true;
            initProductSensor();
            if (initExplodedSensor()) {
                gsap.ticker.add(renderExplodedOnce);
            }
        }
    }, 150);

})();
