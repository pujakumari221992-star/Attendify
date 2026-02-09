
/**
 * AdManager Service for Google AdMob Integration
 * Handles Native Android Bridge communication and Web Preview mock ads.
 */
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-1278413469708839/4515609161';
const APP_ID = 'ca-app-pub-1278413469708839~2349384904';

class AdManager {
  private static instance: AdManager;
  private isInitialized: boolean = false;
  private adReady: boolean = false;
  private isAdLoading: boolean = false;
  private pendingCallback: (() => void) | null = null;
  private isPremium: boolean = false;

  private constructor() {}

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  /**
   * Initialize AdMob with the App ID and set up global event listeners
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupGlobalCallbacks();

    if ((window as any).AndroidAdMob) {
      try {
        (window as any).AndroidAdMob.initialize(APP_ID);
      } catch (e) {
        // Silently fail in production
      }
    }
    
    this.isInitialized = true;
    this.preloadInterstitial();
  }

  /**
   * Sets the premium status of the current user.
   * If true, ads will be disabled.
   */
  setPremium(status: boolean) {
    this.isPremium = status;
  }

  /**
   * Sets up the window-level callbacks that the Native Android layer will trigger.
   */
  private setupGlobalCallbacks() {
    (window as any).onAdLoaded = () => {
      this.adReady = true;
      this.isAdLoading = false;
    };

    (window as any).onAdFailedToLoad = (error: string) => {
      this.adReady = false;
      this.isAdLoading = false;
      if (this.pendingCallback) this.executeCallback();
    };

    (window as any).onAdDismissed = () => {
      this.adReady = false;
      this.executeCallback();
      this.preloadInterstitial();
    };

    (window as any).onAdFailedToShow = (error: string) => {
      this.executeCallback();
      this.preloadInterstitial();
    };
  }

  private executeCallback() {
    if (this.pendingCallback) {
      const cb = this.pendingCallback;
      this.pendingCallback = null;
      cb();
    }
  }

  preloadInterstitial() {
    if (this.isPremium) return; // Don't load ads for premium users
    if (this.adReady || this.isAdLoading) return;
    
    this.isAdLoading = true;

    if ((window as any).AndroidAdMob) {
      try {
        (window as any).AndroidAdMob.loadInterstitial(INTERSTITIAL_AD_UNIT_ID);
      } catch (e) {
        this.isAdLoading = false;
      }
    } else {
      setTimeout(() => {
        if (!this.adReady) {
          (window as any).onAdLoaded();
        }
      }, 2000);
    }
  }

  showInterstitial(onComplete: () => void) {
    if (this.isPremium) {
      // Instantly call callback for premium users, skip ad logic completely
      onComplete();
      return;
    }

    this.pendingCallback = onComplete;

    if (!this.adReady) {
      this.executeCallback();
      this.preloadInterstitial();
      return;
    }

    if ((window as any).AndroidAdMob) {
      try {
        (window as any).AndroidAdMob.showInterstitial(INTERSTITIAL_AD_UNIT_ID);
      } catch (e) {
        this.executeCallback();
      }
    } else {
      this.renderTestAdOverlay();
    }
  }

  private renderTestAdOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'admob-test-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: #000; z-index: 10000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: white; font-family: 'Inter', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="position: absolute; top: 40px; right: 30px; font-size: 24px; cursor: pointer; padding: 10px;" onclick="window.onAdDismissed()">✕</div>
      <div style="text-align: center; max-width: 80%;">
        <div style="background: #fbbf24; color: black; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; margin-bottom: 20px;">TEST AD</div>
        <div style="width: 80px; height: 80px; background: #136A73; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <i class="fa-solid fa-crown text-3xl text-yellow-400" style="color: #fbbf24;"></i>
        </div>
        <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 12px;">Go Pro with Attendify</h2>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Get unlimited staff members and remove all advertisements today.</p>
        <button style="background: #136A73; color: white; border: none; padding: 16px 48px; border-radius: 20px; font-weight: 800; font-size: 16px;">Upgrade Now</button>
      </div>
      <div style="position: absolute; bottom: 40px; font-size: 10px; color: #475569; font-weight: bold; letter-spacing: 1px;">AD WILL CLOSE IN 5 SECONDS</div>
    `;

    document.body.appendChild(overlay);

    const autoClose = setTimeout(() => {
      const el = document.getElementById('admob-test-overlay');
      if (el) (window as any).onAdDismissed();
    }, 5000);

    const originalDismiss = (window as any).onAdDismissed;
    (window as any).onAdDismissed = () => {
      clearTimeout(autoClose);
      const el = document.getElementById('admob-test-overlay');
      if (el) el.remove();
      (window as any).onAdDismissed = originalDismiss;
      originalDismiss();
    };
  }
}

export default AdManager.getInstance();
