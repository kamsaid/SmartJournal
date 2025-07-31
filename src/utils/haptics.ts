// Haptic Feedback Utilities - Enhanced tactile feedback system
import * as Haptics from 'expo-haptics';
import { HAPTICS } from '@/design-system';

// Enhanced haptic feedback patterns
export class HapticManager {
  private static isEnabled = true;
  
  // Enable/disable haptic feedback globally
  static setEnabled(enabled: boolean) {
    HapticManager.isEnabled = enabled;
  }
  
  static getEnabled(): boolean {
    return HapticManager.isEnabled;
  }

  // Basic haptic feedback - convert HAPTICS constants to Expo haptics
  static async trigger(type: keyof typeof HAPTICS, options?: {
    enableVibrateFallback?: boolean;
    ignoreAndroidSystemSettings?: boolean;
  }) {
    if (!HapticManager.isEnabled) return;
    
    const hapticType = HAPTICS[type];
    
    try {
      switch (hapticType) {
        case 'impactLight':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impactMedium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impactHeavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'notificationSuccess':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'notificationWarning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'notificationError':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          // Fallback to light impact
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently handle haptic errors - they're not critical to app functionality
      console.warn('Haptic feedback error:', error);
    }
  }

  // Helper method for direct haptic calls
  private static async triggerDirect(hapticType: string) {
    if (!HapticManager.isEnabled) return;
    
    try {
      switch (hapticType) {
        case 'impactLight':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impactMedium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impactHeavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'notificationSuccess':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'notificationWarning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'notificationError':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  // Contextual haptic patterns
  static async success() {
    if (!HapticManager.isEnabled) return;
    
    // Triple light impact for success
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 50);
    setTimeout(() => HapticManager.triggerDirect('notificationSuccess'), 100);
  }

  static async error() {
    if (!HapticManager.isEnabled) return;
    
    // Strong impact followed by notification error
    await HapticManager.triggerDirect('impactHeavy');
    setTimeout(() => HapticManager.triggerDirect('notificationError'), 100);
  }

  static async warning() {
    if (!HapticManager.isEnabled) return;
    
    // Medium impact followed by notification warning
    await HapticManager.triggerDirect('impactMedium');
    setTimeout(() => HapticManager.triggerDirect('notificationWarning'), 100);
  }

  static async buttonPress() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactLight');
  }

  static async cardTap() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactMedium');
  }

  static async longPress() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactHeavy');
  }

