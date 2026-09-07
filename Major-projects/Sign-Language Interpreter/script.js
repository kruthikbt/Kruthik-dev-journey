// ─────────────────────────────────────────────
//  GLOBALS
// ─────────────────────────────────────────────
const THRESHOLD = 0.75;
let handsModel = null;
let cameraStream = null;
let lastGesture = null;
let gestureHoldFrames = 0;
const HOLD_NEEDED = 18; // frames to confirm
let frameCount = 0, lastFpsTime = Date.now(), fps = 0;
let history = [], sentence = [];
let totalClear = 0, totalUnclear = 0;
let lastAddedGesture = '';
let lastAddedTime = 0;
const COOLDOWN_MS = 1800;
let currentLang = 'en';

const translations = {
    en: {
        load_title: "Sign Language AI",
        loading_model: "Loading MediaPipe Hands model…",
        warming_model: "Warming up model…",
        ready: "Ready!",
        live_status: "Live Camera · AI Recognition",
        title: "Sign Language<br>Interpreter",
        description: "Show ASL hand gestures to your camera — confidence threshold at 75%",
        stat_total: "Total Signs",
        stat_recognized: "Recognized",
        stat_unclear: "Unclear",
        cam_hint: "Click <strong>Start Camera</strong> below<br>to enable live hand tracking",
        status_waiting: "WAITING",
        status_live: "LIVE",
        start_btn: "▶ Start Camera & Begin Recognition",
        lm_analysis: "Hand Landmark Analysis",
        supported_gestures: "Supported Gestures",
        interpreted_sign: "Interpreted Sign",
        cam_idle_hint: "Enable camera & show<br>a hand gesture to begin",
        confidence: "Confidence",
        built_sentence: "Built Sentence",
        undo: "⌫ Undo",
        space: "␣ Space",
        clear: "✕ Clear",
        recognition_history: "Recognition History",
        no_history: "No attempts yet",
        clear_all: "Clear All",
        toast_cam_started: "Camera started — show a gesture!",
        toast_cam_denied: "Camera access denied",
        toast_theme: "Theme switched to",
        toast_lang: "Language changed to",
        sign_unclear_title: "Sign unclear —<br>please repeat",
        sign_unclear_sub: "Below 75% threshold",
        initialising: "⏳ Initialising…",
        stop_btn: "■ Stop Camera & End Recognition",
        toast_cam_stopped: "Camera stopped"
    },
    kn: {
        load_title: "ಸನ್ನೆ ಭಾಷೆ AI",
        loading_model: "MediaPipe Hands ಮಾಡೆಲ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
        warming_model: "ಮಾಡೆಲ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
        ready: "ಸಿದ್ಧವಾಗಿದೆ!",
        live_status: "ಲೈವ್ ಕ್ಯಾಮೆರಾ · AI ಗುರುತಿಸುವಿಕೆ",
        title: "ಸನ್ನೆ ಭಾಷೆ<br>ಅನುವಾದಕ",
        description: "ಕ್ಯಾಮೆರಾಗೆ ASL ಹಸ್ತ ಸನ್ನೆಗಳನ್ನು ತೋರಿಸಿ — 75% ನಿಖರತೆ ಅಗತ್ಯ",
        stat_total: "ಒಟ್ಟು ಸನ್ನೆಗಳು",
        stat_recognized: "ಗುರುತಿಸಲಾಗಿದೆ",
        stat_unclear: "ಅಸ್ಪಷ್ಟ",
        cam_hint: "ಹಸ್ತ ಸನ್ನೆ ಗುರುತಿಸಲು ಕೆಳಗಿನ <strong>ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ</strong> ಕ್ಲಿಕ್ ಮಾಡಿ",
        status_waiting: "ಕಾಯಲಾಗುತ್ತಿದೆ",
        status_live: "ಲೈವ್",
        start_btn: "▶ ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಗುರುತಿಸುವಿಕೆ ಶುರುಮಾಡಿ",
        lm_analysis: "ಹಸ್ತ ಗುರುತುಗಳ ವಿಶ್ಲೇಷಣೆ",
        supported_gestures: "ಬೆಂಬಲಿತ ಸನ್ನೆಗಳು",
        interpreted_sign: "ಅನುವಾದಿತ ಸನ್ನೆ",
        cam_idle_hint: "ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯಗೊಳಿಸಿ ಮತ್ತು<br>ಪ್ರಾರಂಭಿಸಲು ಸನ್ನೆ ತೋರಿಸಿ",
        confidence: "ನಿಖರತೆ",
        built_sentence: "ರಚಿಸಿದ ವಾಕ್ಯ",
        undo: "⌫ ರದ್ದು",
        space: "␣ ಜಾಗ",
        clear: "✕ ಅಳಿಸಿ",
        recognition_history: "ಗುರುತಿಸುವಿಕೆಯ ಇತಿಹಾಸ",
        no_history: "ಇನ್ನೂ ಯಾವುದೇ ಸನ್ನೆಗಳಿಲ್ಲ",
        clear_all: "ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ",
        toast_cam_started: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಯಿತು — ಸನ್ನೆ ತೋರಿಸಿ!",
        toast_cam_denied: "ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ",
        toast_theme: "ಥೀಮ್ ಬದಲಾಗಿದೆ:",
        toast_lang: "ಭಾಷೆ ಬದಲಾಗಿದೆ:",
        sign_unclear_title: "ಸನ್ನೆ ಅಸ್ಪಷ್ಟವಾಗಿದೆ —<br>ದಯವಿಟ್ಟು ಪುನರಾವರ್ತಿಸಿ",
        sign_unclear_sub: "75% ಮಿತಿಗಿಂತ ಕಡಿಮೆ ಇದೆ",
        initialising: "⏳ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
        stop_btn: "■ ಕ್ಯಾಮೆರಾ ನಿಲ್ಲಿಸಿ ಮತ್ತು ಗುರುತಿಸುವಿಕೆ ಮುಕ್ತಾಯಗೊಳಿಸಿ",
        toast_cam_stopped: "ಕ್ಯಾಮೆರಾ ನಿಲ್ಲಿಸಲಾಗಿದೆ"
    },
    hi: {
        load_title: "सांकेतिक भाषा AI",
        loading_model: "MediaPipe Hands मॉडल लोड हो रहा है…",
        warming_model: "मॉडल तैयार हो रहा है…",
        ready: "तैयार!",
        live_status: "लाइव कैमरा · AI पहचान",
        title: "सांकेतिक भाषा<br>दुभाषिया",
        description: "कैमरे को ASL हाथ के इशारे दिखाएं — 75% आत्मविश्वास सीमा",
        stat_total: "कुल संकेत",
        stat_recognized: "पहचाना गया",
        stat_unclear: "अस्पष्ट",
        cam_hint: "हाथ की ट्रैकिंग सक्षम करने के लिए नीचे <strong>कैमरा शुरू करें</strong> पर क्लिक करें",
        status_waiting: "प्रतीक्षा",
        status_live: "लाइव",
        start_btn: "▶ कैमरा शुरू करें और पहचान शुरू करें",
        lm_analysis: "हाथ के लैंडमार्क विश्लेषण",
        supported_gestures: "समर्थित संकेत",
        interpreted_sign: "व्याख्यायित संकेत",
        cam_idle_hint: "कैमरा सक्षम करें और शुरू<br>करने के लिए इशारा दिखाएं",
        confidence: "आत्मविश्वास",
        built_sentence: "बनाया गया वाक्य",
        undo: "⌫ पूर्ववत",
        space: "␣ स्पेस",
        clear: "✕ साफ़ करें",
        recognition_history: "पहचान का इतिहास",
        no_history: "अभी तक कोई प्रयास नहीं",
        clear_all: "सभी साफ़ करें",
        toast_cam_started: "कैमरा शुरू हो गया — इशारा दिखाएं!",
        toast_cam_denied: "कैमरा एक्सेस से इनकार",
        toast_theme: "थीम बदल दी गई:",
        toast_lang: "भाषा बदल दी गई:",
        sign_unclear_title: "संकेत अस्पष्ट है —<br>कृपया दोहराएं",
        sign_unclear_sub: "75% सीमा से नीचे",
        initialising: "⏳ शुरू हो रहा है…",
        stop_btn: "■ कैमरा रोकें और पहचान समाप्त करें",
        toast_cam_stopped: "कैमरा रोक दिया गया"
    }
};

