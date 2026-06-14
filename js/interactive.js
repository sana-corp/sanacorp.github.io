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
    let isCriticalSpike = false;
    let criticalTime = 0;

    function initPressureChart() {
        pressureCanvas = document.getElementById('pressure-chart');
        if (!pressureCanvas) return;
        pressureCtx = pressureCanvas.getContext('2d');

        // Populate initial points
        pressurePoints = [];
        for (let i = 0; i < 50; i++) {
            pressurePoints.push(5.2 + Math.random() * 0.4); // Nominal pressure around 5.4 MPa
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
                appendScadaLog("ВНИМАНИЕ: Зафиксирован аномальный рост момента и давления на забое. Риск затяжки!");
                
                setTimeout(() => {
                    if (isCriticalSpike && overlay) overlay.classList.add('triggered');
                }, 1000);
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                isCriticalSpike = false;
                if (overlay) overlay.classList.remove('triggered');
                if (statusEl) {
                    statusEl.textContent = 'AMIRIG ONLINE';
                    statusEl.className = 'sim-status active';
                }
                appendScadaLog("Риск нейтрализован. Параметры бурения возвращены в гидравлическое окно. Мониторинг продолжается.");
            };
        }

        // Initialize log box with standard queries
        const logsBox = document.getElementById('scada-logs-box');
        if (logsBox) {
            logsBox.innerHTML = `
                <div class="log-row">[23:20:01] Amirig Engine: Инициализация предиктивного ядра риск-инжиниринга.</div>
                <div class="log-row">[23:20:03] Amirig telemetry: Соединение с партией ГТИ установлено. Чтение сигналов.</div>
                <div class="log-row">[23:20:05] Автораспознавание фаз: Текущая операция - Бурение ротором (глубина 3450м).</div>
                <div class="log-row">[23:20:10] Датчики буровой: Калибровка верифицирована. Точность контроля: 99.9%</div>
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

        // Update loop
        pressurePoints.shift();
        
        let lastVal = pressurePoints[pressurePoints.length - 1] || 5.4;
        let val = lastVal;

        if (isCriticalSpike) {
            criticalTime++;
            // Rapid spike from 5.4 to 12.8 MPa
            val = Math.min(13.8, 5.4 + Math.pow(criticalTime, 2) * 0.15 + Math.random() * 0.3);
            pressurePoints.push(val);
        } else {
            // Normal fluctuation around 5.4 MPa
            val = lastVal + (Math.random() - 0.5) * 0.08;
            val = Math.max(4.8, Math.min(6.2, val));
            pressurePoints.push(val);
        }

        // Update numeric readouts in sidebar
        const pressValEl = document.getElementById('scada-pressure');
        const tempValEl = document.getElementById('scada-temp');
        const signalValEl = document.getElementById('scada-signal');
        const batteryValEl = document.getElementById('scada-battery');

        if (pressValEl) {
            pressValEl.textContent = val.toFixed(2) + ' MPa';
            if (isCriticalSpike && val > 9.0) {
                pressValEl.style.color = '#FF5E00';
            } else {
                pressValEl.style.color = '#FFFFFF';
            }
        }

        if (tempValEl && Math.random() < 0.03) {
            const temp = 42.0 + Math.sin(performance.now() * 0.001) * 0.8 + Math.random() * 0.1;
            tempValEl.textContent = temp.toFixed(1) + ' °C';
        }

        if (signalValEl && Math.random() < 0.01) {
            const sig = -75 - Math.floor(Math.random() * 5);
            signalValEl.textContent = sig + ' dBm';
        }

        if (batteryValEl && Math.random() < 0.005) {
            const bat = 3.65 - Math.random() * 0.01;
            batteryValEl.textContent = bat.toFixed(2) + ' V';
        }

        // Randomly query telemetry log rows
        if (Math.random() < 0.003) {
            const msgList = [
                "Amirig: Фильтрация шумов датчика веса (фильтр Калмана). Отклонение <0.05%.",
                "Автораспознавание операций: Детектирована смена фазы - Наращивание свечи.",
                "Terrixa AI: Выполнен семантический поиск по регламенту ликвидации прихватов.",
                "Amirig: Расчет давления свабирования/поршневания в норме (запас 1.25 МПа).",
                "Мониторинг ННБ: Сопоставление телеметрии бурового подрядчика и инклинометрии.",
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

        // Plot telemetry line
        ctx.strokeStyle = isCriticalSpike ? '#FF5E00' : '#00ffd2';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = isCriticalSpike ? 'rgba(255, 94, 0, 0.5)' : 'rgba(0, 255, 210, 0.4)';
        ctx.beginPath();

        const step = width / (pressurePoints.length - 1);
        for (let i = 0; i < pressurePoints.length; i++) {
            const x = i * step;
            const y = height - (pressurePoints[i] / 15.0) * height; // max 15.0 MPa scale
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
        
        // Fill area under line
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, isCriticalSpike ? 'rgba(255, 94, 0, 0.15)' : 'rgba(0, 255, 210, 0.12)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // ==========================================
    // 2. FINANCIAL AI SPEECH & OCR CONSULES (PAGE 3)
    // ==========================================
    function initFinancialAI() {
        // Voice module setup
        const recordBtn = document.getElementById('voice-record-btn');
        const chatArea = document.getElementById('chat-voice-area');
        const jsonResult = document.getElementById('json-result');
        const speechMetrics = document.getElementById('speech-metrics-box');

        if (recordBtn) {
            recordBtn.onclick = async () => {
                recordBtn.classList.add('recording');
                recordBtn.querySelector('span').textContent = 'Голосовой поток обрабатывается...';
                
                const voiceWaves = document.getElementById('voice-waves');
                if (voiceWaves) voiceWaves.classList.add('active');

                // Reset metrics display
                if (speechMetrics) {
                    speechMetrics.style.display = 'none';
                }

                await delay(1500);

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
                if (voiceWaves) voiceWaves.classList.remove('active');

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
                        document.getElementById('ocr-val-total').style.color = '#4CAF50';
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

    // ==========================================
    // 3. AUDIO VISUALIZER & CBT COACH (PAGE 4)
    // ==========================================
    let vizCanvas, vizCtx, vizFrameId;
    let isPlaying = false;
    let vizAngle = 0;
    let currentBufferMB = 5.2;
    let currentBufferSec = 19;
    
    // Timeline variables
    let lastProgressTime = null;
    let elapsedTimeSec = 0;
    const playbackDurationSec = 300; // 5 minutes duration (300 seconds)

    // Visualizer Theme colors (Forest is default)
    let activeThemeColor = 'rgba(0, 255, 210, 0.6)';
    let activeThemeWaveColor = '#FF5E00';

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

        const playBtn = document.getElementById('btn-player-play');
        const natureBtns = document.querySelectorAll('.btn-nature');
        const trackTitle = document.getElementById('current-track-title');
        const trackSubtitle = document.getElementById('current-track-subtitle');
        const playerCard = document.getElementById('audio-player-card');

        if (playBtn) {
            playBtn.onclick = () => {
                isPlaying = !isPlaying;
                playBtn.classList.toggle('playing');
                if (isPlaying) {
                    playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
                    
                    // Reset buffer when starting play
                    currentBufferMB = 5.2;
                    currentBufferSec = 19;
                    lastProgressTime = performance.now();
                    
                    animateVisualizer();
                } else {
                    playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
                    if (vizFrameId) cancelAnimationFrame(vizFrameId);
                    // Clear visualizer
                    if (vizCtx) vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
                    
                    // Set buffer to idle state
                    const bufferValEl = document.getElementById('player-buffer');
                    if (bufferValEl) {
                        bufferValEl.textContent = '1.2 MB / 4s (Paused)';
                    }
                    lastProgressTime = null;
                }
            };
        }

        natureBtns.forEach(btn => {
            btn.onclick = () => {
                natureBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sound = btn.getAttribute('data-sound');
                if (playerCard) {
                    // Remove old themes and apply new theme class
                    playerCard.classList.remove('theme-forest', 'theme-rain', 'theme-waves');
                    playerCard.classList.add(`theme-${sound}`);
                }
                
                if (sound === 'forest') {
                    if (trackTitle) trackTitle.textContent = 'Звуки леса и ручья';
                    if (trackSubtitle) trackSubtitle.textContent = 'Терапевтическая сессия медитации • 96kHz Lossless';
                    activeThemeColor = 'rgba(0, 255, 210, 0.6)';
                    activeThemeWaveColor = '#FF5E00';
                } else if (sound === 'rain') {
                    if (trackTitle) trackTitle.textContent = 'Осенний дождь (Almaty Ambient)';
                    if (trackSubtitle) trackSubtitle.textContent = 'Нейро-атмосфера дождя • 96kHz FLAC';
                    activeThemeColor = 'rgba(191, 119, 255, 0.6)';
                    activeThemeWaveColor = '#00FFD2';
                } else if (sound === 'waves') {
                    if (trackTitle) trackTitle.textContent = 'Тихий океан (Alpha-Relax Session)';
                    if (trackSubtitle) trackSubtitle.textContent = 'Гипнотическая сессия прибоя • 96kHz Lossless';
                    activeThemeColor = 'rgba(0, 191, 255, 0.6)';
                    activeThemeWaveColor = '#FF5E00';
                }
            };
        });

        // Clickable timeline seek slider
        const timelineSlider = document.getElementById('player-timeline-slider');
        if (timelineSlider) {
            timelineSlider.onclick = (e) => {
                const rect = timelineSlider.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, clickX / rect.width));
                elapsedTimeSec = percent * playbackDurationSec;
                
                const fillEl = document.getElementById('player-timeline-fill');
                const currentEl = document.getElementById('player-time-current');
                if (fillEl) fillEl.style.width = (percent * 100) + '%';
                if (currentEl) {
                    const minutes = Math.floor(elapsedTimeSec / 60);
                    const seconds = Math.floor(elapsedTimeSec % 60);
                    currentEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            };
        }

        // CBT Chat logic
        const chatPsyArea = document.getElementById('chat-psy-area');
        const moodChips = document.querySelectorAll('.btn-mood-chip');

        moodChips.forEach(chip => {
            chip.onclick = async () => {
                const moodText = chip.textContent;
                
                // Highlight active chip
                moodChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                // Add user bubble
                const userBubble = document.createElement('div');
                userBubble.className = 'chat-bubble user';
                userBubble.textContent = moodText;
                chatPsyArea.appendChild(userBubble);
                chatPsyArea.scrollTop = chatPsyArea.scrollHeight;

                await delay(800);

                // Add advanced terminal log simulation bubble
                const logBlock = document.createElement('div');
                logBlock.className = 'chat-bubble psy-log';
                logBlock.style.fontFamily = 'monospace';
                logBlock.style.fontSize = '0.78rem';
                logBlock.style.color = '#00ffd2';
                logBlock.style.background = 'rgba(0, 5, 15, 0.6)';
                logBlock.style.border = '1px solid rgba(0, 255, 210, 0.15)';
                logBlock.style.padding = '12px';
                logBlock.style.borderRadius = '8px';
                logBlock.style.margin = '5px 0';
                logBlock.style.whiteSpace = 'pre-line';
                logBlock.style.width = '100%';
                logBlock.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5)';
                chatPsyArea.appendChild(logBlock);
                
                const logs = [
                    '► [SYSTEM] Инициализация клинического CBT-протокола...',
                    '► [NLP] Запуск семантического анализа тональности...',
                    '► [TTS] Калибровка динамического синтезатора речи (Lossless FLAC)...',
                    '► [READY] Модель подготовлена. Трансляция аудиосессии...'
                ];
                
                for (let i = 0; i < logs.length; i++) {
                    logBlock.textContent += (i > 0 ? '\n' : '') + logs[i];
                    chatPsyArea.scrollTop = chatPsyArea.scrollHeight;
                    await delay(450);
                }
                
                await delay(600);
                chatPsyArea.removeChild(logBlock);

                // Bot CBT response
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
                
                // Animate bubble entry with GSAP if available
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
    }

    function animateVisualizer() {
        if (!vizCanvas || !vizCtx || !isPlaying) return;
        vizFrameId = requestAnimationFrame(animateVisualizer);

        const ctx = vizCtx;
        const width = vizCanvas.width;
        const height = vizCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // --- DYNAMIC TELEMETRY UPDATE ---
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

        // --- PLAYBACK TIMELINE TIMING ---
        if (isPlaying) {
            const now = performance.now();
            if (!lastProgressTime) lastProgressTime = now;
            const deltaSec = (now - lastProgressTime) / 1000;
            lastProgressTime = now;

            elapsedTimeSec += deltaSec;
            if (elapsedTimeSec >= playbackDurationSec) {
                elapsedTimeSec = 0; // Loop playback
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

        // Draw tech audio spectrum bar visualization using active theme color
        vizAngle += 0.04;
        const barWidth = 4;
        const gap = 2;
        const numBars = Math.floor(width / (barWidth + gap));
        
        ctx.fillStyle = activeThemeColor;
        for (let i = 0; i < numBars; i++) {
            // Frequency simulation math
            const sinVal = Math.sin(i * 0.15 + vizAngle);
            const cosVal = Math.cos(i * 0.05 - vizAngle * 0.8);
            const barHeight = Math.max(5, (sinVal * cosVal + 1) * (height * 0.4) + Math.random() * 8);
            
            const x = i * (barWidth + gap);
            const y = height - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
        }

        // Draw floating alpha wave lines using active theme wave color
        ctx.strokeStyle = activeThemeWaveColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < width; x += 5) {
            const y = height * 0.3 + Math.sin(x * 0.02 + vizAngle * 2.0) * 12 * Math.cos(vizAngle);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

        // ==========================================
    // 4. SMART FRIDGE HARDWARE & API METRICS (PAGE 5)
    // ==========================================
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

        if (!cartList) return;

        // Reset cart states
        cart = {};
        updateCartUI();

        // Clear scale and API logs
        const scaleLog = document.getElementById('fridge-scale-log');
        const apiLog = document.getElementById('fridge-api-log');
        if (scaleLog) scaleLog.innerHTML = `<div class="log-placeholder">Ожидание взаимодействия с полками...</div>`;
        if (apiLog) apiLog.innerHTML = `<div class="log-placeholder">Gateway status: IDLE. Waiting for lock auth...</div>`;

        itemElements.forEach(item => {
            item.style.display = 'block';
            
            item.onclick = () => {
                const itemId = item.id;
                const data = itemsData[itemId];
                
                item.style.display = 'none';

                // Add to cart object
                if (cart[itemId]) {
                    cart[itemId].count++;
                } else {
                    cart[itemId] = { ...data, count: 1 };
                }

                // Update Shelf Weight Text UI
                const shelf = document.getElementById(data.shelf);
                if (shelf) {
                    let curWeight = parseInt(shelf.getAttribute('data-weight')) - data.weight;
                    shelf.setAttribute('data-weight', curWeight);
                    shelf.querySelector('.shelf-w-val').textContent = curWeight;
                }

                // Write load cell signal logs
                if (scaleLog) {
                    if (scaleLog.querySelector('.log-placeholder')) scaleLog.innerHTML = '';
                    const now = new Date();
                    const timeStr = `[${now.toTimeString().split(' ')[0]}]`;
                    const adcCode = "0x" + Math.floor(0x3B8000 + Math.random() * 0x24000).toString(16).toUpperCase();
                    scaleLog.innerHTML = `<div class="log-line">${timeStr} <strong>HX711 Delta:</strong> -${data.weight}g detected on ${data.shelf === 'shelf-1' ? 'Shelf 1' : 'Shelf 2'} (ADC: ${adcCode})</div>` + scaleLog.innerHTML;
                }

                updateCartUI();
            };
        });
    }

    function updateCartUI() {
        const cartList = document.getElementById('cart-list');
        const totalVal = document.getElementById('cart-total');
        const qrPane = document.getElementById('qr-checkout');
        const apiLog = document.getElementById('fridge-api-log');
        
        if (!cartList) return;

        cartList.innerHTML = '';
        let total = 0;
        let itemsCount = 0;

        for (const [id, item] of Object.entries(cart)) {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <span>${item.name} (x${item.count})</span>
                <span style="font-weight:bold; color: var(--accent-orange)">${item.price * item.count} KZT</span>
            `;
            cartList.appendChild(row);
            total += item.price * item.count;
            itemsCount += item.count;
        }

        if (itemsCount === 0) {
            cartList.innerHTML = `<p class="empty-cart-msg">Возьмите продукты из холодильника...</p>`;
            if (qrPane) qrPane.classList.remove('active');
        } else {
            if (qrPane) {
                qrPane.classList.add('active');
                
                // Write software gateway transaction log updates
                if (apiLog) {
                    if (apiLog.querySelector('.log-placeholder')) apiLog.innerHTML = '';
                    const now = new Date();
                    const timeStr = now.toTimeString().split(' ')[0];
                    apiLog.innerHTML = `
                        <div class="log-line">[${timeStr}] <strong>REST API:</strong> POST /v1/cart/update (ID: TX_${Math.floor(Math.random()*10000)})</div>
                        <div class="log-line">[${timeStr}] <strong>Tuya MCU:</strong> Command DOOR_LOCK -> CLOSED sent.</div>
                        <div class="log-line">[${timeStr}] <strong>Acquiring Gateway:</strong> QR Payload updated. Total: ${total} KZT. Status: WAITING_FOR_AUTH.</div>
                    `;
                }
            }
        }

        if (totalVal) totalVal.textContent = `${total} KZT`;
    }

    // ==========================================
    // 5. ACADEMIC CRM SALESFORCE CONSOLE (PAGE 6)
    // ==========================================
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
    }

    function updateCRMView(step) {
        const display = document.getElementById('funnel-view-display');
        if (!display) return;

        if (step === 'lead') {
            display.innerHTML = `
                <div class="crm-salesforce-panel">
                    <img src="img/crm-mockup.png" class="crm-bg-mock" onerror="this.style.display='none';">
                    <div class="crm-panel-header">
                        <span class="badge-tag">JSC-CRM Console / Lead Card</span>
                        <h4>Лид #4829 — Абитуриент: Алишер Смагулов</h4>
                    </div>
                    <div class="crm-grid-columns">
                        <div class="crm-meta-col">
                            <p><strong>Источник:</strong> Telegram Lead Gen Bot</p>
                            <p><strong>Целевой регион:</strong> Германия (Бакалавриат)</p>
                            <p><strong>Специальность:</strong> Computer Science (TUM)</p>
                            <p><strong>Рейтинг лида:</strong> 94/100 (High Potential)</p>
                        </div>
                        <div class="crm-activity-col">
                            <h5>События по лиду (Activity History):</h5>
                            <div class="activity-timeline">
                                <div class="act-row"><strong>[23:22:01]</strong> Лид создан ботом. Запрошен чеклист документов.</div>
                                <div class="act-row"><strong>[23:22:05]</strong> Автоматическая отправка WhatsApp-приветствия.</div>
                                <div class="act-row"><strong>[23:22:10]</strong> Менеджер назначен: Елена Кравцова.</div>
                            </div>
                        </div>
                    </div>
                    <div class="crm-status-line orange-text">Текущий статус: Лид ожидает обработки менеджером</div>
                </div>
            `;
        } else if (step === 'chat') {
            display.innerHTML = `
                <div class="crm-salesforce-panel">
                    <img src="img/crm-mockup.png" class="crm-bg-mock" onerror="this.style.display='none';">
                    <div class="crm-panel-header">
                        <span class="badge-tag">Omnichannel Chat Center (Telegram API + WhatsApp Business)</span>
                        <h4>История переписки: Алишер Смагулов</h4>
                    </div>
                    <div class="crm-chat-history-console">
                        <div class="chat-console-msg student">
                            <span class="msg-author">Студент (Telegram):</span>
                            Здравствуйте, хочу поступить в TUM на Computer Science. Что мне нужно загрузить?
                        </div>
                        <div class="chat-console-msg manager">
                            <span class="msg-author">Елена Кравцова (Менеджер):</span>
                            Здравствуйте! Направила вам ссылку на личный кабинет. Потребуется скан загранпаспорта, IELTS сертификат и ваше мотивационное письмо.
                        </div>
                        <div class="chat-console-msg student">
                            <span class="msg-author">Студент (Telegram):</span>
                            Отлично, я всё собрал и загрузил в кабинет! Проверьте, пожалуйста.
                        </div>
                    </div>
                    <div class="crm-status-line">Каналы коммуникации объединены в одно окно</div>
                </div>
            `;
        } else if (step === 'docs') {
            display.innerHTML = `
                <div class="crm-salesforce-panel">
                    <img src="img/crm-mockup.png" class="crm-bg-mock" onerror="this.style.display='none';">
                    <div class="crm-panel-header">
                        <span class="badge-tag">Secure Document Safe (File Cabinets)</span>
                        <h4>Документы абитуриента для TUM</h4>
                    </div>
                    <div class="crm-files-cabinet-console">
                        <div class="crm-file-box-console">
                            <div class="file-info-console">
                                <span class="file-name">Загранпаспорт_Смагулов.pdf</span>
                                <span class="file-meta">Размер: 2.4 MB | SHA256: 3F4A8D...</span>
                            </div>
                            <span class="status-badge-console uploaded">ВЕРИФИЦИРОВАНО</span>
                        </div>
                        <div class="crm-file-box-console">
                            <div class="file-info-console">
                                <span class="file-name">IELTS_Academic_6.5.pdf</span>
                                <span class="file-meta">Размер: 1.1 MB | Проверка подлинности ID: OK</span>
                            </div>
                            <span class="status-badge-console uploaded">ВЕРИФИЦИРОВАНО</span>
                        </div>
                        <div class="crm-file-box-console">
                            <div class="file-info-console">
                                <span class="file-name">Motivation_Letter_TUM.pdf</span>
                                <span class="file-meta">Размер: 840 KB | AI Plagiarism check: 98% Unique</span>
                            </div>
                            <span class="status-badge-console uploaded">ВЕРИФИЦИРОВАНО</span>
                        </div>
                    </div>
                    <div class="crm-status-line">Все обязательные документы собраны и прошли автоматический комплаенс-контроль</div>
                </div>
            `;
        } else if (step === 'questionnaire') {
            display.innerHTML = `
                <div class="crm-salesforce-panel">
                    <img src="img/crm-mockup.png" class="crm-bg-mock" onerror="this.style.display='none';">
                    <div class="crm-panel-header">
                        <span class="badge-tag">Automated University Application Pipeline</span>
                        <h4>Анкеты и формы поступления</h4>
                    </div>
                    <div class="crm-grid-columns">
                        <div class="crm-meta-col">
                            <h5>Заполнение полей (Field Mapping):</h5>
                            <p><strong>Фамилия/Имя:</strong> Smagulov Alisher [Mapped]</p>
                            <p><strong>Дата рождения:</strong> 14.10.2008 [Mapped]</p>
                            <p><strong>Предыдущее образование:</strong> НИШ Астана [Mapped]</p>
                        </div>
                        <div class="crm-activity-col">
                            <h5>Выходные формы:</h5>
                            <div class="form-output-status">
                                <div class="status-row">TUM Online Application Form — <strong>ГЕНЕРАЦИЯ ЗАВЕРШЕНА</strong></div>
                                <div class="status-row">Визовая анкета DS-160 — <strong>ГОТОВА К ОТПРАВКЕ</strong></div>
                            </div>
                        </div>
                    </div>
                    <div class="crm-status-line">Данные сопоставлены с базами данных зарубежного вуза автоматически</div>
                </div>
            `;
        } else if (step === 'enroll') {
            display.innerHTML = `
                <div class="crm-salesforce-panel">
                    <img src="img/crm-mockup.png" class="crm-bg-mock" onerror="this.style.display='none';">
                    <div class="crm-panel-header">
                        <span class="badge-tag">Academic Ledger & Billing System</span>
                        <h4>Финансовые транши и Зачисление</h4>
                    </div>
                    <div class="crm-invoice-console">
                        <div class="invoice-box-console">
                            <p><strong>Получатель:</strong> Technical University of Munich (TUM)</p>
                            <p><strong>Студент:</strong> Alisher Smagulov</p>
                            <p><strong>Назначение:</strong> Winter Semester Tuition Fee</p>
                            <p><strong>SWIFT Code:</strong> DEUTDEDDXXX</p>
                            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.12); margin: 10px 0;">
                            <p style="font-size: 1.1rem; color: var(--accent-orange);"><strong>ИТОГ:</strong> 8,500 EUR (4,250,000 KZT по курсу Нацбанка РК)</p>
                        </div>
                    </div>
                    <div class="crm-status-line green-text">Статус оплаты: ПОДТВЕРЖДЕНО. Приказ о зачислении № 849/TUM сформирован.</div>
                </div>
            `;
        }
    }

    // ==========================================
    // 6. ERP FLOW LINES & 3D BIN PACKING LOGISTICS (PAGE 7)
    // ==========================================
    let flowCanvas, flowCtx, flowFrameId;
    let particlesList = [];

    function initERPFlows() {
        flowCanvas = document.getElementById('erp-flow-lines-canvas');
        if (!flowCanvas) return;
        flowCtx = flowCanvas.getContext('2d');

        // Set dimensions match container
        flowCanvas.width = flowCanvas.parentElement.clientWidth;
        flowCanvas.height = flowCanvas.parentElement.clientHeight;

        particlesList = [];
        animateERPFlows();
    }

    function animateERPFlows() {
        if (!flowCanvas || !flowCtx) return;
        flowFrameId = requestAnimationFrame(animateERPFlows);

        const ctx = flowCtx;
        const w = flowCanvas.width;
        const h = flowCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw connections
        ctx.strokeStyle = 'rgba(0, 255, 210, 0.12)';
        ctx.lineWidth = 1.5;

        const hwX = [w * 0.2, w * 0.5, w * 0.8];
        const deptX = [w * 0.25, w * 0.5, w * 0.75];
        const boardX = w * 0.5;

        // Bottom to Mid connections
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(hwX[i], h - 50);
                ctx.lineTo(deptX[j], h / 2);
                ctx.stroke();
            }
        }

        // Mid to Top connections
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(deptX[j], h / 2);
            ctx.lineTo(boardX, 50);
            ctx.stroke();
        }

        // Generate flow particles
        if (Math.random() < 0.05) {
            const startX = hwX[Math.floor(Math.random() * hwX.length)];
            const midX = deptX[Math.floor(Math.random() * deptX.length)];
            
            particlesList.push({
                x: startX,
                y: h - 50,
                targetMidX: midX,
                progress: 0,
                speed: 0.012 + Math.random() * 0.008
            });
        }

        // Update & draw particles
        for (let i = particlesList.length - 1; i >= 0; i--) {
            const p = particlesList[i];
            p.progress += p.speed;

            if (p.progress >= 2) {
                particlesList.splice(i, 1);
                continue;
            }

            if (p.progress < 1) {
                // HW to Dept - Raw Telemetry (Cyan)
                p.x = p.x + (p.targetMidX - p.x) * p.progress;
                p.y = (h - 50) - ( (h - 50) - (h / 2) ) * p.progress;
                ctx.fillStyle = '#00ffd2';
                ctx.shadowColor = '#00ffd2';
            } else {
                // Dept to Board - Consolidated Analytics (Orange)
                const localProgress = p.progress - 1;
                p.x = p.targetMidX + (boardX - p.targetMidX) * localProgress;
                p.y = (h / 2) - ( (h / 2) - 50 ) * localProgress;
                ctx.fillStyle = '#FF5E00';
                ctx.shadowColor = '#FF5E00';
            }

            ctx.beginPath();
            ctx.shadowBlur = 8;
            ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset glow
        }
    }

    // 3D Bin Packing canvas animation (2D isometric projection)
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

    // Expose for restart button
    window._restartBinPacking = initBinPacking;


    function animateBinPacking() {
        if (!packCanvas || !packCtx) return;
        packFrameId = requestAnimationFrame(animateBinPacking);

        const ctx = packCtx;
        const w = packCanvas.width;
        const h = packCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw Container frame (isometric box outline)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        
        const cx = w / 2;
        const cy = h / 2 + 30;

        // Isometric coordinates projection mapping
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

        // Add a box dynamically every 50 frames
        packTick++;
        if (packTick % 50 === 0 && packedBoxes.length < 15) {
            const positions = [
                {x:0, y:0, z:0}, {x:2, y:0, z:0}, {x:4, y:0, z:0},
                {x:0, y:2, z:0}, {x:2, y:2, z:0}, {x:4, y:2, z:0},
                {x:0, y:0, z:1}, {x:2, y:0, z:1}, {x:4, y:0, z:1},
                {x:0, y:2, z:1}, {x:2, y:2, z:1}, {x:4, y:2, z:1},
                {x:0, y:0, z:2}, {x:2, y:0, z:2}, {x:4, y:0, z:2}
            ];
            const p = positions[packedBoxes.length];
            if (p) packedBoxes.push(p);

            // Log details in sidebar
            const pLogs = document.getElementById('bin-pack-logs');
            if (pLogs) {
                if (pLogs.querySelector('.log-placeholder')) pLogs.innerHTML = '';
                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                pLogs.innerHTML = `<div class="log-line">[${timeStr}] Box #${packedBoxes.length} placed at offset x:${p.x}, y:${p.y}, z:${p.z} (BFD-3D packing math)</div>` + pLogs.innerHTML;
            }
        }

        // Update statistics indicators
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

        // Draw packed boxes (cubes)
        packedBoxes.forEach((b, idx) => {
            drawCube(ctx, b.x, b.y, b.z, 2, 2, 1, idx % 2 === 0 ? 'rgba(0, 255, 210, 0.65)' : 'rgba(255, 94, 0, 0.65)');
        });

        // Helper: Draw isometric cube
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

        // Color shading utility
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

    // ==========================================
    // 7. TECHNICAL PRESENTATION ACCORDIONS
    // ==========================================
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
    // ROUTING AND LIFE CYCLE MANAGER
    // ==========================================
    function stopAllLoops() {
        if (pressureFrameId) cancelAnimationFrame(pressureFrameId);
        if (vizFrameId) cancelAnimationFrame(vizFrameId);
        if (flowFrameId) cancelAnimationFrame(flowFrameId);
        if (packFrameId) cancelAnimationFrame(packFrameId);
        resetAllAccordions();
    }

    window.addEventListener('page-swapped', (e) => {
        const activePage = e.detail.page;
        stopAllLoops();

        if (activePage === 'product') {
            setTimeout(initPressureChart, 100);
        } else if (activePage === 'case-finance') {
            initFinancialAI();
        } else if (activePage === 'case-health') {
            isPlaying = false;
            initAudioVisualizer();
        } else if (activePage === 'case-vending') {
            initSmartFridge();
        } else if (activePage === 'case-crm') {
            initAcademicCRM();
        } else if (activePage === 'erp') {
            setTimeout(() => {
                initERPFlows();
                initBinPacking();
            }, 100);
        }
    });

    // Handle initial routing context
    setTimeout(() => {
        initAccordions();
        const hash = window.location.hash || '#/';
        if (hash === '#/product') initPressureChart();
        if (hash === '#/case-finance') initFinancialAI();
        if (hash === '#/case-health') initAudioVisualizer();
        if (hash === '#/case-vending') initSmartFridge();
        if (hash === '#/case-crm') initAcademicCRM();
        if (hash === '#/erp') {
            initERPFlows();
            initBinPacking();
        }
    }, 200);

})();
