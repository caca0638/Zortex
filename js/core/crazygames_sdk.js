/**
 * ============================================================================
 * ZORTEX: CRAZYGAMES SDK v2 RESILIENT WRAPPER
 * Module: js/core/crazygames_sdk.js
 * Architecture: Fail-safe, zero-crash proxy for CrazyGames SDK v2 integration.
 * Complies with CrazyGames QA requirements:
 *   - Automatic loadingStart / loadingStop tracking
 *   - Automatic gameplayStart / gameplayStop lifecycle hooks
 *   - Midgame ad cooldown guarding (minimum 150s between midgame breaks)
 *   - Audio ducking/muting synchronization during ad playback
 *   - Rewarded ad handlers for optional revive & bonus loot
 *   - happytime celebrations for boss kills and milestones
 * ============================================================================
 */
(function() {
  'use strict';

  class CrazyGamesSDKWrapper {
    constructor() {
      this.lastMidgameAdTime = 0;
      this.midgameCooldownSec = 150; // 2.5 minutes minimum between midgame ads
      this.wasAudioMutedBeforeAd = false;
      this.isAdPlaying = false;
      this.initialized = false;
      this.environment = 'local';
    }

    get sdk() {
      return (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) ? window.CrazyGames.SDK : null;
    }

    get isAvailable() {
      return Boolean(this.sdk);
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      try {
        if (this.sdk) {
          if (typeof this.sdk.getEnvironment === 'function') {
            this.environment = this.sdk.getEnvironment();
          }
          console.log(`[CrazyGames SDK] Initialized successfully. Environment: ${this.environment}`);
        } else {
          console.log('[CrazyGames SDK] SDK script not detected or running standalone. Using mock fail-safe mode.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] Init error handled:', err);
      }
    }

    loadingStart() {
      try {
        if (this.sdk && this.sdk.game && typeof this.sdk.game.loadingStart === 'function') {
          this.sdk.game.loadingStart();
          console.log('[CrazyGames SDK] loadingStart() signaled.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] loadingStart error:', err);
      }
    }

    loadingStop() {
      try {
        if (this.sdk && this.sdk.game && typeof this.sdk.game.loadingStop === 'function') {
          this.sdk.game.loadingStop();
          console.log('[CrazyGames SDK] loadingStop() signaled.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] loadingStop error:', err);
      }
    }

    gameplayStart() {
      try {
        if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
          this.sdk.game.gameplayStart();
          console.log('[CrazyGames SDK] gameplayStart() signaled.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] gameplayStart error:', err);
      }
    }

    gameplayStop() {
      try {
        if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
          this.sdk.game.gameplayStop();
          console.log('[CrazyGames SDK] gameplayStop() signaled.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] gameplayStop error:', err);
      }
    }

    happytime() {
      try {
        if (this.sdk && this.sdk.game && typeof this.sdk.game.happytime === 'function') {
          this.sdk.game.happytime();
          console.log('[CrazyGames SDK] happytime() celebration triggered.');
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] happytime error:', err);
      }
    }

    _muteAudioForAd() {
      this.wasAudioMutedBeforeAd = (window.audio && window.audio.muted) || false;
      if (window.audio && typeof window.audio.setMuted === 'function') {
        window.audio.setMuted(true);
      }
    }

    _restoreAudioAfterAd() {
      if (window.audio && typeof window.audio.setMuted === 'function') {
        window.audio.setMuted(this.wasAudioMutedBeforeAd);
      }
    }

    /**
     * Midgame Ad: Triggered between runs or game over screens
     * Respects 150s cooldown to keep gameplay natural and unspammed.
     */
    requestMidgameAd(callbacks = {}) {
      const now = performance.now() * 0.001;
      const timeSinceLastAd = now - this.lastMidgameAdTime;

      if (!this.sdk || !this.sdk.ad || typeof this.sdk.ad.requestAd !== 'function') {
        // Standalone or SDK unavailable -> immediate continuation
        if (typeof callbacks.adFinished === 'function') callbacks.adFinished();
        return;
      }

      // Check cooldown
      if (this.lastMidgameAdTime > 0 && timeSinceLastAd < this.midgameCooldownSec) {
        console.log(`[CrazyGames SDK] Midgame ad skipped: Cooldown active (${Math.round(this.midgameCooldownSec - timeSinceLastAd)}s remaining)`);
        if (typeof callbacks.adFinished === 'function') callbacks.adFinished();
        return;
      }

      this.isAdPlaying = true;
      this._muteAudioForAd();
      this.gameplayStop();

      this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          console.log('[CrazyGames SDK] Midgame ad started.');
          if (typeof callbacks.adStarted === 'function') callbacks.adStarted();
        },
        adFinished: () => {
          console.log('[CrazyGames SDK] Midgame ad finished.');
          this.lastMidgameAdTime = performance.now() * 0.001;
          this.isAdPlaying = false;
          this._restoreAudioAfterAd();
          if (typeof callbacks.adFinished === 'function') callbacks.adFinished();
        },
        adError: (error, errorData) => {
          console.warn('[CrazyGames SDK] Midgame ad error / unfilled:', error, errorData);
          this.isAdPlaying = false;
          this._restoreAudioAfterAd();
          if (typeof callbacks.adError === 'function') callbacks.adError(error, errorData);
          else if (typeof callbacks.adFinished === 'function') callbacks.adFinished();
        }
      });
    }

    /**
     * Rewarded Ad: User-initiated opt-in reward
     */
    requestRewardedAd(callbacks = {}) {
      if (!this.sdk || !this.sdk.ad || typeof this.sdk.ad.requestAd !== 'function') {
        console.log('[CrazyGames SDK] Mock rewarded ad granted (SDK not present or local).');
        if (typeof callbacks.onReward === 'function') callbacks.onReward();
        return;
      }

      this.isAdPlaying = true;
      this._muteAudioForAd();
      this.gameplayStop();

      this.sdk.ad.requestAd('rewarded', {
        adStarted: () => {
          console.log('[CrazyGames SDK] Rewarded ad started.');
          if (typeof callbacks.adStarted === 'function') callbacks.adStarted();
        },
        adFinished: () => {
          console.log('[CrazyGames SDK] Rewarded ad finished. Granting player reward!');
          this.isAdPlaying = false;
          this._restoreAudioAfterAd();
          if (typeof callbacks.onReward === 'function') callbacks.onReward();
        },
        adError: (error, errorData) => {
          console.warn('[CrazyGames SDK] Rewarded ad error:', error, errorData);
          this.isAdPlaying = false;
          this._restoreAudioAfterAd();
          if (typeof callbacks.onError === 'function') callbacks.onError(error, errorData);
        }
      });
    }
  }

  window.ZortexCrazyGames = new CrazyGamesSDKWrapper();
})();
