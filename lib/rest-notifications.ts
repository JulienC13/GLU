import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification locale + son de fin de repos. Fonctionne même si l'app passe
 * en arrière-plan pendant le repos (écran éteint, changement d'app…).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensureChannel() {
  if (channelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('rest-timer', {
    name: 'Fin de repos',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  channelReady = true;
}

let permissionRequested = false;

async function ensurePermission() {
  if (permissionRequested) return;
  permissionRequested = true;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

/** Programme la notification/son de fin de repos, dans `seconds` secondes. */
export async function scheduleRestEndNotification(seconds: number): Promise<string | null> {
  try {
    await ensurePermission();
    await ensureChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Repos terminé 💪',
        body: 'Prochaine série, on y retourne !',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: 'rest-timer',
      },
    });
  } catch (e) {
    console.warn('[GLU] Notification de repos indisponible', e);
    return null;
  }
}

export async function cancelRestEndNotification(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // déjà déclenchée ou annulée — sans conséquence
  }
}