// ─────────────────────────────────────────────
//  LANDMARK INDICES (MediaPipe)
// ─────────────────────────────────────────────
const TIP = { THUMB:4, INDEX:8, MIDDLE:12, RING:16, PINKY:20 };
const MCP = { THUMB:2, INDEX:5, MIDDLE:9, RING:13, PINKY:17 };
const PIP = { INDEX:6, MIDDLE:10, RING:14, PINKY:18 };

// ─────────────────────────────────────────────
//  FINGER STATE HELPERS
// ─────────────────────────────────────────────
function fingerUp(lm, tip, pip) {
    return lm[tip].y < lm[pip].y;
}
function thumbUp(lm, hand) {
    if (hand === 'Right') return lm[TIP.THUMB].x > lm[MCP.THUMB].x;
    return lm[TIP.THUMB].x < lm[MCP.THUMB].x;
}
function thumbDown(lm, hand) {
    if (hand === 'Right') return lm[TIP.THUMB].x < lm[MCP.THUMB].x - 0.04;
    return lm[TIP.THUMB].x > lm[MCP.THUMB].x + 0.04;
}
function dist(a, b) {
    return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}
function fingersUpArray(lm, hand) {
    return [
        thumbUp(lm, hand) ? 1 : 0,
        fingerUp(lm, TIP.INDEX, PIP.INDEX) ? 1 : 0,
        fingerUp(lm, TIP.MIDDLE, PIP.MIDDLE) ? 1 : 0,
        fingerUp(lm, TIP.RING, PIP.RING) ? 1 : 0,
        fingerUp(lm, TIP.PINKY, PIP.PINKY) ? 1 : 0,
    ];
}

