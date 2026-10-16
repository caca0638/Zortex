/**
 * ZORTEX: CYBER SURVIVOR - GİRDİ YÖNETİCİSİ (InputManager.js)
 * Klavye, Fare ve Gamepad (Twin-Stick & D-Pad) girdilerini dinler ve normalize eder.
 */

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 640, y: 360, isDown: false, rightDown: false };
    this.gamepadConnected = false;
    this.gamepadIndex = null;
    
    // Normalize hareket vektörleri (-1 ile 1 arası)
    this.moveX = 0;
    this.moveY = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.isShooting = false;
    this.isDashing = false;
    this.isDecoy = false;

    // Tetiklenen anlık olaylar (One-shot triggers)
    this.weaponSelectIndex = null; // 0, 1, 2, 3
    this.weaponCycleDelta = 0;     // -1 veya +1
    this.pauseTriggered = false;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key] = true;

      // 1, 2, 3, 4 ve Numpad Silah Seçimleri
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') this.weaponSelectIndex = 0;
      else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') this.weaponSelectIndex = 1;
      else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') this.weaponSelectIndex = 2;
      else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') this.weaponSelectIndex = 3;

      if (e.code === 'Space') this.isDashing = true;
      if (e.code === 'KeyC') this.isDecoy = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.pauseTriggered = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
      if (e.code === 'Space') this.isDashing = false;
      if (e.code === 'KeyC') this.isDecoy = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        this.mouse.isDown = true;
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    }, { passive: true });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Gamepad Olayları
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadIndex = e.gamepad.index;
      console.log('🎮 Gamepad Bağlandı:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadIndex = null;
    });
  }

  // Her karede çağrılan girdi güncellemesi
  update() {
    let mx = 0;
    let my = 0;

    // Klavye Hareketi (WASD & Ok Tuşları)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;

    // Vektör Normalizasyonu
    const mag = Math.hypot(mx, my);
    if (mag > 0) {
      this.moveX = mx / mag;
      this.moveY = my / mag;
    } else {
      this.moveX = 0;
      this.moveY = 0;
    }

    this.isShooting = this.mouse.isDown || this.keys['Space'] || this.keys['KeyJ'] || this.keys['KeyK'] || this.keys['KeyZ'];

    // Gamepad Durumu Kontrolü
    this.pollGamepad();
  }

  pollGamepad() {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads || gamepads.length === 0) return;
    const gp = gamepads[this.gamepadIndex !== null ? this.gamepadIndex : 0];
    if (!gp) return;

    // Sol Analog Stick (Hareket)
    const deadzone = 0.18;
    const ax0 = gp.axes[0] || 0;
    const ax1 = gp.axes[1] || 0;
    if (Math.hypot(ax0, ax1) > deadzone) {
      this.moveX = ax0;
      this.moveY = ax1;
    }

    // Sağ Analog Stick (Nişan Alma)
    const ax2 = gp.axes[2] || 0;
    const ax3 = gp.axes[3] || 0;
    if (Math.hypot(ax2, ax3) > deadzone) {
      this.aimX = ax2;
      this.aimY = ax3;
      this.isShooting = true;
    }

    // Gamepad Butonları
    // RT (Tetik) veya A butonu ile ateş
    if ((gp.buttons[7] && gp.buttons[7].pressed) || (gp.buttons[0] && gp.buttons[0].pressed)) {
      this.isShooting = true;
    }
    // RB veya B butonu ile Dash
    if ((gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[1] && gp.buttons[1].pressed)) {
      this.isDashing = true;
    }
    // D-Pad Sol / Sağ ile Silah Değiştirme
    if (gp.buttons[14] && gp.buttons[14].pressed) this.weaponCycleDelta = -1;
    if (gp.buttons[15] && gp.buttons[15].pressed) this.weaponCycleDelta = 1;
  }

  // Gamepad Titreşim (Haptic Feedback)
  triggerRumble(intensity = 'light') {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this.gamepadIndex !== null ? this.gamepadIndex : 0];
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
      const effect = intensity === 'heavy'
        ? { duration: 180, strongMagnitude: 0.85, weakMagnitude: 0.65 }
        : { duration: 80, strongMagnitude: 0.35, weakMagnitude: 0.25 };
      gp.vibrationActuator.playEffect('dual-rumble', effect).catch(() => {});
    }
  }

  // Tüketilen anlık tetikleyicileri sıfırla
  consumeWeaponSelect() {
    const val = this.weaponSelectIndex;
    this.weaponSelectIndex = null;
    return val;
  }

  consumeWeaponCycle() {
    const val = this.weaponCycleDelta;
    this.weaponCycleDelta = 0;
    return val;
  }

  consumePause() {
    const val = this.pauseTriggered;
    this.pauseTriggered = false;
    return val;
  }
}
