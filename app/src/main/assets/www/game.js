/**
 * 2D Penalty Shootout Game (Android Touch & Web)
 * Full Persian UI & Landscape Widescreen Support
 * Exact Visual Alignment + Intelligent Jumping Goalkeeper AI + Triple Audio Engine
 */

(function() {
  // Canvas & Context Setup
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const uiOverlay = document.getElementById('ui-overlay');
  const scoreDisplay = document.getElementById('score-display');
  const goalsDisplay = document.getElementById('goals-display');
  const highscoreDisplay = document.getElementById('highscore-display');
  const livesDisplay = document.getElementById('lives-display');
  const livesBox = document.getElementById('lives-box');
  const targetsBox = document.getElementById('targets-box');
  const targetsDisplay = document.getElementById('targets-display');
  const centerBanner = document.getElementById('center-banner');
  const bannerTitle = document.getElementById('banner-title');
  const bannerDesc = document.getElementById('banner-desc');
  const guideBox = document.getElementById('guide-box');
  const guideText = document.getElementById('guide-text');
  const powerIndicator = document.getElementById('power-indicator');
  const powerVal = document.getElementById('power-val');

  // Modals & Buttons
  const menuModal = document.getElementById('menu-modal');
  const gameoverModal = document.getElementById('gameover-modal');
  const helpModal = document.getElementById('help-modal');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnShowHelp = document.getElementById('btn-show-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnBackMenu = document.getElementById('btn-back-menu');
  const btnHome = document.getElementById('btn-home');
  const btnSound = document.getElementById('btn-sound');
  const btnHelp = document.getElementById('btn-help');

  // Mode & Difficulty Selection Cards
  const modeCards = document.querySelectorAll('.mode-card');
  const diffBtns = document.querySelectorAll('.diff-btn');

  // Game Settings & State
  let gameMode = 'endless'; // endless, tournament, target
  let difficulty = 1; // 1: Easy, 2: Medium, 3: Hard
  let soundEnabled = true;
  let score = 0;
  let goals = 0;
  let highscore = parseInt(localStorage.getItem('penalty_highscore') || '0', 10);
  let lives = 3;
  let tournamentRound = 1;
  let tournamentMaxRounds = 5;
  let targetsHit = 0;
  let targetsTotal = 5;
  let isPlaying = false;

  highscoreDisplay.textContent = highscore;

  // Assets Loading
  const images = {
    field: new Image(),
    goalkeeper: new Image(),
    ball: new Image()
  };

  let assetsLoaded = 0;
  const totalAssets = 3;

  function onAssetLoad() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
      console.log('All game assets loaded successfully.');
    }
  }

  images.field.src = 'assets/field.png';
  images.field.onload = onAssetLoad;
  images.goalkeeper.src = 'assets/goalkeeper.png';
  images.goalkeeper.onload = onAssetLoad;
  images.ball.src = 'assets/ball.png';
  images.ball.onload = onAssetLoad;

  // Triple Audio System (Native Android Bridge + HTML5 Audio WAV + Web Audio API)
  const soundFiles = {
    click: new Audio('assets/sounds/click.wav'),
    whistle: new Audio('assets/sounds/whistle.wav'),
    kick: new Audio('assets/sounds/kick.wav'),
    goal: new Audio('assets/sounds/goal.wav'),
    save: new Audio('assets/sounds/save.wav'),
    miss: new Audio('assets/sounds/save.wav')
  };

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && soundEnabled) {
      try {
        audioCtx = new AudioContext();
      } catch (e) {
        console.warn('AudioContext fallback not available');
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;

    // 1. Try Native Android Bridge first (0ms latency inside APK)
    if (window.AndroidBridge && typeof window.AndroidBridge.playSound === 'function') {
      try {
        window.AndroidBridge.playSound(type);
        return;
      } catch(e) {}
    }

    // 2. Play HTML5 Audio WAV file
    if (soundFiles[type]) {
      try {
        soundFiles[type].currentTime = 0;
        soundFiles[type].play();
        return;
      } catch(e) {}
    }

    // 3. Web Audio API synthesizer fallback
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.08);
    } 
    else if (type === 'whistle') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.setValueAtTime(2800, now + 0.1);
      osc.frequency.setValueAtTime(2400, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.45);
    } 
    else if (type === 'kick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } 
    else if (type === 'goal') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } 
    else if (type === 'save' || type === 'miss') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + 0.25);
    }
  }

  // Responsive Canvas Setup
  let cw = 1536;
  let ch = 1024;
  let dpr = 1;

  function resizeCanvas() {
    const container = document.getElementById('game-container');
    const rect = container.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cw = rect.width;
    ch = rect.height;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // World Coordinates & Exact Alignment with field.png
  function getGoalRect() {
    const goalWidth = cw * 0.679;
    const goalHeight = ch * 0.300;
    const goalCenterY = ch * 0.458; // Bottom goal line on grass
    return {
      x: (cw - goalWidth) / 2,
      y: goalCenterY - goalHeight,
      w: goalWidth,
      h: goalHeight,
      centerX: cw / 2,
      centerY: goalCenterY
    };
  }

  // Ball Object
  const ball = {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    curve: 0,
    rot: 0,
    scale: 1,
    state: 'IDLE', // IDLE, AIMING, KICKED, RESULT, RESETTING
    timer: 0
  };

  function resetBall() {
    ball.x = 0;
    ball.y = 0;
    ball.z = 0;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 0;
    ball.curve = 0;
    ball.rot = 0;
    ball.scale = 1;
    ball.state = 'IDLE';
    ball.timer = 0;
    swipePath = [];
    powerIndicator.style.display = 'none';
  }

  // Intelligent Jumping Goalkeeper Object (#1 Green Monster)
  const goalie = {
    x: 0,        // Horizontal offset from goal center
    y: 0,        // Elevation above goal line
    vx: 0,       // Horizontal jump speed
    vy: 0,       // Vertical jump speed
    targetX: 0,
    targetY: 0,
    state: 'IDLE', // IDLE, WAITING_REACTION, DIVING, CELEBRATING, DEJECTED
    timer: 0,
    rot: 0,
    scaleX: 1,
    scaleY: 1
  };

  function resetGoalie() {
    goalie.x = 0;
    goalie.y = 0;
    goalie.vx = 0;
    goalie.vy = 0;
    goalie.targetX = 0;
    goalie.targetY = 0;
    goalie.state = 'IDLE';
    goalie.timer = 0;
    goalie.rot = 0;
    goalie.scaleX = 1;
    goalie.scaleY = 1;
  }

  // Targets for Target Challenge Mode
  let targetsList = [];

  function spawnTarget() {
    const gr = getGoalRect();
    const pad = 45;
    const tx = gr.x + pad + Math.random() * (gr.w - pad * 2);
    const ty = gr.y + pad + Math.random() * (gr.h - pad * 2);
    targetsList.push({
      x: tx,
      y: ty,
      radius: 28,
      hit: false,
      pulse: Math.random() * Math.PI
    });
  }

  function initRound() {
    resetBall();
    resetGoalie();
    centerBanner.classList.remove('show');
    if (gameMode === 'target' && targetsList.length === 0) {
      for (let i = 0; i < 3; i++) spawnTarget();
    }
  }

  // Particle System
  let particles = [];

  function spawnConfetti(cx, cy, count = 45) {
    const colors = ['#f2cc60', '#3fb950', '#58a6ff', '#f85149', '#ffffff'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
        gravity: 0.3,
        type: 'confetti'
      });
    }
  }

  function spawnGrassDust(cx, cy) {
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 1,
        size: Math.random() * 5 + 2,
        color: '#3fb950',
        alpha: 0.8,
        gravity: 0.2,
        type: 'dust'
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      if (p.rot !== undefined) p.rot += p.vrot;
      p.alpha -= 0.015;
      if (p.alpha <= 0 || p.y > ch + 50) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    ctx.save();
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      if (p.type === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Touch & Mouse Input Handling (Swipe Mechanics)
  let isDragging = false;
  let swipePath = [];

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (cw / rect.width),
      y: (clientY - rect.top) * (ch / rect.height)
    };
  }

  function getBallScreenPos() {
    const gr = getGoalRect();
    const spotY = ch * 0.82;
    const currentZ = ball.z;
    const scale = 1.0 - currentZ * 0.65;
    
    const screenY = spotY - (spotY - gr.centerY) * currentZ - ball.y;
    const screenX = cw / 2 + ball.x * scale;
    const shadowY = spotY - (spotY - gr.centerY) * currentZ;

    return { x: screenX, y: screenY, shadowY: shadowY, scale: scale };
  }

  canvas.addEventListener('pointerdown', function(e) {
    if (!isPlaying || ball.state !== 'IDLE') return;
    const pos = getPointerPos(e);
    const bPos = getBallScreenPos();
    const ballRadius = 65 * bPos.scale;

    const dist = Math.hypot(pos.x - bPos.x, pos.y - bPos.y);
    if (dist < ballRadius * 1.8) {
      isDragging = true;
      ball.state = 'AIMING';
      swipePath = [pos];
      powerIndicator.style.display = 'flex';
      powerVal.textContent = '۰٪';
    }
  });

  canvas.addEventListener('pointermove', function(e) {
    if (!isDragging || ball.state !== 'AIMING') return;
    const pos = getPointerPos(e);
    swipePath.push(pos);

    if (swipePath.length > 35) {
      swipePath.shift();
    }

    const first = swipePath[0];
    const dy = first.y - pos.y;
    const powerPercent = Math.min(100, Math.max(0, Math.round((dy / (ch * 0.45)) * 100)));
    powerVal.textContent = powerPercent + '٪';
  });

  function onPointerRelease(e) {
    if (!isDragging || ball.state !== 'AIMING') return;
    isDragging = false;
    powerIndicator.style.display = 'none';

    if (swipePath.length < 3) {
      ball.state = 'IDLE';
      return;
    }

    const first = swipePath[0];
    const last = swipePath[swipePath.length - 1];
    const dx = last.x - first.x;
    const dy = first.y - last.y;

    if (dy < 40) {
      ball.state = 'IDLE';
      return;
    }

    let totalCurvature = 0;
    if (swipePath.length > 5) {
      for (let i = 1; i < swipePath.length - 1; i++) {
        const pt = swipePath[i];
        const t = (first.y - pt.y) / (first.y - last.y || 1);
        const expectedX = first.x + (last.x - first.x) * t;
        totalCurvature += (pt.x - expectedX);
      }
      totalCurvature /= (swipePath.length - 2);
    }

    const power = Math.min(1.0, Math.max(0.3, dy / (ch * 0.45)));
    ball.vz = 0.022 + power * 0.025;
    ball.vx = (dx / (cw * 0.5)) * 16;
    ball.vy = power * 14;
    ball.curve = (totalCurvature / cw) * 0.85;
    ball.state = 'KICKED';
    ball.timer = 0;

    playSound('kick');
    const bPos = getBallScreenPos();
    spawnGrassDust(bPos.x, bPos.y + 20);

    // Enter reaction state for goalkeeper AI
    goalie.state = 'WAITING_REACTION';
    goalie.timer = 0;
  }

  canvas.addEventListener('pointerup', onPointerRelease);
  canvas.addEventListener('pointercancel', onPointerRelease);
  canvas.addEventListener('pointerleave', onPointerRelease);

  // Goalkeeper Intelligent Jumping & Reaction
  function updateGoalieAI() {
    if (goalie.state === 'WAITING_REACTION') {
      goalie.timer++;
      
      // Reaction delay based on difficulty so scoring is balanced and not too hard!
      // Easy: 14 frames, Medium: 9 frames, Hard: 5 frames
      const reactionDelay = difficulty === 1 ? 14 : (difficulty === 2 ? 9 : 5);
      
      if (goalie.timer >= reactionDelay) {
        const gr = getGoalRect();
        
        // Predict exact ball arrival position at goal plane z = 1
        const timeToGoal = max(1, (1.0 - ball.z) / (ball.vz || 0.03));
        let predX = ball.x + ball.vx * (timeToGoal * 0.6) + ball.curve * (timeToGoal * timeToGoal * 0.4);
        let predY = Math.max(0, Math.min(gr.h, ball.vy * 0.8));

        // Apply intelligent jumping and dive parameters
        if (difficulty === 1) {
          // Easy: Goalie jumps with moderate speed, sometimes misjudges curves or corner shots
          if (Math.random() < 0.38) {
            predX *= -0.5; // Wrong side dive
          } else {
            predX += (Math.random() - 0.5) * 160;
          }
        } else if (difficulty === 2) {
          // Medium: Professional dive, but corners (سه جاف) and curved shots score
          predX += (Math.random() - 0.5) * 65;
        } else {
          // Hard: Fast acrobatic jump and dive right towards the ball
          predX += (Math.random() - 0.5) * 25;
        }

        goalie.targetX = predX;
        goalie.targetY = predY;
        goalie.state = 'DIVING';
        
        // Calculate dynamic jump velocities to make him actually leap off the ground!
        const diveFrames = Math.max(12, timeToGoal);
        goalie.vx = (predX - goalie.x) / (diveFrames * 0.85);
        goalie.vy = Math.min(16, Math.max(6, (predY / 15) + 6)); // Vertical jump velocity upwards
      }
    } 
    else if (goalie.state === 'DIVING') {
      // Professional jumping and diving motion across X and Y
      goalie.x += goalie.vx;
      goalie.y += goalie.vy;
      goalie.vy -= 0.65; // Gravity pulls the goalie back down towards grass
      if (goalie.y < 0) {
        goalie.y = 0;
        goalie.vy = 0;
      }
      // Rotate body dynamically towards the dive direction
      goalie.rot = (goalie.vx / 18) * 0.45;
      
      // Dynamic stretching animation when reaching out to block
      goalie.scaleX = 1 + Math.min(0.2, Math.abs(goalie.vx) * 0.015);
      goalie.scaleY = 1 - Math.min(0.1, Math.abs(goalie.vx) * 0.008);
    } 
    else if (goalie.state === 'CELEBRATING') {
      goalie.timer++;
      goalie.y = Math.abs(Math.sin(goalie.timer * 0.3)) * 25; // Happy bounce
      goalie.rot = Math.sin(goalie.timer * 0.2) * 0.15;
      goalie.scaleX = 1;
      goalie.scaleY = 1;
    } 
    else if (goalie.state === 'DEJECTED') {
      goalie.timer++;
      goalie.y = 0;
      goalie.rot = Math.sin(goalie.timer * 0.1) * 0.05; // Shaking head in sadness
      goalie.scaleX = 1;
      goalie.scaleY = 1;
    } 
    else if (goalie.state === 'IDLE') {
      goalie.timer += 0.04;
      goalie.x = Math.sin(goalie.timer) * 18;
      goalie.y = Math.abs(Math.sin(goalie.timer * 2)) * 6;
      goalie.rot = 0;
      goalie.scaleX = 1;
      goalie.scaleY = 1;
    }
  }

  function Math_max(a, b) { return a > b ? a : b; }
  function max(a, b) { return a > b ? a : b; }

  function showBanner(title, desc, type = 'goal') {
    bannerTitle.textContent = title;
    bannerDesc.textContent = desc;
    centerBanner.className = 'show ' + type;
    setTimeout(() => {
      centerBanner.classList.remove('show');
    }, 2400);
  }

  function updateGame() {
    if (!isPlaying) return;

    targetsList.forEach(t => {
      t.pulse += 0.08;
    });

    updateGoalieAI();

    if (ball.state === 'KICKED') {
      ball.z += ball.vz;
      ball.x += ball.vx;
      ball.vx += ball.curve;
      ball.y += ball.vy;
      ball.vy -= 0.6; // Gravity
      if (ball.y < 0) {
        ball.y = 0;
        ball.vy = -ball.vy * 0.45;
      }
      ball.rot += 0.25;

      // Check collision when crossing goal plane (z >= 0.94)
      if (ball.z >= 0.94) {
        const gr = getGoalRect();
        const bScreen = getBallScreenPos();

        const goalieScreenX = gr.centerX + goalie.x;
        // Goalie chest/hands in screen space during jump
        const goalieScreenY = gr.centerY - goalie.y - 70;
        const goalieHitDist = Math.hypot(bScreen.x - goalieScreenX, bScreen.y - goalieScreenY);

        // Balanced reach based on difficulty: Easy=95px, Medium=115px, Hard=130px
        const blockRadius = difficulty === 1 ? 95 : (difficulty === 2 ? 115 : 130);

        if (goalieHitDist < blockRadius && bScreen.y < gr.centerY + 40) {
          // SAVED BY GOALIE!
          ball.state = 'RESULT';
          ball.vz = -0.016;
          ball.vx = (bScreen.x - goalieScreenX) * 0.2;
          ball.vy = 7;
          goalie.state = 'CELEBRATING';
          goalie.timer = 0;
          playSound('save');
          showBanner('مهار شد! 🧤', 'دروازه‌بان با یک پرش و شیرجه عالی توپ را گرفت!', 'save');

          handleRoundEnd('save');
        } 
        else {
          const isInsideWidth = bScreen.x > gr.x + 35 && bScreen.x < gr.x + gr.w - 35;
          const isInsideHeight = bScreen.y > gr.y + 15 && bScreen.y < gr.y + gr.h;

          if (isInsideWidth && isInsideHeight) {
            // GOAL!!
            ball.state = 'RESULT';
            ball.vz = 0.005;
            ball.vy = -2;
            goalie.state = 'DEJECTED';
            goalie.timer = 0;
            playSound('goal');
            spawnConfetti(bScreen.x, bScreen.y, 60);
            showBanner('گلل!! ⚽🔥', 'یک شوت بی‌نقص و حرفه‌ای به تور نشست!', 'goal');

            if (gameMode === 'target') {
              targetsList.forEach(t => {
                if (!t.hit && Math.hypot(bScreen.x - t.x, bScreen.y - t.y) < t.radius + 40) {
                  t.hit = true;
                  targetsHit++;
                  score += 250;
                  spawnConfetti(t.x, t.y, 30);
                }
              });
              targetsDisplay.textContent = `${targetsHit} / ${targetsTotal}`;
            }

            handleRoundEnd('goal');
          } 
          else {
            ball.state = 'RESULT';
            goalie.state = 'IDLE';
            if (Math.abs(bScreen.x - gr.x) < 40 || Math.abs(bScreen.x - (gr.x + gr.w)) < 40) {
              playSound('save');
              ball.vx = -ball.vx * 0.8;
              showBanner('تیرک دروازه! 💥', 'توپ با اختلاف میلی‌متری به تیرک خورد!', 'save');
            } else {
              playSound('miss');
              showBanner('بیرون رفت! ❌', 'ضربه از کنار دروازه به بیرون رفت.', 'save');
            }
            handleRoundEnd('miss');
          }
        }
      }
    } 
    else if (ball.state === 'RESULT') {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy -= 0.5;
      if (ball.y < 0) {
        ball.y = 0;
        ball.vx *= 0.85;
      }
      ball.timer++;
      if (ball.timer > 120) {
        initRound();
      }
    }
    updateParticles();
  }

  function handleRoundEnd(result) {
    if (result === 'goal') {
      goals++;
      score += 100 * difficulty;
      goalsDisplay.textContent = goals;
      scoreDisplay.textContent = score;
      if (score > highscore) {
        highscore = score;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('penalty_highscore', highscore);
      }
    } else {
      if (gameMode === 'endless') {
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
          setTimeout(showGameOver, 2200);
          return;
        }
      }
    }

    if (gameMode === 'tournament') {
      tournamentRound++;
      if (tournamentRound > tournamentMaxRounds) {
        setTimeout(showGameOver, 2200);
      } else {
        guideText.textContent = `ضربه ${tournamentRound} از ${tournamentMaxRounds} | برای شوت زدن انگشت را روی توپ کشیده و رها کنید`;
      }
    } else if (gameMode === 'target') {
      if (targetsHit >= targetsTotal) {
        setTimeout(showGameOver, 2200);
      }
    }
  }

  function updateLivesDisplay() {
    const hearts = livesDisplay.querySelectorAll('.life-heart');
    hearts.forEach((heart, idx) => {
      if (idx < lives) {
        heart.classList.remove('lost');
      } else {
        heart.classList.add('lost');
      }
    });
  }

  function showGameOver() {
    isPlaying = false;
    document.getElementById('go-final-score').textContent = score;
    document.getElementById('go-final-goals').textContent = goals;
    document.getElementById('go-final-high').textContent = highscore;

    if (gameMode === 'tournament') {
      if (goals >= 3) {
        document.getElementById('go-title').textContent = 'قهرمان جام شدی! 🏆🎉';
        document.getElementById('go-subtitle').textContent = `با ثبت ${goals} گل از ۵ ضربه، جام قهرمانی را بالای سر بردی!`;
        playSound('goal');
      } else {
        document.getElementById('go-title').textContent = 'حذف از جام! 😔';
        document.getElementById('go-subtitle').textContent = `متاسفانه با ${goals} گل نتوانستی به قهرمانی برسی. دوباره تلاش کن!`;
      }
    } else if (gameMode === 'target') {
      document.getElementById('go-title').textContent = 'پایان چالش اهداف! ⭐';
      document.getElementById('go-subtitle').textContent = `شما موفق شدید ${targetsHit} هدف طلایی را منهدم کنید!`;
    } else {
      document.getElementById('go-title').textContent = 'پایان رکوردزنی! 🔥';
      document.getElementById('go-subtitle').textContent = `شما قبل از اتمام جان‌ها موفق به ثبت ${goals} گل گردیدید!`;
    }

    gameoverModal.classList.add('active');
  }

  // Render Loop
  function drawGame() {
    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw Field Background (Exact 1536x1024 stadium view)
    if (images.field.complete && images.field.naturalWidth > 0) {
      ctx.drawImage(images.field, 0, 0, cw, ch);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#1c4e20');
      grad.addColorStop(1, '#2c7a33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 2. Draw Golden Targets (Target Challenge Mode)
    if (gameMode === 'target') {
      targetsList.forEach(t => {
        if (!t.hit) {
          ctx.save();
          ctx.translate(t.x, t.y);
          const scale = 1 + Math.sin(t.pulse) * 0.15;
          ctx.scale(scale, scale);
          ctx.beginPath();
          ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(242, 204, 96, 0.88)';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 22px Vazirmatn, Tahoma';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
          ctx.restore();
        }
      });
    }

    // 3. Draw Goalkeeper (#1 Green Monster with exact natural aspect ratio 1231/719 = 1.712)
    const gr = getGoalRect();
    const gScreenX = gr.centerX + goalie.x;
    const gWidth = (cw * 0.33) * goalie.scaleX;
    const gHeight = (gWidth / 1.712) * goalie.scaleY;
    // When goalie.y rises during jump, his body elevates off the grass right towards the crossbar!
    const gScreenY = gr.centerY - gHeight + (ch * 0.02) - goalie.y;

    ctx.save();
    ctx.translate(gScreenX, gScreenY + gHeight / 2);
    ctx.rotate(goalie.rot);
    if (images.goalkeeper.complete && images.goalkeeper.naturalWidth > 0) {
      ctx.drawImage(images.goalkeeper, -gWidth / 2, -gHeight / 2, gWidth, gHeight);
    } else {
      ctx.fillStyle = '#3fb950';
      ctx.fillRect(-gWidth / 2, -gHeight / 2, gWidth, gHeight);
    }
    ctx.restore();

    // 4. Draw Ball Shadow & Ball Sprite (#1 Pixel Art Soccer Ball)
    const bPos = getBallScreenPos();
    const bSize = (cw * 0.088) * bPos.scale;

    // Shadow on grass under the ball
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bPos.x, bPos.shadowY, (bSize * 0.45), (bSize * 0.18), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fill();
    ctx.restore();

    // Ball Sprite
    ctx.save();
    ctx.translate(bPos.x, bPos.y);
    ctx.rotate(ball.rot);
    if (images.ball.complete && images.ball.naturalWidth > 0) {
      ctx.drawImage(images.ball, -bSize / 2, -bSize / 2, bSize, bSize);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, bSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
    ctx.restore();

    // 5. Draw Aiming & Swipe Curve Trajectory Guide
    if (isDragging && swipePath.length > 1 && ball.state === 'AIMING') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(swipePath[0].x, swipePath[0].y);
      for (let i = 1; i < swipePath.length; i++) {
        ctx.lineTo(swipePath[i].x, swipePath[i].y);
      }
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.88)';
      ctx.shadowColor = '#58a6ff';
      ctx.shadowBlur = 15;
      ctx.stroke();

      const last = swipePath[swipePath.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#f2cc60';
      ctx.fill();
      ctx.restore();
    }

    // 6. Draw Particles
    drawParticles();
  }

  function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
  }

  // UI Event Listeners & Mode Selection
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      gameMode = card.getAttribute('data-mode');
      playSound('click');
    });
  });

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = parseInt(btn.getAttribute('data-diff'), 10);
      playSound('click');
    });
  });

  btnStartGame.addEventListener('click', () => {
    playSound('whistle');
    menuModal.classList.remove('active');
    isPlaying = true;
    score = 0;
    goals = 0;
    lives = 3;
    tournamentRound = 1;
    targetsHit = 0;
    scoreDisplay.textContent = score;
    goalsDisplay.textContent = goals;
    updateLivesDisplay();

    if (gameMode === 'endless') {
      livesBox.style.display = 'flex';
      targetsBox.style.display = 'none';
      guideText.textContent = 'برای شوت زدن، انگشت (یا ماوس) را روی توپ گذاشته و به سمت دروازه بکشید (با حرکت کات‌دار!)';
    } else if (gameMode === 'tournament') {
      livesBox.style.display = 'none';
      targetsBox.style.display = 'none';
      guideText.textContent = `ضربه ${tournamentRound} از ${tournamentMaxRounds} | برای شوت زدن انگشت را روی توپ کشیده و رها کنید`;
    } else if (gameMode === 'target') {
      livesBox.style.display = 'none';
      targetsBox.style.display = 'flex';
      targetsList = [];
      for (let i = 0; i < 3; i++) spawnTarget();
      targetsDisplay.textContent = `۰ / ${targetsTotal}`;
      guideText.textContent = 'به سمت اهداف متحرک طلایی (⭐) درون دروازه شوت کنید!';
    }

    initRound();
  });

  btnPlayAgain.addEventListener('click', () => {
    playSound('click');
    gameoverModal.classList.remove('active');
    btnStartGame.click();
  });

  btnBackMenu.addEventListener('click', () => {
    playSound('click');
    gameoverModal.classList.remove('active');
    menuModal.classList.add('active');
  });

  btnHome.addEventListener('click', () => {
    playSound('click');
    isPlaying = false;
    menuModal.classList.add('active');
  });

  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? '🔊' : '🔇';
    btnSound.style.opacity = soundEnabled ? '1' : '0.5';
  });

  btnHelp.addEventListener('click', () => {
    playSound('click');
    helpModal.classList.add('active');
  });

  btnShowHelp.addEventListener('click', () => {
    playSound('click');
    helpModal.classList.add('active');
  });

  btnCloseHelp.addEventListener('click', () => {
    playSound('click');
    helpModal.classList.remove('active');
  });

  // Start Animation Loop
  requestAnimationFrame(gameLoop);
})();