// ─────────────────────────────────────────────
//  GESTURE CLASSIFIER
// ─────────────────────────────────────────────
function classifyGesture(lm, handedness) {
    const hand = handedness;
    const fu = fingersUpArray(lm, hand);
    const [T, I, M, R, P] = fu;
    const upCount = fu.reduce((a,b)=>a+b,0);

    // — FIST (0 fingers up)
    if (upCount === 0) return { name:'FIST ✊', conf: 0.93 };

    // — OPEN HAND (all 5 up)
    if (upCount === 5) return { name:'OPEN HAND 🖐', conf: 0.92 };

    // — THUMBS UP (only thumb, pointing up relative to wrist)
    if (T && !I && !M && !R && !P && lm[TIP.THUMB].y < lm[0].y - 0.1)
        return { name:'THUMBS UP 👍', conf: 0.90 };

    // — THUMBS DOWN
    if (thumbDown(lm, hand) && !I && !M && !R && !P && lm[TIP.THUMB].y > lm[0].y + 0.05)
        return { name:'THUMBS DOWN 👎', conf: 0.88 };

    // — POINTING / ONE ☝️
    if (!T && I && !M && !R && !P) return { name:'ONE ☝️', conf: 0.91 };

    // — PEACE / TWO ✌️
    if (!T && I && M && !R && !P) return { name:'PEACE ✌️', conf: 0.90 };

    // — THREE
    if (!T && I && M && R && !P) return { name:'THREE 🤙', conf: 0.88 };

    // — FOUR
    if (!T && I && M && R && P) return { name:'FOUR 4️⃣', conf: 0.89 };

    // — OK 👌 (thumb+index pinch, others up)
    if (dist(lm[TIP.THUMB], lm[TIP.INDEX]) < 0.06 && M && R && P)
        return { name:'OK 👌', conf: 0.87 };

    // — PINCH 🤏 (thumb+index close, others down)
    if (dist(lm[TIP.THUMB], lm[TIP.INDEX]) < 0.06 && !M && !R && !P)
        return { name:'PINCH 🤏', conf: 0.85 };

    // — ILY / I LOVE YOU 🤟 (thumb + index + pinky)
    if (T && I && !M && !R && P) return { name:'I LOVE YOU 🤟', conf: 0.91 };

    // — ROCK ON / HORNS 🤘 (index + pinky, no middle/ring, no thumb)
    if (!T && I && !M && !R && P) return { name:'ROCK ON 🤘', conf: 0.89 };

    // — CALL ME 🤙 (thumb + pinky)
    if (T && !I && !M && !R && P) return { name:'CALL ME 🤙', conf: 0.90 };

    // — VULCAN 🖖 (index+middle + ring+pinky, gap between)
    if (!T && I && M && R && P) {
        const gap = Math.abs(lm[TIP.MIDDLE].x - lm[TIP.RING].x);
        if (gap > 0.04) return { name:'VULCAN 🖖', conf: 0.85 };
        return { name:'FOUR 4️⃣', conf: 0.87 };
    }

    // — CROSSED FINGERS 🤞 (index over middle, close)
    if (!T && I && M && !R && !P) {
        const cross = dist(lm[TIP.INDEX], lm[TIP.MIDDLE]);
        if (cross < 0.04) return { name:'CROSSED 🤞', conf: 0.83 };
        return { name:'PEACE ✌️', conf: 0.88 };
    }

    // — WAVE / HELLO 👋
    if (upCount >= 4 && T) return { name:'HELLO 👋', conf: 0.86 };

    // Fallback with low confidence
    return { name: `GESTURE (${upCount})`, conf: 0.55 + Math.random()*0.15 };
}

