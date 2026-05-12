import { NativeEventEmitter, NativeModules, EmitterSubscription, Vibration } from 'react-native';
import { showFloatingBubble, hideFloatingBubble, checkPermission, requestPermission, initialize, setBubbleText, triggerLastRepSequence } from 'react-native-floating-bubble';

class FloatingBubbleService {
  private disabled: boolean = false;
  private isShown: boolean = false;
  private listeners: EmitterSubscription[] = [];

  async prewarm() {
    if (this.disabled) return;
    try {
      await initialize();
    } catch (error) {
      console.warn('Bubble prewarm failed', error);
      this.disabled = true;
    }
  }

  async requestBubblePermission() {
    if (this.disabled) return false;
    try {
      await requestPermission();
      return true;
    } catch {
      return false;
    }
  }

  async checkAndInitialize() {
    if (this.disabled) return false;
    try {
      const hasPermission = await checkPermission();
      if (!hasPermission) return false;
      await initialize();
      return true;
    } catch (error) {
      console.warn('Bubble initialization failed', error);
      this.disabled = true;
      return false;
    }
  }

  async showBubble(x: number = 100, y: number = 200, text: string = '0/5') {
    if (this.disabled) return;
    try {
      const isInitialized = await this.checkAndInitialize();
      if (!isInitialized) return;

      await showFloatingBubble(x, y);
      this.isShown = true;
      if (setBubbleText) {
        setBubbleText(text);
      }
    } catch (error) {
      console.warn('showBubble failed', error);
    }
  }

  async hideBubble() {
    if (this.disabled) return;
    try {
      await hideFloatingBubble();
      this.isShown = false;
    } catch (error) {
      console.warn('hideBubble failed', error);
    }
  }

  updateText(text: string) {
    if (!this.disabled && this.isShown && setBubbleText) {
      setBubbleText(text);
    }
  }

  setupListeners(
    onPress: () => void,
    onRemove: () => void,
    onLongPress?: () => void
  ) {
    if (this.disabled || !NativeModules.RNFloatingBubble) return;

    const eventEmitter = new NativeEventEmitter(NativeModules.RNFloatingBubble);
    
    this.listeners.push(
      eventEmitter.addListener('floating-bubble-press', onPress),
      eventEmitter.addListener('floating-bubble-remove', onRemove)
    );

    if (onLongPress) {
      this.listeners.push(
        eventEmitter.addListener('floating-bubble-long-press', onLongPress)
      );
    }
  }

  clearListeners() {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }
}

export default new FloatingBubbleService();
