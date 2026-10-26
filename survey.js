/**
 * survey.js — shared logic for all 3 version pages
 * Called with: initSurvey(config)
 */

// ── Question bank (all 3 languages) ──────────────────────────────────────────
const QUESTIONS = [
  {
    en:    "Q1 placeholder — How natural did the speech sound to you?",
    hi:    "Q1 placeholder — आपको भाषण कितना स्वाभाविक लगा?",
    hirom: "Q1 placeholder — Aapko bhashan kitna swabhavik laga?"
  },
  {
    en:    "Q2 placeholder — How clearly could you understand the speaker?",
    hi:    "Q2 placeholder — आप वक्ता को कितनी स्पष्टता से समझ सके?",
    hirom: "Q2 placeholder — Aap vakta ko kitni spashtataa se samajh sake?"
  },
  {
    en:    "Q3 placeholder — How pleasant did the voice sound?",
    hi:    "Q3 placeholder — आवाज़ आपको कितनी सुखद लगी?",
    hirom: "Q3 placeholder — Awaaz aapko kitni sukhad lagi?"
  },
  {
    en:    "Q4 placeholder — How appropriate was the speaking pace?",
    hi:    "Q4 placeholder — बोलने की गति कितनी उचित थी?",
    hirom: "Q4 placeholder — Bolne ki gati kitni uchit thi?"
  },
  {
    en:    "Q5 placeholder — How confident did the speaker sound?",
    hi:    "Q5 placeholder — वक्ता कितने आत्मविश्वास के साथ बोल रहे थे?",
    hirom: "Q5 placeholder — Vakta kitne aatmavishwas ke saath bol rahe the?"
  }
];

const SLIDER_LEFT  = { en: "Not at all",     hi: "बिल्कुल नहीं",  hirom: "Bilkul nahin" };
const SLIDER_RIGHT = { en: "Extremely",       hi: "अत्यंत",       hirom: "Atyant" };

// ── Language strings ──────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    listenNote:   "Please listen to the audio before answering.",
    prevBtn:      "← Back",
    nextBtn:      "Continue →",
    submitBtn:    "Submit",
    finalTitle:   "Thank you.",
    finalSub:     "Your responses have been recorded.",
    downloadBtn:  "Download Responses (CSV)",
    audioLabel:   function(n, total) { return "Audio " + n + " of " + total; },
    unanswered:   "Please answer all questions before continuing.",
  },
  hi: {
    listenNote:   "कृपया उत्तर देने से पहले ऑडियो सुनें।",
    prevBtn:      "← पीछे",
    nextBtn:      "आगे →",
    submitBtn:    "जमा करें",
    finalTitle:   "धन्यवाद।",
    finalSub:     "आपकी प्रतिक्रियाएँ दर्ज की जा चुकी हैं।",
    downloadBtn:  "प्रतिक्रियाएँ डाउनलोड करें (CSV)",
    audioLabel:   function(n, total) { return "ऑडियो " + n + " / " + total; },
    unanswered:   "कृपया आगे बढ़ने से पहले सभी प्रश्नों का उत्तर दें।",
  },
  hirom: {
    listenNote:   "Kripaya jawab dene se pehle audio sunein.",
    prevBtn:      "← Peeche",
    nextBtn:      "Aage →",
    submitBtn:    "Jama karein",
    finalTitle:   "Dhanyavaad.",
    finalSub:     "Aapke jawab darj kar liye gaye hain.",
    downloadBtn:  "Jawab Download Karein (CSV)",
    audioLabel:   function(n, total) { return "Audio " + n + " / " + total; },
    unanswered:   "Kripaya aage badhne se pehle sabhi prashnon ka jawab dein.",
  }
};

