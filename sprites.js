// Canvas Vector Sprite Renderer
// Crisp, scalable, colorful vector art for characters, obstacles, and effects

// Universal Canvas roundRect polyfill for complete cross-browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    if (typeof radii === 'number') radii = [radii, radii, radii, radii];
    if (Array.isArray(radii) && radii.length === 1) radii = [radii[0], radii[0], radii[0], radii[0]];
    const r = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, (radii && radii[0]) || 0);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const Sprites = {
  // Draw the player character with fluid animations and rich handcrafted details
  // Supports both drawPlayer(ctx, player) and drawPlayer(ctx, x, y, w, h, player)
  drawPlayer(ctx, player, argY, argW, argH, extra) {
    if (typeof player === 'number') {
      const x = player;
      player = Object.assign({}, extra || {}, {
        x: x,
        y: typeof argY === 'number' ? argY : 0,
        width: typeof argW === 'number' ? argW : (extra?.width || 20),
        height: typeof argH === 'number' ? argH : (extra?.height || 30)
      });
    }
    if (!player) return;

    ctx.save();
    ctx.translate(player.x || 0, player.y || 0);

    // Fluid slope lean and dynamic tilt!
    if (player.tiltAngle) {
      ctx.rotate(player.tiltAngle);
    }

    // Fluid squash and stretch!
    const sx = (player.scaleX || 1) * (player.facing === -1 ? -1 : 1);
    const sy = player.scaleY || 1;
    ctx.scale(sx, sy);

    // Invulnerability flashing
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    const w = player.width || (player.customization?.type === 'daddy' ? 24 : 20);
    const h = player.height || (player.customization?.type === 'daddy' ? 34 : 30);
    const skinColor = player.customization?.skin || '#ffdfbf';
    const outfitColor = player.customization?.outfit || '#ff4f84';
    const pantsColor = player.customization?.pants || '#3a7bd5';
    const charType = player.customization?.type || 'ilianna';
    const isDaddy = charType === 'daddy';
    const hairStyle = player.customization?.hairStyle || 'classic';
    const clothingStyle = player.customization?.clothingStyle || 'adventurer';
    const eyeType = player.customization?.eyeType || (charType === 'ilianna' ? 'sapphire' : (charType === 'ava' ? 'emerald' : (charType === 'mommy' ? 'violet' : 'sapphire')));

    const isRunning = player.isGrounded && Math.abs(player.vx) > 0.5 && !player.isClimbing;
    const isJumping = !player.isGrounded && !player.isClimbing;
    const isClimbing = player.isClimbing;

    // Run cycle animation bob
    const bobSpeed = isDaddy ? 11 : 14;
    const runCycle = Math.sin(player.animTimer * bobSpeed);
    const legCycle = Math.sin(player.animTimer * bobSpeed);
    const yBob = isRunning ? Math.abs(runCycle) * (isDaddy ? 4.5 : 3.2) : (isClimbing ? Math.sin(player.animTimer * 12) * 2 : 0);

    // Soft drop shadow on ground
    if (player.isGrounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, h / 2, isDaddy ? w * 0.58 : w * 0.44, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Bubble Shield if active
    if (player.shieldTimer > 0) {
      ctx.save();
      const shieldPulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
      const r = (isDaddy ? w * 0.98 : w * 0.88) * shieldPulse;
      const grad = ctx.createRadialGradient(0, -h * 0.1, r * 0.35, 0, -h * 0.1, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(0.65, 'rgba(120, 220, 255, 0.45)');
      grad.addColorStop(1, 'rgba(255, 130, 220, 0.85)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -h * 0.1, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shield sparkles
      ctx.fillStyle = '#ffffff';
      const sparkAngle = (Date.now() * 0.003) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(Math.cos(sparkAngle) * r * 0.9, -h * 0.1 + Math.sin(sparkAngle) * r * 0.9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Determine pants color and styling
    let activePantsColor = pantsColor;
    if (isDaddy) {
      if (clothingStyle === 'sweat_pants') {
        activePantsColor = '#8e9aaf'; // Heather athletic gray sweatpants
      } else if (clothingStyle === 'cargo_pants') {
        activePantsColor = '#588157'; // Olive outdoor cargo pants
      } else if (clothingStyle === 'work_flannel') {
        activePantsColor = '#1d3557'; // Dark heavy work dungarees
      } else {
        activePantsColor = '#2b4c7e'; // Classic indigo blue jeans
      }
    }

    // --- LEGS & SHOES WITH ARTICULATION ---
    ctx.fillStyle = activePantsColor;
    const legW = isDaddy ? 8 : 6;
    const legH = 13;

    if (isClimbing) {
      const cLeg = Math.sin(player.animTimer * 12);
      ctx.fillRect(-legW - 2, h / 2 - legH + (cLeg > 0 ? -4 : 2), legW, legH);
      ctx.fillRect(2, h / 2 - legH + (cLeg > 0 ? 2 : -4), legW, legH);
    } else if (isJumping) {
      ctx.fillRect(-legW - 1, h / 2 - legH - 2, legW, legH - 2);
      ctx.fillRect(1, h / 2 - legH - 4, legW, legH - 2);
    } else if (isRunning) {
      ctx.fillRect(-legW - 1 + legCycle * 5.5, h / 2 - legH - yBob, legW, legH);
      ctx.fillRect(1 - legCycle * 5.5, h / 2 - legH - yBob, legW, legH);
    } else {
      ctx.fillRect(-legW - 1, h / 2 - legH, legW, legH);
      ctx.fillRect(1, h / 2 - legH, legW, legH);
    }

    // Boy pants details for Daddy
    if (isDaddy) {
      if (clothingStyle === 'blue_jeans' || !clothingStyle) {
        // Gold contrast seam stitching on blue jeans
        ctx.strokeStyle = '#e0a96d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-legW - 1, h / 2 - legH + 2);
        ctx.lineTo(-legW - 1, h / 2 - 2);
        ctx.moveTo(1 + legW, h / 2 - legH + 2);
        ctx.lineTo(1 + legW, h / 2 - 2);
        ctx.stroke();
      } else if (clothingStyle === 'sweat_pants') {
        // Elastic ribbed cuffs
        ctx.fillStyle = '#6c757d';
        ctx.fillRect(-legW - 1, h / 2 - 4, legW, 2);
        ctx.fillRect(1, h / 2 - 4, legW, 2);
      } else if (clothingStyle === 'cargo_pants') {
        // Cargo flap pocket on sides
        ctx.fillStyle = '#47624b';
        ctx.fillRect(-legW - 2, h / 2 - legH + 4, 3, 5);
        ctx.fillRect(legW, h / 2 - legH + 4, 3, 5);
      }
    }

    // Footwear: Detailed shoes / boots (Daddy gets white dad sneakers)
    ctx.fillStyle = player.springTimer > 0 ? '#ffea00' : (isDaddy ? '#f8f9fa' : '#ffffff');
    if (isClimbing) {
      const cLeg = Math.sin(player.animTimer * 12);
      ctx.fillRect(-legW - 3, h / 2 - 3 + (cLeg > 0 ? -4 : 2), legW + 2, 5);
      ctx.fillRect(1, h / 2 - 3 + (cLeg > 0 ? 2 : -4), legW + 2, 5);
    } else if (isJumping) {
      // Athletic jumping tuck: tuck feet up by 2 to 4 pixels for maximum clearance!
      ctx.fillRect(-legW - 3, h / 2 - 5, legW + 2, 5);
      ctx.fillRect(1, h / 2 - 7, legW + 2, 5);
    } else if (isRunning) {
      ctx.fillRect(-legW - 3 + legCycle * 5.5, h / 2 - 3 - yBob, legW + 3, 5);
      ctx.fillRect(0 - legCycle * 5.5, h / 2 - 3 - yBob, legW + 3, 5);
    } else {
      ctx.fillRect(-legW - 3, h / 2 - 3, legW + 2, 5);
      ctx.fillRect(1, h / 2 - 3, legW + 2, 5);
    }

    // Shoe laces / runner stripes
    ctx.fillStyle = isDaddy ? '#1d4ed8' : (charType === 'ilianna' ? '#ffd700' : '#ff2a6d');
    const laceY = isJumping ? h / 2 - 6 : (h / 2 - 4 - yBob);
    ctx.fillRect(-legW - 1, laceY, 2, 2);
    ctx.fillRect(3, isJumping ? laceY - 2 : laceY, 2, 2);

    // Spring boots wings
    if (player.springTimer > 0) {
      ctx.fillStyle = '#fffbe6';
      ctx.beginPath();
      ctx.ellipse(-legW - 5, isJumping ? h / 2 - 6 : h / 2 - 4, 5, 2.5, -0.3, 0, Math.PI * 2);
      ctx.ellipse(legW + 5, isJumping ? h / 2 - 8 : h / 2 - 4, 5, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- BODY / SHIRT & BELLY ---
    const bodyY = -h * 0.15 - yBob;

    if (isDaddy) {
      // DADDY: Round, jiggly dad belly with spring inertia!
      const bellySpring = Math.max(-2.5, Math.min(2.5, player.bellyOffset || 0));

      // Dad body base with realistic fabric gradient
      const torsoGrad = ctx.createLinearGradient(-w * 0.45, bodyY, w * 0.45, bodyY + h * 0.45);
      torsoGrad.addColorStop(0, outfitColor);
      torsoGrad.addColorStop(1, '#1b3456');
      ctx.fillStyle = torsoGrad;
      ctx.beginPath();
      ctx.roundRect(-w * 0.44, bodyY, w * 0.88, h * 0.45, 10);
      ctx.fill();

      // Big round belly that jiggles!
      const bellyGrad = ctx.createRadialGradient(4, bodyY + 11 + bellySpring, 2, 4, bodyY + 11 + bellySpring, 16);
      bellyGrad.addColorStop(0, '#ffffff');
      bellyGrad.addColorStop(0.35, outfitColor);
      bellyGrad.addColorStop(1, '#15263f');
      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.ellipse(3, bodyY + 11 + bellySpring, w * 0.48, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // BOY CLOTHES FOR DADDY (Blue Jeans & Polo, Sweat Pants & Tee, Cargo Pants & Vest, Work Flannel)
      if (clothingStyle === 'sweat_pants') {
        // Casual Athletic Sweatshirt & Cozy Tee in outfitColor
        // Soft ribbed crewneck collar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, bodyY + 3, 5, 0, Math.PI);
        ctx.fill();

        // Drawstring bow on elastic waistband
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(-2.5, bodyY + h * 0.42, 2.2, 0, Math.PI * 2);
        ctx.arc(2.5, bodyY + h * 0.42, 2.2, 0, Math.PI * 2);
        ctx.moveTo(0, bodyY + h * 0.42);
        ctx.lineTo(-2.5, bodyY + h * 0.42 + 6);
        ctx.moveTo(0, bodyY + h * 0.42);
        ctx.lineTo(2.5, bodyY + h * 0.42 + 6);
        ctx.stroke();

      } else if (clothingStyle === 'cargo_pants') {
        // Outdoor Expedition Cargo Vest over Polo
        ctx.fillStyle = '#4a5b48'; // Sturdy outdoor olive vest
        ctx.beginPath();
        ctx.roundRect(-w * 0.45, bodyY + 1, w * 0.38, h * 0.42, 3);
        ctx.roundRect(w * 0.07, bodyY + 1, w * 0.38, h * 0.42, 3);
        ctx.fill();

        // Dual cargo pockets with snap flaps
        ctx.fillStyle = '#374536';
        ctx.fillRect(-w * 0.40, bodyY + 7, w * 0.28, 6);
        ctx.fillRect(w * 0.12, bodyY + 7, w * 0.28, 6);
        ctx.fillStyle = '#ffd700'; // brass snap buttons
        ctx.beginPath();
        ctx.arc(-w * 0.26, bodyY + 10, 1.2, 0, Math.PI * 2);
        ctx.arc(w * 0.26, bodyY + 10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Heavy front zipper
        ctx.strokeStyle = '#c68b59';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, bodyY + 1);
        ctx.lineTo(0, bodyY + h * 0.42);
        ctx.stroke();

        // Polo collar underneath
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-5, bodyY);
        ctx.lineTo(0, bodyY + 5);
        ctx.lineTo(5, bodyY);
        ctx.closePath();
        ctx.fill();

        // Heavy webbing outdoor belt
        ctx.fillStyle = '#283618';
        ctx.fillRect(-w * 0.38, bodyY + h * 0.42, w * 0.76, 4);
        ctx.fillStyle = '#dda15e';
        ctx.fillRect(-3, bodyY + h * 0.42 - 1, 6, 6);

      } else if (clothingStyle === 'work_flannel') {
        // Classic Oregon Lumberjack Buffalo Plaid Flannel Shirt!
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(-w * 0.44, bodyY, w * 0.88, h * 0.45, 10);
        ctx.clip();
        ctx.fillStyle = 'rgba(20, 20, 20, 0.45)';
        for (let fx = -w * 0.44; fx < w * 0.44; fx += 6.5) {
          ctx.fillRect(fx, bodyY, 3.2, h * 0.45);
        }
        for (let fy = bodyY; fy < bodyY + h * 0.45; fy += 6.5) {
          ctx.fillRect(-w * 0.44, fy, w * 0.88, 3.2);
        }
        ctx.restore();

        // Dual buttoned flannel chest pockets
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(-w * 0.36, bodyY + 5, w * 0.24, 6);
        ctx.fillRect(w * 0.12, bodyY + 5, w * 0.24, 6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-w * 0.24, bodyY + 8, 1, 0, Math.PI * 2);
        ctx.arc(w * 0.24, bodyY + 8, 1, 0, Math.PI * 2);
        ctx.fill();

        // Flannel collar
        ctx.fillStyle = '#2b2d42';
        ctx.beginPath();
        ctx.moveTo(-6, bodyY);
        ctx.lineTo(-1, bodyY + 6);
        ctx.lineTo(1, bodyY + 6);
        ctx.lineTo(6, bodyY);
        ctx.closePath();
        ctx.fill();

        // Heavy work belt & steel hammer loop
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(-w * 0.4, bodyY + h * 0.41, w * 0.8, 5);
        ctx.fillStyle = '#c08a3e';
        ctx.fillRect(-4, bodyY + h * 0.41 - 1, 8, 7);
        // Steel hammer loop on hip
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(w * 0.22, bodyY + h * 0.41, 4, 8);

      } else {
        // Classic Blue Jeans & Dad Polo (default)
        // Dad polo collar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-6, bodyY);
        ctx.lineTo(0, bodyY + 7);
        ctx.lineTo(6, bodyY);
        ctx.closePath();
        ctx.fill();

        // Placket & buttons stretched tight over the tummy
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(0, bodyY + 10 + bellySpring * 0.5, 1.8, 0, Math.PI * 2);
        ctx.arc(1, bodyY + 16 + bellySpring * 0.8, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Brown leather dad belt with golden buckle
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-w * 0.35, bodyY + h * 0.42, w * 0.7, 4);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-3, bodyY + h * 0.42 - 1, 6, 6);
      }

    } else {
      // ILIANNA, AVA, MOMMY: Detailed, tailored outfits with Hyper-Realistic Style Variations!
      const outfitGrad = ctx.createLinearGradient(-w * 0.3, bodyY, w * 0.3, bodyY + h * 0.42);
      outfitGrad.addColorStop(0, outfitColor);
      outfitGrad.addColorStop(1, '#66122d');
      ctx.fillStyle = outfitGrad;
      ctx.beginPath();
      ctx.roundRect(-w * 0.32, bodyY, w * 0.64, h * 0.42, 7);
      ctx.fill();

      // Hyper-Realistic Clothing Styles
      if (clothingStyle === 'royal_tunic') {
        // Royal velvet sheen overlay
        const sheen = ctx.createLinearGradient(-w * 0.3, bodyY, w * 0.3, bodyY);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        sheen.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
        sheen.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = sheen;
        ctx.beginPath();
        ctx.roundRect(-w * 0.32, bodyY, w * 0.64, h * 0.42, 7);
        ctx.fill();

        // Shimmering gold filigree hem & collar embroidery
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-w * 0.3, bodyY + h * 0.4);
        ctx.lineTo(w * 0.3, bodyY + h * 0.4);
        ctx.moveTo(-w * 0.25, bodyY + 2);
        ctx.lineTo(w * 0.25, bodyY + 2);
        ctx.stroke();

        // Royal Diagonal Satin Sash with gold tassels
        ctx.fillStyle = '#7209b7';
        ctx.beginPath();
        ctx.moveTo(-w * 0.28, bodyY + 2);
        ctx.lineTo(-w * 0.1, bodyY + 2);
        ctx.lineTo(w * 0.28, bodyY + h * 0.38);
        ctx.lineTo(w * 0.12, bodyY + h * 0.38);
        ctx.closePath();
        ctx.fill();

        // Gold tassel at hip
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(w * 0.18, bodyY + h * 0.38, 4, 5);

      } else if (clothingStyle === 'explorer_vest') {
        // Multi-pocket canvas expedition vest
        ctx.fillStyle = 'rgba(240, 240, 245, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-w * 0.32, bodyY, w * 0.28, h * 0.42, 4);
        ctx.roundRect(w * 0.04, bodyY, w * 0.28, h * 0.42, 4);
        ctx.fill();

        // Brass zipper teeth
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, bodyY);
        ctx.lineTo(0, bodyY + h * 0.4);
        ctx.stroke();

        // Cargo flap pockets with snap buttons
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(-w * 0.28, bodyY + h * 0.22, 6, 5);
        ctx.fillRect(w * 0.12, bodyY + h * 0.22, 6, 5);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-w * 0.28 + 3, bodyY + h * 0.24, 0.9, 0, Math.PI * 2);
        ctx.arc(w * 0.12 + 3, bodyY + h * 0.24, 0.9, 0, Math.PI * 2);
        ctx.fill();

      } else if (clothingStyle === 'forest_cloak') {
        // Draped Oregon wool cowl around shoulders
        ctx.fillStyle = '#1b4332';
        ctx.beginPath();
        ctx.ellipse(0, bodyY + 4, w * 0.36, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cascading cape back with dynamic motion
        const capeWave = (isRunning ? Math.sin(player.animTimer * 14) * 4 : 0) + (player.hairSway || 0) * 8;
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.moveTo(-w * 0.32, bodyY + 4);
        ctx.quadraticCurveTo(-w * 0.45 - capeWave, bodyY + h * 0.3, -w * 0.28 - capeWave, bodyY + h * 0.44);
        ctx.lineTo(-w * 0.15, bodyY + h * 0.38);
        ctx.closePath();
        ctx.fill();

        // Carved bronze Oregon pine/leaf pin
        ctx.fillStyle = '#cd7f32';
        ctx.beginPath();
        ctx.ellipse(-w * 0.15, bodyY + 5, 2.5, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Adventurer Style: Rugged cross-body leather harness & belt
        ctx.strokeStyle = '#5a3d28';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.26, bodyY + 2);
        ctx.lineTo(w * 0.22, bodyY + h * 0.38);
        ctx.stroke();

        // Brass ring buckle
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, bodyY + 9, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3d28';
        ctx.beginPath();
        ctx.arc(0, bodyY + 9, 1, 0, Math.PI * 2);
        ctx.fill();

        // Adventure belt with pouch
        ctx.fillStyle = '#4a2810';
        ctx.fillRect(-w * 0.3, bodyY + h * 0.38, w * 0.6, 3);
        ctx.fillRect(w * 0.18, bodyY + h * 0.35, 4, 5); // Mini pouch
      }

      // Character-specific emblems & fine jewelry
      if (charType === 'ilianna') {
        // Princess Golden Star Sapphire Brooch
        ctx.fillStyle = '#ffd700';
        Sprites.drawStar(ctx, 0, bodyY + 7, 5, 2.5, 5);
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, bodyY + 7, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (charType === 'ava') {
        // Sweet Sparkle Heart Brooch
        ctx.fillStyle = '#ff2a6d';
        Sprites.drawHeart(ctx, 0, bodyY + 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, bodyY + 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mommy Pearl Necklace
        ctx.fillStyle = '#ffffff';
        for (let i = -5; i <= 5; i += 2.5) {
          ctx.beginPath();
          ctx.arc(i, bodyY + 4 + Math.abs(i) * 0.4, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- ARMS & WEAPONS ---
    ctx.fillStyle = skinColor;
    const armW = isDaddy ? 6.5 : 5;
    if (isClimbing) {
      const cArm = Math.sin(player.animTimer * 12);
      ctx.fillRect(-w * 0.46, bodyY - 6 + (cArm > 0 ? 6 : -4), armW, 12);
      ctx.fillRect(w * 0.32, bodyY - 6 + (cArm > 0 ? -4 : 6), armW, 12);
    } else if (isJumping) {
      ctx.fillRect(-w * 0.48, bodyY - 8, armW, 12);
      ctx.fillRect(w * 0.34, bodyY - 8, armW, 12);
    } else if (isRunning) {
      ctx.fillRect(-w * 0.45 - legCycle * 4.5, bodyY + 3, armW, 11);
      ctx.fillRect(w * 0.32 + legCycle * 4.5, bodyY + 3, armW, 11);
    } else {
      ctx.fillRect(-w * 0.42, bodyY + 3, armW, 11);
      ctx.fillRect(w * 0.3, bodyY + 3, armW, 11);
    }

    // --- HAMMER WEAPON (IF ACTIVE) ---
    if (player.hammerTimer > 0) {
      const hammerSwing = Math.sin(Date.now() * 0.02) * 1.1;
      ctx.save();
      ctx.translate(w * 0.28, bodyY + 5);
      ctx.rotate(hammerSwing);

      // Wooden handle
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(-2.5, -28, 5, 30);
      ctx.strokeStyle = '#5a3d0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2.5, -28, 5, 30);

      // Heavy Mallet Head
      const malletGrad = ctx.createLinearGradient(-13, -40, 13, -26);
      malletGrad.addColorStop(0, '#664a33');
      malletGrad.addColorStop(0.5, '#8c6647');
      malletGrad.addColorStop(1, '#3b2819');
      ctx.fillStyle = malletGrad;
      ctx.beginPath();
      ctx.roundRect(-13, -42, 26, 16, 3);
      ctx.fill();

      // Steel reinforcement bands
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-13, -42, 26, 16);

      // Golden Star on Mallet
      ctx.fillStyle = '#ffea00';
      Sprites.drawStar(ctx, 0, -34, 4, 2, 5);

      ctx.restore();
    }

    // --- HEAD, FACE & HAIR SYSTEM (LAYERED: BACK HAIR -> HEAD/FACE/EYES -> FRONT HAIR/ACCESSORIES) ---
    const headY = bodyY - 14;
    const headR = isDaddy ? 12.8 : 11.5;
    const hairSway = (player.hairSway || 0) * 12;
    const hColor = player.customization?.hair || (charType === 'ilianna' ? '#e6a147' : (charType === 'ava' ? '#5c3826' : (charType === 'mommy' ? '#3a2312' : '#4a3b32')));
    const hairDark = '#3d2b1f';

    // =========================================================================
    // LAYER 1: BACK HAIR (Drawn BEHIND head so face skin is ALWAYS in front)
    // =========================================================================
    if (!isDaddy) {
      ctx.fillStyle = hColor;

      if (hairStyle === 'long_curls') {
        // Full rounded crown volume behind head
        ctx.beginPath();
        ctx.ellipse(-1, headY - 1, 14, 14.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cascading back spiral curls behind neck and shoulders
        const curlWave = (isRunning ? Math.sin(player.animTimer * 14) * 5 : 0) + hairSway;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(-12 - i * 1.5, headY + 5 + i * 5 + curlWave, 6.5, 9, 0.3, 0, Math.PI * 2);
          ctx.ellipse(9 + i * 1.5, headY + 5 + i * 5 - curlWave * 0.5, 6, 8.5, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (hairStyle === 'braids' || (hairStyle === 'classic' && charType === 'ava')) {
        // Full rounded crown volume behind head
        ctx.beginPath();
        ctx.ellipse(-1, headY - 1, 13.5, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Twin Dutch 3-strand braids cascading down behind shoulders
        const braidBob = (isRunning ? Math.sin(player.animTimer * 14) * 4.5 : 0) + hairSway;
        const drawBraid = (bx, flip) => {
          ctx.save();
          ctx.translate(bx, headY + 3 + braidBob);
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? hColor : '#7a4d33';
            ctx.beginPath();
            ctx.ellipse(flip * (i % 2 === 0 ? -1.5 : 1.5), i * 3.8, 4, 3, flip * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          // Satin ribbon bow
          ctx.fillStyle = '#ff4081';
          ctx.beginPath();
          ctx.ellipse(-3.5, 15, 4, 2.5, 0.4, 0, Math.PI * 2);
          ctx.ellipse(3.5, 15, 4, 2.5, -0.4, 0, Math.PI * 2);
          ctx.fill();
          // Ribbon tail
          ctx.strokeStyle = '#ff4081';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, 15);
          ctx.lineTo(-2, 20);
          ctx.moveTo(0, 15);
          ctx.lineTo(2, 20);
          ctx.stroke();
          ctx.restore();
        };
        drawBraid(-13, -1);
        drawBraid(12, 1);

      } else if (hairStyle === 'ponytail' || (hairStyle === 'classic' && charType === 'mommy')) {
        // Full rounded crown volume behind head
        ctx.beginPath();
        ctx.ellipse(-1, headY - 1, 13.5, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bouncing high warrior ponytail swept back behind the head
        const ponyBob = (isRunning ? Math.sin(player.animTimer * 14) * 4.5 : 0) + hairSway;
        ctx.beginPath();
        ctx.ellipse(-14, headY - 1 + ponyBob, 8, 14.5, -0.38, 0, Math.PI * 2);
        ctx.fill();

        // Metallic gold hair tie wrap
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-11, headY - 4 + ponyBob * 0.4, 3.5, 6);

      } else if (hairStyle === 'short_bob') {
        // Chic rounded bob volume behind head
        ctx.beginPath();
        ctx.ellipse(-1, headY - 1, 14, 14.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bob side curves behind jaw (never overlaps face)
        ctx.beginPath();
        ctx.ellipse(-11, headY + 4, 5.5, 9, 0.22, 0, Math.PI * 2);
        ctx.ellipse(10, headY + 4, 5, 8.5, -0.22, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Classic style (Default for Ilianna: flowing royal waves behind head)
        ctx.beginPath();
        ctx.ellipse(-2, headY - 1, 14, 14.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const wave = (isRunning ? Math.sin(player.animTimer * 14) * 6 : 0) + hairSway;
        ctx.beginPath();
        ctx.ellipse(-12, headY + 6 + wave, 8.5, 17, 0.28, 0, Math.PI * 2);
        ctx.ellipse(-7, headY + 13 + wave * 0.7, 7.5, 14, 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // =========================================================================
    // LAYER 2: HEAD & VIBRANT EXPRESSIVE FACE (Drawn on top of back hair!)
    // =========================================================================

    // Realistic skin gradient with warm subsurface illumination
    const headGrad = ctx.createRadialGradient(2, headY - 4, 2, 0, headY, headR);
    headGrad.addColorStop(0, '#fff5ea');
    headGrad.addColorStop(0.35, skinColor);
    headGrad.addColorStop(1, '#d4916a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Soft jawline ambient occlusion shadow
    ctx.fillStyle = 'rgba(100, 40, 15, 0.14)';
    ctx.beginPath();
    ctx.arc(0, headY + headR - 1, headR * 0.65, 0, Math.PI);
    ctx.fill();

    // Cute blushing cheeks with subsurface warmth
    ctx.fillStyle = isDaddy ? 'rgba(255, 120, 100, 0.4)' : 'rgba(255, 95, 135, 0.52)';
    ctx.beginPath();
    ctx.arc(-5.5, headY + 3.5, isDaddy ? 3.5 : 3, 0, Math.PI * 2);
    ctx.arc(5.5, headY + 3.5, isDaddy ? 3.5 : 3, 0, Math.PI * 2);
    ctx.fill();

    // Soft nose tip highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(6, headY + 1.2, 1, 0, Math.PI * 2);
    ctx.fill();

    // --- HYPER-REALISTIC VIBRANT EYES (LARGE, GLOWING JEWEL TONES THAT REALLY SHOW UP!) ---
    if (player.blinkTimer > 0) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#222222';
      ctx.beginPath();
      ctx.arc(3.0, headY - 1, 3.0, 0, Math.PI, false);
      ctx.arc(8.2, headY - 1, 3.0, 0, Math.PI, false);
      ctx.stroke();
    } else {
      let eyeTones;
      if (isDaddy) {
        switch (eyeType) {
          case 'dad_blue':
            eyeTones = { rim: '#075985', outer: '#0284c7', core: '#38bdf8', highlight: '#bae6fd' };
            break;
          case 'dad_hazel':
            eyeTones = { rim: '#1a2e05', outer: '#65a30d', core: '#a3e635', highlight: '#ecfccb' };
            break;
          case 'dad_gray':
            eyeTones = { rim: '#0f172a', outer: '#475569', core: '#94a3b8', highlight: '#f8fafc' };
            break;
          case 'dad_coffee':
            eyeTones = { rim: '#290e02', outer: '#78350f', core: '#d97706', highlight: '#ffedd5' };
            break;
          case 'dad_brown':
          default:
            eyeTones = { rim: '#451a03', outer: '#b45309', core: '#f59e0b', highlight: '#fde68a' };
            break;
        }
      } else {
        switch (eyeType) {
          case 'emerald':
            eyeTones = { rim: '#022c22', outer: '#059669', core: '#10b981', highlight: '#a7f3d0' };
            break;
          case 'amber':
            eyeTones = { rim: '#451a03', outer: '#d97706', core: '#f59e0b', highlight: '#fef08a' };
            break;
          case 'violet':
            eyeTones = { rim: '#3b0764', outer: '#9333ea', core: '#c084fc', highlight: '#f3e8ff' };
            break;
          case 'sparkle':
            eyeTones = { rim: '#082f49', outer: '#0284c7', core: '#38bdf8', highlight: '#ffffff' };
            break;
          case 'sapphire':
          default:
            eyeTones = { rim: '#03045e', outer: '#0077b6', core: '#00d4ff', highlight: '#caf0f8' };
            break;
        }
      }

      const drawEye = (ex, ey) => {
        // 1. Crisp white almond sclera
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
        ctx.fill();

        // 2. Bold, luminous colored iris (large and vivid so color jumps out!)
        ctx.fillStyle = eyeTones.core;
        ctx.beginPath();
        ctx.arc(ex + 0.2, ey, 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Iris rich radial depth gradient
        const irisGrad = ctx.createRadialGradient(ex + 0.2, ey, 0.4, ex + 0.2, ey, 2.6);
        irisGrad.addColorStop(0, eyeTones.highlight);
        irisGrad.addColorStop(0.45, eyeTones.core);
        irisGrad.addColorStop(1, eyeTones.outer);
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(ex + 0.2, ey, 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Sharp dark limbal ring
        ctx.strokeStyle = eyeTones.rim;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(ex + 0.2, ey, 2.6, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Crisp obsidian pupil
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath();
        ctx.arc(ex + 0.25, ey, 1.0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Primary specular catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex + 0.85, ey - 0.85, 0.9, 0, Math.PI * 2);
        ctx.fill();

        // 5. Secondary soft bounce catchlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(ex - 0.45, ey + 0.75, 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Starlight Diamond Sparkle in iris
        if (!isDaddy && eyeType === 'sparkle') {
          ctx.fillStyle = '#ffffff';
          Sprites.drawStar(ctx, ex + 0.85, ey - 0.85, 1.5, 0.5, 4);
        }
      };

      drawEye(3.0, headY - 1);
      drawEye(8.2, headY - 1);

      // Eyeliner & fine curved eyelashes for ladies
      if (!isDaddy) {
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(3.0, headY - 1.2, 3.4, 1.1 * Math.PI, 1.85 * Math.PI);
        ctx.arc(8.2, headY - 1.2, 3.4, 1.1 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2.5, headY - 3.2);
        ctx.lineTo(1.4, headY - 5.0);
        ctx.moveTo(8.5, headY - 3.2);
        ctx.lineTo(9.8, headY - 5.0);
        ctx.stroke();
      } else {
        // Daddy eye crinkles & warm laugh lines
        ctx.strokeStyle = 'rgba(90, 40, 15, 0.45)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(1.2, headY - 1.2);
        ctx.lineTo(-0.8, headY - 2.2);
        ctx.moveTo(1.2, headY - 0.2);
        ctx.lineTo(-0.8, headY + 0.6);
        ctx.moveTo(10.2, headY - 1.2);
        ctx.lineTo(12.2, headY - 2.2);
        ctx.moveTo(10.2, headY - 0.2);
        ctx.lineTo(12.2, headY + 0.6);
        ctx.stroke();
      }

      // Eyebrows (positioned cleanly above eyes)
      if (isDaddy) {
        ctx.strokeStyle = '#2d1f18';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0.8, headY - 4.5);
        ctx.quadraticCurveTo(3.2, headY - 6.0, 5.5, headY - 4.8);
        ctx.moveTo(6.5, headY - 4.8);
        ctx.quadraticCurveTo(8.8, headY - 6.0, 11.2, headY - 4.5);
        ctx.stroke();
      } else {
        const browColor = player.customization?.hair || (charType === 'mommy' ? '#2e1c12' : '#7f4f24');
        ctx.strokeStyle = browColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(1.0, headY - 4.5);
        ctx.quadraticCurveTo(3.0, headY - 5.8, 5.2, headY - 4.8);
        ctx.moveTo(6.6, headY - 4.8);
        ctx.quadraticCurveTo(8.6, headY - 5.8, 10.8, headY - 4.5);
        ctx.stroke();
      }
    }

    // Cheerful, expressive smile
    ctx.strokeStyle = '#8d3e23';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(5.5, headY + 3.2, isDaddy ? 4.5 : 3.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // ALWAYS FOR DADDY: Textured Dad Mustache
    if (isDaddy) {
      ctx.fillStyle = '#3a2b22';
      ctx.beginPath();
      ctx.ellipse(3, headY + 2.2, 5.2, 2.5, 0.15, 0, Math.PI * 2);
      ctx.ellipse(8, headY + 2.2, 5.2, 2.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Mustache bristle highlights
      ctx.strokeStyle = '#5a4336';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, headY + 2.2);
      ctx.lineTo(0, headY + 3.5);
      ctx.moveTo(8, headY + 2.2);
      ctx.lineTo(11, headY + 3.5);
      ctx.stroke();
    }

    // =========================================================================
    // LAYER 3: FOREGROUND HAIR & ACCESSORIES (Frames face, NEVER obscures it!)
    // =========================================================================
    if (isDaddy) {
      // DADDY: 100% ALL-BALD BOY HAIRSTYLES!
      if (hairStyle === 'side_tufts') {
        // 1. SIDE TUFTS: Completely bald smooth dome on top with funny puffy side tufts flaring out above the ears!
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.beginPath();
        ctx.ellipse(-1, headY - 8, 4.5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairDark;
        ctx.beginPath();
        ctx.arc(-13, headY - 2, 4, 0, Math.PI * 2);
        ctx.arc(-15, headY + 2, 4.5, 0, Math.PI * 2);
        ctx.arc(-12, headY + 5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(13, headY - 2, 4, 0, Math.PI * 2);
        ctx.arc(15, headY + 2, 4.5, 0, Math.PI * 2);
        ctx.arc(12, headY + 5, 3.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (hairStyle === 'stubble_dome') {
        // 2. STUBBLE BUZZ: Shaved head with 5 o'clock shadow buzz stubble around back and sides
        ctx.fillStyle = hairDark;
        const stubbleOffsets = [
          [-11, 0], [-10, 3], [-8, 6], [-12, -3], [-11, -6], [-9, -8],
          [10, 3], [11, 0], [11, -6], [12, -3], [9, -8]
        ];
        for (const [sx, sy] of stubbleOffsets) {
          ctx.beginPath();
          ctx.arc(sx, headY + sy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-2, headY - 7.5, 4.5, 1.8, -0.3, 0, Math.PI * 2);
        ctx.fill();

      } else if (hairStyle === 'comb_over') {
        // 3. DAD COMB-OVER: Shiny bald scalp with desperate long strands swooping across the TOP of dome!
        // Shiny dome highlight underneath
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(-1, headY - 8.5, 5, 2.2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Hair origin tuft on left side above ear
        ctx.fillStyle = hairDark;
        ctx.beginPath();
        ctx.ellipse(-11.5, headY - 5, 2.2, 3.5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 4 Desperate comb-over strands swooping across the TOP curve of the skull (WELL ABOVE EYES!)
        ctx.strokeStyle = hairDark;
        ctx.lineWidth = 1.3;
        const sway = hairSway * 0.3;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(-11, headY - 7 + i * 0.9);
          ctx.bezierCurveTo(
            -4, headY - 13 - i * 0.7 + sway,
            4, headY - 13 - i * 0.7 + sway,
            10, headY - 8 + i * 0.9
          );
          ctx.stroke();
        }

      } else if (hairStyle === 'clean_shave') {
        // 4. CLEAN SHAVE: 100% hairless mirror-buffed chrome dome!
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.ellipse(-2.5, headY - 7.8, 6, 2.6, -0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(5.2, headY - 8.5, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        Sprites.drawStar(ctx, -2, headY - 8, 3.8, 1.2, 4);
        Sprites.drawStar(ctx, 5.5, headY - 9, 2.2, 0.8, 4);

      } else {
        // 5. SHINY BALD (default): Smooth bald dome with comic sparkle twinkle & neat side tufts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.ellipse(-2, headY - 7.5, 5.5, 2.4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4.5, headY - 8.5, 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        Sprites.drawStar(ctx, 3, headY - 9, 3, 1, 4);

        ctx.fillStyle = hairDark;
        ctx.beginPath();
        ctx.ellipse(-13, headY + 1, 3.5, 5.5, 0.2, 0, Math.PI * 2);
        ctx.ellipse(13, headY + 1, 3.5, 5.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // LADIES FOREGROUND STYLING & ACCESSORIES
      ctx.fillStyle = hColor;

      // Forehead bangs (neatly framed on upper forehead, staying strictly above eyebrows at headY - 6.5)
      ctx.beginPath();
      ctx.moveTo(-9, headY - 8);
      ctx.quadraticCurveTo(0, headY - 6.2, 8, headY - 8);
      ctx.lineTo(8, headY - 12);
      ctx.quadraticCurveTo(0, headY - 13.5, -9, headY - 12);
      ctx.closePath();
      ctx.fill();

      // Hair crown sheen highlight
      ctx.strokeStyle = 'rgba(255, 245, 190, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, headY - 6, 11, Math.PI * 0.9, Math.PI * 1.45);
      ctx.stroke();

      // Style-specific accessories & clips
      if (hairStyle === 'long_curls') {
        // Delicate golden star hair clip
        ctx.fillStyle = '#ffea00';
        Sprites.drawStar(ctx, -7, headY - 8, 3.5, 1.8, 5);

      } else if (hairStyle === 'braids' || (hairStyle === 'classic' && charType === 'ava')) {
        // Golden butterfly clip
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(-5, headY - 9, 3.5, 2, 0.6, 0, Math.PI * 2);
        ctx.ellipse(-5, headY - 7, 3.5, 2, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(-5, headY - 8, 1.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (hairStyle === 'ponytail' || (hairStyle === 'classic' && charType === 'mommy')) {
        if (charType === 'mommy') {
          // Tortoiseshell sunglasses resting on forehead & crystal drop earrings
          ctx.fillStyle = '#e65100';
          ctx.beginPath();
          ctx.roundRect(-8, headY - 13, 7, 5, 2);
          ctx.roundRect(1, headY - 13, 7, 5, 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
          ctx.beginPath();
          ctx.roundRect(-7, headY - 12, 5, 3.5, 1.5);
          ctx.roundRect(2, headY - 12, 5, 3.5, 1.5);
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-1, headY - 11);
          ctx.lineTo(1, headY - 11);
          ctx.stroke();

          // Chandelier drop earrings
          const earSwing = (player.hairSway || 0) * 8;
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(10.5, headY + 4, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(10.5, headY + 4);
          ctx.lineTo(10.5 + earSwing, headY + 9);
          ctx.stroke();
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(10.5 + earSwing, headY + 9, 2, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (hairStyle === 'short_bob') {
        // Delicate side wisps framing ears (away from face)
        ctx.strokeStyle = hColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-8, headY - 6);
        ctx.lineTo(-10, headY - 1);
        ctx.moveTo(8, headY - 6);
        ctx.lineTo(10, headY - 1);
        ctx.stroke();

      } else {
        // Classic style (Princess Golden Tiara with Ruby Gem)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-7, headY - 9);
        ctx.lineTo(-5, headY - 15);
        ctx.lineTo(-2, headY - 11);
        ctx.lineTo(2, headY - 17);
        ctx.lineTo(6, headY - 11);
        ctx.lineTo(9, headY - 15);
        ctx.lineTo(11, headY - 9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center Jewels
        ctx.fillStyle = '#ff1493';
        ctx.beginPath();
        ctx.arc(2, headY - 13, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(-5, headY - 12, 1.3, 0, Math.PI * 2);
        ctx.arc(9, headY - 12, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  },

  // Helper to draw a star
  drawStar(ctx, cx, cy, outerRadius, innerRadius, points = 5) {
    ctx.save();
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / points;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < points; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  // Helper to draw a heart
  drawHeart(ctx, cx, cy, size = 10) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(cx, cy + topCurveHeight);
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx - size / 2, cy + (size + topCurveHeight) / 2, cx, cy + (size + topCurveHeight) / 2, cx, cy + size);
    ctx.bezierCurveTo(cx, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  drawBarrel(ctx, barrel) {
    ctx.save();
    ctx.translate(barrel.x, barrel.y);
    ctx.rotate(barrel.rotation);

    const r = barrel.radius;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, r + 2, r * 0.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (barrel.type === 'candy') {
      // Giant rolling peppermint swirl candy!
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff2b5f';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, (i * Math.PI) / 3, (i * Math.PI) / 3 + 0.35);
        ctx.closePath();
        ctx.fill();
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#e01948';
      ctx.stroke();
    } else if (barrel.type === 'watermelon') {
      // Giant rolling juicy striped watermelon!
      ctx.fillStyle = '#2db84d';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Dark green stripes
      ctx.fillStyle = '#146627';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.9, r * 0.3, (i * Math.PI) / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#146627';
      ctx.stroke();
    } else {
      // Classic Wooden Donkey Kong-style barrel
      // Outer rim
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#c68a4c');
      grad.addColorStop(0.7, '#8b5324');
      grad.addColorStop(1, '#532e0e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Steel hoops / bands
      ctx.strokeStyle = '#383b42';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      // Wood plank lines rotating
      ctx.strokeStyle = '#5a3314';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();

      // Steel rivets
      ctx.fillStyle = '#b0b6c2';
      const rivets = [
        { x: r * 0.72, y: 0 },
        { x: -r * 0.72, y: 0 },
        { x: 0, y: r * 0.72 },
        { x: 0, y: -r * 0.72 }
      ];
      rivets.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Outer outline
      ctx.strokeStyle = '#381f0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  },

  // Draw Handcrafted Miniature Ladder (Rustic Twine Rope & Forest Twig Rungs)
  drawLadder(ctx, ladder) {
    ctx.save();
    const { x, y, width, height } = ladder;
    const ropeW = 3.5;

    // Soft organic drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x + 2, y + 2, width, height);

    // Weathered Forest Twine Side Ropes (muted organic flax / hemp fiber)
    const drawRope = (rx) => {
      ctx.fillStyle = '#6b543c';
      ctx.fillRect(rx, y, ropeW, height);
      // Subtle twine twist weave texture
      ctx.strokeStyle = '#483623';
      ctx.lineWidth = 0.9;
      for (let ry = y; ry < y + height; ry += 5) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + ropeW, ry + 2.5);
        ctx.stroke();
      }
    };
    drawRope(x);
    drawRope(x + width - ropeW);

    // Miniature bark-covered twig rungs spaced every 15px
    const step = 15;
    for (let rY = y + 8; rY < y + height - 4; rY += step) {
      // Wood twig rung gradient
      const woodGrad = ctx.createLinearGradient(x, rY, x, rY + 5);
      woodGrad.addColorStop(0, '#5a4634');
      woodGrad.addColorStop(0.5, '#3e2e21');
      woodGrad.addColorStop(1, '#251a11');
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(x + 1, rY, width - 2, 4.5, 1.5);
      ctx.fill();

      // Twine tie-knot holding the rung
      ctx.fillStyle = '#7a6045';
      ctx.beginPath();
      ctx.arc(x + 1.8, rY + 2.2, 2, 0, Math.PI * 2);
      ctx.arc(x + width - 1.8, rY + 2.2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  // Draw Handcrafted Platforms: Oregon Mountain Pass Trail Paths, Cedar Nurse Logs & River Trail Ledges
  drawPlatform(ctx, plat) {
    ctx.save();
    const { x1, y1, x2, y2, thickness = 14, colorTheme = 'oregon_log' } = plat;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const length = Math.hypot(x2 - x1, y2 - y1);

    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // =========================================================================
    // STYLE 1: CARVED OREGON MOUNTAIN PASS TRAIL PATH (Rocky Cliff Switchback)
    // =========================================================================
    if (colorTheme === 'mountain_path') {
      // 1. Deep Contact Shadow cast by the rock ledge onto the mountain cliff below
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#181412';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(length, 4);
      ctx.lineTo(length - 4, thickness + 4);
      ctx.lineTo(4, thickness + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Rugged Mountain Cliff Rock Underside (Basalt & Granite Strata)
      const rockGrad = ctx.createLinearGradient(0, 0, 0, thickness + 6);
      rockGrad.addColorStop(0, '#5a5147');    // Lighter stone rim
      rockGrad.addColorStop(0.3, '#3d362f');  // Chiseled basalt body
      rockGrad.addColorStop(0.7, '#26211c');  // Shadowed rock face
      rockGrad.addColorStop(1, '#151210');    // Deep cliff shadow

      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      // Top trail boundary
      ctx.lineTo(length, 4);
      // Right rugged rock descent
      ctx.lineTo(length + 2, thickness * 0.7);
      ctx.lineTo(length - 6, thickness + 5);
      // Chiseled jagged bottom edge with natural rock points
      const segments = Math.floor(length / 28);
      for (let s = segments; s >= 0; s--) {
        const px = (s / segments) * length;
        const jag = Math.sin(s * 3.7 + length) * 4;
        ctx.lineTo(px, thickness + 2 + jag);
      }
      // Left rugged rock corner
      ctx.lineTo(-4, thickness * 0.65);
      ctx.closePath();
      ctx.fill();

      // 3. Natural Rock Fractures & Granite Chisel Highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Chiseled stone facet highlight ridges
      for (let rx = 18; rx < length - 20; rx += 45) {
        ctx.moveTo(rx, 6);
        ctx.lineTo(rx + 10, thickness * 0.6);
        ctx.lineTo(rx + 6, thickness + 1);
      }
      ctx.stroke();

      // Dark basalt shadow crevices
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let rx = 35; rx < length - 15; rx += 50) {
        ctx.moveTo(rx, 8);
        ctx.lineTo(rx - 8, thickness * 0.75);
        ctx.lineTo(rx - 4, thickness + 3);
      }
      ctx.stroke();

      // 4. Walkable Mountain Path Upper Trail (Packed Alpine Earth & Crushed Slate)
      const pathGrad = ctx.createLinearGradient(0, -2, 0, 9);
      pathGrad.addColorStop(0, '#9c8c7c'); // Sunlit alpine trail dirt
      pathGrad.addColorStop(0.5, '#756657');
      pathGrad.addColorStop(1, '#4e4338');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.roundRect(0, -1, length, 9, 3);
      ctx.fill();

      // 5. Embedded Flat Stepping-Stones along the mountain path
      const stoneColors = ['#aba195', '#82786f', '#5e5650', '#c2b8ac'];
      for (let sx = 14; sx < length - 20; sx += 32) {
        const stW = 10 + (sx % 7);
        const stH = 4 + (sx % 3);
        const stY = 1 + (sx % 3) * 0.8;
        ctx.fillStyle = stoneColors[Math.floor(sx / 32) % stoneColors.length];
        ctx.beginPath();
        ctx.ellipse(sx, stY, stW * 0.5, stH * 0.5, 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Stone top highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 6. Miniature Wooden Trail Guide Posts with Mountain Rope (matching the Oregon trail backdrop!)
      const postSpacing = 160;
      let prevPostX = null;
      for (let px = 28; px < length - 10; px += postSpacing) {
        const postH = 16;
        const postW = 5;
        // Wood post drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(px + 2, -postH + 3, postW, postH);

        // Weathered rustic timber trail stake
        const postGrad = ctx.createLinearGradient(px, -postH, px + postW, -postH);
        postGrad.addColorStop(0, '#85674c');
        postGrad.addColorStop(0.7, '#59412f');
        postGrad.addColorStop(1, '#332317');
        ctx.fillStyle = postGrad;
        ctx.beginPath();
        ctx.roundRect(px, -postH, postW, postH, 1.5);
        ctx.fill();

        // Post metal cap/knot
        ctx.fillStyle = '#261b12';
        ctx.fillRect(px, -postH + 3, postW, 2);

        // Guide rope sagging gracefully between trail posts
        if (prevPostX !== null) {
          ctx.strokeStyle = '#c4b59d';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(prevPostX + postW / 2, -postH + 4);
          const midX = (prevPostX + px) / 2;
          ctx.quadraticCurveTo(midX, -postH + 11, px + postW / 2, -postH + 4);
          ctx.stroke();

          // Rope shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(prevPostX + postW / 2, -postH + 5);
          ctx.quadraticCurveTo(midX, -postH + 12, px + postW / 2, -postH + 5);
          ctx.stroke();
        }
        prevPostX = px;
      }

      // 7. Small Alpine Mountain Flora (Hardy wild grass tufts & violet alpine lupines)
      for (let gx = 55; gx < length - 35; gx += 75) {
        // Alpine grass blades
        ctx.strokeStyle = '#85a842';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.quadraticCurveTo(gx - 3, -6, gx - 5, -8);
        ctx.moveTo(gx, 0);
        ctx.quadraticCurveTo(gx + 2, -7, gx + 4, -9);
        ctx.moveTo(gx, 0);
        ctx.quadraticCurveTo(gx + 5, -5, gx + 7, -6);
        ctx.stroke();

        // Violet mountain lupine flower dots
        ctx.fillStyle = '#a66fe6';
        ctx.beginPath();
        ctx.arc(gx - 5, -9, 1.8, 0, Math.PI * 2);
        ctx.arc(gx + 4, -10, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8d4ff';
        ctx.beginPath();
        ctx.arc(gx - 5, -9, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Trail Cairn (3 balanced hiker marker stones at trail edge)
      const cairnX = length - 22;
      ctx.fillStyle = '#6e655d';
      ctx.beginPath();
      ctx.ellipse(cairnX, 0, 6, 2.5, 0, 0, Math.PI * 2); // Bottom stone
      ctx.fill();
      ctx.fillStyle = '#8a8077';
      ctx.beginPath();
      ctx.ellipse(cairnX, -2.5, 4.5, 2, 0, 0, Math.PI * 2); // Middle stone
      ctx.fill();
      ctx.fillStyle = '#aaa096';
      ctx.beginPath();
      ctx.ellipse(cairnX, -4.8, 3, 1.5, 0, 0, Math.PI * 2); // Top stone
      ctx.fill();

      ctx.restore();
      return;
    }

    // =========================================================================
    // STYLE 2: UNRAVEL-STYLE NATURAL FOREST TWIGS & BRANCHES (Levels 1 & 2)
    // Real-looking slender twigs with organic bark, lichen, moss, and natural node forks
    // =========================================================================
    // Slender, realistic twig thickness (thinner profile for obvious jump gap)
    const twigThick = Math.min(thickness, 7.5);

    // 1. Soft subtle contact shadow cast by the twig onto the forest background
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#0f0a06';
    ctx.beginPath();
    ctx.ellipse(length / 2, twigThick + 2, length * 0.49, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Organic twig spine: natural gentle curvature and tapering bark
    const barkGrad = ctx.createLinearGradient(0, -1, 0, twigThick + 2);
    if (colorTheme === 'river_trail') {
      // River drift-twig: weathered silver-grey cedar
      barkGrad.addColorStop(0, '#5a4f44');
      barkGrad.addColorStop(0.3, '#433930');
      barkGrad.addColorStop(0.7, '#2b231c');
      barkGrad.addColorStop(1, '#19130e');
    } else {
      // Dark Oregon old-growth fir/hemlock twig: deep earthy umber & mossy undertones
      barkGrad.addColorStop(0, '#4e3a2b');
      barkGrad.addColorStop(0.25, '#3d2c1e');
      barkGrad.addColorStop(0.65, '#281c12');
      barkGrad.addColorStop(1, '#140c07');
    }

    ctx.fillStyle = barkGrad;
    ctx.beginPath();
    // Top surface with organic subtle waviness
    ctx.moveTo(0, 1);
    const segs = 16;
    for (let i = 1; i <= segs; i++) {
      const sx = (i / segs) * length;
      const wave = Math.sin(i * 1.7) * 1.2;
      ctx.lineTo(sx, 1 + wave);
    }
    // Right broken twig tip (natural fibrous snap)
    ctx.lineTo(length + 2, twigThick * 0.4);
    ctx.lineTo(length - 1, twigThick + 1);
    // Underside contour
    for (let i = segs; i >= 0; i--) {
      const sx = (i / segs) * length;
      const wave = Math.sin(i * 1.7) * 1.2;
      const swell = (i % 5 === 2) ? 2 : 0; // Natural branch node swellings
      ctx.lineTo(sx, twigThick + 1 + wave + swell);
    }
    // Left broken twig tip
    ctx.lineTo(-2, twigThick * 0.5);
    ctx.closePath();
    ctx.fill();

    // 3. Subtle bark texture ridges (fine natural grain)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let x = 12; x < length - 15; x += 18) {
      const ty = (x % 4);
      ctx.moveTo(x, 2 + ty);
      ctx.lineTo(x + 10, 2 + ty);
    }
    ctx.stroke();

    // 4. Natural branch nodes & tiny dead side-spurs (Unravel signature twig details!)
    const spurStep = 95;
    for (let bx = 35; bx < length - 30; bx += spurStep) {
      // Tiny broken side-twig stub pointing downward
      ctx.fillStyle = '#261b11';
      ctx.beginPath();
      ctx.moveTo(bx, twigThick);
      ctx.lineTo(bx + 4, twigThick + 6);
      ctx.lineTo(bx + 7, twigThick + 1);
      ctx.closePath();
      ctx.fill();

      // Delicate green pine needle cluster or tiny leaf bud
      ctx.strokeStyle = '#5a7828';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 4, twigThick + 6);
      ctx.lineTo(bx + 2, twigThick + 10);
      ctx.moveTo(bx + 4, twigThick + 6);
      ctx.lineTo(bx + 7, twigThick + 10);
      ctx.stroke();
    }

    // 5. Pale lichen patches (Usnea / cup lichen) that blend naturally into the woods
    const lichenColors = ['rgba(168, 192, 148, 0.45)', 'rgba(195, 215, 175, 0.5)', 'rgba(140, 165, 120, 0.4)'];
    for (let lx = 20; lx < length - 25; lx += 42) {
      ctx.fillStyle = lichenColors[(Math.floor(lx / 42)) % lichenColors.length];
      ctx.beginPath();
      ctx.ellipse(lx, 2, 8, 2.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Soft emerald moss velvet along top edge (blends into the moss in the photo background!)
    const mossGrad = ctx.createLinearGradient(0, -2, 0, 4);
    mossGrad.addColorStop(0, 'rgba(125, 185, 55, 0.7)');
    mossGrad.addColorStop(1, 'rgba(60, 110, 25, 0.2)');
    ctx.fillStyle = mossGrad;

    for (let mx = 10; mx < length - 15; mx += 22) {
      ctx.beginPath();
      ctx.ellipse(mx + 8, 1, 9, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // Draw the playful Mountain Guardian ("Barnaby") at the top
  drawBoss(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const bob = Math.sin(Date.now() * 0.005) * 3;
    const armWindup = Math.sin(boss.throwTimer * 8);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: Fluffy Yeti / Bear
    ctx.fillStyle = '#e8f4fc';
    ctx.beginPath();
    ctx.ellipse(0, 0 + bob, 26, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly patch
    ctx.fillStyle = '#c8e2f8';
    ctx.beginPath();
    ctx.ellipse(0, 4 + bob, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#e8f4fc';
    ctx.beginPath();
    ctx.arc(0, -18 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#c8e2f8';
    ctx.beginPath();
    ctx.arc(-14, -30 + bob, 7, 0, Math.PI * 2);
    ctx.arc(14, -30 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb3c6';
    ctx.beginPath();
    ctx.arc(-14, -30 + bob, 4, 0, Math.PI * 2);
    ctx.arc(14, -30 + bob, 4, 0, Math.PI * 2);
    ctx.fill();

    // Silly Party Hat / Flower on Head
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(-6, -34 + bob);
    ctx.lineTo(6, -34 + bob);
    ctx.lineTo(0, -48 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(0, -48 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Friendly Face
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(-6, -18 + bob, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -18 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -19 + bob, 1, 0, Math.PI * 2);
    ctx.arc(7, -19 + bob, 1, 0, Math.PI * 2);
    ctx.fill();

    // Nose & Smile
    ctx.fillStyle = '#3a506b';
    ctx.beginPath();
    ctx.ellipse(0, -13 + bob, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3a506b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -10 + bob, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Cute Cheeks
    ctx.fillStyle = 'rgba(255, 120, 150, 0.5)';
    ctx.beginPath();
    ctx.arc(-11, -14 + bob, 3.5, 0, Math.PI * 2);
    ctx.arc(11, -14 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Arms: Throwing barrel animation!
    ctx.fillStyle = '#e8f4fc';
    if (boss.isThrowing) {
      // Tossing arm reaching forward
      ctx.beginPath();
      ctx.ellipse(22, -4 + bob, 14, 7, 0.4 + armWindup * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Left arm back
      ctx.beginPath();
      ctx.ellipse(-18, 4 + bob, 10, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ready stance resting on barrels
      ctx.beginPath();
      ctx.ellipse(-18, 2 + bob, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.ellipse(18, 2 + bob, 9, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // Draw the Pet to Rescue at the goal!
  drawGoalPet(ctx, goal) {
    ctx.save();
    ctx.translate(goal.x, goal.y);

    const tailWag = Math.sin(Date.now() * 0.015) * 0.4;
    const bob = Math.sin(Date.now() * 0.006) * 2;

    // Picnic Rug / Cushion
    ctx.fillStyle = '#ff758c';
    ctx.beginPath();
    ctx.ellipse(0, 12, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pet Type: Cute Golden Puppy or Kitten
    const isKitty = goal.petType === 'kitten';
    const petColor = isKitty ? '#ffffff' : '#f5b041';

    // Tail wagging happily
    ctx.fillStyle = petColor;
    ctx.save();
    ctx.translate(-10, 2 + bob);
    ctx.rotate(tailWag - 0.5);
    ctx.fillRect(-3, -10, 4, 10);
    ctx.restore();

    // Body
    ctx.fillStyle = petColor;
    ctx.beginPath();
    ctx.ellipse(0, 2 + bob, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(6, -6 + bob, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    if (isKitty) {
      // Pointy cat ears with pink inside
      ctx.fillStyle = petColor;
      ctx.beginPath();
      ctx.moveTo(1, -12 + bob);
      ctx.lineTo(4, -18 + bob);
      ctx.lineTo(7, -12 + bob);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, -12 + bob);
      ctx.lineTo(11, -18 + bob);
      ctx.lineTo(14, -12 + bob);
      ctx.fill();
      ctx.fillStyle = '#ff80bf';
      ctx.beginPath();
      ctx.moveTo(3, -13 + bob);
      ctx.lineTo(4, -16 + bob);
      ctx.lineTo(6, -13 + bob);
      ctx.fill();
    } else {
      // Floppy dog ears
      ctx.fillStyle = '#cf7d15';
      ctx.beginPath();
      ctx.ellipse(2, -5 + bob, 4, 7, 0.4, 0, Math.PI * 2);
      ctx.ellipse(10, -5 + bob, 4, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(5, -6 + bob, 1.8, 0, Math.PI * 2);
    ctx.arc(9, -6 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.5, -6.6 + bob, 0.8, 0, Math.PI * 2);
    ctx.arc(9.5, -6.6 + bob, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Cute pink nose
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(7, -3 + bob, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Little pink bow / ribbon
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(0, -2 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Floating heart above pet
    const heartY = -22 + Math.sin(Date.now() * 0.007) * 4;
    ctx.fillStyle = '#ff2b5f';
    Sprites.drawHeart(ctx, 6, heartY, 6);

    ctx.restore();
  },

  // Draw Heart
  drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    // bottom left curve
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.4, x, y + size);
    // bottom right curve
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.4, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    // top right curve
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  // Draw Collectibles (Gem, Heart, Wand, Boots)
  drawItem(ctx, item) {
    ctx.save();
    const bob = Math.sin(Date.now() * 0.006 + item.x) * 3;
    ctx.translate(item.x, item.y + bob);

    // Glow aura
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    if (item.type === 'gem') {
      // Sparkling diamond gem
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.lineTo(-5, -9);
      ctx.lineTo(5, -9);
      ctx.lineTo(10, -3);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#bdf7ff';
      ctx.beginPath();
      ctx.moveTo(-5, -9);
      ctx.lineTo(0, -3);
      ctx.lineTo(5, -9);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#008ba3';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (item.type === 'heart') {
      ctx.fillStyle = '#ff2a6d';
      Sprites.drawHeart(ctx, 0, -8, 14);
    } else if (item.type === 'wand') {
      // Magic Bubble Wand
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(3, -2);
      ctx.stroke();

      // Wand star tip
      ctx.fillStyle = '#ff007f';
      Sprites.drawStar(ctx, 4, -4, 8, 4, 5);
      // Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'boots') {
      // Spring Boots
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 8, 3);
      ctx.fill();
      // Coiled spring underneath
      ctx.strokeStyle = '#c4a000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(4, 7);
      ctx.lineTo(-4, 10);
      ctx.lineTo(4, 13);
      ctx.stroke();
    } else if (item.type === 'hammer') {
      // Classic Donkey Kong Wooden Mallet Item
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(-2.5, -4, 5, 18);
      ctx.strokeStyle = '#5a3d0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2.5, -4, 5, 18);

      // Mallet Head
      ctx.fillStyle = '#6d4c33';
      ctx.beginPath();
      ctx.roundRect(-10, -16, 20, 12, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -16, 20, 12);

      // Star sparkle on hammer
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -10, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // Draw floating particles & score popups
  drawParticles(ctx, particles) {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'text') {
        ctx.font = 'bold ' + (p.size || 16) + 'px "Fredoka", "Arial Rounded MT Bold", sans-serif';
        ctx.textAlign = 'center';
        // Stroke outline for readability
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color || '#ffea00';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'star') {
        ctx.fillStyle = p.color || '#ffea00';
        Sprites.drawStar(ctx, p.x, p.y, p.radius || 5, (p.radius || 5) * 0.5, 5);
      } else if (p.type === 'bubble') {
        ctx.fillStyle = 'rgba(120, 220, 255, 0.4)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Bubble glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - (p.radius || 8) * 0.3, p.y - (p.radius || 8) * 0.3, (p.radius || 8) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'toot') {
        // Funny cartoon green/yellow cloud puff with stink swirls
        ctx.fillStyle = p.color || 'rgba(160, 230, 80, 0.75)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 10, 0, Math.PI * 2);
        ctx.arc(p.x - 7, p.y + 3, (p.radius || 10) * 0.75, 0, Math.PI * 2);
        ctx.arc(p.x + 7, p.y + 2, (p.radius || 10) * 0.7, 0, Math.PI * 2);
        ctx.arc(p.x, p.y - 6, (p.radius || 10) * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(110, 180, 40, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Funny stink swirl lines
        ctx.beginPath();
        ctx.moveTo(p.x - 8, p.y - 8);
        ctx.quadraticCurveTo(p.x - 4, p.y - 14, p.x - 10, p.y - 18);
        ctx.moveTo(p.x + 6, p.y - 8);
        ctx.quadraticCurveTo(p.x + 10, p.y - 14, p.x + 6, p.y - 18);
        ctx.stroke();
      } else if (p.type === 'splinter') {
        // Flying wooden splinter from smashed barrel
        ctx.fillStyle = p.color || '#9e6231';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.5);
        ctx.strokeStyle = '#522f12';
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.5);
        ctx.restore();
      } else if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        // Simple circle dust particle
        ctx.fillStyle = p.color || 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
};

window.Sprites = Sprites;
