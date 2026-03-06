/**
 * Neon Snake Arena v2.0 - Renderer
 *
 * KEY FIX: canvas is sized to exactly GRID_WIDTH x GRID_HEIGHT x CELL_SIZE.
 * All entity renders use raw grid coordinates (x * CELL_SIZE, y * CELL_SIZE).
 * No offset math needed anywhere else.  CSS flexbox centres the canvas.
 */

class Renderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.state  = state;

    // Fix canvas to exact grid size — entities render at (x*cell, y*cell) with no offset
    this.canvas.width  = GameConfig.CANVAS.WIDTH;
    this.canvas.height = GameConfig.CANVAS.HEIGHT;

    this.shakeX    = 0;
    this.shakeY    = 0;
    this.gridPulse = 0;

    // Level-up overlay
    this.levelUpTimer = 0;
    this.levelUpText  = '';
  }

  // ── Main render ──────────────────────────────────────────

  render(snake, food, powerUps, particles, nowMs) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    // Advance animations
    this.gridPulse += 0.025;
    if (this.gridPulse > Math.PI * 2) this.gridPulse -= Math.PI * 2;
    if (this.levelUpTimer > 0) this.levelUpTimer -= 16;

    // Screen shake
    if (this.state.effects.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.state.effects.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.state.effects.screenShake;
    } else {
      this.shakeX = 0; this.shakeY = 0;
    }

    // Background
    ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vg = ctx.createRadialGradient(W/2, H/2, W*0.18, W/2, H/2, W*0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Game world (with screen shake)
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    this._drawGrid(ctx);
    particles.render(ctx);
    food.render(ctx, nowMs);
    powerUps.render(ctx);
    snake.render(ctx);
    ctx.restore();

    // HUD — always in screen-space, never shaken
    this._drawHUD(ctx, powerUps);
    this._drawFlashOverlay(ctx, W, H);
  }

  // ── Menu screen ──────────────────────────────────────────

  renderMenu(options, selectedIndex, highScores) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, W, H);

    this.gridPulse += 0.008;
    this._drawGrid(ctx);

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `900 40px "Orbitron", monospace`;
    ctx.shadowBlur   = 32;
    ctx.shadowColor  = '#00e5ff';
    ctx.fillStyle    = '#00e5ff';
    ctx.fillText('NEON SNAKE', W / 2, H * 0.15);
    ctx.font         = `700 18px "Orbitron", monospace`;
    ctx.shadowBlur   = 10;
    ctx.fillStyle    = 'rgba(255,255,255,0.45)';
    ctx.fillText('A  R  E  N  A', W / 2, H * 0.15 + 48);
    ctx.restore();

    // Separator
    const sa = 0.2 + Math.sin(this.gridPulse * 2) * 0.08;
    ctx.strokeStyle = `rgba(0,229,255,${sa})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.15, H * 0.27); ctx.lineTo(W * 0.85, H * 0.27);
    ctx.stroke();

    // Mode cards
    const cardH  = 66;
    const cardW  = Math.min(W * 0.65, 460);
    const cardX  = (W - cardW) / 2;
    const startY = H * 0.31;
    const modeKeys = Object.keys(GameConfig.MODES);

    options.forEach((name, i) => {
      const y    = startY + i * (cardH + 10);
      const sel  = i === selectedIndex;
      const mk   = modeKeys[i];
      const mc   = GameConfig.MODES[mk];
      const hi   = highScores[mc.id] || 0;

      // Card bg
      ctx.save();
      ctx.fillStyle   = sel ? 'rgba(0,229,255,0.10)' : 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = sel
        ? `rgba(0,229,255,${0.75 + Math.sin(this.gridPulse * 4) * 0.2})`
        : 'rgba(255,255,255,0.10)';
      ctx.lineWidth   = sel ? 2 : 1;
      if (sel) { ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(0,229,255,0.4)'; }
      this._roundRect(ctx, cardX, y, cardW, cardH, 8);
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // Icon
      ctx.save();
      ctx.font = '22px Arial';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(mc.icon, cardX + 16, y + cardH / 2 - 8);

      // Mode name
      ctx.font      = `${sel ? '700' : '400'} 15px "Orbitron", monospace`;
      ctx.fillStyle = sel ? '#00e5ff' : '#ffffff';
      if (sel) { ctx.shadowBlur = 8; ctx.shadowColor = '#00e5ff'; }
      ctx.fillText(mc.name.toUpperCase(), cardX + 52, y + cardH / 2 - 10);

      // Description
      ctx.shadowBlur = 0;
      ctx.font       = `11px "Space Mono", monospace`;
      ctx.fillStyle  = 'rgba(255,255,255,0.45)';
      ctx.fillText(mc.description, cardX + 52, y + cardH / 2 + 13);

      // High score
      ctx.textAlign = 'right';
      ctx.font      = `11px "Orbitron", monospace`;
      ctx.fillStyle = hi > 0 ? '#ffdd00' : 'rgba(255,255,255,0.2)';
      ctx.fillText(hi > 0 ? `BEST  ${hi}` : 'NO SCORE YET', cardX + cardW - 14, y + cardH / 2);
      ctx.restore();
    });

    // Footer
    ctx.save();
    ctx.font         = `11px "Space Mono", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.fillText('W/S or Arrows  navigate   ·   ENTER or SPACE  select   ·   M  mute', W/2, H * 0.89);
    ctx.restore();
  }

  // ── Countdown ────────────────────────────────────────────

  renderCountdown(value) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    if (value > 0) {
      ctx.font         = `900 110px "Orbitron", monospace`;
      ctx.shadowBlur   = 50;
      ctx.shadowColor  = '#00e5ff';
      ctx.fillStyle    = '#00e5ff';
      ctx.fillText(value.toString(), W / 2, H / 2);
    } else {
      ctx.font         = `900 72px "Orbitron", monospace`;
      ctx.shadowBlur   = 50;
      ctx.shadowColor  = '#00ff88';
      ctx.fillStyle    = '#00ff88';
      ctx.fillText('GO!', W / 2, H / 2);
    }
    ctx.restore();
  }

  // ── Pause overlay ────────────────────────────────────────

  renderPause() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `900 54px "Orbitron", monospace`;
    ctx.shadowBlur   = 28;
    ctx.shadowColor  = '#00e5ff';
    ctx.fillStyle    = '#00e5ff';
    ctx.fillText('PAUSED', W / 2, H / 2 - 32);

    ctx.shadowBlur = 0;
    ctx.font       = `13px "Space Mono", monospace`;
    ctx.fillStyle  = 'rgba(255,255,255,0.5)';
    ctx.fillText('P / ESC  ·  resume', W / 2, H / 2 + 24);
    ctx.fillText('R  ·  restart        ESC × 2  ·  menu', W / 2, H / 2 + 48);
    ctx.restore();
  }

  // ── Game Over screen ─────────────────────────────────────

  renderGameOver(stats) {
    const ctx = this.ctx;
    const W   = this.canvas.width;   // 720
    const H   = this.canvas.height;  // 576

    ctx.fillStyle = 'rgba(0,0,0,0.90)';
    ctx.fillRect(0, 0, W, H);

    // ── "GAME OVER" title ─────────────────────────────────
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `900 46px "Orbitron", monospace`;
    ctx.shadowBlur   = 36;
    ctx.shadowColor  = '#ff0055';
    ctx.fillStyle    = '#ff0055';
    ctx.fillText('GAME OVER', W / 2, 60);
    ctx.restore();

    // ── Score card ────────────────────────────────────────
    const bW = Math.min(W * 0.66, 460);
    const bX = (W - bW) / 2;
    const bY = 90;
    const bH = 58;

    ctx.save();
    ctx.fillStyle   = 'rgba(0,229,255,0.08)';
    ctx.strokeStyle = 'rgba(0,229,255,0.45)';
    ctx.lineWidth   = 1.5;
    this._roundRect(ctx, bX, bY, bW, bH, 8);
    ctx.fill(); ctx.stroke();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `700 11px "Orbitron", monospace`;
    ctx.fillStyle    = 'rgba(255,255,255,0.4)';
    ctx.fillText('SCORE', W / 2, bY + 14);
    ctx.font         = `900 28px "Orbitron", monospace`;
    ctx.fillStyle    = '#ffffff';
    ctx.shadowBlur   = 14;
    ctx.shadowColor  = '#ffffff';
    ctx.fillText(stats.score.toLocaleString(), W / 2, bY + 40);
    ctx.restore();

    // High score banner or mode label
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    if (stats.isHighScore) {
      ctx.font        = `700 13px "Orbitron", monospace`;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = '#ffdd00';
      ctx.fillStyle   = '#ffdd00';
      ctx.fillText('\u2605  NEW HIGH SCORE  \u2605', W / 2, bY + bH + 16);
    } else {
      ctx.font      = `11px "Space Mono", monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText((stats.mode || '').toUpperCase() + ' MODE', W / 2, bY + bH + 16);
    }
    ctx.restore();

    // ── Compact stats (2 rows × 3 columns) ───────────────
    const statsY  = bY + bH + 36;
    const colL    = W * 0.17;
    const colC    = W * 0.50;
    const colR    = W * 0.83;
    const lhStats = 24;

    const statRows = [
      [['LEN',      stats.length],      ['LVL',    stats.level],      ['TIME',    this._fmtMs(stats.elapsedMs)]],
      [['FOOD',     stats.foodEaten],   ['GOLDEN', stats.goldenEaten], ['PWR-UPS', stats.powerUps]],
    ];

    ctx.save();
    ctx.textBaseline = 'middle';
    statRows.forEach((row, ri) => {
      const ry = statsY + ri * lhStats;
      [[colL, row[0]], [colC, row[1]], [colR, row[2]]].forEach(([cx, [label, val]]) => {
        ctx.textAlign = 'center';
        ctx.font      = `9px "Space Mono", monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.fillText(label, cx, ry - 6);
        ctx.font      = `700 12px "Orbitron", monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(val), cx, ry + 9);
      });
    });
    ctx.restore();

    // ── Divider ───────────────────────────────────────────
    const divY = statsY + statRows.length * lhStats + 10;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,229,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.08, divY); ctx.lineTo(W * 0.92, divY);
    ctx.stroke();
    ctx.restore();

    // ── Leaderboard section ───────────────────────────────
    const lbHeaderY = divY + 16;

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `700 10px "Orbitron", monospace`;
    ctx.fillStyle    = 'rgba(0,229,255,0.7)';
    ctx.letterSpacing = '2px';
    ctx.fillText('TOP  SCORES  —  NEON  SNAKE', W / 2, lbHeaderY);
    ctx.restore();

    const lbStartY = lbHeaderY + 18;
    const rowH     = 28;
    const maxRows  = 7;
    const padL     = W * 0.09;
    const padR     = W * 0.91;

    // Medal colours for top 3
    const rankColor = ['#FFD700', '#C0C0C0', '#CD7F32'];

    const leaderboard = stats.leaderboard; // null | [] | [{rank, displayName, score}]

    if (leaderboard === null) {
      // Loading…
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `12px "Space Mono", monospace`;
      ctx.fillStyle    = 'rgba(255,255,255,0.35)';
      const dotCount   = Math.floor(performance.now() / 400) % 4;
      ctx.fillText('LOADING' + '.'.repeat(dotCount), W / 2, lbStartY + rowH * 3);
      ctx.restore();

    } else if (leaderboard.length === 0) {
      // Empty
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `11px "Space Mono", monospace`;
      ctx.fillStyle    = 'rgba(255,255,255,0.3)';
      ctx.fillText('NO SCORES YET — BE THE FIRST!', W / 2, lbStartY + rowH * 2);
      ctx.restore();

    } else {
      // Rows
      const displayRows = leaderboard.slice(0, maxRows);

      displayRows.forEach((entry, i) => {
        const ry = lbStartY + i * rowH;

        // Highlight player's own entry (score match)
        const isPlayer = (entry.score === stats.score);
        if (isPlayer) {
          ctx.save();
          ctx.fillStyle = 'rgba(0,229,255,0.08)';
          ctx.strokeStyle = 'rgba(0,229,255,0.3)';
          ctx.lineWidth = 1;
          this._roundRect(ctx, padL - 6, ry - rowH / 2 + 2, padR - padL + 12, rowH - 4, 4);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.textBaseline = 'middle';

        // Rank number
        const rc = rankColor[i] || (isPlayer ? '#00e5ff' : 'rgba(255,255,255,0.55)');
        ctx.font      = `700 11px "Orbitron", monospace`;
        ctx.fillStyle = rc;
        ctx.textAlign = 'left';
        ctx.fillText('#' + entry.rank, padL, ry);

        // Display name (truncated)
        const maxNameW = (padR - padL) * 0.58;
        ctx.font      = isPlayer ? `700 11px "Space Mono", monospace` : `11px "Space Mono", monospace`;
        ctx.fillStyle = isPlayer ? '#00e5ff' : 'rgba(255,255,255,0.75)';
        const nameX   = padL + 36;
        // Clip long names
        let name = entry.displayName || 'Anonymous';
        while (name.length > 3 && ctx.measureText(name).width > maxNameW) {
          name = name.slice(0, -1);
        }
        ctx.textAlign = 'left';
        ctx.fillText(name, nameX, ry);

        // Score (right-aligned)
        ctx.font      = `700 11px "Orbitron", monospace`;
        ctx.fillStyle = i === 0 ? '#FFD700' : (isPlayer ? '#00e5ff' : 'rgba(255,255,255,0.8)');
        ctx.textAlign = 'right';
        ctx.fillText(entry.score.toLocaleString(), padR, ry);

        ctx.restore();
      });

      // Player rank line (shown below list if player is not in top rows)
      const playerInList = displayRows.some(e => e.score === stats.score);
      if (!playerInList && stats.playerRank !== null) {
        const extraY = lbStartY + displayRows.length * rowH + 6;

        // Dashed separator
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(padL, extraY - 4); ctx.lineTo(padR, extraY - 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.font         = `700 11px "Orbitron", monospace`;
        ctx.fillStyle    = '#00e5ff';
        ctx.textAlign    = 'left';
        ctx.fillText('#' + stats.playerRank, padL, extraY + rowH / 2);

        ctx.font      = `700 11px "Space Mono", monospace`;
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'left';
        ctx.fillText('YOU', padL + 36, extraY + rowH / 2);

        ctx.font      = `700 11px "Orbitron", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(stats.score.toLocaleString(), padR, extraY + rowH / 2);
        ctx.restore();
      }
    }

    // ── Footer ────────────────────────────────────────────
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `11px "Orbitron", monospace`;
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.fillText('R  restart   \u00b7   ESC  main menu', W / 2, H - 18);
    ctx.restore();
  }

  // ── Grid ─────────────────────────────────────────────────

  _drawGrid(ctx) {
    const cell = GameConfig.CANVAS.CELL_SIZE;
    const cols = GameConfig.CANVAS.GRID_WIDTH;
    const rows = GameConfig.CANVAS.GRID_HEIGHT;
    const gAlpha = 0.07 + Math.sin(this.gridPulse) * 0.025;

    ctx.save();
    ctx.strokeStyle = `rgba(0,229,255,${gAlpha})`;
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) { ctx.moveTo(c*cell, 0); ctx.lineTo(c*cell, rows*cell); }
    for (let r = 0; r <= rows; r++) { ctx.moveTo(0, r*cell); ctx.lineTo(cols*cell, r*cell); }
    ctx.stroke();

    // Border glow
    ctx.strokeStyle = `rgba(0,229,255,${0.3 + Math.sin(this.gridPulse) * 0.08})`;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = 'rgba(0,229,255,0.3)';
    ctx.strokeRect(0, 0, cols*cell, rows*cell);
    ctx.restore();
  }

  // ── HUD ──────────────────────────────────────────────────

  _drawHUD(ctx, powerUps) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const p = 14;

    // Top bar
    ctx.save();
    ctx.fillStyle   = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, W, 44);
    ctx.strokeStyle = 'rgba(0,229,255,0.13)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(0,44); ctx.lineTo(W,44); ctx.stroke();
    ctx.restore();

    // Score (left)
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.font         = `700 20px "Orbitron", monospace`;
    ctx.shadowBlur   = 10;
    ctx.shadowColor  = '#00e5ff';
    ctx.fillStyle    = '#00e5ff';
    ctx.fillText(this.state.score, p, 20);
    ctx.font         = `9px "Orbitron", monospace`;
    ctx.shadowBlur   = 0;
    ctx.fillStyle    = 'rgba(0,229,255,0.45)';
    ctx.fillText('SCORE', p, 36);
    ctx.restore();

    // Centre: mode + level
    const mc = GameConfig.MODES[this.state.mode.toUpperCase()];
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `700 12px "Orbitron", monospace`;
    ctx.fillStyle    = 'rgba(255,255,255,0.65)';
    ctx.fillText(`${mc ? mc.name.toUpperCase() : ''} \u00b7 LVL ${this.state.level}`, W/2, 14);
    ctx.restore();

    // Timer (Time Attack)
    if (mc && mc.timeLimit > 0) {
      const tr    = Math.max(0, this.state.timeRemaining);
      const tCol  = tr <= 10 ? '#ff0055' : '#ffffff';
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `700 17px "Orbitron", monospace`;
      ctx.fillStyle    = tCol;
      if (tr <= 10) { ctx.shadowBlur = 12; ctx.shadowColor = '#ff0055'; }
      ctx.fillText(this._fmtSecs(tr), W/2, 30);
      ctx.restore();
    }

    // Best + length (right)
    const hi = this.state.highScores[this.state.mode] || 0;
    ctx.save();
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.font         = `10px "Orbitron", monospace`;
    ctx.fillStyle    = 'rgba(255,221,0,0.7)';
    ctx.fillText(`BEST ${hi}`, W - p, 14);
    ctx.font      = `10px "Orbitron", monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`LEN ${this.state.snake.segments.length}`, W - p, 30);
    ctx.restore();

    // Combo badge
    if (this.state.combo > 1) {
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `700 13px "Orbitron", monospace`;
      const comboA = Math.min(1, this.state.combo / 3);
      ctx.fillStyle    = `rgba(255,221,0,${comboA})`;
      ctx.shadowBlur   = 12;
      ctx.shadowColor  = '#ffdd00';
      ctx.fillText(`COMBO \u00d7${this.state.combo}`, W/2, 58);
      ctx.restore();
    }

    // Active power-up timers
    powerUps.renderActiveIndicators(ctx, W);

    // Level-up notification
    if (this.levelUpTimer > 0) {
      const a = Math.min(1, this.levelUpTimer / 400);
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = `700 18px "Orbitron", monospace`;
      ctx.fillStyle    = `rgba(0,255,136,${a})`;
      ctx.shadowBlur   = 18;
      ctx.shadowColor  = '#00ff88';
      ctx.fillText(this.levelUpText, W/2, H/2 - 90);
      ctx.restore();
    }

    // Speed bar (bottom-left)
    const spd = Math.max(0, Math.min(100, Math.round(
      (1 - (this.state.speed - GameConfig.TIMING.MIN_SPEED) /
       (GameConfig.TIMING.BASE_SPEED - GameConfig.TIMING.MIN_SPEED)) * 100
    )));
    ctx.save();
    ctx.font         = `9px "Orbitron", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.fillStyle    = 'rgba(0,255,136,0.5)';
    ctx.fillText(`SPD ${spd}%`, p, H - 10);
    ctx.restore();
  }

  // ── Flash overlay ────────────────────────────────────────

  _drawFlashOverlay(ctx, W, H) {
    if (this.state.effects.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.state.effects.flash * 0.22})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  _fmtMs(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  }

  _fmtSecs(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}`;
  }

  showLevelUp(level) {
    this.levelUpText  = `LEVEL ${level}!`;
    this.levelUpTimer = 1500;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Renderer };
}
