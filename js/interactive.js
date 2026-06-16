/* ==========================================================================
   CLIENT-SIDE HIGH-FIDELITY ENTERPRISE SIMULATORS (ALL PAGES)
   ========================================================================== */

(function() {

    // Helper: Delay function
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // ==========================================
    // 1. SCADA INDUSTRIAL PANEL & TELEMETRY CHARTS (PAGE 2)
    // ==========================================
    let pressureCanvas, pressureCtx, pressureFrameId;
    let pressurePoints = [];
    let torquePoints = [];
    let flowPoints = [];
    let isCriticalSpike = false;
    let criticalTime = 0;

    function initPressureChart() {
        pressureCanvas = document.getElementById('pressure-chart');
        if (!pressureCanvas) return;
        pressureCtx = pressureCanvas.getContext('2d');

        // Populate initial points
        pressurePoints = [];
        torquePoints = [];
        flowPoints = [];
        for (let i = 0; i < 60; i++) {
            pressurePoints.push(5.2 + Math.random() * 0.3); // Nominal pressure: ~5.4 MPa
            torquePoints.push(17.5 + Math.random() * 1.2);   // Nominal torque: ~18 kNm
            flowPoints.push(27.8 + Math.random() * 0.8);     // Nominal flow: ~28 L/s
        }

        isCriticalSpike = false;
        
        // Setup triggers
        const alertBtn = document.getElementById('alert-trigger-btn');
        const closeBtn = document.getElementById('alert-close-btn');
        const overlay = document.getElementById('operator-alert-overlay');
        const statusEl = document.querySelector('.sim-status');

        if (alertBtn) {
            alertBtn.onclick = () => {
                isCriticalSpike = true;
                criticalTime = 0;
                if (statusEl) {
                    statusEl.textContent = 'RISK ALERT';
                    statusEl.className = 'sim-status alert';
                }
                
                // Add alert log row
                appendScadaLog("CRITICAL: [WARN_702] Зафиксирован аномальный рост крутящего момента и давления на забое. Риск затяжки буровой колонны!");
                
                setTimeout(() => {
                    if (isCriticalSpike && overlay) overlay.classList.add('active');
                }, 1000);
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                isCriticalSpike = false;
                if (overlay) overlay.classList.remove('active');
                if (statusEl) {
                    statusEl.textContent = 'AMIRIG ONLINE';
                    statusEl.className = 'sim-status active';
                }
                appendScadaLog("SYS: Риск нейтрализован. Управляющая команда ESP32/Tuya отправлена. Давление в норме.");
            };
        }

        // Initialize log box with standard queries
        const logsBox = document.getElementById('scada-logs-box');
        if (logsBox) {
            logsBox.innerHTML = `
                <div class="log-row">[23:20:01] SYS: Инициализация предиктивного ядра риск-инжиниринга.</div>
                <div class="log-row">[23:20:03] LoRaWAN: Соединение с партией ГТИ установлено. Опрос датчиков.</div>
                <div class="log-row">[23:20:05] AI CORE: Текущая операция - Бурение ротором (глубина 3450м).</div>
                <div class="log-row">[23:20:10] ESP32: Калибровка весовых мостов выполнена. Точность контроля: 99.9%</div>
            `;
        }

        animatePressureChart();
    }

    function appendScadaLog(message) {
        const logsBox = document.getElementById('scada-logs-box');
        if (!logsBox) return;
        const now = new Date();
        const timeStr = `[${now.toTimeString().split(' ')[0]}]`;
        const row = document.createElement('div');
        row.className = 'log-row';
        row.innerHTML = `<span style="color: var(--accent-orange)">${timeStr}</span> ${message}`;
        logsBox.appendChild(row);
        if (logsBox.children.length > 8) {
            logsBox.removeChild(logsBox.firstChild);
        }
        logsBox.scrollTop = logsBox.scrollHeight;
    }

    function animatePressureChart() {
        if (!pressureCanvas || !pressureCtx) return;
        pressureFrameId = requestAnimationFrame(animatePressureChart);

        // Update loop - shift all buffers
        pressurePoints.shift();
        torquePoints.shift();
        flowPoints.shift();
        
        let lastP = pressurePoints[pressurePoints.length - 1] || 5.4;
        let lastT = torquePoints[torquePoints.length - 1] || 18;
        let lastF = flowPoints[flowPoints.length - 1] || 28;

        let curP, curT, curF;

        if (isCriticalSpike) {
            criticalTime++;
            // Rapid spike of pressure and torque, drop of flow
            curP = Math.min(13.8, lastP + Math.pow(criticalTime, 1.8) * 0.08 + Math.random() * 0.4);
            curT = Math.min(29.8, lastT + Math.pow(criticalTime, 1.5) * 0.12 + Math.random() * 0.6);
            curF = Math.max(8.5, lastF - Math.pow(criticalTime, 1.3) * 0.15 - Math.random() * 0.3);
        } else {
            // Normal micro-fluctuations (simulate sensor noise)
            curP = lastP + (Math.random() - 0.5) * 0.08;
            curP = Math.max(4.8, Math.min(6.0, curP));

            curT = lastT + (Math.random() - 0.5) * 0.25;
            curT = Math.max(16.0, Math.min(20.0, curT));

            curF = lastF + (Math.random() - 0.5) * 0.15;
            curF = Math.max(26.0, Math.min(30.0, curF));
        }

        pressurePoints.push(curP);
        torquePoints.push(curT);
        flowPoints.push(curF);

        // Update numeric readouts in sidebar
        const pressValEl = document.getElementById('scada-pressure');
        const tempValEl = document.getElementById('scada-temp');
        const signalValEl = document.getElementById('scada-signal');
        const batteryValEl = document.getElementById('scada-battery');

        if (pressValEl) {
            pressValEl.textContent = curP.toFixed(2) + ' MPa';
            pressValEl.style.color = isCriticalSpike && curP > 9.0 ? '#FF5E00' : '#FFFFFF';
        }

        if (tempValEl && Math.random() < 0.03) {
            const temp = 42.4 + Math.sin(performance.now() * 0.001) * 0.4 + (isCriticalSpike ? criticalTime * 0.15 : 0) + Math.random() * 0.1;
            tempValEl.textContent = temp.toFixed(1) + ' °C';
            if (isCriticalSpike) tempValEl.style.color = '#FF5E00';
            else tempValEl.style.color = '#FFFFFF';
        }

        if (signalValEl && Math.random() < 0.01) {
            const sig = -78 - Math.floor(Math.random() * 4) - (isCriticalSpike ? Math.floor(Math.random() * 10) : 0);
            signalValEl.textContent = sig + ' dBm';
        }

        if (batteryValEl && Math.random() < 0.005) {
            const bat = 3.64 - Math.random() * 0.01;
            batteryValEl.textContent = bat.toFixed(2) + ' V';
        }

        // Randomly query telemetry log rows
        if (Math.random() < 0.003 && !isCriticalSpike) {
            const msgList = [
                "SYS: Фильтрация шумов датчика давления (фильтр Калмана). Отклонение <0.05%.",
                "AI CORE: Детектирована смена фазы - Наращивание свечи.",
                "Terrixa AI: Выполнен семантический поиск по регламенту ликвидации прихватов.",
                "LoRaWAN: Стабильный прием пакетов с забоя. Пакеты: 99.98% OK",
                "Amirig: Расчет давления свабирования/поршневания в норме (запас 1.25 МПа).",
                "Telegram API: Отправлен суточный рапорт баланса времени за 23:00."
            ];
            appendScadaLog(msgList[Math.floor(Math.random() * msgList.length)]);
        }

        // Draw loop
        const ctx = pressureCtx;
        const width = pressureCanvas.width;
        const height = pressureCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // Tech grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        // Y grid
        for (let y = 30; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        // X grid
        for (let x = 40; x < width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Critical warning limit threshold line (9.0 MPa limit)
        ctx.strokeStyle = 'rgba(255, 94, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const limitY = height - (9.0 / 15.0) * height; // Max mapping 15 MPa
        ctx.moveTo(0, limitY);
        ctx.lineTo(width, limitY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(255, 94, 0, 0.6)';
        ctx.font = '10px monospace';
        ctx.fillText("WARN LIMIT: 9.0 MPa", 10, limitY - 5);

        // Drawing helper for Bezier Spline
        function drawSpline(points, maxScale, color, glowColor, fillAlpha) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 6;
            ctx.shadowColor = glowColor;
            ctx.beginPath();

            const step = width / (points.length - 1);
            
            ctx.moveTo(0, height - (points[0] / maxScale) * height);
            
            for (let i = 0; i < points.length - 1; i++) {
                const x1 = i * step;
                const y1 = height - (points[i] / maxScale) * height;
                const x2 = (i + 1) * step;
                const y2 = height - (points[i + 1] / maxScale) * height;
                
                const xc = (x1 + x2) / 2;
                const yc = (y1 + y2) / 2;
                
                ctx.quadraticCurveTo(x1, y1, xc, yc);
            }
            
            // Connect last point
            const lastX = (points.length - 1) * step;
            const lastY = height - (points[points.length - 1] / maxScale) * height;
            ctx.lineTo(lastX, lastY);
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow

            if (fillAlpha > 0) {
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, glowColor.replace(/[\d\.]+\)$/, fillAlpha + ')'));
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        // Plot three channels
        // 1. Flow Rate (Gray)
        drawSpline(flowPoints, 40.0, '#718096', 'rgba(113, 128, 150, 0.1)', 0.05);

        // 2. Torque (Light Gray)
        drawSpline(torquePoints, 35.0, '#A0AEC0', 'rgba(160, 174, 192, 0.1)', 0.03);

        // 3. Pressure (Orange/Red)
        const pColor = isCriticalSpike ? '#FF3B30' : '#FF6B00';
        const pGlow = isCriticalSpike ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 107, 0, 0.3)';
        drawSpline(pressurePoints, 15.0, pColor, pGlow, 0.12);
    }

    // ==========================================
    // 2. FINANCIAL AI SPEECH & OCR CONSULES (PAGE 3)
    // ==========================================
    let voiceCanvas, voiceCtx, voiceFrameId;
    let isVoiceRecording = false;
    let voicePhase = 0;
    let voiceAmp = 4; // current wave amplitude (interpolated)

    function initFinancialAI() {
        // Voice module setup
        const recordBtn = document.getElementById('voice-record-btn');
        const chatArea = document.getElementById('chat-voice-area');
        const jsonResult = document.getElementById('json-result');
        const speechMetrics = document.getElementById('speech-metrics-box');
        
        voiceCanvas = document.getElementById('voice-waves-canvas');
        if (voiceCanvas) {
            voiceCtx = voiceCanvas.getContext('2d');
            voiceCanvas.width = voiceCanvas.clientWidth;
            voiceCanvas.height = voiceCanvas.clientHeight;
            isVoiceRecording = false;
            voiceAmp = 4;
            
            if (voiceFrameId) cancelAnimationFrame(voiceFrameId);
            animateVoiceWaves();
        }

        if (recordBtn) {
            recordBtn.onclick = async () => {
                if (isVoiceRecording) return; // prevent spamming
                isVoiceRecording = true;
                
                recordBtn.classList.add('recording');
                recordBtn.querySelector('span').textContent = 'Голосовой поток обрабатывается...';
                
                const voiceWaves = document.getElementById('voice-waves');
                if (voiceWaves) voiceWaves.style.opacity = '1';

                // Reset metrics display
                if (speechMetrics) {
                    speechMetrics.style.display = 'none';
                }

                await delay(2000);

                // Add user voice transcript with smooth fade & slide animation
                const userBubble = document.createElement('div');
                userBubble.className = 'chat-bubble user';
                userBubble.style.opacity = '0';
                userBubble.style.transform = 'translateY(15px)';
                userBubble.innerHTML = `
                    <div class="transcript-source">Whisper Speech Input:</div>
                    "Спиши 500 000 тенге за кабель КГ у дистрибьютора."
                `;
                chatArea.appendChild(userBubble);
                if (globalThis.gsap) {
                    globalThis.gsap.to(userBubble, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => { chatArea.scrollTop = chatArea.scrollHeight; }
                    });
                } else {
                    userBubble.style.opacity = '1';
                    userBubble.style.transform = 'none';
                    chatArea.scrollTop = chatArea.scrollHeight;
                }

                recordBtn.classList.remove('recording');
                recordBtn.querySelector('span').textContent = 'Запустить демо-запись';
                isVoiceRecording = false;
                if (voiceWaves) voiceWaves.style.opacity = '0.45';

                await delay(1000);

                // Add bot response with smooth fade & slide animation
                const botBubble = document.createElement('div');
                botBubble.className = 'chat-bubble bot';
                botBubble.style.opacity = '0';
                botBubble.style.transform = 'translateY(15px)';
                botBubble.innerHTML = `
                    <div class="bot-header">ИИ-Финансист (LLaMA-3 Core):</div>
                    Распознано финансовое распоряжение. Сущности успешно сопоставлены с бюджетом. Операция одобрена и занесена в реестр JSC-ERP.
                `;
                chatArea.appendChild(botBubble);
                if (globalThis.gsap) {
                    globalThis.gsap.to(botBubble, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => { chatArea.scrollTop = chatArea.scrollHeight; }
                    });
                } else {
                    botBubble.style.opacity = '1';
                    botBubble.style.transform = 'none';
                    chatArea.scrollTop = chatArea.scrollHeight;
                }

                // Show processing metrics with smooth scale & fade animation
                if (speechMetrics) {
                    speechMetrics.style.display = 'block';
                    speechMetrics.style.opacity = '0';
                    speechMetrics.style.transform = 'scaleY(0.8)';
                    speechMetrics.style.transformOrigin = 'top';
                    speechMetrics.innerHTML = `
                        <div class="metric-line"><strong>Latency (Задержка):</strong> 220ms (Whisper Webhook API)</div>
                        <div class="metric-line"><strong>Confidence Score (Точность):</strong> 99.42%</div>
                        <div class="metric-line"><strong>Acoustic Model:</strong> whisper-large-v3-turbo (Local Host)</div>
                        <div class="metric-line"><strong>Token cost:</strong> Input: 12 tokens, Output: 24 tokens ($0.000108)</div>
                    `;
                    if (globalThis.gsap) {
                        globalThis.gsap.to(speechMetrics, {
                            opacity: 1,
                            scaleY: 1,
                            duration: 0.5,
                            ease: 'back.out(1.2)'
                        });
                    } else {
                        speechMetrics.style.opacity = '1';
                        speechMetrics.style.transform = 'none';
                    }
                }

                // Output JSON with fade-in effect
                if (jsonResult) {
                    const data = {
                        "pipeline_event": "SPEECH_TRANSACTION_RECOGNIZED",
                        "model_version": "llama-3.1-70b-instruct-conntur",
                        "inference_time_ms": 184,
                        "entities_extracted": {
                            "action": "DEBIT",
                            "value_amount": 500000.00,
                            "currency_unit": "KZT",
                            "inventory_spec": "силовой_кабель_КГ_3х10",
                            "counterparty_id": "Distributor_Kabel_LLP",
                            "matched_ledger_account": "1250-Hardware_Capital_Expense"
                        },
                        "security_verdict": "COMPLIANT_WITH_CAPEX_LIMITS",
                        "erp_sync_status": "COMMITTED_IN_LEDGER"
                    };
                    jsonResult.innerHTML = '';
                    jsonResult.style.opacity = '0';
                    if (globalThis.gsap) {
                        jsonResult.innerHTML = JSON.stringify(data, null, 2);
                        globalThis.gsap.to(jsonResult, {
                            opacity: 1,
                            duration: 0.8,
                            ease: 'power1.out'
                        });
                    } else {
                        jsonResult.innerHTML = JSON.stringify(data, null, 2);
                        jsonResult.style.opacity = '1';
                    }
                }
            };
        }
        // --- Finance chips: trigger quick demo scenarios ---
        const financeChips = document.querySelectorAll('.finance-chips .btn-mood-chip');
        const nlpScenarios = {
            transfer: {
                phrase: '"Спиши 500 000 тенге за кабель КГ у дистрибьютора ООО «КабельСервис»."',
                amount: 92, amountLabel: '500 000 ₸',
                entity: 87, entityLabel: 'КабельСервис',
                conf: 99, confLabel: '99.4%',
                statusTag: 'РАСПОЗНАНО',
            },
            budget: {
                phrase: '"Запрос: остаток по статье Capex за Q2 по проекту строительства."',
                amount: 76, amountLabel: 'Q2 / Capex',
                entity: 80, entityLabel: 'Строительство',
                conf: 97, confLabel: '97.1%',
                statusTag: 'ИЗВЛЕЧЕНО',
            },
            report: {
                phrase: '"Сформируй сводный отчёт расходов за июнь по всем центрам затрат."',
                amount: 60, amountLabel: 'Июнь / All',
                entity: 95, entityLabel: 'Все ЦЗ',
                conf: 98, confLabel: '98.8%',
                statusTag: 'ОБРАБОТАНО',
            },
        };

        function animateNlpBars(scenario) {
            const statusEl = document.getElementById('finance-nlp-status');
            const barAmount = document.getElementById('nlp-bar-amount');
            const valAmount = document.getElementById('nlp-val-amount');
            const barEntity = document.getElementById('nlp-bar-entity');
            const valEntity = document.getElementById('nlp-val-entity');
            const barConf = document.getElementById('nlp-bar-conf');
            const valConf = document.getElementById('nlp-val-conf');
            if (!barAmount) return;

            if (statusEl) statusEl.textContent = 'ОБРАБОТКА...';

            // Reset bars
            [barAmount, barEntity, barConf].forEach(b => b && (b.style.width = '0%'));
            [valAmount, valEntity, valConf].forEach(v => v && (v.textContent = '—'));

            setTimeout(() => {
                if (barAmount) { barAmount.style.width = scenario.amount + '%'; }
                if (valAmount) valAmount.textContent = scenario.amountLabel;
                setTimeout(() => {
                    if (barEntity) barEntity.style.width = scenario.entity + '%';
                    if (valEntity) valEntity.textContent = scenario.entityLabel;
                    setTimeout(() => {
                        if (barConf) barConf.style.width = scenario.conf + '%';
                        if (valConf) valConf.textContent = scenario.confLabel;
                        if (statusEl) statusEl.textContent = scenario.statusTag;
                    }, 300);
                }, 250);
            }, 200);
        }

        financeChips.forEach(chip => {
            chip.onclick = () => {
                financeChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const key = chip.getAttribute('data-finance');
                const sc = nlpScenarios[key];
                if (!sc || !recordBtn) return;

                // Simulate clicking record
                recordBtn.click();

                // Override the user bubble text with chip scenario phrase after a tick
                setTimeout(() => {
                    if (chatArea) {
                        const userBubbles = chatArea.querySelectorAll('.chat-bubble.user');
                        if (userBubbles.length) {
                            const last = userBubbles[userBubbles.length - 1];
                            const src = last.querySelector('.transcript-source');
                            if (src) last.innerHTML = `<div class="transcript-source">Whisper Speech Input:</div>${sc.phrase}`;
                        }
                    }
                    animateNlpBars(sc);
                }, 1200);
            };
        });

        // Also trigger NLP bars after normal record button use
        const origOnClick = recordBtn ? recordBtn.onclick : null;
        if (recordBtn && origOnClick) {
            const wrappedClick = recordBtn.onclick;
            recordBtn.onclick = async () => {
                await wrappedClick();
                setTimeout(() => animateNlpBars(nlpScenarios.transfer), 1000);
            };
        }


        // OCR Scan setup
        const btnScan = document.getElementById('btn-ocr-scan');
        const laser = document.getElementById('laser-line');
        const verdict = document.getElementById('ocr-verdict-result');
        const docSelector = document.querySelectorAll('.btn-select-doc');
        const docContent = document.getElementById('mock-doc-content');

        let activeDoc = 'invoice-ok';

        docSelector.forEach(btn => {
            btn.onclick = () => {
                docSelector.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeDoc = btn.getAttribute('data-doc');

                // Update document template text with highlightable bounding boxes
                if (activeDoc === 'invoice-ok') {
                    docContent.innerHTML = `
                        <img src="img/invoice-scan.jpg" class="ocr-bg-img" onerror="this.style.display='none';">
                        <img src="img/qadr-logo.png" class="ocr-doc-logo" onerror="this.style.display='none';">
                        <div class="ocr-bounding-box" style="top: 8%; left: 15%; width: 70%; height: 8%;" data-label="Тип документа: Счет-фактура (99.8%)"></div>
                        <div class="ocr-bounding-box" style="top: 22%; left: 3%; width: 94%; height: 8%;" data-label="Поставщик: QADR (99.2%)"></div>
                        <div class="ocr-bounding-box" style="top: 36%; left: 3%; width: 94%; height: 8%;" data-label="Покупатель: АО 'Продашн Инжиниринг' (99.5%)"></div>
                        <div class="ocr-bounding-box" style="top: 48%; left: 3%; width: 94%; height: 8%;" data-label="Договор спецификации: № Д-402 (98.9%)"></div>
                        <div class="ocr-bounding-box" style="top: 67%; left: 30%; width: 68%; height: 10%;" data-label="ИТОГ К ОПЛАТЕ: 500 000 KZT (99.7%)"></div>
                        
                        <h4>СЧЕТ НА ОПЛАТУ № 184</h4>
                        <p><strong>Поставщик:</strong> QADR</p>
                        <p><strong>Покупатель:</strong> АО "Продашн Инжиниринг"</p>
                        <p><strong>Договор:</strong> № Д-402 от 12.02.2026 (Согласован)</p>
                        <hr>
                        <p><strong>Номенклатура:</strong> Кабель силовой КГ 3х10+1х6</p>
                        <p><strong>Сумма к оплате:</strong> <span class="highlight-val">500 000 KZT</span></p>
                    `;
                    document.getElementById('ocr-val-supplier').textContent = 'QADR';
                    document.getElementById('ocr-val-total').textContent = '500 000 KZT';
                    document.getElementById('ocr-val-total').style.color = '';
                } else {
                    docContent.innerHTML = `
                        <img src="img/invoice-scan.jpg" class="ocr-bg-img" onerror="this.style.display='none';">
                        <img src="img/qadr-logo.png" class="ocr-doc-logo" onerror="this.style.display='none';">
                        <div class="ocr-bounding-box" style="top: 8%; left: 15%; width: 70%; height: 8%;" data-label="Тип документа: Счет-фактура (99.8%)"></div>
                        <div class="ocr-bounding-box" style="top: 22%; left: 3%; width: 94%; height: 8%;" data-label="Поставщик: QADR (99.1%)"></div>
                        <div class="ocr-bounding-box" style="top: 36%; left: 3%; width: 94%; height: 8%;" data-label="Покупатель: АО 'Продашн Инжиниринг' (99.5%)"></div>
                        <div class="ocr-bounding-box" style="top: 48%; left: 3%; width: 94%; height: 8%;" data-label="Договор спецификации: № Д-402 (98.9%)"></div>
                        <div class="ocr-bounding-box" style="top: 67%; left: 30%; width: 68%; height: 12%;" data-label="ИТОГ К ОПЛАТЕ: 1 200 000 KZT [ПРЕВЫШЕНИЕ] (99.6%)"></div>
                        
                        <h4>СЧЕТ НА ОПЛАТУ № 927</h4>
                        <p><strong>Поставщик:</strong> QADR</p>
                        <p><strong>Покупатель:</strong> АО "Продашн Инжиниринг"</p>
                        <p><strong>Договор:</strong> № Д-402 от 12.02.2026 (Согласован)</p>
                        <hr>
                        <p><strong>Номенклатура:</strong> Оборудование ЧПУ станка</p>
                        <p><strong>Сумма к оплате:</strong> <span class="highlight-val">1 200 000 KZT</span> <br><small style="color:#FF5E00">(Бюджетный лимит спецификации: 1 000 000 KZT)</small></p>
                    `;
                    document.getElementById('ocr-val-supplier').textContent = 'QADR';
                    document.getElementById('ocr-val-total').textContent = '1 200 000 KZT';
                    document.getElementById('ocr-val-total').style.color = '';
                }

                // Reset verdict
                if (verdict) {
                    verdict.className = 'ocr-verdict-box';
                    verdict.innerHTML = `<span class="verdict-label">ВЕРДИКТ:</span><span class="verdict-status pending">ОЖИДАНИЕ СКАНИРОВАНИЯ</span>`;
                }
            };
        });

        if (btnScan) {
            btnScan.onclick = async () => {
                if (laser) laser.classList.add('scanning');
                if (verdict) {
                    verdict.innerHTML = `<span class="verdict-label">ВЕРДИКТ:</span><span class="verdict-status pending">СЛУЖБА AI OCR: ПОДКЛЮЧЕНИЕ К СЕССИИ...</span>`;
                }

                const boxes = document.querySelectorAll('.ocr-bounding-box');
                boxes.forEach(box => {
                    box.className = 'ocr-bounding-box'; // reset
                });

                // Sequential flashing of bounding boxes to look like active text detection
                for (let i = 0; i < boxes.length; i++) {
                    await delay(350);
                    boxes[i].classList.add('active');
                    if (verdict) {
                        const labelText = boxes[i].getAttribute('data-label').split(' (')[0];
                        verdict.innerHTML = `<span class="verdict-label">ВЕРДИКТ:</span><span class="verdict-status pending">OCR РАСПОЗНАВАНИЕ: ${labelText}...</span>`;
                    }
                }

                await delay(400);
                if (laser) laser.classList.remove('scanning');

                if (verdict) {
                    if (activeDoc === 'invoice-ok') {
                        boxes.forEach(b => b.classList.add('verified'));
                        verdict.className = 'ocr-verdict-box success';
                        verdict.innerHTML = `<span class="verdict-label">ВЕРДИКТ:</span><span class="verdict-status success">ОДОБРЕНО (Все реквизиты совпадают, сумма укладывается в рамки лимитов Capex договора № Д-402)</span>`;
                        document.getElementById('ocr-val-total').style.color = '#FF6B00';
                    } else {
                        // Mark everything OK except the last box
                        for (let i = 0; i < boxes.length - 1; i++) {
                            boxes[i].classList.add('verified');
                        }
                        boxes[boxes.length - 1].classList.add('error');
                        verdict.className = 'ocr-verdict-box failed';
                        verdict.innerHTML = `<span class="verdict-label">ВЕРДИКТ:</span><span class="verdict-status failed">ОТКЛОНЕНО (Обнаружено несоответствие: сумма 1 200 000 KZT превышает лимит Capex спецификации договора на 200 000 KZT)</span>`;
                        document.getElementById('ocr-val-total').style.color = '#FF5E00';
                    }
                }
            };
        }
    }

    function animateVoiceWaves() {
        if (!voiceCanvas || !voiceCtx) return;
        voiceFrameId = requestAnimationFrame(animateVoiceWaves);

        const w = voiceCanvas.width;
        const h = voiceCanvas.height;
        voiceCtx.clearRect(0, 0, w, h);

        voicePhase += 0.15; // wave speed

        const targetMaxAmp = isVoiceRecording ? h * 0.45 : h * 0.06;
        voiceAmp += (targetMaxAmp - voiceAmp) * 0.08; // smooth interpolation

        // Draw 3 layered waves
        const waves = [
            { freq: 0.02, amp: voiceAmp * 1.0, opacity: 0.5, speed: 0.05, color: '#FF6B00' },
            { freq: 0.04, amp: voiceAmp * 0.6, opacity: 0.3, speed: -0.08, color: '#718096' },
            { freq: 0.015, amp: voiceAmp * 0.8, opacity: 0.2, speed: 0.03, color: '#A0AEC0' }
        ];

        waves.forEach(wave => {
            voiceCtx.strokeStyle = wave.color;
            voiceCtx.globalAlpha = wave.opacity;
            voiceCtx.lineWidth = isVoiceRecording ? 2.5 : 1.2;
            voiceCtx.beginPath();

            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin(x * wave.freq + voicePhase * wave.speed * 10) * wave.amp;
                if (x === 0) voiceCtx.moveTo(x, y);
                else voiceCtx.lineTo(x, y);
            }
            voiceCtx.stroke();
        });
        voiceCtx.globalAlpha = 1.0;
    }

    // ==========================================
    // 3. AUDIO VISUALIZER & CBT COACH (PAGE 4)
    // ==========================================
    let vizCanvas, vizCtx, vizFrameId;
    let isPlaying = false;
    let vizAngle = 0;
    let currentBufferMB = 5.2;
    let currentBufferSec = 19;
    let audioEl = null;
    
    // Timeline variables
    let lastProgressTime = null;
    let elapsedTimeSec = 0;
    const playbackDurationSec = 300; // 5 minutes duration (300 seconds)

    // Visualizer Theme colors (Forest is default)
    let activeThemeColor = 'rgba(255, 107, 0, 0.3)';
    let activeThemeWaveColor = '#FF6B00';
    let ripples = []; // expanding concentric rings

    function updateSentimentBars(anxiety, stress, calm) {
        const bars = [
            { bar: document.getElementById('sentiment-anxiety'), val: document.getElementById('sentiment-anxiety-val'), target: anxiety },
            { bar: document.getElementById('sentiment-stress'), val: document.getElementById('sentiment-stress-val'), target: stress },
            { bar: document.getElementById('sentiment-calm'), val: document.getElementById('sentiment-calm-val'), target: calm }
        ];

        bars.forEach(item => {
            if (item.bar && item.val) {
                if (globalThis.gsap) {
                    globalThis.gsap.to(item.bar, {
                        width: item.target + '%',
                        duration: 1.2,
                        ease: 'power2.out'
                    });
                    const currentVal = parseInt(item.val.textContent) || 0;
                    const valObj = { value: currentVal };
                    globalThis.gsap.to(valObj, {
                        value: item.target,
                        duration: 1.2,
                        ease: 'power2.out',
                        onUpdate: () => {
                            item.val.textContent = Math.round(valObj.value) + '%';
                        }
                    });
                } else {
                    item.bar.style.width = item.target + '%';
                    item.val.textContent = item.target + '%';
                }
            }
        });
    }

    function initAudioVisualizer() {
        vizCanvas = document.getElementById('visualizer-canvas');
        if (!vizCanvas) return;
        vizCtx = vizCanvas.getContext('2d');

        vizCanvas.width = vizCanvas.parentElement.clientWidth;
        vizCanvas.height = vizCanvas.parentElement.clientHeight;

        const playBtn       = document.getElementById('btn-player-play');
        const natureBtns    = document.querySelectorAll('.btn-nature');
        const trackTitle    = document.getElementById('current-track-title');
        const trackSubtitle = document.getElementById('current-track-subtitle');
        const playerCard    = document.getElementById('audio-player-card');
        const fillEl        = document.getElementById('player-timeline-fill');
        const currentEl     = document.getElementById('player-time-current');
        const durationEl    = document.getElementById('player-time-duration');
        const bufferValEl   = document.getElementById('player-buffer');
        const timelineSlider= document.getElementById('player-timeline-slider');

        ripples = [];

        // ─── Track definitions ──────────────────────────────────────────────
        const tracks = {
            forest: {
                src:      'audio/forest.mp3',
                title:    'Звуки леса и ручья',
                subtitle: 'Терапевтическая сессия медитации • 96kHz Lossless',
                theme:    'theme-forest',
                color:    'rgba(34, 197, 94, 0.3)',
                wave:     '#22C55E'
            },
            rain: {
                src:      'audio/rain.mp3',
                title:    'Осенний дождь (Almaty Ambient)',
                subtitle: 'Нейро-атмосфера дождя • 96kHz FLAC',
                theme:    'theme-rain',
                color:    'rgba(59, 130, 246, 0.3)',
                wave:     '#3B82F6'
            },
            waves: {
                src:      'audio/waves.mp3',
                title:    'Тихий океан (Alpha-Relax Session)',
                subtitle: 'Гипнотическая сессия прибоя • 96kHz Lossless',
                theme:    'theme-waves',
                color:    'rgba(139, 92, 246, 0.3)',
                wave:     '#8B5CF6'
            }
        };

        // ─── HTML5 Audio instance ────────────────────────────────────────────
        let currentSound = 'forest';
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
        }
        audioEl = new Audio();
        audioEl.loop = true;
        audioEl.volume = 0.7;
        audioEl.preload = 'metadata';

        function loadTrack(sound, autoplay) {
            const t = tracks[sound];
            if (!t) return;
            currentSound = sound;

            // UI updates
            if (trackTitle)    trackTitle.textContent    = t.title;
            if (trackSubtitle) trackSubtitle.textContent = t.subtitle;
            if (playerCard) {
                playerCard.classList.remove('theme-forest', 'theme-rain', 'theme-waves');
                playerCard.classList.add(t.theme);
            }
            activeThemeColor     = t.color;
            activeThemeWaveColor = t.wave;

            // Load audio
            const wasPlaying = isPlaying;
            audioEl.pause();
            audioEl.src = t.src;
            audioEl.load();

            // Reset UI
            if (fillEl)    fillEl.style.width = '0%';
            if (currentEl) currentEl.textContent = '00:00';
            if (bufferValEl) bufferValEl.textContent = 'Загрузка...';

            if (autoplay || wasPlaying) {
                audioEl.play().then(() => {
                    isPlaying = true;
                    setPlayIcon(true);
                    if (vizFrameId) cancelAnimationFrame(vizFrameId);
                    animateVisualizer();
                }).catch(() => showAudioMissingBanner(t.src));
            }
        }

        // ─── Show banner if file is missing ─────────────────────────────────
        function showAudioMissingBanner(src) {
            let banner = document.getElementById('audio-missing-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'audio-missing-banner';
                banner.style.cssText = `
                    position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
                    background:rgba(255,94,0,0.92); color:#fff; font-size:0.75rem;
                    padding:8px 16px; border-radius:8px; z-index:10;
                    text-align:center; pointer-events:none; white-space:nowrap;
                `;
                if (playerCard) { playerCard.style.position = 'relative'; playerCard.appendChild(banner); }
            }
            const filename = src.split('/').pop();
            banner.textContent = `⚠ Файл не найден: ${filename} — положи его в папку audio/`;
            banner.style.display = 'block';
            setTimeout(() => { banner.style.display = 'none'; }, 5000);
        }

        // ─── Play / Pause icon helper ────────────────────────────────────────
        function setPlayIcon(playing) {
            if (!playBtn) return;
            playBtn.innerHTML = playing
                ? `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
                : `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        }

        // ─── Format seconds → mm:ss ──────────────────────────────────────────
        function fmt(sec) {
            if (!isFinite(sec)) return '∞';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }

        // ─── Audio events → update UI ────────────────────────────────────────
        audioEl.addEventListener('timeupdate', () => {
            const dur = audioEl.duration || 0;
            const cur = audioEl.currentTime || 0;
            elapsedTimeSec = cur;
            if (fillEl)    fillEl.style.width = dur ? ((cur / dur) * 100) + '%' : '0%';
            if (currentEl) currentEl.textContent = fmt(cur);
            if (durationEl) durationEl.textContent = fmt(dur);

            // Simulated buffer telemetry
            if (bufferValEl && isPlaying) {
                const mb = (cur * 0.032).toFixed(1); // ~32KB/s for mp3 ~256kbps
                bufferValEl.textContent = `${mb} MB / ${Math.round(cur)}s`;
            }
        });

        audioEl.addEventListener('loadedmetadata', () => {
            if (durationEl) durationEl.textContent = fmt(audioEl.duration);
        });

        audioEl.addEventListener('ended', () => {
            isPlaying = false;
            setPlayIcon(false);
            if (vizFrameId) cancelAnimationFrame(vizFrameId);
            if (vizCtx) vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
        });

        audioEl.addEventListener('error', () => {
            showAudioMissingBanner(audioEl.src);
            isPlaying = false;
            setPlayIcon(false);
        });

        // ─── Play / Pause button ─────────────────────────────────────────────
        if (playBtn) {
            playBtn.onclick = () => {
                if (isPlaying) {
                    audioEl.pause();
                    isPlaying = false;
                    setPlayIcon(false);
                    if (vizFrameId) cancelAnimationFrame(vizFrameId);
                    if (vizCtx) vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
                    if (bufferValEl) bufferValEl.textContent = 'Пауза';
                } else {
                    if (!audioEl.src || audioEl.src === window.location.href) {
                        loadTrack(currentSound, true);
                        return;
                    }
                    audioEl.play().then(() => {
                        isPlaying = true;
                        setPlayIcon(true);
                        if (vizFrameId) cancelAnimationFrame(vizFrameId);
                        animateVisualizer();
                    }).catch(() => showAudioMissingBanner(audioEl.src));
                }
            };
        }

        // ─── Nature sound buttons ─────────────────────────────────────────────
        natureBtns.forEach(btn => {
            btn.onclick = () => {
                natureBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sound = btn.getAttribute('data-sound');
                loadTrack(sound, true);
            };
        });

        // ─── Timeline seek ────────────────────────────────────────────────────
        if (timelineSlider) {
            timelineSlider.onclick = (e) => {
                const rect    = timelineSlider.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const dur     = audioEl.duration;
                if (dur && isFinite(dur)) {
                    audioEl.currentTime = percent * dur;
                }
            };
        }

        // ─── Load default track (but don't autoplay until user clicks) ───────
        loadTrack('forest', false);
        setPlayIcon(false);


        const chatPsyArea = document.getElementById('chat-psy-area');
        const moodChips = document.querySelectorAll('.btn-mood-chip');

        moodChips.forEach(chip => {
            chip.onclick = async () => {
                const moodText = chip.textContent;
                moodChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                const userBubble = document.createElement('div');
                userBubble.className = 'chat-bubble user';
                userBubble.textContent = moodText;
                chatPsyArea.appendChild(userBubble);
                chatPsyArea.scrollTop = chatPsyArea.scrollHeight;

                await delay(800);

                const logBlock = document.createElement('div');
                logBlock.className = 'chat-bubble psy-log';
                logBlock.style.fontFamily = 'monospace';
                logBlock.style.fontSize = '0.78rem';
                logBlock.style.color = '#4A5568';
                logBlock.style.background = '#F7FAFC';
                logBlock.style.border = '1px solid #E2E8F0';
                logBlock.style.padding = '12px';
                logBlock.style.borderRadius = '8px';
                logBlock.style.margin = '5px 0';
                logBlock.style.whiteSpace = 'pre-line';
                logBlock.style.width = '100%';
                chatPsyArea.appendChild(logBlock);
                
                const logs = [
                    '► [SYSTEM] Инициализация клинического CBT-протокола...',
                    '► [BIO] Синхронизация сенсоров: Вариабельность пульса - 72уд/мин (Стабильно)',
                    '► [NLP] Запуск семантического анализа тональности...',
                    '► [TTS] Генерация бинаурального тембра (10Hz Alpha Carrier)...',
                    '► [READY] Трансляция терапевтического контента запущена...'
                ];
                
                for (let i = 0; i < logs.length; i++) {
                    logBlock.textContent += (i > 0 ? '\n' : '') + logs[i];
                    chatPsyArea.scrollTop = chatPsyArea.scrollHeight;
                    await delay(450);
                }
                
                await delay(600);
                chatPsyArea.removeChild(logBlock);

                const botBubble = document.createElement('div');
                botBubble.className = 'chat-bubble psy';
                
                const chipType = chip.getAttribute('data-mood');
                if (chipType === 'stress') {
                    botBubble.innerHTML = `<div class="bot-header">ИИ-Коуч (CBT Protocol):</div>Зафиксированы маркеры когнитивного искажения: Катастрофизация. <br><strong>Рекомендуемая практика "5-4-3-2-1":</strong> Назовите мысленно 5 предметов, которые вы видите, 4 звука, которые слышите, и сделайте 3 глубоких вдоха.`;
                    updateSentimentBars(88, 92, 12);
                } else if (chipType === 'fatigue') {
                    botBubble.innerHTML = `<div class="bot-header">ИИ-Коуч (CBT Protocol):</div>Уровень истощения батареи внимания: Высокий (84% выгорания). <br><strong>План действий:</strong> Автоматически сформирована аудиосессия "Глубокий сон" с внедрением бинауральных биений на частоте 4Гц. Запустите её в плеере слева.`;
                    updateSentimentBars(45, 84, 22);
                } else {
                    botBubble.innerHTML = `<div class="bot-header">ИИ-Коуч (CBT Protocol):</div>Проанализирован паттерн засыпания. <br><strong>Инструкция:</strong> Начнем перевод мозговой активности в альфа-фазу. Рекомендую прослушивание трека "Тихий океан" со спадом громкости на протяжении 15 минут.`;
                    updateSentimentBars(72, 68, 35);
                }
                
                if (globalThis.gsap) {
                    botBubble.style.opacity = 0;
                    botBubble.style.transform = 'translateY(10px)';
                    chatPsyArea.appendChild(botBubble);
                    globalThis.gsap.to(botBubble, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                } else {
                    chatPsyArea.appendChild(botBubble);
                }
                
                chatPsyArea.scrollTop = chatPsyArea.scrollHeight;
            };
        });

        const chatPsyInput = document.getElementById('chat-psy-input');
        const chatPsySendBtn = document.getElementById('chat-psy-send-btn');

        if (chatPsyInput && chatPsySendBtn) {
            const sendMessage = async () => {
                const text = chatPsyInput.value.trim();
                if (!text) return;
                chatPsyInput.value = '';

                // Add user message bubble
                const userBubble = document.createElement('div');
                userBubble.className = 'chat-bubble user';
                userBubble.textContent = text;
                chatPsyArea.appendChild(userBubble);
                chatPsyArea.scrollTop = chatPsyArea.scrollHeight;

                await delay(800);

                // Add AI log
                const logBlock = document.createElement('div');
                logBlock.className = 'chat-bubble psy-log';
                logBlock.style.fontFamily = 'monospace';
                logBlock.style.fontSize = '0.78rem';
                logBlock.style.color = '#4A5568';
                logBlock.style.background = '#F7FAFC';
                logBlock.style.border = '1px solid #E2E8F0';
                logBlock.style.padding = '12px';
                logBlock.style.borderRadius = '8px';
                logBlock.style.margin = '5px 0';
                logBlock.style.whiteSpace = 'pre-line';
                logBlock.style.width = '100%';
                chatPsyArea.appendChild(logBlock);

                const logs = [
                    '► [SYSTEM] Анализ сообщения пользователя...',
                    '► [NLP] Определение уровня стресса и тревожности...',
                    '► [TTS] Синтез терапевтической голосовой обратной связи...',
                    '► [READY] Ответ сформирован.'
                ];

                for (let i = 0; i < logs.length; i++) {
                    logBlock.textContent += (i > 0 ? '\n' : '') + logs[i];
                    chatPsyArea.scrollTop = chatPsyArea.scrollHeight;
                    await delay(350);
                }

                await delay(500);
                chatPsyArea.removeChild(logBlock);

                // Add AI response
                const botBubble = document.createElement('div');
                botBubble.className = 'chat-bubble psy';
                botBubble.innerHTML = `<div class="bot-header">ИИ-Коуч (CBT Protocol):</div>Спасибо, что поделились. Давайте сосредоточимся на вашем состоянии. Рекомендую сделать короткую дыхательную практику (4 секунды вдох, 4 секунды задержка, 4 секунды выдох). Сделайте это прямо сейчас.`;
                
                if (globalThis.gsap) {
                    botBubble.style.opacity = 0;
                    botBubble.style.transform = 'translateY(10px)';
                    chatPsyArea.appendChild(botBubble);
                    globalThis.gsap.to(botBubble, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                } else {
                    chatPsyArea.appendChild(botBubble);
                }
                chatPsyArea.scrollTop = chatPsyArea.scrollHeight;
                updateSentimentBars(45, 50, 65);
            };

            chatPsySendBtn.onclick = sendMessage;
            chatPsyInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            };
        }
    }

    function animateVisualizer() {
        if (!vizCanvas || !vizCtx || !isPlaying) return;
        vizFrameId = requestAnimationFrame(animateVisualizer);

        const ctx = vizCtx;
        const width = vizCanvas.width;
        const height = vizCanvas.height;

        ctx.clearRect(0, 0, width, height);

        const bitrateValEl = document.getElementById('player-bitrate');
        if (bitrateValEl && Math.random() < 0.05) {
            const br = 1408 + Math.floor(Math.random() * 9);
            bitrateValEl.textContent = br + ' kbps';
        }

        const bufferValEl = document.getElementById('player-buffer');
        if (bufferValEl) {
            if (currentBufferMB < 15.4) {
                currentBufferMB += 0.02 + Math.random() * 0.03;
                currentBufferSec += 0.08 + Math.random() * 0.12;
            } else {
                currentBufferMB = 15.4 + (Math.random() - 0.5) * 0.1;
                currentBufferSec = 56 + (Math.random() - 0.5) * 0.5;
            }
            bufferValEl.textContent = `${currentBufferMB.toFixed(1)} MB / ${Math.floor(currentBufferSec)}s`;
        }

        if (isPlaying) {
            const now = performance.now();
            if (!lastProgressTime) lastProgressTime = now;
            const deltaSec = (now - lastProgressTime) / 1000;
            lastProgressTime = now;

            elapsedTimeSec += deltaSec;
            if (elapsedTimeSec >= playbackDurationSec) {
                elapsedTimeSec = 0;
            }

            const fillEl = document.getElementById('player-timeline-fill');
            const currentEl = document.getElementById('player-time-current');
            if (fillEl) {
                fillEl.style.width = (elapsedTimeSec / playbackDurationSec * 100) + '%';
            }
            if (currentEl) {
                const minutes = Math.floor(elapsedTimeSec / 60);
                const seconds = Math.floor(elapsedTimeSec % 60);
                currentEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        vizAngle += 0.025;
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;
        const pulseRadius = baseRadius + Math.sin(vizAngle * 2) * 5;

        if (Math.random() < 0.03) {
            ripples.push({ r: pulseRadius, alpha: 0.4 });
        }

        ctx.lineWidth = 1;
        for (let i = ripples.length - 1; i >= 0; i--) {
            const rip = ripples[i];
            rip.r += 1.2;
            rip.alpha -= 0.008;

            if (rip.alpha <= 0) {
                ripples.splice(i, 1);
                continue;
            }

            ctx.strokeStyle = activeThemeWaveColor;
            ctx.globalAlpha = rip.alpha;
            ctx.beginPath();
            ctx.arc(cx, cy, rip.r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        const numLines = 90;
        ctx.strokeStyle = activeThemeColor;
        ctx.lineWidth = 2.5;

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2 + vizAngle * 0.1;
            const noise = Math.sin(i * 0.45 + vizAngle * 3) * Math.cos(i * 0.2 - vizAngle) * 0.6 + 0.4;
            const lineLength = 10 + noise * (isPlaying ? 35 : 5) + Math.random() * 2;
            
            const startX = cx + Math.cos(angle) * pulseRadius;
            const startY = cy + Math.sin(angle) * pulseRadius;
            const endX = cx + Math.cos(angle) * (pulseRadius + lineLength);
            const endY = cy + Math.sin(angle) * (pulseRadius + lineLength);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(1, 8, 21, 0.95)';
        ctx.strokeStyle = activeThemeWaveColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeThemeWaveColor;

        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    const itemsData = {
        'bottle-1': { name: 'Кола (0.5л)', price: 1500, shelf: 'shelf-1', weight: 500 },
        'bottle-2': { name: 'Кола (0.5л)', price: 1500, shelf: 'shelf-1', weight: 500 },
        'bottle-3': { name: 'Кола (0.5л)', price: 1500, shelf: 'shelf-1', weight: 500 },
        'sandwich-1': { name: 'Сэндвич классический', price: 1800, shelf: 'shelf-2', weight: 300 },
        'sandwich-2': { name: 'Сэндвич классический', price: 1800, shelf: 'shelf-2', weight: 300 },
        'sandwich-3': { name: 'Сэндвич классический', price: 1800, shelf: 'shelf-2', weight: 300 }
    };

    let cart = {};

    function initSmartFridge() {
        const itemElements = document.querySelectorAll('.item-element');
        const cartList = document.getElementById('cart-list');
        const totalVal = document.getElementById('cart-total');
        const qrPane = document.getElementById('qr-checkout');
        const pushEl = document.getElementById('kaspi-push');

        if (!cartList) return;

        cart = {};
        updateCartUI();
        
        if (pushEl) pushEl.style.display = 'none';

        const scaleLog = document.getElementById('fridge-scale-log');
        const apiLog = document.getElementById('fridge-api-log');
        if (scaleLog) scaleLog.innerHTML = `<div class="log-placeholder">Ожидание взаимодействия с полками...</div>`;
        if (apiLog) apiLog.innerHTML = `<div class="log-placeholder">LockAPI status: SECURED. Waiting for QR authorization...</div>`;

        // Door Interactive Click Logic
        const door = document.getElementById('fridge-door');
        let doorOpen = false;
        if (door) {
            door.style.transform = 'none';
            door.onclick = (e) => {
                e.stopPropagation();
                doorOpen = !doorOpen;
                if (doorOpen) {
                    door.style.transform = 'rotateY(-48deg)';
                    appendApiLog("DOOR_SENSOR: Дверь холодильника открыта покупателем.");
                } else {
                    door.style.transform = 'none';
                    appendApiLog("DOOR_SENSOR: Дверь холодильника закрыта.");
                }
            };
        }

        itemElements.forEach(item => {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
            
            item.onclick = (e) => {
                e.stopPropagation();
                
                // If door is closed, open it automatically first
                if (!doorOpen && door) {
                    doorOpen = true;
                    door.style.transform = 'rotateY(-48deg)';
                    appendApiLog("DOOR_SENSOR: Автоматическое открытие двери при выборе товара.");
                }

                const itemId = item.id;
                const data = itemsData[itemId];
                
                // Flying item animation using GSAP
                const rect = item.getBoundingClientRect();
                const fly = document.createElement('div');
                fly.className = 'fly-item';
                fly.style.left = rect.left + 'px';
                fly.style.top = rect.top + 'px';
                document.body.appendChild(fly);

                const cartIcon = document.getElementById('cart-list');
                const cartRect = cartIcon.getBoundingClientRect();

                if (globalThis.gsap) {
                    item.style.opacity = '0';
                    item.style.pointerEvents = 'none';
                    
                    globalThis.gsap.to(fly, {
                        left: cartRect.left + 50,
                        top: cartRect.top + 50,
                        width: 8,
                        height: 8,
                        opacity: 0.2,
                        duration: 0.9,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            fly.remove();
                            addItemToCart(itemId, data);
                        }
                    });
                } else {
                    item.style.opacity = '0';
                    item.style.pointerEvents = 'none';
                    fly.remove();
                    addItemToCart(itemId, data);
                }
            };
        });
    }

    function addItemToCart(itemId, data) {
        if (cart[itemId]) {
            cart[itemId].count++;
        } else {
            cart[itemId] = { ...data, count: 1 };
        }

        // Write load cell signal logs
        const scaleLog = document.getElementById('fridge-scale-log');
        if (scaleLog) {
            if (scaleLog.querySelector('.log-placeholder')) scaleLog.innerHTML = '';
            const now = new Date();
            const timeStr = `[${now.toTimeString().split(' ')[0]}]`;
            const adcCode = "0x" + Math.floor(0x3B8000 + Math.random() * 0x24000).toString(16).toUpperCase();
            scaleLog.innerHTML = `<div class="log-line">${timeStr} <strong>HX711 Delta:</strong> -${data.weight}г на полке ${data.shelf === 'shelf-1' ? '1 (Напитки)' : '2 (Закуски)'} (ADC Code: ${adcCode})</div>` + scaleLog.innerHTML;
        }

        updateCartUI();
    }

    function updateCartUI() {
        const cartList = document.getElementById('cart-list');
        const totalVal = document.getElementById('cart-total');
        const qrPane = document.getElementById('qr-checkout');
        
        if (!cartList) return;

        cartList.innerHTML = '';
        let total = 0;
        let itemsCount = 0;

        for (const [id, item] of Object.entries(cart)) {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '6px';
            row.style.fontSize = '0.85rem';
            row.innerHTML = `
                <span style="color:#FFFFFF;">${item.name} (x${item.count})</span>
                <span style="font-weight:bold; color: var(--accent-orange)">${item.price * item.count} KZT</span>
            `;
            cartList.appendChild(row);
            total += item.price * item.count;
            itemsCount += item.count;
        }

        if (itemsCount === 0) {
            cartList.innerHTML = `<p class="empty-cart-msg">Возьмите продукты из холодильника...</p>`;
            if (qrPane) {
                qrPane.style.opacity = '0.2';
                qrPane.style.pointerEvents = 'none';
            }
        } else {
            if (qrPane) {
                qrPane.style.opacity = '1';
                qrPane.style.pointerEvents = 'auto';
            }

            // Show Kaspi QR Push notification mockup on phone screen
            const pushEl = document.getElementById('kaspi-push');
            const pushAmountEl = document.getElementById('push-amount');
            if (pushEl && pushAmountEl) {
                pushAmountEl.textContent = `${total} KZT`;
                pushEl.style.display = 'block';

                const payBtn = document.getElementById('btn-pay-push');
                if (payBtn) {
                    payBtn.onclick = () => {
                        pushEl.style.display = 'none';
                        cart = {};
                        updateCartUI();
                        
                        // Close fridge door automatically on payment success
                        const door = document.getElementById('fridge-door');
                        if (door) door.style.transform = 'none';
                        
                        // Restock fridge elements visually
                        const itemElements = document.querySelectorAll('.item-element');
                        itemElements.forEach(item => {
                            item.style.opacity = '1';
                            item.style.pointerEvents = 'auto';
                        });

                        appendApiLog(`KASPI_GATEWAY: Оплата ${total} KZT совершена успешно. Дверь заблокирована.`);
                    };
                }
            }
        }

        if (totalVal) totalVal.textContent = `${total} KZT`;
    }

    function appendApiLog(msg) {
        const apiLog = document.getElementById('fridge-api-log');
        if (apiLog) {
            if (apiLog.querySelector('.log-placeholder')) apiLog.innerHTML = '';
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            apiLog.innerHTML = `<div class="log-line" style="margin-bottom:4px;">[${timeStr}] ${msg}</div>` + apiLog.innerHTML;
        }
    }

    function initAcademicCRM() {
        const stepBtns = document.querySelectorAll('.funnel-step-btn');
        const display = document.getElementById('funnel-view-display');

        stepBtns.forEach(btn => {
            btn.onclick = () => {
                stepBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const step = btn.getAttribute('data-step');
                updateCRMView(step);
            };
        });
        
        // Load default lead view
        updateCRMView('lead');
    }

    function updateCRMView(step) {
        const display = document.getElementById('funnel-view-display');
        if (!display) return;

        if (step === 'lead') {
            display.innerHTML = `
                <div class="crm-salesforce-panel" style="background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(10, 17, 40, 0.08); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(10, 17, 40, 0.05);">
                    <div class="crm-panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(10, 17, 40, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">Лид #4829 — Абитуриент: Алишер Смагулов</h4>
                        <span class="badge-tag" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold;">ОЖИДАЕТ ОБРАБОТКИ</span>
                    </div>
                    <div class="crm-grid-columns" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px;">
                        <div class="crm-meta-col" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
                            <div><strong style="color: var(--text-secondary);">Источник:</strong> <span style="color: var(--accent-orange); font-weight: bold;">Telegram Lead Gen Bot</span></div>
                            <div><strong style="color: var(--text-secondary);">Целевой регион:</strong> Германия (Бакалавриат)</div>
                            <div><strong style="color: var(--text-secondary);">Специальность:</strong> Computer Science (TUM)</div>
                            <div><strong style="color: var(--text-secondary);">Рейтинг лида:</strong> <span style="color: #FF6B00; font-weight: bold;">94/100 (High Potential)</span></div>
                        </div>
                        <div class="crm-activity-col" style="font-size: 0.8rem; color: var(--text-primary);">
                            <h5 style="margin: 0 0 10px 0; font-size: 0.85rem; color: var(--text-primary);">События по лиду (Activity History):</h5>
                            <div class="activity-timeline" style="display: flex; flex-direction: column; gap: 8px; border-left: 2px solid rgba(10, 17, 40, 0.08); padding-left: 15px; margin-left: 5px;">
                                <div class="act-row"><span style="color: var(--text-secondary);">[23:22:01]</span> Лид создан ботом. Запрошен чеклист.</div>
                                <div class="act-row"><span style="color: var(--text-secondary);">[23:22:05]</span> Отправка WhatsApp-приветствия.</div>
                                <div class="act-row"><span style="color: var(--text-secondary);">[23:22:10]</span> Менеджер назначен: Елена Кравцова.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 'chat') {
            display.innerHTML = `
                <div class="crm-salesforce-panel" style="background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(10, 17, 40, 0.08); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(10, 17, 40, 0.05);">
                    <div class="crm-panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(10, 17, 40, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">Omnichannel Chat Center</h4>
                        <span class="badge-tag" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold;">WHATSAPP + TELEGRAM ACTIVE</span>
                    </div>
                    <div class="crm-chat-history-console" style="display: flex; flex-direction: column; gap: 15px; height: 180px; overflow-y: auto; padding-right: 5px; font-size: 0.85rem;">
                        <div class="chat-console-msg student" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 12px; color: var(--text-primary);">
                            <span class="msg-author" style="color: var(--accent-orange); font-weight: bold; display: block; margin-bottom: 4px;">Студент (Telegram):</span>
                            Здравствуйте, хочу поступить в TUM на Computer Science. Что мне нужно загрузить?
                        </div>
                        <div class="chat-console-msg manager" style="background: rgba(255, 94, 0, 0.05); border: 1px solid rgba(255, 94, 0, 0.1); border-radius: 12px; padding: 12px; align-self: flex-end; width: 90%; color: var(--text-primary);">
                            <span class="msg-author" style="color: var(--text-primary); font-weight: bold; display: block; margin-bottom: 4px;">Елена Кравцова (Менеджер):</span>
                            Здравствуйте! Направила вам ссылку на личный кабинет. Потребуется скан загранпаспорта, IELTS сертификат и ваше мотивационное письмо.
                        </div>
                        <div class="chat-console-msg student" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 12px; color: var(--text-primary);">
                            <span class="msg-author" style="color: var(--accent-orange); font-weight: bold; display: block; margin-bottom: 4px;">Студент (Telegram):</span>
                            Отлично, я всё собрал и загрузил в кабинет! Проверьте, пожалуйста.
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 'docs') {
            display.innerHTML = `
                <div class="crm-salesforce-panel" style="background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(10, 17, 40, 0.08); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(10, 17, 40, 0.05);">
                    <div class="crm-panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(10, 17, 40, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">Кабинет документов абитуриента</h4>
                        <span class="badge-tag" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold;">3/3 ВЕРИФИЦИРОВАНО</span>
                    </div>
                    <div class="crm-files-cabinet-console" style="display: flex; flex-direction: column; gap: 10px;">
                        <div class="crm-file-box-console" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                            <div class="file-info-console">
                                <span class="file-name" style="color: var(--text-primary); font-weight: bold; display: block;">Загранпаспорт_Смагулов.pdf</span>
                                <span class="file-meta" style="color: var(--text-secondary); font-size: 0.7rem;">Размер: 2.4 MB | SHA256: 3F4A8D...</span>
                            </div>
                            <span class="status-badge-console uploaded" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">VERIFIED</span>
                        </div>
                        <div class="crm-file-box-console" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                            <div class="file-info-console">
                                <span class="file-name" style="color: var(--text-primary); font-weight: bold; display: block;">IELTS_Academic_6.5.pdf</span>
                                <span class="file-meta" style="color: var(--text-secondary); font-size: 0.7rem;">Размер: 1.1 MB | Проверка ID подлинности: OK</span>
                            </div>
                            <span class="status-badge-console uploaded" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">VERIFIED</span>
                        </div>
                        <div class="crm-file-box-console" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                            <div class="file-info-console">
                                <span class="file-name" style="color: var(--text-primary); font-weight: bold; display: block;">Motivation_Letter_TUM.pdf</span>
                                <span class="file-meta" style="color: var(--text-secondary); font-size: 0.7rem;">Размер: 840 KB | AI Plagiarism check: 98% Unique</span>
                            </div>
                            <span class="status-badge-console uploaded" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">VERIFIED</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 'questionnaire') {
            display.innerHTML = `
                <div class="crm-salesforce-panel" style="background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(10, 17, 40, 0.08); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(10, 17, 40, 0.05);">
                    <div class="crm-panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(10, 17, 40, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">Заполнение анкет и отправка пакета</h4>
                        <span class="badge-tag" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold;">API MAPPING COMPLETED</span>
                    </div>
                    <div class="crm-grid-columns" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px;">
                        <div class="crm-meta-col" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 15px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 8px;">
                            <h5 style="margin: 0 0 5px 0; color: var(--text-primary); font-size: 0.85rem;">Сопоставление полей:</h5>
                            <div><strong style="color: var(--text-secondary);">Фамилия/Имя:</strong> Smagulov Alisher <span style="color: #FF6B00;">✔</span></div>
                            <div><strong style="color: var(--text-secondary);">Дата рождения:</strong> 14.10.2008 <span style="color: #FF6B00;">✔</span></div>
                            <div><strong style="color: var(--text-secondary);">Ср. балл аттестата:</strong> GPA 4.92/5.00 <span style="color: #FF6B00;">✔</span></div>
                        </div>
                        <div class="crm-activity-col" style="font-size: 0.8rem; color: var(--text-primary);">
                            <h5 style="margin: 0 0 10px 0; font-size: 0.85rem; color: var(--text-primary);">Выходные документы:</h5>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div>TUM Online Application Form — <span style="color: #FF6B00; font-weight: bold;">ГЕНЕРАЦИЯ ЗАВЕРШЕНА</span></div>
                                <div>Визовая анкета DS-160 — <span style="color: var(--accent-orange); font-weight: bold;">ГОТОВА К ОТПРАВКЕ</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (step === 'enroll') {
            display.innerHTML = `
                <div class="crm-salesforce-panel" style="background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(10, 17, 40, 0.08); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(10, 17, 40, 0.05);">
                    <div class="crm-panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(10, 17, 40, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">Зачисление и Финансовый транш</h4>
                        <span class="badge-tag" style="background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); color: #FF6B00; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold;">ТРАНЗАКЦИЯ ПОДТВЕРЖДЕНА</span>
                    </div>
                    <div class="crm-invoice-console" style="background: rgba(10, 17, 40, 0.02); border: 1px solid rgba(10, 17, 40, 0.04); border-radius: 12px; padding: 15px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px; color: var(--text-primary);">
                        <div><strong style="color: var(--text-secondary);">Получатель:</strong> Technical University of Munich (TUM)</div>
                        <div><strong style="color: var(--text-secondary);">Назначение:</strong> Winter Semester Tuition Fee</div>
                        <div><strong style="color: var(--text-secondary);">SWIFT Code:</strong> DEUTDEDDXXX</div>
                        <hr style="border: 0; border-top: 1px dashed rgba(10, 17, 40, 0.1); margin: 10px 0;">
                        <p style="font-size: 1.1rem; color: #FF6B00; margin: 0;"><strong>ИТОГ:</strong> 8,500 EUR (4,250,000 KZT по курсу Нацбанка РК)</p>
                    </div>
                </div>
            `;
        }
    }

    let flowCanvas, flowCtx, flowFrameId;
    let particlesList = [];

    function initERPFlows() {
        flowCanvas = document.getElementById('erp-flow-lines-canvas');
        if (!flowCanvas) return;
        flowCtx = flowCanvas.getContext('2d');

        flowCanvas.width = flowCanvas.parentElement.clientWidth;
        flowCanvas.height = flowCanvas.parentElement.clientHeight;

        particlesList = [];
        animateERPFlows();
    }

    // Cubic Bezier calculation for smooth curved network splines
    function getBezierPoint(t, x1, y1, x2, y2) {
        const cpY1 = y1 - (y1 - y2) * 0.45;
        const cpY2 = y2 + (y1 - y2) * 0.45;
        const mt = 1 - t;
        const x = mt*mt*mt*x1 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x2;
        const y = mt*mt*mt*y1 + 3*mt*mt*t*cpY1 + 3*mt*t*t*cpY2 + t*t*t*y2;
        return { x, y };
    }

    function animateERPFlows() {
        if (!flowCanvas || !flowCtx) return;
        flowFrameId = requestAnimationFrame(animateERPFlows);

        const ctx = flowCtx;
        const w = flowCanvas.width;
        const h = flowCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const hwX = [w * 0.2, w * 0.5, w * 0.8];
        const deptX = [w * 0.25, w * 0.5, w * 0.75];
        const boardX = w * 0.5;

        // Draw background curved connection lines
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.15)';
        ctx.lineWidth = 1.5;

        // Bottom to Mid
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(hwX[i], h - 50);
                const cpY1 = (h - 50) - ((h - 50) - (h / 2)) * 0.45;
                const cpY2 = (h / 2) + ((h - 50) - (h / 2)) * 0.45;
                ctx.bezierCurveTo(hwX[i], cpY1, deptX[j], cpY2, deptX[j], h / 2);
                ctx.stroke();
            }
        }

        // Mid to Top
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(deptX[j], h / 2);
            const cpY1 = (h / 2) - ((h / 2) - 50) * 0.45;
            const cpY2 = 50 + ((h / 2) - 50) * 0.45;
            ctx.bezierCurveTo(deptX[j], cpY1, boardX, cpY2, boardX, 50);
            ctx.stroke();
        }

        // Spawn dynamic phototonic particles
        if (Math.random() < 0.05) {
            const startX = hwX[Math.floor(Math.random() * hwX.length)];
            const midX = deptX[Math.floor(Math.random() * deptX.length)];
            
            particlesList.push({
                startX: startX,
                startY: h - 50,
                midX: midX,
                midY: h / 2,
                endX: boardX,
                endY: 50,
                progress: 0,
                speed: 0.01 + Math.random() * 0.008,
                history: [] // trail buffers
            });
        }

        // Update and draw particles with fading glowing trails
        for (let i = particlesList.length - 1; i >= 0; i--) {
            const p = particlesList[i];
            p.progress += p.speed;

            if (p.progress >= 2) {
                particlesList.splice(i, 1);
                continue;
            }

            let pt;
            let pColor, pGlow;

            if (p.progress < 1) {
                pt = getBezierPoint(p.progress, p.startX, p.startY, p.midX, p.midY);
                pColor = '#FF6B00';
                pGlow = 'rgba(255, 107, 0, 0.5)';
            } else {
                pt = getBezierPoint(p.progress - 1, p.midX, p.midY, p.endX, p.endY);
                pColor = '#FF6B00';
                pGlow = 'rgba(255, 107, 0, 0.5)';
            }

            // Keep track of trail history
            p.history.push({ x: pt.x, y: pt.y });
            if (p.history.length > 8) p.history.shift();

            // Draw particle trail (fade out tail)
            p.history.forEach((hPt, hIdx) => {
                const alpha = hIdx / p.history.length * 0.4;
                ctx.fillStyle = pColor;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(hPt.x, hPt.y, 2 + hIdx * 0.25, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // Draw leading particle core
            ctx.fillStyle = pColor;
            ctx.shadowColor = pGlow;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    let packCanvas, packCtx, packFrameId;
    let packedBoxes = [];
    let packTick = 0;

    function initBinPacking() {
        packCanvas = document.getElementById('bin-packing-canvas');
        if (!packCanvas) return;
        packCtx = packCanvas.getContext('2d');

        packedBoxes = [];
        packTick = 0;

        if (packFrameId) cancelAnimationFrame(packFrameId);

        const pLogs = document.getElementById('bin-pack-logs');
        if (pLogs) {
            pLogs.innerHTML = `<div class="log-placeholder">Инициализация Best-Fit Decreasing 3D Grid...</div>`;
        }

        const densityEl = document.getElementById('bin-density-val');
        const stepEl = document.getElementById('bin-step-val');
        if (densityEl) densityEl.textContent = '0.0%';
        if (stepEl) stepEl.textContent = '0 / 15';

        animateBinPacking();
    }

    window._restartBinPacking = initBinPacking;

    function animateBinPacking() {
        if (!packCanvas || !packCtx) return;
        packFrameId = requestAnimationFrame(animateBinPacking);

        const ctx = packCtx;
        const w = packCanvas.width;
        const h = packCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Container isometric frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        
        const cx = w / 2;
        const cy = h / 2 + 30;

        function isoProj(x, y, z) {
            return {
                rx: cx + (x - y) * Math.cos(Math.PI / 6) * 16,
                ry: cy - (x + y) * Math.sin(Math.PI / 6) * 16 - z * 14
            };
        }

        // Draw container base outline
        ctx.beginPath();
        let pt = isoProj(0, 0, 0); ctx.moveTo(pt.rx, pt.ry);
        pt = isoProj(6, 0, 0); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(6, 4, 0); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(0, 4, 0); ctx.lineTo(pt.rx, pt.ry);
        ctx.closePath();
        ctx.stroke();

        // Draw vertical columns
        ctx.beginPath();
        pt = isoProj(0, 0, 0); ctx.moveTo(pt.rx, pt.ry); pt = isoProj(0, 0, 3); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(6, 0, 0); ctx.moveTo(pt.rx, pt.ry); pt = isoProj(6, 0, 3); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(6, 4, 0); ctx.moveTo(pt.rx, pt.ry); pt = isoProj(6, 4, 3); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(0, 4, 0); ctx.moveTo(pt.rx, pt.ry); pt = isoProj(0, 4, 3); ctx.lineTo(pt.rx, pt.ry);
        ctx.stroke();

        // Draw top frame
        ctx.beginPath();
        pt = isoProj(0, 0, 3); ctx.moveTo(pt.rx, pt.ry);
        pt = isoProj(6, 0, 3); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(6, 4, 3); ctx.lineTo(pt.rx, pt.ry);
        pt = isoProj(0, 4, 3); ctx.lineTo(pt.rx, pt.ry);
        ctx.closePath();
        ctx.stroke();

        // Add a box dynamically every 60 frames
        packTick++;
        if (packTick % 60 === 0 && packedBoxes.length < 15) {
            const positions = [
                {x:0, y:0, z:0}, {x:2, y:0, z:0}, {x:4, y:0, z:0},
                {x:0, y:2, z:0}, {x:2, y:2, z:0}, {x:4, y:2, z:0},
                {x:0, y:0, z:1}, {x:2, y:0, z:1}, {x:4, y:0, z:1},
                {x:0, y:2, z:1}, {x:2, y:2, z:1}, {x:4, y:2, z:1},
                {x:0, y:0, z:2}, {x:2, y:0, z:2}, {x:4, y:0, z:2}
            ];
            const p = positions[packedBoxes.length];
            if (p) {
                // Initialize animZ to slide/fall down smoothly
                packedBoxes.push({
                    x: p.x, y: p.y, z: p.z,
                    animZ: p.z + 4 // offset above
                });
            }

            const pLogs = document.getElementById('bin-pack-logs');
            if (pLogs) {
                if (pLogs.querySelector('.log-placeholder')) pLogs.innerHTML = '';
                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                pLogs.innerHTML = `<div class="log-line">[${timeStr}] Box #${packedBoxes.length} placed at offset x:${p.x}, y:${p.y}, z:${p.z} (BFD-3D packing math)</div>` + pLogs.innerHTML;
            }
        }

        const densityVal = document.getElementById('bin-density-val');
        const stepVal = document.getElementById('bin-step-val');

        if (densityVal) {
            const efficiency = 60 + (packedBoxes.length / 15) * 32.4;
            densityVal.textContent = efficiency.toFixed(1) + '%';
        }
        if (stepVal) {
            stepVal.textContent = `${packedBoxes.length} / 15 коробок`;
        }

        if (packedBoxes.length >= 15 && packTick % 500 === 0) {
            packedBoxes = [];
            const pLogs = document.getElementById('bin-pack-logs');
            if (pLogs) pLogs.innerHTML = `<div class="log-placeholder">Загрузка контейнера сброшена. Запуск укладки заново...</div>`;
        }

        // Draw packed boxes (cubes) with falling animation interpolation
        packedBoxes.forEach((b, idx) => {
            // Smoothly interpolate Z animation
            b.animZ += (b.z - b.animZ) * 0.15;
            
            drawCube(ctx, b.x, b.y, b.animZ, 2, 2, 1, idx % 2 === 0 ? 'rgba(0, 255, 210, 0.65)' : 'rgba(255, 94, 0, 0.65)');
        });

        function drawCube(ctx, x, y, z, dx, dy, dz, color) {
            ctx.fillStyle = color;
            ctx.strokeStyle = '#000E29';
            ctx.lineWidth = 1;

            // Draw Top face
            ctx.beginPath();
            let p = isoProj(x, y, z + dz); ctx.moveTo(p.rx, p.ry);
            p = isoProj(x + dx, y, z + dz); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x + dx, y + dy, z + dz); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x, y + dy, z + dz); ctx.lineTo(p.rx, p.ry);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw Left face
            ctx.fillStyle = shadeColor(color, -20);
            ctx.beginPath();
            p = isoProj(x, y, z); ctx.moveTo(p.rx, p.ry);
            p = isoProj(x + dx, y, z); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x + dx, y, z + dz); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x, y, z + dz); ctx.lineTo(p.rx, p.ry);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw Right face
            ctx.fillStyle = shadeColor(color, -40);
            ctx.beginPath();
            p = isoProj(x + dx, y, z); ctx.moveTo(p.rx, p.ry);
            p = isoProj(x + dx, y + dy, z); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x + dx, y + dy, z + dz); ctx.lineTo(p.rx, p.ry);
            p = isoProj(x + dx, y, z + dz); ctx.lineTo(p.rx, p.ry);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        function shadeColor(color, percent) {
            if (color.startsWith('rgba')) {
                const parts = color.substring(5, color.length - 1).split(',');
                let r = parseInt(parts[0]);
                let g = parseInt(parts[1]);
                let b = parseInt(parts[2]);
                let a = parseFloat(parts[3]);

                r = Math.max(0, Math.min(255, r + percent));
                g = Math.max(0, Math.min(255, g + percent));
                b = Math.max(0, Math.min(255, b + percent));

                return `rgba(${r},${g},${b},${a})`;
            }
            return color;
        }
    }

    function initAccordions() {
        const triggers = document.querySelectorAll('.slide-accordion-trigger');
        triggers.forEach(trigger => {
            trigger.onclick = () => {
                const item = trigger.closest('.slide-accordion-item');
                const content = item.querySelector('.slide-accordion-content');
                if (!item || !content) return;
                
                const isOpen = item.classList.contains('active');
                
                // Close other items in the same slides-accordion container
                const parentAccordion = trigger.closest('.slides-accordion');
                if (parentAccordion) {
                    const siblingItems = parentAccordion.querySelectorAll('.slide-accordion-item');
                    siblingItems.forEach(sibling => {
                        if (sibling !== item) {
                            sibling.classList.remove('active');
                            const sibContent = sibling.querySelector('.slide-accordion-content');
                            if (sibContent) {
                                sibContent.style.maxHeight = null;
                            }
                        }
                    });
                }

                if (isOpen) {
                    item.classList.remove('active');
                    content.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            };
        });
    }

    function resetAllAccordions() {
        const items = document.querySelectorAll('.slide-accordion-item');
        items.forEach(item => {
            item.classList.remove('active');
            const content = item.querySelector('.slide-accordion-content');
            if (content) {
                content.style.maxHeight = null;
            }
        });
    }

    // ==========================================
    // MODAL WINDOWS AND PRESENTATION TRIGGERS
    // ==========================================
    function initModals() {
        const triggers = document.querySelectorAll('.demo-trigger-btn');
        triggers.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const modalId = btn.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    document.body.classList.add('modal-open');
                    if (window.lenisInstance) window.lenisInstance.stop();
                    
                    // Trigger initialization based on which modal opened
                    if (modalId === 'modal-demo-product') {
                        initPressureChart();
                    } else if (modalId === 'modal-demo-finance') {
                        initFinancialAI();
                    } else if (modalId === 'modal-demo-health') {
                        isPlaying = false;
                        initAudioVisualizer();
                    } else if (modalId === 'modal-demo-vending') {
                        initSmartFridge();
                    } else if (modalId === 'modal-demo-crm') {
                        initAcademicCRM();
                    } else if (modalId === 'modal-demo-erp') {
                        // Init active tab
                        const activeTabBtn = modal.querySelector('.erp-tab-btn.active');
                        if (activeTabBtn) {
                            const tabId = activeTabBtn.getAttribute('data-tab');
                            if (tabId === 'erp-tab-flows') initERPFlows();
                            else if (tabId === 'erp-tab-packing') initBinPacking();
                        } else {
                            initERPFlows();
                            initBinPacking();
                        }
                    }
                }
            };
        });

        // Close triggers
        const closeBtns = document.querySelectorAll('.demo-modal-close');
        closeBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const modal = btn.closest('.demo-modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                    if (window.lenisInstance) window.lenisInstance.start();
                    stopAllLoops();
                }
            };
        });

        // Close when clicking modal background
        const modals = document.querySelectorAll('.demo-modal');
        modals.forEach(modal => {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                    if (window.lenisInstance) window.lenisInstance.start();
                    stopAllLoops();
                }
            };
        });

        // ERP Tab switching
        const tabBtns = document.querySelectorAll('.erp-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetTabId = btn.getAttribute('data-tab');
                const tabs = document.querySelectorAll('.erp-tab-content');
                tabs.forEach(t => t.classList.remove('active'));

                const targetTab = document.getElementById(targetTabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                    // Re-init canvas inside active tab
                    if (targetTabId === 'erp-tab-flows') {
                        initERPFlows();
                    } else if (targetTabId === 'erp-tab-packing') {
                        initBinPacking();
                    }
                }
            };
        });
    }

    // ==========================================
    // ROUTING AND LIFE CYCLE MANAGER
    // ==========================================
    function stopAllLoops() {
        if (pressureFrameId) cancelAnimationFrame(pressureFrameId);
        if (vizFrameId) cancelAnimationFrame(vizFrameId);
        if (flowFrameId) cancelAnimationFrame(flowFrameId);
        if (packFrameId) cancelAnimationFrame(packFrameId);
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
            audioEl = null;
        }
        isPlaying = false;
        resetAllAccordions();
    }

    window.addEventListener('page-swapped', (e) => {
        stopAllLoops();

        // Close active modals on page change
        const activeModals = document.querySelectorAll('.demo-modal.active');
        activeModals.forEach(m => m.classList.remove('active'));
        if (window.lenisInstance) window.lenisInstance.start();

        // Bind new page triggers
        initModals();
    });

    // Handle initial routing context
    setTimeout(() => {
        initAccordions();
        initModals();
    }, 200);

})();