// ── Main init ─────────────────────────────────────────────────────────────────
function initSurvey(config) {
  var VERSION   = config.version;
  var AUDIOS    = config.audios;
  var TOTAL     = AUDIOS.length;

  var currentAudio = 0;
  var lang         = 'en';
  var responses    = {};
  var audioPlayed  = {};

  var progressFill  = document.getElementById('progress-fill');
  var progressLabel = document.getElementById('progress-label');
  var audioCard     = document.getElementById('audio-card');
  var finalScreen   = document.getElementById('final-screen');
  var langBtns      = document.querySelectorAll('.lang-btn');
  var toast         = document.getElementById('toast');

  langBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      lang = btn.dataset.lang;
      langBtns.forEach(function(b) { b.classList.toggle('active', b === btn); });
      renderCard();
    });
  });

  function renderCard() {
    var audioFile = AUDIOS[currentAudio];
    var s         = STRINGS[lang];
    var saved     = responses[audioFile] || {};

    var questionsHTML = QUESTIONS.map(function(q, i) {
      var val = saved[i] !== undefined ? saved[i] : 5;
      var pct = ((val - 1) / 9) * 100;
      return '<div class="question-item">'
        + '<p class="question-text"><span class="q-num">' + (i + 1) + '.</span>' + q[lang] + '</p>'
        + '<div class="slider-wrap">'
        + '<div class="slider-labels"><span>' + SLIDER_LEFT[lang] + '</span><span>' + SLIDER_RIGHT[lang] + '</span></div>'
        + '<div class="slider-row">'
        + '<input type="range" min="1" max="10" value="' + val + '" class="slider" id="slider-' + i + '" '
        + 'style="background: linear-gradient(to right, var(--accent) 0%, var(--accent) ' + pct + '%, var(--border) ' + pct + '%, var(--border) 100%)" '
        + 'data-qindex="' + i + '">'
        + '<span class="slider-value" id="slider-val-' + i + '">' + val + '</span>'
        + '</div></div></div>';
    }).join('');

    var isLast = (currentAudio === TOTAL - 1);

    audioCard.innerHTML = ''
      + '<div class="audio-card-header">'
      + '<span class="audio-number">' + (currentAudio + 1) + '</span>'
      + '<span class="audio-card-title">' + s.audioLabel(currentAudio + 1, TOTAL) + '</span>'
      + '</div>'
      + '<div class="player-wrap">'
      + '<div class="player-inner">'
      + '<button class="play-btn" id="play-btn" aria-label="Play">' + playIcon() + '</button>'
      + '<div class="player-timeline">'
      + '<div class="timeline-bar" id="timeline-bar"><div class="timeline-progress" id="timeline-progress"></div></div>'
      + '<div class="timeline-times"><span id="time-current">0:00</span><span id="time-total">—</span></div>'
      + '</div></div>'
      + '<p class="listen-note">' + s.listenNote + '</p>'
      + '</div>'
      + '<div class="questions-section">' + questionsHTML + '</div>'
      + '<div class="nav-wrap">'
      + '<button class="nav-btn" id="btn-prev"' + (currentAudio === 0 ? ' disabled' : '') + '>' + s.prevBtn + '</button>'
      + '<button class="nav-btn primary" id="btn-next">' + (isLast ? s.submitBtn : s.nextBtn) + '</button>'
      + '</div>';

    attachPlayer(audioFile);

    document.querySelectorAll('.slider').forEach(function(slider) {
      slider.addEventListener('input', function() {
        var qi  = parseInt(slider.dataset.qindex);
        var val = parseInt(slider.value);
        var pct = ((val - 1) / 9) * 100;
        slider.style.background = 'linear-gradient(to right, var(--accent) 0%, var(--accent) ' + pct + '%, var(--border) ' + pct + '%, var(--border) 100%)';
        document.getElementById('slider-val-' + qi).textContent = val;
        if (!responses[audioFile]) responses[audioFile] = {};
        responses[audioFile][qi] = val;
      });
    });

    document.getElementById('btn-prev').addEventListener('click', function() {
      saveCurrentSliders(audioFile);
      currentAudio--;
      renderCard();
    });

    document.getElementById('btn-next').addEventListener('click', function() {
      saveCurrentSliders(audioFile);
      if (isLast) { showFinal(); }
      else { currentAudio++; renderCard(); }
    });

    updateProgress();
  }

  function saveCurrentSliders(audioFile) {
    if (!responses[audioFile]) responses[audioFile] = {};
    document.querySelectorAll('.slider').forEach(function(slider) {
      responses[audioFile][parseInt(slider.dataset.qindex)] = parseInt(slider.value);
    });
  }

  function updateProgress() {
    var pct = Math.round((currentAudio / TOTAL) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = (currentAudio + 1) + ' / ' + TOTAL;
  }

  var audioEl = null;

  function attachPlayer(audioFile) {
    if (audioEl) { audioEl.pause(); audioEl = null; }
    audioEl = new Audio('audio/' + audioFile + '.opus');

    var playBtn  = document.getElementById('play-btn');
    var timeline = document.getElementById('timeline-bar');
    var progress = document.getElementById('timeline-progress');
    var tCurrent = document.getElementById('time-current');
    var tTotal   = document.getElementById('time-total');

    audioEl.addEventListener('loadedmetadata', function() {
      tTotal.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', function() {
      var pct = (audioEl.currentTime / audioEl.duration) * 100 || 0;
      progress.style.width = pct + '%';
      tCurrent.textContent = formatTime(audioEl.currentTime);
    });

    audioEl.addEventListener('ended', function() {
      playBtn.innerHTML = playIcon();
      audioPlayed[audioFile] = true;
    });

    playBtn.addEventListener('click', function() {
      if (audioEl.paused) {
        audioEl.play();
        playBtn.innerHTML = pauseIcon();
        audioPlayed[audioFile] = true;
      } else {
        audioEl.pause();
        playBtn.innerHTML = playIcon();
      }
    });

    timeline.addEventListener('click', function(e) {
      var rect = timeline.getBoundingClientRect();
      var pct  = (e.clientX - rect.left) / rect.width;
      audioEl.currentTime = pct * audioEl.duration;
    });
  }

  function showFinal() {
    if (audioEl) audioEl.pause();
    audioCard.style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'none';
    finalScreen.classList.add('visible');

    var s = STRINGS[lang];
    document.getElementById('final-title').textContent = s.finalTitle;
    document.getElementById('final-sub').textContent   = s.finalSub;

    var dlBtn = document.getElementById('download-btn');
    dlBtn.textContent = s.downloadBtn;

    // Auto-submit to Google Sheets
    submitToSheets(function(ok) {
      if (!ok) {
        // Network failed — offer CSV fallback
        dlBtn.style.display = 'inline-flex';
        dlBtn.addEventListener('click', downloadCSV);
      }
      // Success: button stays hidden, data is in the Sheet
    });
  }

  // ── Submit to Google Sheets ──────────────────────────────────────────────────
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzBBd_JTtiQg8tRpocrWNWWoKgUk8vV_0itOixiJO8VvHOMZf--6V8zORVDwdPlQnrxtQ/exec'; // ← paste your deployment URL

  function submitToSheets(callback) {
    if (!SHEETS_URL || SHEETS_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
      // No URL set yet — fall back to CSV
      callback(false);
      return;
    }

    var timestamp = new Date().toISOString();
    var rows = [];
    AUDIOS.forEach(function(file, audioIndex) {
      var r = responses[file] || {};
      rows.push([
        timestamp,
        'v' + VERSION,
        file,
        audioIndex + 1,          // presentation order for this participant
        r[0] !== undefined ? r[0] : '',
        r[1] !== undefined ? r[1] : '',
        r[2] !== undefined ? r[2] : '',
        r[3] !== undefined ? r[3] : '',
        r[4] !== undefined ? r[4] : ''
      ]);
    });

    fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',                              // avoids CORS preflight; response will be opaque
      body: JSON.stringify({ rows: rows }),
      headers: { 'Content-Type': 'text/plain' }
    })
    .then(function() {
      callback(true);  // opaque response — assume success, data reached the Sheet
    })
    .catch(function() {
      callback(false); // actual network failure — show CSV fallback
    });
  }

  // ── CSV fallback ─────────────────────────────────────────────────────────────
  function downloadCSV() {
    var rows = [['Timestamp', 'Version', 'Audio File', 'Audio Order', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5']];
    var timestamp = new Date().toISOString();
    AUDIOS.forEach(function(file, audioIndex) {
      var r = responses[file] || {};
      rows.push([
        timestamp, 'v' + VERSION, file, audioIndex + 1,
        r[0] !== undefined ? r[0] : '',
        r[1] !== undefined ? r[1] : '',
        r[2] !== undefined ? r[2] : '',
        r[3] !== undefined ? r[3] : '',
        r[4] !== undefined ? r[4] : ''
      ]);
    });
    var csv  = rows.map(function(r) { return r.map(function(c) { return '"' + c + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'survey_v' + VERSION + '_responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }


  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
  }

  function playIcon() {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="4,2 14,8 4,14" fill="#0d0d0d"/></svg>';
  }
  function pauseIcon() {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="#0d0d0d"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="#0d0d0d"/></svg>';
  }
  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  renderCard();
}