// ─────────────────────────────────────────────
//  COLOR HELPER
// ─────────────────────────────────────────────
function confColor(c) {
    if (c >= THRESHOLD) return 'var(--accent2)';
    if (c >= 0.5) return 'var(--warn)';
    return 'var(--danger)';
}

// ─────────────────────────────────────────────
//  UI UPDATE
// ─────────────────────────────────────────────
function updateConfBar(c) {
    const fill = document.getElementById('conf-fill');
    const pct  = document.getElementById('conf-pct');
    const p = Math.round(c*100);
    fill.style.width = p + '%';
    fill.style.background = confColor(c);
    pct.textContent = p + '%';
    pct.style.color = confColor(c);
}

function showResult(name, conf) {
    const wd = document.getElementById('word-display');
    const dc = document.getElementById('disp-content');
    const clean = conf >= THRESHOLD;
    wd.className = 'word-display ' + (clean ? 'clear' : 'unclear');
    if (clean) {
        dc.innerHTML = `<div class="big-word">${name}</div>`;
    } else {
        dc.innerHTML = `
            <div class="unclear-block">
                <div class="unclear-ico">⚠</div>
                <div class="unclear-title">${translations[currentLang].sign_unclear_title}</div>
                <div class="unclear-sub">${translations[currentLang].sign_unclear_sub}</div>
            </div>`;
    }
}

