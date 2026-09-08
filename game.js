// Donkey Kong Style Rolling Hill Game
// Core Engine: Physics, Slopes, Ladders, Spawning, Scoring, and Game Loop

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution
    this.width = 800;
    this.height = 650;

    // High DPI Canvas Scaling
    this.setupCanvasDPI();

    // Input States
    this.keys = {};
    this.touchControls = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false
    };

    // Game States: 'MENU', 'PLAYING', 'PAUSED', 'LEVEL_CLEAR', 'GAME_OVER'
    this.state = 'MENU';

    // Player Customization & Profile
    this.selectedChar = 'ilianna';
    this.customColors = {
      outfit: '#ff69b4',
      pants: '#3a7bd5',
      hair: '#e6a147',
      skin: '#ffdfbf'
    };
    this.customization = {
      outfit: '#ff69b4',
      hairStyle: 'classic',
      clothingStyle: 'adventurer',
      eyeType: 'sapphire'
    };

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('girlsGame_highScore') || '0', 10);
    this.lives = 3;
    this.level = 1;
    this.maxLevels = 3;

    // Game Entities
    this.player = null;
    this.barrels = [];
    this.platforms = [];
    this.ladders = [];
    this.items = [];
    this.particles = [];
    this.boss = null;
    this.goal = null;

    // Photographic Diorama Backgrounds (Sackboy & Unravel 2 aesthetic + Oregon Creek/Lake Home)
    this.bgImages = {};
    if (typeof Image !== 'undefined') {
      this.bgImages['home'] = new Image();
      this.bgImages['home'].src = 'assets/bg_home.jpg';
      this.bgImages[1] = new Image();
      this.bgImages[1].src = 'assets/bg_level1.jpg';
      this.bgImages[2] = new Image();
      this.bgImages[2].src = 'assets/bg_level2.jpg';
      this.bgImages[3] = new Image();
      this.bgImages[3].src = 'assets/bg_level3.jpg';
    }

    // Ambient floating fireflies / magical glowing spores
    this.ambientParticles = [];
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.4,
        radius: 1.5 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Timers
    this.barrelSpawnTimer = 0;
    this.barrelSpawnInterval = 3.2; // seconds
    this.coyoteCounter = 0;
    this.jumpBufferCounter = 0;

    // Load initial level layout for background preview
    this.loadLevel(1);
    this.state = 'MENU';

    this.initEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Start Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupCanvasDPI() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Viewport-based responsive sizing (avoids cyclic shrinking loops)
    const maxW = Math.min(window.innerWidth - 30, 800);
    const maxH = Math.max(340, window.innerHeight - 170);

    const scale = Math.min(maxW / this.width, maxH / this.height);
    const targetW = Math.max(320, Math.floor(this.width * scale));
    const targetH = Math.max(260, Math.floor(this.height * scale));

    container.style.width = `${targetW}px`;
    container.style.height = `${targetH}px`;
  }

  initEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Prevent default page scroll on Arrow keys & Space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.jumpBufferCounter = 0.12; // 120ms jump buffer
      }

      if (e.code === 'KeyP') {
        this.togglePause();
      }

      if (e.code === 'KeyH') {
        this.goToHomeScreen();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch / On-screen buttons
    this.setupTouchButtons();
  }

  setupTouchButtons() {
    const bindBtn = (id, keyName) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const handlePress = (e) => {
        e.preventDefault();
        this.touchControls[keyName] = true;
        if (keyName === 'jump') {
          this.jumpBufferCounter = 0.12;
        }
      };

      const handleRelease = (e) => {
        e.preventDefault();
        this.touchControls[keyName] = false;
      };

      btn.addEventListener('pointerdown', handlePress);
      btn.addEventListener('pointerup', handleRelease);
      btn.addEventListener('pointercancel', handleRelease);
      btn.addEventListener('pointerleave', handleRelease);
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-up', 'up');
    bindBtn('btn-down', 'down');
    bindBtn('btn-jump', 'jump');
  }

  // Check if a specific action key is active (combines keyboard & touch)
  isActionActive(action) {
    switch (action) {
      case 'left':
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
      case 'right':
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;
      case 'up':
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up;
      case 'down':
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down;
      case 'jump':
        return this.keys['Space'] || this.touchControls.jump;
      default:
        return false;
    }
  }

  // Start or reset game (continues song between levels!)
  startGame(level = 1, options = {}) {
    const isContinuingLevel = (level > 1) || (this.state === 'LEVEL_CLEAR');
    const resume = options.resume !== undefined ? options.resume : isContinuingLevel;

    this.level = level;
    this.lives = 3;
    this.score = (level === 1 && !isContinuingLevel) ? 0 : this.score;
    this.loadLevel(this.level);
    this.state = 'PLAYING';

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const winScreen = document.getElementById('win-screen');

    if (startScreen) {
      startScreen.classList.add('hidden');
      if (startScreen.style) {
        if (startScreen.style.setProperty) startScreen.style.setProperty('display', 'none', 'important');
        else startScreen.style.display = 'none';
      }
    }
    if (gameOverScreen) {
      gameOverScreen.classList.add('hidden');
      if (gameOverScreen.style) {
        if (gameOverScreen.style.setProperty) gameOverScreen.style.setProperty('display', 'none', 'important');
        else gameOverScreen.style.display = 'none';
      }
    }
    if (winScreen) {
      winScreen.classList.add('hidden');
      if (winScreen.style) {
        if (winScreen.style.setProperty) winScreen.style.setProperty('display', 'none', 'important');
        else winScreen.style.display = 'none';
      }
    }

    // Continue the song from where it left off between levels!
    if (window.soundEngine) {
      window.soundEngine.startMusic({ resume });
    }
  }

  loadLevel(lvl) {
    this.barrels = [];
    this.items = [];
    this.particles = [];
    this.platforms = [];
    this.ladders = [];

    // Boss at top-left
    this.boss = {
      x: 120,
      y: 110,
      isThrowing: false,
      throwTimer: 0
    };

    // Goal at top-right
    this.goal = {
      x: 670,
      y: 105,
      petType: lvl === 2 ? 'kitten' : 'puppy'
    };

    // Regional floating announcement banner
    const levelBannerNames = {
      1: '🌲 OREGON OLD GROWTH 🦌',
      2: '🌊 CASCADE RIVER RIDGE 🌲',
      3: '🏔️ HIGH CASCADE MOUNTAIN PASS 🏔️'
    };
    this.particles.push({
      x: 400,
      y: 280,
      vx: 0,
      vy: -0.35,
      alpha: 1,
      life: 2.4,
      maxLife: 2.4,
      type: 'text',
      text: levelBannerNames[lvl] || `LEVEL ${lvl}`,
      color: '#ffffff'
    });

    // Level Platform layouts (zig-zag Donkey Kong style slopes)
    if (lvl === 1) {
      // LEVEL 1: Dark Old-Growth Oregon Woods (Deer in the Woods & Ancient Cedar Nurse Logs)
      this.barrelSpawnInterval = 3.2;

      // Tier 1: Bottom Ground (extends off-screen to left so rolling barrels exit smoothly)
      this.platforms.push({ x1: -60, y1: 612, x2: 780, y2: 600, colorTheme: 'oregon_log' });

      // Tier 2: Slopes Down from Left to Right
      this.platforms.push({ x1: 30, y1: 480, x2: 740, y2: 505, colorTheme: 'oregon_log' });

      // Tier 3: Slopes Down from Right to Left
      this.platforms.push({ x1: 60, y1: 390, x2: 770, y2: 360, colorTheme: 'oregon_log' });

      // Tier 4: Slopes Down from Left to Right
      this.platforms.push({ x1: 30, y1: 235, x2: 740, y2: 265, colorTheme: 'oregon_log' });

      // Tier 5: Top Flat Peak (Boss & Pet)
      this.platforms.push({ x1: 60, y1: 135, x2: 740, y2: 135, colorTheme: 'oregon_log' });

      // Ladders connecting the tiers
      this.ladders.push({ x: 680, y: 502, width: 34, height: 102 }); // Bottom to Tier 2
      this.ladders.push({ x: 120, y: 388, width: 34, height: 96 });  // Tier 2 to Tier 3
      this.ladders.push({ x: 670, y: 262, width: 34, height: 102 }); // Tier 3 to Tier 4
      this.ladders.push({ x: 190, y: 135, width: 34, height: 105 }); // Tier 4 to Peak
      this.ladders.push({ x: 520, y: 135, width: 34, height: 115 }); // Extra ladder to Peak

      // Gems, Hammer & Items
      this.items.push({ x: 420, y: 470, type: 'gem', value: 100 });
      this.items.push({ x: 260, y: 360, type: 'hammer' }); // HAMMER on Tier 3!
      this.items.push({ x: 480, y: 225, type: 'wand' }); // Bubble shield
      this.items.push({ x: 710, y: 335, type: 'gem', value: 100 });

    } else if (lvl === 2) {
      // LEVEL 2: Misty Cascade River Ridge (Weathered Riverbank Timber & Driftwood Logs)
      this.barrelSpawnInterval = 2.6;

      // 5 Tiers with steeper slopes
      this.platforms.push({ x1: -60, y1: 612, x2: 780, y2: 595, colorTheme: 'river_trail' });
      this.platforms.push({ x1: 40, y1: 475, x2: 750, y2: 510, colorTheme: 'river_trail' });
      this.platforms.push({ x1: 50, y1: 400, x2: 760, y2: 360, colorTheme: 'river_trail' });
      this.platforms.push({ x1: 40, y1: 230, x2: 750, y2: 270, colorTheme: 'river_trail' });
      this.platforms.push({ x1: 70, y1: 135, x2: 730, y2: 135, colorTheme: 'river_trail' });

      this.ladders.push({ x: 690, y: 507, width: 34, height: 94 });
      this.ladders.push({ x: 260, y: 490, width: 34, height: 115 });
      this.ladders.push({ x: 100, y: 395, width: 34, height: 85 });
      this.ladders.push({ x: 680, y: 266, width: 34, height: 98 });
      this.ladders.push({ x: 320, y: 135, width: 34, height: 115 });
      this.ladders.push({ x: 600, y: 135, width: 34, height: 125 });

      this.items.push({ x: 200, y: 580, type: 'gem', value: 150 });
      this.items.push({ x: 500, y: 470, type: 'boots' }); // Spring boots
      this.items.push({ x: 360, y: 475, type: 'hammer' }); // HAMMER!
      this.items.push({ x: 220, y: 360, type: 'gem', value: 150 });
      this.items.push({ x: 550, y: 235, type: 'wand' });
      this.items.push({ x: 710, y: 565, type: 'heart' });

    } else {
      // LEVEL 3: High Cascade Mountain Pass (Carved Rock-Shelf Mountain Trail Switchbacks!)
      this.barrelSpawnInterval = 2.1;

      this.platforms.push({ x1: -60, y1: 612, x2: 780, y2: 600, colorTheme: 'mountain_path' });
      this.platforms.push({ x1: 30, y1: 475, x2: 750, y2: 515, colorTheme: 'mountain_path' });
      this.platforms.push({ x1: 50, y1: 405, x2: 770, y2: 360, colorTheme: 'mountain_path' });
      this.platforms.push({ x1: 30, y1: 225, x2: 750, y2: 275, colorTheme: 'mountain_path' });
      this.platforms.push({ x1: 60, y1: 135, x2: 740, y2: 135, colorTheme: 'mountain_path' });

      this.ladders.push({ x: 690, y: 512, width: 34, height: 92 });
      this.ladders.push({ x: 380, y: 500, width: 34, height: 105 });
      this.ladders.push({ x: 100, y: 400, width: 34, height: 80 });
      this.ladders.push({ x: 490, y: 375, width: 34, height: 98 });
      this.ladders.push({ x: 680, y: 270, width: 34, height: 95 });
      this.ladders.push({ x: 220, y: 135, width: 34, height: 105 });
      this.ladders.push({ x: 560, y: 135, width: 34, height: 125 });

      this.items.push({ x: 160, y: 460, type: 'boots' });
      this.items.push({ x: 310, y: 480, type: 'hammer' }); // HAMMER!
      this.items.push({ x: 340, y: 370, type: 'wand' });
      this.items.push({ x: 520, y: 235, type: 'hammer' }); // Extra HAMMER!
      this.items.push({ x: 580, y: 230, type: 'gem', value: 250 });
      this.items.push({ x: 440, y: 120, type: 'gem', value: 250 });
      this.items.push({ x: 720, y: 230, type: 'heart' });
    }

    // Spawn Player at bottom left (miniature diorama scale like Unravel's Yarny!)
    this.player = {
      x: 80,
      y: 575,
      vx: 0,
      vy: 0,
      width: 20,
      height: 30,
      facing: 1, // 1: right, -1: left
      isGrounded: false,
      isClimbing: false,
      currentLadder: null,
      animTimer: 0,
      blinkTimer: 0,
      invulnerableTimer: 0,
      shieldTimer: 0,
      springTimer: 0,
      hammerTimer: 0,
      scaleX: 1,
      scaleY: 1,
      tiltAngle: 0,
      hairSway: 0,
      bellyOffset: 0,
      bellyVel: 0,
      sparkleTimer: 0,
      customization: {
        type: this.selectedChar,
        ...this.customColors,
        ...(this.customization || {})
      }
    };

    this.updateHUD();
  }

  // Spawn a rolling barrel from the boss
  spawnBarrel() {
    this.boss.isThrowing = true;
    this.boss.throwTimer = 0.6;

    setTimeout(() => {
      let bType = 'wood';
      if (this.level === 2) bType = Math.random() > 0.4 ? 'watermelon' : 'wood';
      if (this.level === 3) bType = Math.random() > 0.4 ? 'candy' : (Math.random() > 0.5 ? 'watermelon' : 'wood');

      const barrel = {
        x: this.boss.x + 30,
        y: this.boss.y + 10,
        vx: 2.2 + (this.level - 1) * 0.4,
        vy: 0,
        radius: 9.5,
        rotation: 0,
        type: bType,
        isGrounded: false,
        hasAwardedPoints: false
      };

      this.barrels.push(barrel);
      window.soundEngine.playBarrelBounce();
    }, 250);
  }

  // Main Game Loop
  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap delta time
    this.lastTime = timestamp;

    try {
      this.update(dt);
      this.render();
    } catch (err) {
      console.error('Game loop error:', err);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.updateBoss(dt);
    this.updatePlayer(dt);
    this.updateBarrels(dt);
    this.updateItems(dt);
    this.updateParticles(dt);
    this.checkVictory();
  }

  updateBoss(dt) {
    if (this.boss.throwTimer > 0) {
      this.boss.throwTimer -= dt;
      if (this.boss.throwTimer <= 0) {
        this.boss.isThrowing = false;
      }
    }

    this.barrelSpawnTimer += dt;
    if (this.barrelSpawnTimer >= this.barrelSpawnInterval) {
      this.barrelSpawnTimer = 0;
      this.spawnBarrel();
    }
  }

  updatePlayer(dt) {
    const p = this.player;

    // Timers
    p.animTimer += dt;
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.shieldTimer > 0) p.shieldTimer -= dt;
    if (p.springTimer > 0) p.springTimer -= dt;
    if (p.hammerTimer > 0) p.hammerTimer -= dt;

    // Eye blinking
    if (Math.random() < 0.01 && p.blinkTimer <= 0) {
      p.blinkTimer = 0.15;
    }
    if (p.blinkTimer > 0) p.blinkTimer -= dt;

    // Jump Buffering & Coyote Time
    if (this.jumpBufferCounter > 0) this.jumpBufferCounter -= dt;
    if (p.isGrounded) {
      this.coyoteCounter = 0.1; // 100ms
    } else {
      if (this.coyoteCounter > 0) this.coyoteCounter -= dt;
    }

    // --- LADDER CLIMBING LOGIC ---
    let nearLadder = null;
    for (const ladder of this.ladders) {
      // Overlap check: allow entering from slightly above or below
      if (p.x >= ladder.x - 14 && p.x <= ladder.x + ladder.width + 14 &&
          p.y + p.height / 2 >= ladder.y - 8 && p.y - p.height / 2 <= ladder.y + ladder.height + 6) {
        nearLadder = ladder;
        break;
      }
    }

    const wantUp = this.isActionActive('up');
    const wantDown = this.isActionActive('down');
    const wantJump = this.isActionActive('jump') || this.jumpBufferCounter > 0;

    if (nearLadder && (wantUp || wantDown) && !p.isClimbing) {
      // If at top of ladder, must press down to enter ladder
      if (wantDown || p.y + p.height / 2 > nearLadder.y + 5) {
        p.isClimbing = true;
        p.currentLadder = nearLadder;
        p.x = nearLadder.x + nearLadder.width / 2; // snap to ladder center
        p.vx = 0;
        p.vy = 0;
        if (wantDown && p.y + p.height / 2 <= nearLadder.y + 4) {
          p.y += 8; // nudge down into ladder
        }
      }
    }

    if (p.isClimbing) {
      const climbSpeed = 2.5;
      if (wantUp) {
        p.vy = -climbSpeed;
        if (Math.random() < 0.12) window.soundEngine.playLadderStep();
      } else if (wantDown) {
        p.vy = climbSpeed;
        if (Math.random() < 0.12) window.soundEngine.playLadderStep();
      } else {
        p.vy = 0;
      }

      p.y += p.vy;

      // Jump off ladder
      if (wantJump) {
        p.isClimbing = false;
        p.vy = -8.2;
        this.jumpBufferCounter = 0;
        window.soundEngine.playJump();
      }

      // Reached top of ladder -> step onto platform
      if (p.y + p.height / 2 <= p.currentLadder.y + 2 && wantUp) {
        p.isClimbing = false;
        p.y = p.currentLadder.y - p.height / 2 - 2;
        p.vy = 0;
        p.isGrounded = true;
      } else if (p.y - p.height / 2 > p.currentLadder.y + p.currentLadder.height) {
        // Reached bottom of ladder
        p.isClimbing = false;
      }

      return; // Skip regular gravity while on ladder
    }

    // --- HORIZONTAL MOVEMENT & FLUID ACCELERATION ---
    const moveSpeed = p.springTimer > 0 ? 4.6 : 3.7;
    const accel = p.isGrounded ? 0.9 : 0.6;
    const friction = p.isGrounded ? 0.74 : 0.88;

    const wantLeft = this.isActionActive('left');
    const wantRight = this.isActionActive('right');

    if (wantLeft) {
      // Skidding dust puff when reversing direction sharply
      if (p.vx > 1.6 && p.isGrounded) {
        this.spawnJumpDust(p.x, p.y + p.height / 2);
      }
      p.vx -= accel;
      if (p.vx < -moveSpeed) p.vx = -moveSpeed;
      p.facing = -1;
    } else if (wantRight) {
      if (p.vx < -1.6 && p.isGrounded) {
        this.spawnJumpDust(p.x, p.y + p.height / 2);
      }
      p.vx += accel;
      if (p.vx > moveSpeed) p.vx = moveSpeed;
      p.facing = 1;
    } else {
      p.vx *= friction;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    p.x += p.vx;

    // Constrain within screen bounds
    if (p.x < 24) p.x = 24;
    if (p.x > this.width - 24) p.x = this.width - 24;

    // --- JUMPING WITH VARIABLE HEIGHT & SQUASH/STRETCH ---
    if (wantJump && (p.isGrounded || this.coyoteCounter > 0)) {
      // Powerful clean jump that comfortably clears barrels and logs!
      const jumpPower = p.springTimer > 0 ? -12.8 : -10.6;
      p.vy = jumpPower;
      p.isGrounded = false;
      this.coyoteCounter = 0;
      this.jumpBufferCounter = 0;

      // Jump stretch animation!
      p.scaleX = 0.82;
      p.scaleY = 1.22;

      if (p.springTimer > 0) {
        window.soundEngine.playSuperJump();
      } else {
        window.soundEngine.playJump();
      }

      this.spawnJumpDust(p.x, p.y + p.height / 2);
    }

    // Variable jump: smooth gentle cutoff on early release for short hops!
    if (!wantJump && p.vy < -3.2) {
      p.vy *= 0.85;
    }

    // --- GRAVITY & VERTICAL MOVEMENT ---
    const gravity = 0.38;
    p.vy += gravity;
    if (p.vy > 10) p.vy = 10;
    p.y += p.vy;

    // --- PLATFORM COLLISION WITH SLOPES & SMOOTH LANDING ---
    const wasGrounded = p.isGrounded;
    p.isGrounded = false;
    const feetY = p.y + p.height / 2;
    let targetTilt = 0;

    for (const plat of this.platforms) {
      const minX = Math.min(plat.x1, plat.x2);
      const maxX = Math.max(plat.x1, plat.x2);

      if (p.x >= minX && p.x <= maxX) {
        // Calculate slope Y at player's X
        const t = (p.x - plat.x1) / (plat.x2 - plat.x1);
        const slopeY = plat.y1 + t * (plat.y2 - plat.y1);

        // Falling onto platform
        if (p.vy >= 0 && feetY >= slopeY - 6 && feetY <= slopeY + 12) {
          p.y = slopeY - p.height / 2;
          p.vy = 0;
          p.isGrounded = true;

          // Align character posture gently to the slope angle of the log/stick!
          const platAngle = Math.atan2(plat.y2 - plat.y1, plat.x2 - plat.x1);
          targetTilt = platAngle * 0.65;

          // Landing squish!
          if (!wasGrounded) {
            p.scaleX = 1.25;
            p.scaleY = 0.76;
            this.spawnJumpDust(p.x, p.y + p.height / 2);
          }
          break;
        }
      }
    }

    // Running forward lean
    targetTilt += (p.vx / moveSpeed) * 0.08;
    p.tiltAngle += (targetTilt - p.tiltAngle) * 0.22;

    // Smooth recovery of squash and stretch back to 1.0
    p.scaleX += (1 - p.scaleX) * 0.2;
    p.scaleY += (1 - p.scaleY) * 0.2;

    // Secondary hair sway spring physics
    p.hairSway += (-p.hairSway * 0.22 - p.vx * 0.08 - p.vy * 0.04);
    p.hairSway *= 0.86;

    // Daddy belly bounce inertia spring (pulls up naturally with jump momentum)
    p.bellyVel += (-p.bellyOffset * 0.38 + p.vy * 0.12 + Math.abs(p.vx) * 0.06);
    p.bellyOffset += p.bellyVel;
    p.bellyVel *= 0.8;

    // Trailing magical sparkles for the girls and mommy
    if (this.selectedChar !== 'daddy') {
      p.sparkleTimer = (p.sparkleTimer || 0) + dt;
      if (p.sparkleTimer > 0.07 && (Math.abs(p.vx) > 0.8 || !p.isGrounded)) {
        p.sparkleTimer = 0;
        this.particles.push({
          type: 'star',
          x: p.x - p.facing * 8 + (Math.random() - 0.5) * 6,
          y: p.y + 4 + (Math.random() - 0.5) * 8,
          vx: -p.facing * (0.4 + Math.random() * 0.6),
          vy: -0.3 - Math.random() * 0.5,
          radius: 3.5 + Math.random() * 2,
          color: this.selectedChar === 'ilianna' ? '#ffd700' : (this.selectedChar === 'ava' ? '#ff69b4' : '#00f0ff'),
          life: 0.4,
          maxLife: 0.4
        });
      }
    }
  }

  updateBarrels(dt) {
    const gravity = 0.35;

    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];

      b.vy += gravity;
      if (b.vy > 9) b.vy = 9;

      b.x += b.vx;
      b.y += b.vy;

      // Barrel rotation matches its rolling velocity
      b.rotation += (b.vx / b.radius) * 1.3;

      // Platform collision
      b.isGrounded = false;
      for (const plat of this.platforms) {
        const minX = Math.min(plat.x1, plat.x2);
        const maxX = Math.max(plat.x1, plat.x2);

        if (b.x >= minX - 5 && b.x <= maxX + 5) {
          const t = (b.x - plat.x1) / (plat.x2 - plat.x1);
          const slopeY = plat.y1 + t * (plat.y2 - plat.y1);

          if (b.vy >= 0 && b.y + b.radius >= slopeY - 4 && b.y + b.radius <= slopeY + 14) {
            // Soft landing thump if dropping from upper ledge or ladder
            if (!b.isGrounded && b.vy > 3.2) {
              window.soundEngine.playBarrelBounce();
            }
            b.y = slopeY - b.radius;
            b.vy = 0;
            b.isGrounded = true;

            // Rolling direction matches slope gradient
            const slopeDir = plat.y2 > plat.y1 ? 1 : -1;
            const rollSpeed = 2.4 + (this.level - 1) * 0.4;
            b.vx = slopeDir * rollSpeed;
            break;
          }
        }
      }

      // Barrel ladder drop chance (authentic Donkey Kong surprise!)
      if (b.isGrounded && (!b.ladderCooldown || b.ladderCooldown <= 0)) {
        for (const ladder of this.ladders) {
          if (b.x >= ladder.x + 4 && b.x <= ladder.x + ladder.width - 4 &&
              Math.abs(b.y + b.radius - ladder.y) < 12) {
            if (Math.random() < 0.28) {
              b.vx = 0;
              b.vy = 3.2;
              b.ladderCooldown = 1.8;
              break;
            } else {
              b.ladderCooldown = 0.8;
            }
          }
        }
      }
      if (b.ladderCooldown > 0) b.ladderCooldown -= dt;

      // Check jumping over barrel for combo points!
      const p = this.player;
      if (!b.hasAwardedPoints && !p.isGrounded && p.vy > -5) {
        const dx = Math.abs(p.x - b.x);
        const dy = b.y - p.y;
        if (dx < 32 && dy > 2 && dy < 85) {
          b.hasAwardedPoints = true;

          if (this.selectedChar === 'daddy') {
            // DADDY TOOTS WHEN HE JUMPS OVER THE BARRELS!
            this.score += 150;
            this.updateHUD();
            window.soundEngine.playToot();
            this.spawnTootPuff(p.x - p.facing * 14, p.y + 8);
            this.spawnScorePopup(b.x, b.y - 25, 'TOOT! 💨 +150', '#a3e635', 20);
          } else {
            this.score += 100;
            this.updateHUD();
            window.soundEngine.playJumpOverBarrel();
            this.spawnScorePopup(b.x, b.y - 25, '+100!', '#ffea00');
            this.spawnStarBurst(b.x, b.y, '#ffd700', 8);
          }
        }
      }

      // Check collision with player or Hammer Smash!
      const dist = Math.hypot(p.x - b.x, (p.y + 1) - b.y);

      // HAMMER SMASH: If player has active Hammer, SMASH the barrel to bits!
      if (p.hammerTimer > 0 && dist < b.radius + p.width * 0.7 + 22) {
        window.soundEngine.playHammerSmash();
        this.spawnBarrelSplinters(b.x, b.y, b.type);
        this.barrels.splice(i, 1);

        if (this.selectedChar === 'daddy') {
          this.score += 350;
          this.updateHUD();
          window.soundEngine.playToot();
          this.spawnTootPuff(p.x - p.facing * 14, p.y + 8);
          this.spawnScorePopup(b.x, b.y - 18, 'DADDY SMASH! 🔨💨 +350', '#a3e635', 22);
        } else {
          this.score += 300;
          this.updateHUD();
          this.spawnScorePopup(b.x, b.y - 18, 'HAMMER SMASH! 🔨 +300', '#ffd700', 22);
        }
        continue;
      }

      // Player collision: tighter hitbox (b.radius * 0.62 + p.width * 0.32) makes it easy to jump cleanly over!
      if (dist < b.radius * 0.62 + p.width * 0.32) {
        // Player has Bubble Shield active: pop the barrel!
        if (p.shieldTimer > 0) {
          window.soundEngine.playBubblePop();
          this.spawnScorePopup(b.x, b.y, 'POPPED! +200', '#ff80bf');
          this.spawnBubbleBurst(b.x, b.y);
          this.score += 200;
          this.updateHUD();
          this.barrels.splice(i, 1);
          continue;
        }

        // Hurt player (if not in invulnerability frames)
        if (p.invulnerableTimer <= 0) {
          this.playerHit();
        }
      }

      // Remove barrels that rolled or fell off the screen
      if (b.y > this.height + 40 || b.x < -35 || b.x > this.width + 35) {
        this.barrels.splice(i, 1);
      }
    }
  }

  playerHit() {
    const p = this.player;
    this.lives--;
    this.updateHUD();
    window.soundEngine.playHurt();
    p.invulnerableTimer = 2.4; // 2.4s grace period
    this.spawnScorePopup(p.x, p.y - 30, 'OUCH!', '#ff3366');

    // Slight knockback bounce
    p.vy = -5;
    p.vx = p.facing * -3;

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  updateItems(dt) {
    const p = this.player;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const dist = Math.hypot(p.x - item.x, p.y - item.y);

      if (dist < 26) {
        if (item.type === 'gem') {
          this.score += item.value || 100;
          window.soundEngine.playGem();
          this.spawnScorePopup(item.x, item.y, `+${item.value}!`, '#00f0ff');
          this.spawnStarBurst(item.x, item.y, '#00f0ff', 10);
        } else if (item.type === 'heart') {
          this.lives = Math.min(this.lives + 1, 3);
          window.soundEngine.playGem();
          this.spawnScorePopup(item.x, item.y, '+1 HEART!', '#ff2a6d');
        } else if (item.type === 'wand') {
          p.shieldTimer = 10; // 10 seconds of bubble shield
          window.soundEngine.playPowerup();
          this.spawnScorePopup(item.x, item.y, 'BUBBLE SHIELD!', '#ff80bf', 20);
        } else if (item.type === 'boots') {
          p.springTimer = 10; // 10 seconds of spring boots
          window.soundEngine.playPowerup();
          this.spawnScorePopup(item.x, item.y, 'SPRING BOOTS!', '#ffea00', 20);
        } else if (item.type === 'hammer') {
          p.hammerTimer = 12; // 12 seconds of Hammer Time!
          window.soundEngine.playPowerup();
          this.spawnScorePopup(item.x, item.y, 'HAMMER TIME! 🔨', '#ffd700', 22);
          this.spawnStarBurst(item.x, item.y, '#ffd700', 14);
        }

        this.updateHUD();
        this.items.splice(i, 1);
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += (p.vx || 0);
      p.y += (p.vy || 0);
      if (p.rotation !== undefined) p.rotation += (p.vRot || 0);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkVictory() {
    const p = this.player;
    const g = this.goal;

    const dist = Math.hypot(p.x - g.x, p.y - g.y);
    if (dist < 38) {
      this.levelClear();
    }
  }

  levelClear() {
    this.state = 'LEVEL_CLEAR';
    window.soundEngine.pauseMusic(); // Pause without resetting currentTime so next level continues song!
    window.soundEngine.playWin();

    // Bonus points
    const timeBonus = 500;
    const lifeBonus = this.lives * 250;
    this.score += timeBonus + lifeBonus;
    this.updateHUD();

    // Confetti celebration
    this.spawnConfettiBurst();

    // Show Win Screen Modal
    const winScreen = document.getElementById('win-screen');
    const winTitle = document.getElementById('win-title');
    const winMsg = document.getElementById('win-msg');
    const nextBtn = document.getElementById('btn-next-level');

    if (this.level < this.maxLevels) {
      winTitle.innerText = `🎉 LEVEL ${this.level} COMPLETE! 🎉`;
      const nextArea = this.level === 1 ? 'Misty Cascade River Ridge' : 'High Cascade Mountain Pass';
      winMsg.innerText = `You rescued the ${this.goal.petType}! Ready to hike into the ${nextArea}?`;
      nextBtn.innerText = 'NEXT LEVEL ❯';
      nextBtn.onclick = () => this.startGame(this.level + 1, { resume: true });
    } else {
      winTitle.innerText = '🎉 YOU BEAT THE GAME! 🎉';
      winMsg.innerText = `Congratulations! You conquered the High Cascade Mountain Pass and rescued everyone! You are the Oregon Mountain Hero!`;
      nextBtn.innerText = 'PLAY AGAIN ↺';
      nextBtn.onclick = () => this.startGame(1, { resume: true });
    }

    if (winScreen) {
      winScreen.classList.remove('hidden');
      if (winScreen.style) {
        if (winScreen.style.removeProperty) winScreen.style.removeProperty('display');
        else winScreen.style.display = '';
      }
    }
  }

  gameOver() {
    this.state = 'GAME_OVER';
    window.soundEngine.stopMusic();

    const overScreen = document.getElementById('game-over-screen');
    if (overScreen) {
      overScreen.classList.remove('hidden');
      if (overScreen.style) {
        if (overScreen.style.removeProperty) overScreen.style.removeProperty('display');
        else overScreen.style.display = '';
      }
    }
    const scoreText = document.getElementById('final-score-text');
    if (scoreText) scoreText.innerText = `Final Score: ${this.score}`;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  goToHomeScreen() {
    this.state = 'MENU';
    window.soundEngine.pauseMusic();
    this.barrels = [];
    this.particles = [];
    if (this.player) {
      this.player.x = 80;
      this.player.y = 575;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isClimbing = false;
      this.player.hammerTimer = 0;
      this.player.shieldTimer = 0;
    }
    const startScreen = document.getElementById('start-screen');
    const winScreen = document.getElementById('win-screen');
    const overScreen = document.getElementById('game-over-screen');
    if (startScreen) {
      startScreen.classList.remove('hidden');
      if (startScreen.style) {
        if (startScreen.style.removeProperty) startScreen.style.removeProperty('display');
        else startScreen.style.display = '';
      }
    }
    if (winScreen) {
      winScreen.classList.add('hidden');
      if (winScreen.style) {
        if (winScreen.style.setProperty) winScreen.style.setProperty('display', 'none', 'important');
        else winScreen.style.display = 'none';
      }
    }
    if (overScreen) {
      overScreen.classList.add('hidden');
      if (overScreen.style) {
        if (overScreen.style.setProperty) overScreen.style.setProperty('display', 'none', 'important');
        else overScreen.style.display = 'none';
      }
    }
    this.updateHUD();
    if (window.heroPreview && typeof window.heroPreview.syncFromDOM === 'function') {
      window.heroPreview.syncFromDOM();
    }
  }

  // --- PARTICLE GENERATORS ---
  spawnJumpDust(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        radius: 3 + Math.random() * 3,
        color: 'rgba(255, 255, 255, 0.7)',
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  spawnStarBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        type: 'star',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5 + Math.random() * 3,
        color: color,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  spawnBubbleBurst(x, y) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        type: 'bubble',
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -1.5 - Math.random() * 2,
        radius: 7 + Math.random() * 6,
        life: 0.7,
        maxLife: 0.7
      });
    }
  }

  spawnTootPuff(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        type: 'toot',
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 8,
        vx: -this.player.facing * (1.2 + Math.random() * 2.2),
        vy: -0.4 - Math.random() * 1.2,
        radius: 8 + Math.random() * 6,
        color: i % 2 === 0 ? 'rgba(165, 235, 75, 0.8)' : 'rgba(215, 245, 120, 0.75)',
        life: 0.9,
        maxLife: 0.9
      });
    }
  }

  spawnBarrelSplinters(x, y, type) {
    const count = 16;
    const colors = type === 'watermelon'
      ? ['#2db84d', '#146627', '#ff3366', '#ffffff']
      : (type === 'candy' ? ['#ff2b5f', '#ffffff', '#ffd700'] : ['#8b5324', '#c68a4c', '#532e0e', '#d4ad7b']);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      this.particles.push({
        type: 'splinter',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  spawnScorePopup(x, y, text, color = '#ffea00', size = 18) {
    this.particles.push({
      type: 'text',
      x: x,
      y: y,
      text: text,
      color: color,
      size: size,
      vx: 0,
      vy: -1.2,
      life: 0.85,
      maxLife: 0.85
    });
  }

  spawnConfettiBurst() {
    const colors = ['#ff4f84', '#ffea00', '#00f0ff', '#a05bff', '#ff9900', '#5aff82'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        type: 'confetti',
        x: this.width / 2 + (Math.random() - 0.5) * 300,
        y: this.height / 3 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 9,
        vy: -4 - Math.random() * 8,
        vRot: (Math.random() - 0.5) * 0.2,
        rotation: Math.random() * Math.PI,
        size: 7 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 3.5,
        maxLife: 3.5
      });
    }
  }

  updateHUD() {
    // Score & Highscore
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('girlsGame_highScore', this.highScore.toString());
    }

    const scoreEl = document.getElementById('hud-score');
    const highScoreEl = document.getElementById('hud-high-score');
    const levelEl = document.getElementById('hud-level');
    const heartsEl = document.getElementById('hud-hearts');

    if (scoreEl) scoreEl.innerText = this.score;
    if (highScoreEl) highScoreEl.innerText = this.highScore;
    if (levelEl) {
      const levelNames = {
        1: '1: Oregon Woods 🌲',
        2: '2: Cascade River 🌊',
        3: '3: Mountain Pass 🏔️'
      };
      levelEl.innerText = `LEVEL ${levelNames[this.level] || this.level}`;
    }

    if (heartsEl) {
      let heartsHtml = '';
      for (let i = 0; i < 3; i++) {
        heartsHtml += i < this.lives ? '❤️ ' : '🖤 ';
      }
      heartsEl.innerHTML = heartsHtml;
    }
  }

  // --- RENDERING ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.renderBackground(ctx);

    // Platforms & Hills
    for (const plat of this.platforms) {
      try { window.Sprites.drawPlatform(ctx, plat); } catch (e) { console.error('drawPlatform error:', e); }
    }

    // Ladders
    for (const ladder of this.ladders) {
      try { window.Sprites.drawLadder(ctx, ladder); } catch (e) { console.error('drawLadder error:', e); }
    }

    // Collectibles & Power-ups
    for (const item of this.items) {
      try { window.Sprites.drawItem(ctx, item); } catch (e) { console.error('drawItem error:', e); }
    }

    // Goal Pet
    if (this.goal) {
      try { window.Sprites.drawGoalPet(ctx, this.goal); } catch (e) { console.error('drawGoalPet error:', e); }
    }

    // Mountain Guardian Boss
    if (this.boss) {
      try { window.Sprites.drawBoss(ctx, this.boss); } catch (e) { console.error('drawBoss error:', e); }
    }

    // Rolling Barrels
    for (const barrel of this.barrels) {
      try { window.Sprites.drawBarrel(ctx, barrel); } catch (e) { console.error('drawBarrel error:', e); }
    }

    // Player
    if (this.player) {
      try { window.Sprites.drawPlayer(ctx, this.player); } catch (e) { console.error('drawPlayer error:', e); }
    }

    // Particles & Popups
    try { window.Sprites.drawParticles(ctx, this.particles); } catch (e) { console.error('drawParticles error:', e); }

    // Pause Overlay
    if (this.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = 'bold 36px "Fredoka", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    }
  }

  renderBackground(ctx) {
    const isMenu = (this.state === 'MENU');
    const bg = isMenu ? (this.bgImages['home'] || this.bgImages[1]) : this.bgImages[this.level];
    if (bg && bg.complete && bg.naturalWidth > 0) {
      // Draw photographic Sackboy / Unravel 2 macro diorama image
      ctx.drawImage(bg, 0, 0, this.width, this.height);

      // Subtle atmospheric depth grading for gameplay clarity
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, this.width, this.height);

      // Dreamy soft vignette around edges
      const vig = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.width * 0.35,
        this.width / 2, this.height / 2, this.width * 0.72
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.48)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // Clean fallback forest gradient if image still loading
      let grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#10231b');
      grad.addColorStop(0.6, '#091510');
      grad.addColorStop(1, '#050a08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Ambient floating fireflies / luminous spores (Sackboy & Unravel magic!)
    const t = Date.now() * 0.002;
    for (const p of this.ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      const glow = (Math.sin(t + p.phase) + 1) * 0.5 * 0.55 + 0.25;
      const fireflyColor = this.level === 3 ? `rgba(180, 240, 255, ${glow})` : (this.level === 2 ? `rgba(255, 235, 150, ${glow})` : `rgba(255, 255, 180, ${glow})`);

      ctx.fillStyle = fireflyColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow aura around firefly
      ctx.fillStyle = this.level === 3 ? `rgba(160, 220, 255, ${glow * 0.3})` : `rgba(255, 240, 160, ${glow * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

window.Game = Game;

function initGame() {
  if (!window.game && typeof document !== 'undefined' && document.getElementById('gameCanvas')) {
    window.game = new Game();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
}
