import { NativeEventEmitter, NativeModules, EmitterSubscription } from 'react-native';
import { showFloatingBubble, hideFloatingBubble, checkPermission, initialize } from 'react-native-floating-bubble';

class FloatingBubbleService {
  private disabled: boolean = false;
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
      // Assuming setBubbleText is exposed or handled natively? 
      // Some forks of RNFloatingBubble have it. 
      // If not, we just show it.
    } catch (error) {
      console.warn('showBubble failed', error);
    }
  }

  async hideBubble() {
    if (this.disabled) return;
    try {
      await hideFloatingBubble();
    } catch (error) {
      console.warn('hideBubble failed', error);
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