function addToHistory(name, conf) {
    const clean = conf >= THRESHOLD;
    const pct = Math.round(conf*100);
    history.push({name, conf, clean});

    const list = document.getElementById('hist-list');
    const empty = document.getElementById('hist-empty');
    if (empty) empty.remove();

    const el = document.createElement('div');
    el.className = 'hi';
    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:9px">
            <span class="hi-word" style="color:${clean?'var(--accent2)':'var(--muted)'}">${clean ? name : '???'}</span>
        </div>
        <div class="hi-meta">
            <span class="hi-pct" style="color:${confColor(conf)}">${pct}%</span>
            <span class="badge ${clean?'bc':'bu'}">${clean?'CLEAR':'UNCLEAR'}</span>
        </div>`;
    list.insertBefore(el, list.firstChild);

    document.getElementById('hist-count').textContent = history.length + ' attempt' + (history.length!==1?'s':'');

    if (clean) {
        totalClear++;
        sentence.push(name.replace(/[^\w\s]/gi,'').trim());
        updateSentence();
    } else {
        totalUnclear++;
    }
    document.getElementById('s-total').textContent = history.length;
    document.getElementById('s-clear').textContent = totalClear;
    document.getElementById('s-unclear').textContent = totalUnclear;
}

function updateSentence() {
    const box = document.getElementById('sentence-box');
    box.innerHTML = '';
    sentence.forEach(w => {
        if (w === ' ') {
            const sp = document.createElement('span');
            sp.style.cssText = 'display:inline-block;width:16px';
            box.appendChild(sp);
        } else {
            const span = document.createElement('span');
            span.className = 'sw';
            span.textContent = w;
            box.appendChild(span);
        }
    });
    const cur = document.createElement('div');
    cur.className = 'cur';
    box.appendChild(cur);
}

function removeLastWord() { if (sentence.length) { sentence.pop(); updateSentence(); } }
function addSpace() { sentence.push(' '); updateSentence(); }
function clearSentence() { sentence = []; updateSentence(); }

function clearAll() {
    history = []; sentence = [];
    totalClear = 0; totalUnclear = 0;
    document.getElementById('s-total').textContent = '0';
    document.getElementById('s-clear').textContent = '0';
    document.getElementById('s-unclear').textContent = '0';
    document.getElementById('hist-count').textContent = '0 attempts';
    document.getElementById('hist-list').innerHTML = '<div class="empty" id="hist-empty">No attempts yet</div>';
    document.getElementById('conf-fill').style.width = '0';
    document.getElementById('conf-pct').textContent = '—';
    document.getElementById('conf-pct').style.color = 'var(--muted)';
    const wd = document.getElementById('word-display');
    wd.className = 'word-display';
    document.getElementById('disp-content').innerHTML = translations[currentLang].cam_idle_hint;
    updateSentence();
}

// ─────────────────────────────────────────────
//  MEDIAPIPE SETUP
// ─────────────────────────────────────────────
function onResults(results) {
    const canvas = document.getElementById('output-canvas');
    const ctx = canvas.getContext('2d');
    const video = document.getElementById('input-video');

    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // FPS
    frameCount++;
    const now = Date.now();
    if (now - lastFpsTime > 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
        document.getElementById('fps-txt').textContent = fps + ' FPS';
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        gestureHoldFrames = 0;
        lastGesture = null;
        return;
    }

    const lm       = results.multiHandLandmarks[0];
    const handed   = results.multiHandedness?.[0]?.label || 'Right';

    // Draw connections
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color:'rgba(78,205,196,0.5)', lineWidth:2 });
    // Draw landmarks
    drawLandmarks(ctx, lm, { color:'rgba(124,110,247,0.9)', fillColor:'rgba(124,110,247,0.3)', lineWidth:1, radius:4 });

    // Update landmark chips
    const fmt = p => `${(p.x).toFixed(2)},${(p.y).toFixed(2)}`;
    document.getElementById('lm-wrist').textContent   = fmt(lm[0]);
    document.getElementById('lm-index').textContent   = fmt(lm[TIP.INDEX]);
    document.getElementById('lm-middle').textContent  = fmt(lm[TIP.MIDDLE]);
    document.getElementById('lm-ring').textContent    = fmt(lm[TIP.RING]);
    document.getElementById('lm-pinky').textContent   = fmt(lm[TIP.PINKY]);
    document.getElementById('lm-thumb').textContent   = fmt(lm[TIP.THUMB]);
    const fu = fingersUpArray(lm, handed);
    document.getElementById('lm-fingers').textContent = fu.reduce((a,b)=>a+b,0) + '/5';
    document.getElementById('lm-hand').textContent    = handed;

    // Classify
    const result = classifyGesture(lm, handed);
    document.getElementById('lm-id').textContent = result.name.split(' ')[0];

    // Smooth: require HOLD_NEEDED consistent frames
    if (result.name === lastGesture) {
        gestureHoldFrames++;
    } else {
        gestureHoldFrames = 1;
        lastGesture = result.name;
    }

    updateConfBar(result.conf);
    showResult(result.name, result.conf);

    // Only commit after hold + cooldown
    if (gestureHoldFrames === HOLD_NEEDED) {
        const t = Date.now();
        if (result.name !== lastAddedGesture || t - lastAddedTime > COOLDOWN_MS) {
            lastAddedGesture = result.name;
            lastAddedTime = t;
            addToHistory(result.name, result.conf);
            showToast(result.conf >= THRESHOLD ? '✓ ' + result.name : '⚠ ' + translations[currentLang].sign_unclear_title.replace('<br>', ' '));
        }
    }

    // Draw confidence label on canvas
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = result.conf >= THRESHOLD ? '#4ecdc4' : '#f76e6e';
    const pct = Math.round(result.conf * 100);
    ctx.fillText(result.name + '  ' + pct + '%', 10, canvas.height - 12);
    ctx.restore();
}

// ─────────────────────────────────────────────
//  START CAMERA
// ─────────────────────────────────────────────
async function toggleCamera() {
    const btn = document.getElementById('cam-btn');
    if (cameraStream) {
        stopCamera();
    } else {
        startCamera();
    }
}

async function startCamera() {
    const btn = document.getElementById('cam-btn');
    btn.textContent = translations[currentLang].initialising;
    btn.disabled = true;

    try {
        const video = document.getElementById('input-video');
        cameraStream = await navigator.mediaDevices.getUserMedia({ video:{ width:1280, height:720, facingMode:'user' }, audio:false });
        video.srcObject = cameraStream;
        await video.play();

        video.style.display = 'block';
        document.getElementById('no-cam-msg').style.display = 'none';
        document.getElementById('cam-status').textContent = translations[currentLang].status_live;
        
        btn.disabled = false;
        btn.classList.add('stop-mode');
        btn.setAttribute('data-i18n', 'stop_btn');
        btn.textContent = translations[currentLang].stop_btn;

        handsModel.send({ image: video });
        const camera = new Camera(video, {
            onFrame: async () => { await handsModel.send({ image: video }); },
            width: 1280, height: 720
        });
        camera.start();
        showToast(translations[currentLang].toast_cam_started);
    } catch(e) {
        btn.textContent = '⚠ ' + translations[currentLang].toast_cam_denied;
        btn.disabled = false;
        console.error(e);
    }
}

async function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const video = document.getElementById('input-video');
    video.srcObject = null;
    video.style.display = 'none';
    document.getElementById('no-cam-msg').style.display = 'flex';
    document.getElementById('cam-status').textContent = translations[currentLang].status_waiting;
    
    const btn = document.getElementById('cam-btn');
    btn.classList.remove('stop-mode');
    btn.setAttribute('data-i18n', 'start_btn');
    btn.textContent = translations[currentLang].start_btn;
    btn.disabled = false;
    
    showToast(translations[currentLang].toast_cam_stopped);
}

// ─────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2000);
}

// ─────────────────────────────────────────────
//  INIT MEDIAPIPE
// ─────────────────────────────────────────────
async function initModel() {
    const msg = document.getElementById('load-msg');
    msg.textContent = 'Loading MediaPipe Hands…';

    handsModel = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsModel.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });

    handsModel.onResults(onResults);

    msg.textContent = 'Warming up model…';
    await handsModel.initialize();

    msg.textContent = 'Ready!';
    await new Promise(r => setTimeout(r, 600));

    const ls = document.getElementById('loading-screen');
    ls.style.opacity = '0';
    setTimeout(()=> {
        ls.style.display = 'none';
        document.getElementById('app').style.display = 'block';
        updateSentence();
        initTheme();
        initLang();
    }, 600);
}

// ─────────────────────────────────────────────
//  THEME TOGGLE
// ─────────────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        showToast(`${translations[currentLang].toast_theme} ${theme}`);
    });
}

// ─────────────────────────────────────────────
//  MULTI-LANGUAGE
// ─────────────────────────────────────────────
function initLang() {
    currentLang = localStorage.getItem('lang') || 'en';
    document.getElementById('lang-select').value = currentLang;
    applyTranslations(currentLang);

    document.getElementById('lang-select').addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('lang', currentLang);
        applyTranslations(currentLang);
        showToast(`${translations[currentLang].toast_lang} ${document.getElementById('lang-select').selectedOptions[0].text}`);
    });
}

function applyTranslations(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });
}

// Start
window.addEventListener('load', initModel);
