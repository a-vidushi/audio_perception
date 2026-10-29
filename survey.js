/**
 * survey.js — shared logic for all 3 version pages
 * Called with: initSurvey(config)
 */

// ── Question bank (English, Hindi Devanagari, and Hindi Roman) ────────────────
const QUESTIONS = [
  {
    en:    "How easy do you think this person would be to strike up a conversation with?",
    hi:    "इनसे बात करना आपको कितना आसान लगेगा?",
    hirom: "Inse baat karna aapko kitna aasaan lagega?"
  },
  {
    en:    "How educated do you think this person sounds?",
    hi:    "ये आपको कितने पढ़े-लिखे सुनाई देते हैं?",
    hirom: "Ye aapko kitne padhe-likhe sunaai dete hain?"
  },
  {
    en:    "How ambitious do you think this person sounds?",
    hi:    "आपके हिसाब से, सिर्फ उनको सुनके, आपको ये कितने ambitious (महत्वाकांक्षी) लगते हैं?",
    hirom: "Aapke hisaab se, sirf unko sunke, aapko ye kitne ambitious lagte hain?"
  },
  {
    en:    "How grammatically correct would you say this person's speech is?",
    hi:    "इनकी बोली आपको कितनी शुद्ध लगती है?",
    hirom: "Inki boli aapko kitni shudhh lagti hai?"
  },
  {
    en:    "Would you hire this person for a white collar job for your company?",
    hi:    "क्या आप इनको अपने एक ऑफिस की एक अच्छी नौकरी पर रखना चाहेंगे?",
    hirom: "Kya aap inko apne ek office ki ek achhi naukri par rakhna chahenge?"
  }
];