  static async selection() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('selection');
  }

  static async swipe() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactLight');
  }

  static async threshold() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactMedium');
  }

  static async celebration() {
    if (!HapticManager.isEnabled) return;
    
    // Celebratory pattern
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 100);
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 200);
    setTimeout(() => HapticManager.triggerDirect('notificationSuccess'), 300);
  }

  static async heartbeat() {
    if (!HapticManager.isEnabled) return;
    
    // Heartbeat-like pattern
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 150);
  }

  static async pulse() {
    if (!HapticManager.isEnabled) return;
    
    // Gentle pulse
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 300);
  }

  static async knock() {
    if (!HapticManager.isEnabled) return;
    
    // Double knock pattern
    await HapticManager.triggerDirect('impactMedium');
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 100);
  }

  static async typewriter() {
    if (!HapticManager.isEnabled) return;
    
    // Subtle typing feedback
    await HapticManager.triggerDirect('selection');
  }

  static async refresh() {
    if (!HapticManager.isEnabled) return;
    
    // Pull-to-refresh pattern
    await HapticManager.triggerDirect('impactMedium');
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 50);
  }

  static async loading() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactLight');
  }

  static async navigation() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('selection');
  }

  static async focus() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('impactLight');
  }

  static async blur() {
    if (!HapticManager.isEnabled) return;
    await HapticManager.triggerDirect('selection');
  }

  // Complex contextual patterns
  static async checkInComplete() {
    if (!HapticManager.isEnabled) return;
    
    // Completion celebration
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 80);
    setTimeout(() => HapticManager.triggerDirect('notificationSuccess'), 160);
  }

  static async journalSave() {
    if (!HapticManager.isEnabled) return;
    
    // Gentle save confirmation
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('selection'), 50);
  }

  static async insightDiscovered() {
    if (!HapticManager.isEnabled) return;
    
    // Eureka moment
    await HapticManager.triggerDirect('impactMedium');
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 100);
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 200);
  }

  static async progressMilestone() {
    if (!HapticManager.isEnabled) return;
    
    // Achievement unlocked
    await HapticManager.triggerDirect('impactHeavy');
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 100);
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 200);
  }

  static async streakContinued() {
    if (!HapticManager.isEnabled) return;
    
    // Encouraging streak pattern
    await HapticManager.triggerDirect('impactLight');
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 60);
    setTimeout(() => HapticManager.triggerDirect('impactMedium'), 120);
  }

  static async levelUp() {
    if (!HapticManager.isEnabled) return;
    
    // Level progression
    await HapticManager.triggerDirect('impactMedium');
    setTimeout(() => HapticManager.triggerDirect('impactHeavy'), 100);
    setTimeout(() => HapticManager.triggerDirect('notificationSuccess'), 200);
    setTimeout(() => HapticManager.triggerDirect('impactLight'), 300);
  }

  // Animated haptic sequences
  static async playSequence(pattern: {
    type: keyof typeof HAPTICS;
    delay: number;
  }[]) {
    if (!HapticManager.isEnabled) return;
    
    for (const step of pattern) {
      await new Promise<void>(resolve => {
        setTimeout(async () => {
          await HapticManager.trigger(step.type);
          resolve();
        }, step.delay);
      });
    }
  }

  // Context-aware haptic feedback
  static async contextual(context: string, intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!HapticManager.isEnabled) return;
    
    const contextMap: Record<string, () => Promise<void>> = {
      'auth-success': () => HapticManager.success(),
      'auth-error': () => HapticManager.error(),
      'checkin-start': () => HapticManager.buttonPress(),
      'checkin-complete': () => HapticManager.checkInComplete(),
      'journal-save': () => HapticManager.journalSave(),
      'insight-found': () => HapticManager.insightDiscovered(),
      'milestone': () => HapticManager.progressMilestone(),
      'streak': () => HapticManager.streakContinued(),
      'level-up': () => HapticManager.levelUp(),
      'tab-switch': () => HapticManager.navigation(),
      'card-tap': () => HapticManager.cardTap(),
      'swipe': () => HapticManager.swipe(),
      'focus': () => HapticManager.focus(),
      'blur': () => HapticManager.blur(),
      'refresh': () => HapticManager.refresh(),
      'celebration': () => HapticManager.celebration(),
      'theme-change': () => HapticManager.selection(),
    };

    const contextualFeedback = contextMap[context];
    if (contextualFeedback) {
      await contextualFeedback();
    } else {
      // Fallback to intensity-based feedback
      const intensityMap = {
        light: 'impactLight',
        medium: 'impactMedium',
        heavy: 'impactHeavy',
      } as const;
      
      await HapticManager.triggerDirect(intensityMap[intensity]);
    }
  }
}

// Hook for haptic feedback
export const useHaptic = () => {
  return {
    trigger: HapticManager.trigger,
    success: HapticManager.success,
    error: HapticManager.error,
    warning: HapticManager.warning,
    buttonPress: HapticManager.buttonPress,
    cardTap: HapticManager.cardTap,
    longPress: HapticManager.longPress,
    selection: HapticManager.selection,
    swipe: HapticManager.swipe,
    threshold: HapticManager.threshold,
    celebration: HapticManager.celebration,
    heartbeat: HapticManager.heartbeat,
    pulse: HapticManager.pulse,
    knock: HapticManager.knock,
    typewriter: HapticManager.typewriter,
    refresh: HapticManager.refresh,
    loading: HapticManager.loading,
    navigation: HapticManager.navigation,
    focus: HapticManager.focus,
    blur: HapticManager.blur,
    checkInComplete: HapticManager.checkInComplete,
    journalSave: HapticManager.journalSave,
    insightDiscovered: HapticManager.insightDiscovered,
    progressMilestone: HapticManager.progressMilestone,
    streakContinued: HapticManager.streakContinued,
    levelUp: HapticManager.levelUp,
    playSequence: HapticManager.playSequence,
    contextual: HapticManager.contextual,
    setEnabled: HapticManager.setEnabled,
    getEnabled: HapticManager.getEnabled,
  };
};

export default HapticManager;