// ── Main init ─────────────────────────────────────────────────────────────────
function initSurvey(config) {
  var VERSION      = null;
  var AUDIOS       = [];
  var TOTAL        = 0;
  var configReady  = false;
  var pendingStart = false;

  var isIntro      = true;
  var hasStarted   = false;
  var currentAudio = 0;
  var responses    = {};
  var audioPlayed  = {};
  var toastTimer   = null;

  var demographics = {
    age: '',
    city: ''
  };

  // Restore saved demographics if any
  try {
    var savedDemographics = localStorage.getItem('survey_demographics');
    if (savedDemographics) {
      demographics = JSON.parse(savedDemographics);
    }
  } catch (e) {}

  var progressWrap  = document.getElementById('progress-wrap');
  var progressFill  = document.getElementById('progress-fill');
  var progressLabel = document.getElementById('progress-label');
  var audioCard     = document.getElementById('audio-card');
  var finalScreen   = document.getElementById('final-screen');
  var toast         = document.getElementById('toast');

  var audioEl = null;

  function applyConfig(cfg) {
    if (!cfg || !cfg.audios) return;
    VERSION     = cfg.version;
    AUDIOS      = cfg.audios;
    TOTAL       = AUDIOS.length;
    configReady = true;

    if (pendingStart) {
      pendingStart = false;
      isIntro = false;
      hasStarted = true;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (config && typeof config.then === 'function') {
    config.then(applyConfig);
  } else if (config && config.audios) {
    applyConfig(config);
  }

  function render() {
    if (isIntro) {
      renderIntro();
    } else if (currentAudio >= TOTAL) {
      renderDemographics();
    } else {
      renderAudioCard();
    }
  }

  function renderIntro() {
    if (audioEl) { audioEl.pause(); audioEl = null; }

    progressWrap.style.display = 'none';

    var btnLabel = hasStarted
      ? 'Continue to Survey / आगे बढ़ें →'
      : 'Start Survey / शुरू करें →';

    audioCard.innerHTML = ''
      + '<div class="intro-card-inner">'
      + '<div class="intro-header">'
      + '<h2 class="intro-title">Introduction &amp; Instructions</h2>'
      + '<p class="intro-sub-hi">परिचय एवं निर्देश</p>'
      + '<p class="intro-sub-hirom">Parichay evam Nirdesh</p>'
      + '</div>'
      + '<div class="intro-body">'
      + '<p class="intro-text-en">'
      + 'No preparation or prior knowledge is needed for this survey. You will listen to a few short audio clips and answer the questions using the sliders. There are no right or wrong answers, just listen and rate whatever you feel. Your data is completely safe and anonymous.'
      + '</p>'
      + '<p class="intro-text-hi">'
      + 'इस सर्वे के लिए किसी तैयारी या पहले से जानकारी की कोई ज़रूरत नहीं है। आपको बस कुछ छोटे ऑडियो सुनने हैं और स्लाइडर से पूछे गए सवालों के जवाब देने हैं। इसमें कोई सही या गलत जवाब नहीं है, बस आवाज़ सुनकर आपको जो भी लगे, उसी हिसाब से जवाब दें। आपका डेटा पूरी तरह सुरक्षित है।'
      + '</p>'
      + '<p class="intro-text-hirom">'
      + 'Is survey ke liye kisi preparation ya pehle se jaankari ki koi zaroorat nahi hai. Aapko bas kuch chhote audios sunne hain aur slider se sawalon ke jawab dene hain. Isme koi sahi ya galat jawab nahi hai, bas sunkar aapko jo bhi lage, usi hisaab se jawab dein. Aapka data bilkul surakshit hai.'
      + '</p>'
      + '</div>'
      + '<div class="nav-wrap intro-nav">'
      + '<button class="nav-btn primary" id="btn-start-survey">' + btnLabel + '</button>'
      + '</div>'
      + '</div>';

    document.getElementById('btn-start-survey').addEventListener('click', function() {
      if (!configReady) {
        pendingStart = true;
        var btn = document.getElementById('btn-start-survey');
        if (btn) btn.textContent = 'Loading / लोड हो रहा है...';
        return;
      }
      isIntro = false;
      hasStarted = true;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function renderDemographics() {
    if (audioEl) { audioEl.pause(); audioEl = null; }

    progressWrap.style.display = 'flex';
    progressFill.style.width = '100%';
    progressLabel.textContent = 'Final Step / अंतिम चरण';

    audioCard.innerHTML = ''
      + '<div class="demographics-card-inner">'
      + '<div class="demographics-header">'
      + '<h2 class="demographics-title">Participant Details</h2>'
      + '<p class="demographics-sub-hi">प्रतिभागी विवरण</p>'
      + '<p class="demographics-sub-hirom">Prathibhagi Vivaran</p>'
      + '</div>'
      + '<div class="demographics-intro">'
      + '<p class="q-en">Almost done! Please enter your age and the city you are from to complete the survey.</p>'
      + '<p class="q-hi">लगभग समाप्त! सर्वेक्षण पूरा करने के लिए कृपया अपनी उम्र और आप किस शहर से हैं, यह बताएं।</p>'
      + '<p class="q-hirom">Lagbhag poora hua! Survey poora karne ke liye kripaya apni umar aur aap kis sheher se hain, yeh batayein.</p>'
      + '</div>'
      + '<div class="demographics-body">'
      + '<div class="demographics-field">'
      + '<label class="demographics-label" for="input-age">'
      + '<span class="q-en">1. What is your age?</span>'
      + '<span class="q-hi">आपकी उम्र क्या है?</span>'
      + '<span class="q-hirom">Aapki umar kya hai?</span>'
      + '</label>'
      + '<input type="number" id="input-age" class="demographics-input" min="1" max="120" placeholder="e.g. 21" value="' + (demographics.age || '') + '">'
      + '</div>'
      + '<div class="demographics-field">'
      + '<label class="demographics-label" for="input-city">'
      + '<span class="q-en">2. Which city are you from?</span>'
      + '<span class="q-hi">आप किस शहर से हैं?</span>'
      + '<span class="q-hirom">Aap kis sheher se hain?</span>'
      + '</label>'
      + '<input type="text" id="input-city" class="demographics-input" placeholder="e.g. Delhi, Lucknow, Mumbai..." value="' + (demographics.city || '') + '">'
      + '</div>'
      + '</div>'
      + '<div class="nav-wrap">'
      + '<button class="nav-btn" id="btn-demo-prev">← Back / पीछे</button>'
      + '<button class="nav-btn primary" id="btn-submit-survey">Submit / जमा करें</button>'
      + '</div>'
      + '</div>';

    document.getElementById('btn-demo-prev').addEventListener('click', function() {
      var ageVal = (document.getElementById('input-age').value || '').trim();
      var cityVal = (document.getElementById('input-city').value || '').trim();
      demographics.age = ageVal;
      demographics.city = cityVal;

      currentAudio = TOTAL - 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-submit-survey').addEventListener('click', function() {
      var ageVal = (document.getElementById('input-age').value || '').trim();
      var cityVal = (document.getElementById('input-city').value || '').trim();

      if (!ageVal || !cityVal) {
        showToast('Please enter both your age and city / कृपया अपनी उम्र और शहर दोनों भरें');
        return;
      }

      demographics.age = ageVal;
      demographics.city = cityVal;

      try {
        localStorage.setItem('survey_demographics', JSON.stringify(demographics));
      } catch (e) {}

      showFinal();
    });
  }

  function renderAudioCard() {
    progressWrap.style.display = 'flex';
    var audioFile = AUDIOS[currentAudio];
    var saved     = responses[audioFile] || {};

    var questionsHTML = QUESTIONS.map(function(q, i) {
      var isTouched = (saved[i] !== undefined);
      var val = isTouched ? saved[i] : 5;
      var pct = ((val - 1) / 9) * 100;
      var bgStyle = isTouched
        ? 'linear-gradient(to right, var(--accent) 0%, var(--accent) ' + pct + '%, var(--border) ' + pct + '%, var(--border) 100%)'
        : '#282828';
      var sliderClass = isTouched ? 'slider' : 'slider untouched';
      var valClass    = isTouched ? 'slider-value' : 'slider-value untouched';
      var valText     = isTouched ? val : '—';

      return '<div class="question-item" id="q-item-' + i + '">'
        + '<div class="question-header">'
        + '<span class="q-num">' + (i + 1) + '.</span>'
        + '<div class="q-multilang">'
        + '<p class="q-en">' + q.en + '</p>'
        + '<p class="q-hi">' + q.hi + '</p>'
        + '<p class="q-hirom">' + q.hirom + '</p>'
        + '</div>'
        + '</div>'
        + '<div class="slider-wrap">'
        + '<div class="slider-labels">'
        + '<span>Not at all / बिल्कुल नहीं (Bilkul nahin)</span>'
        + '<span>Extremely / बहुत (Bohot)</span>'
        + '</div>'
        + '<div class="slider-row">'
        + '<input type="range" min="1" max="10" value="' + val + '" class="' + sliderClass + '" id="slider-' + i + '" '
        + 'style="background: ' + bgStyle + '" '
        + 'data-qindex="' + i + '">'
        + '<span class="' + valClass + '" id="slider-val-' + i + '">' + valText + '</span>'
        + '</div></div></div>';
    }).join('');

    var isLast = (currentAudio === TOTAL - 1);

    audioCard.innerHTML = ''
      + '<div class="audio-card-header">'
      + '<span class="audio-number">' + (currentAudio + 1) + '</span>'
      + '<div class="audio-card-titles">'
      + '<span class="audio-card-title">Audio ' + (currentAudio + 1) + ' of ' + TOTAL + '</span>'
      + '<span class="audio-card-subtitle-hi">ऑडियो ' + (currentAudio + 1) + ' / ' + TOTAL + '</span>'
      + '</div>'
      + '</div>'
      + '<div class="player-wrap">'
      + '<div class="player-inner">'
      + '<button class="play-btn" id="play-btn" aria-label="Play">' + playIcon() + '</button>'
      + '<div class="player-timeline">'
      + '<div class="timeline-bar" id="timeline-bar"><div class="timeline-progress" id="timeline-progress"></div></div>'
      + '<div class="timeline-times"><span id="time-current">0:00</span><span id="time-total">—</span></div>'
      + '</div></div>'
      + '<p class="listen-note">'
      + 'Please listen to the audio before answering.<br>'
      + '<span>कृपया उत्तर देने से पहले ऑडियो सुनें • Kripaya jawab dene se pehle audio sunein.</span>'
      + '</p>'
      + '</div>'
      + '<div class="questions-section">' + questionsHTML + '</div>'
      + '<div class="nav-wrap">'
      + '<button class="nav-btn" id="btn-prev">← Back / पीछे</button>'
      + '<button class="nav-btn primary" id="btn-next">Continue / आगे →</button>'
      + '</div>';

    attachPlayer(audioFile);

    function markAsTouched(slider, qi, val) {
      slider.classList.remove('untouched');
      var valEl = document.getElementById('slider-val-' + qi);
      if (valEl) {
        valEl.classList.remove('untouched');
        valEl.textContent = val;
      }
      var pct = ((val - 1) / 9) * 100;
      slider.style.background = 'linear-gradient(to right, var(--accent) 0%, var(--accent) ' + pct + '%, var(--border) ' + pct + '%, var(--border) 100%)';
      if (!responses[audioFile]) responses[audioFile] = {};
      responses[audioFile][qi] = val;
    }

    document.querySelectorAll('.slider').forEach(function(slider) {
      var qi = parseInt(slider.dataset.qindex);

      slider.addEventListener('input', function() {
        markAsTouched(slider, qi, parseInt(slider.value));
      });

      slider.addEventListener('change', function() {
        markAsTouched(slider, qi, parseInt(slider.value));
      });

      slider.addEventListener('pointerdown', function() {
        setTimeout(function() {
          markAsTouched(slider, qi, parseInt(slider.value));
        }, 0);
      });
    });

    document.getElementById('btn-prev').addEventListener('click', function() {
      saveCurrentSliders(audioFile);
      if (currentAudio > 0) {
        currentAudio--;
        render();
      } else {
        isIntro = true;
        render();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-next').addEventListener('click', function() {
      saveCurrentSliders(audioFile);

      var unanswered = false;
      for (var i = 0; i < QUESTIONS.length; i++) {
        if (!responses[audioFile] || responses[audioFile][i] === undefined) {
          unanswered = true;
          break;
        }
      }

      if (unanswered) {
        showToast('Please answer all questions before continuing • कृपया सभी प्रश्नों का उत्तर दें');
        QUESTIONS.forEach(function(q, i) {
          if (!responses[audioFile] || responses[audioFile][i] === undefined) {
            var qItem = document.getElementById('q-item-' + i);
            if (qItem) {
              qItem.classList.add('highlight-unanswered');
              setTimeout(function() {
                qItem.classList.remove('highlight-unanswered');
              }, 1200);
            }
          }
        });
        return;
      }

      currentAudio++;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    updateProgress();
  }

  function saveCurrentSliders(audioFile) {
    if (!responses[audioFile]) responses[audioFile] = {};
    document.querySelectorAll('.slider').forEach(function(slider) {
      if (!slider.classList.contains('untouched')) {
        responses[audioFile][parseInt(slider.dataset.qindex)] = parseInt(slider.value);
      }
    });
  }

  function updateProgress() {
    var pct = Math.round((currentAudio / TOTAL) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = (currentAudio + 1) + ' / ' + TOTAL;
  }

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
    progressWrap.style.display = 'none';
    finalScreen.classList.add('visible');

    document.getElementById('final-title').innerHTML = 'Thank you.<br><span style="font-size:24px;color:#d8d0c5;">धन्यवाद।</span>';
    document.getElementById('final-sub').innerHTML   = 'Your responses have been recorded.<br><span style="font-size:15px;color:var(--text-secondary);">आपकी प्रतिक्रियाएँ दर्ज कर ली गई हैं। (Aapke jawab darj kar liye gaye hain.)</span>';

    var dlBtn = document.getElementById('download-btn');
    dlBtn.innerHTML = '⬇ Download Responses (CSV) / प्रतिक्रियाएँ डाउनलोड करें';

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
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzBBd_JTtiQg8tRpocrWNWWoKgUk8vV_0itOixiJO8VvHOMZf--6V8zORVDwdPlQnrxtQ/exec';

  function submitToSheets(callback) {
    if (!SHEETS_URL || SHEETS_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
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
        r[4] !== undefined ? r[4] : '',
        demographics.age || '',
        demographics.city || ''
      ]);
    });

    fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        rows: rows,
        age: demographics.age || '',
        city: demographics.city || '',
        version: VERSION
      }),
      headers: { 'Content-Type': 'text/plain' }
    })
    .then(function() {
      callback(true);
    })
    .catch(function() {
      callback(false);
    });
  }

  // ── CSV fallback ─────────────────────────────────────────────────────────────
  function downloadCSV() {
    var rows = [['Timestamp', 'Version', 'Audio File', 'Audio Order', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Age', 'City']];
    var timestamp = new Date().toISOString();
    AUDIOS.forEach(function(file, audioIndex) {
      var r = responses[file] || {};
      rows.push([
        timestamp,
        'v' + VERSION,
        file,
        audioIndex + 1,
        r[0] !== undefined ? r[0] : '',
        r[1] !== undefined ? r[1] : '',
        r[2] !== undefined ? r[2] : '',
        r[3] !== undefined ? r[3] : '',
        r[4] !== undefined ? r[4] : '',
        demographics.age || '',
        demographics.city || ''
      ]);
    });
    var csv  = rows.map(function(r) { return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

  render();
}
