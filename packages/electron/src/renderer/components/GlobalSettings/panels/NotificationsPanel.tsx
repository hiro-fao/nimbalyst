import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { SettingsToggle } from '../SettingsToggle';
import {
  notificationSettingsAtom,
  setNotificationSettingsAtom,
  type CompletionSoundType,
} from '../../../store/atoms/appSettings';
import { getSoundPlayer } from '../../../services/SoundPlayer';

function getCustomSoundErrorMessage(t: (key: string, options?: any) => string, error: string, maxBytes?: number): string {
  switch (error) {
    case 'too-large':
      return t('notifications.custom_sound_errors.too_large', { max: Math.round((maxBytes ?? 0) / 1024 / 1024), defaultValue: `That file is too large (max ${Math.round((maxBytes ?? 0) / 1024 / 1024)} MB).` });
    case 'invalid':
      return t('notifications.custom_sound_errors.invalid', 'That file does not look like a supported audio file.');
    case 'copy-failed':
      return t('notifications.custom_sound_errors.copy_failed', 'Could not save that file. Please try another.');
    case 'unreadable':
      return t('notifications.custom_sound_errors.unreadable', 'That file could not be read.');
    default:
      return t('notifications.custom_sound_errors.default', 'Could not use that file.');
  }
}

/**
 * NotificationsPanel - Self-contained settings panel for notifications.
 *
 * This component subscribes directly to Jotai atoms instead of receiving props.
 * Changes are automatically persisted via the setter atom.
 */
export function NotificationsPanel() {
  const { t } = useTranslation();
  const [settings] = useAtom(notificationSettingsAtom);
  const [, updateSettings] = useAtom(setNotificationSettingsAtom);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [notificationHelp, setNotificationHelp] = useState<string | null>(null);
  const [customSoundError, setCustomSoundError] = useState<string | null>(null);

  const { completionSoundEnabled, completionSoundType, completionSoundCustomName, completionSoundVolume, osNotificationsEnabled, notifyWhenFocused } = settings;

  // play-completion-sound is handled by store/listeners/soundListeners.ts.

  const handleTestSound = async () => {
    if (!window.electronAPI) return;

    setIsTestPlaying(true);
    try {
      // Pass the live volume so the test reflects the current slider position
      // immediately, without waiting for the debounced persist to land.
      await window.electronAPI.invoke('completion-sound:test', completionSoundType, completionSoundVolume);
    } catch (error) {
      console.error('Failed to test sound:', error);
    } finally {
      setTimeout(() => setIsTestPlaying(false), 500);
    }
  };

  const handleChooseCustomSound = async () => {
    if (!window.electronAPI) return;
    setCustomSoundError(null);
    try {
      const result = await window.electronAPI.invoke('completion-sound:choose-custom');
      if (!result) return; // user cancelled the dialog
      if (result.error) {
        setCustomSoundError(getCustomSoundErrorMessage(t, result.error, result.maxBytes));
        return;
      }
      if (result.fileName) {
        // Confirm the file actually decodes before committing the selection.
        const decodable = await getSoundPlayer().validateCustomSound();
        if (!decodable) {
          await window.electronAPI.invoke('completion-sound:clear-custom');
          setCustomSoundError('That audio file could not be decoded. Please choose a different file.');
          return;
        }
        updateSettings({ completionSoundType: 'custom', completionSoundCustomName: result.fileName });
      }
    } catch (error) {
      console.error('Failed to choose custom sound:', error);
      setCustomSoundError('Could not use that file.');
    }
  };

  const handleClearCustomSound = async () => {
    if (!window.electronAPI) return;
    setCustomSoundError(null);
    try {
      await window.electronAPI.invoke('completion-sound:clear-custom');
      updateSettings({ completionSoundType: 'chime', completionSoundCustomName: null });
    } catch (error) {
      console.error('Failed to clear custom sound:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.invoke('notifications:show-test');
    if (result?.success) {
      setNotificationHelp(t('notifications.os.test_sent', 'A test notification was sent. If you do not see it, open your OS notification settings and allow Nimbalyst notifications.'));
    } else {
      setNotificationHelp(result?.error || t('notifications.os.test_failed', 'Failed to show a test notification.'));
    }
  };

  const handleOpenNotificationSettings = async () => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.invoke('notifications:open-system-settings');
    if (!result?.success) {
      setNotificationHelp(result?.error || 'Failed to open system notification settings.');
    }
  };

  return (
    <div className="provider-panel flex flex-col">
      <div className="provider-panel-header mb-6 pb-4 border-b border-[var(--nim-border)]">
        <h3 className="provider-panel-title text-xl font-semibold leading-tight mb-2 text-[var(--nim-text)]">{t('notifications.title', 'Notifications')}</h3>
        <p className="provider-panel-description text-sm leading-relaxed text-[var(--nim-text-muted)]">
          {t('notifications.description', 'Configure audio and visual notifications for AI interactions.')}
        </p>
      </div>

      <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)] last:border-b-0 last:mb-0 last:pb-0">
        <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('notifications.completion_sounds.title', 'Completion Sounds')}</h4>
        <p className="text-sm leading-relaxed text-[var(--nim-text-muted)] mb-4">
          {t('notifications.completion_sounds.description', 'Play a sound when the AI or agent completes a turn and is ready for more input.')}
        </p>

        <SettingsToggle
          checked={completionSoundEnabled}
          onChange={(checked) => updateSettings({ completionSoundEnabled: checked })}
          name={t('notifications.completion_sounds.enable', 'Enable Completion Sounds')}
          description={t('notifications.completion_sounds.enable_desc', 'Play an audio notification when AI chat or agent completes a response.')}
        />

        {completionSoundEnabled && (
          <div className="setting-item py-3 mt-4">
            <div className="setting-text flex flex-col gap-0.5">
              <span className="setting-name text-sm font-medium text-[var(--nim-text)]">{t('notifications.completion_sounds.sound_type', 'Sound Type')}</span>
              <span className="setting-description text-xs leading-relaxed text-[var(--nim-text-muted)]">
                {t('notifications.completion_sounds.sound_type_desc', 'Choose the sound to play when a response completes.')}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {(['chime', 'bell', 'pop', 'custom'] as CompletionSoundType[]).map((sound) => (
                <label key={sound} className="setting-radio-label flex items-center gap-2 cursor-pointer text-sm text-[var(--nim-text)]">
                  <input
                    type="radio"
                    name="sound-type"
                    value={sound}
                    checked={completionSoundType === sound}
                    onChange={(e) => updateSettings({ completionSoundType: e.target.value as CompletionSoundType })}
                    className="setting-radio w-4 h-4 cursor-pointer shrink-0 accent-[var(--nim-primary)]"
                  />
                  <span className="capitalize">{t(`notifications.completion_sounds.sounds.${sound}`, sound)}</span>
                </label>
              ))}
            </div>

            {completionSoundType === 'custom' && (
              <div className="completion-sound-custom mt-3 flex flex-col gap-2">
                <span className="text-xs leading-relaxed text-[var(--nim-text-muted)]">
                  {completionSoundCustomName
                    ? t('notifications.completion_sounds.custom_selected', { name: completionSoundCustomName, defaultValue: `Selected: ${completionSoundCustomName}` })
                    : t('notifications.completion_sounds.custom_none', 'No custom sound selected yet.')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleChooseCustomSound} className="nim-btn-secondary text-sm">
                    {completionSoundCustomName ? t('notifications.completion_sounds.change_file', 'Change File...') : t('notifications.completion_sounds.choose_file', 'Choose File...')}
                  </button>
                  {completionSoundCustomName && (
                    <button onClick={handleClearCustomSound} className="nim-btn-secondary text-sm">
                      {t('notifications.completion_sounds.remove', 'Remove')}
                    </button>
                  )}
                </div>
                <span className="text-xs leading-relaxed text-[var(--nim-text-muted)]">
                  {t('notifications.completion_sounds.supported_formats', 'Supports MP3, WAV, OGG, M4A, AAC, and FLAC.')}
                </span>
                {customSoundError && (
                  <span className="completion-sound-custom-error text-xs leading-relaxed text-[var(--nim-error)]">
                    {customSoundError}
                  </span>
                )}
              </div>
            )}

            <div className="setting-text flex flex-col gap-0.5 mt-4">
              <div className="flex items-center justify-between">
                <span className="setting-name text-sm font-medium text-[var(--nim-text)]">{t('notifications.completion_sounds.volume', 'Volume')}</span>
                <span className="setting-value text-xs font-medium tabular-nums text-[var(--nim-text-muted)]">
                  {completionSoundVolume}%
                </span>
              </div>
              <span className="setting-description text-xs leading-relaxed text-[var(--nim-text-muted)]">
                {t('notifications.completion_sounds.volume_desc', 'Playback volume as a percentage of your system volume.')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={completionSoundVolume}
              onChange={(e) => updateSettings({ completionSoundVolume: Number(e.target.value) })}
              aria-label="Completion sound volume"
              className="w-full mt-2 cursor-pointer accent-[var(--nim-primary)]"
            />

            <button
              onClick={handleTestSound}
              disabled={isTestPlaying || (completionSoundType === 'custom' && !completionSoundCustomName)}
              className="nim-btn-secondary text-sm mt-3"
            >
              {isTestPlaying ? t('notifications.completion_sounds.playing', 'Playing...') : t('notifications.completion_sounds.test_sound', 'Test Sound')}
            </button>
          </div>
        )}
      </div>

      <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)] last:border-b-0 last:mb-0 last:pb-0">
        <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('notifications.os.title', 'OS Notifications')}</h4>
        <p className="text-sm leading-relaxed text-[var(--nim-text-muted)] mb-4">
          {t('notifications.os.description', 'Show system notifications when AI responses complete while the app is in the background.')}
        </p>

        <SettingsToggle
          checked={osNotificationsEnabled}
          onChange={(checked) => {
            updateSettings({ osNotificationsEnabled: checked });
            if (checked) {
              void handleTestNotification();
            } else {
              setNotificationHelp(null);
            }
          }}
          name={t('notifications.os.enable', 'Enable OS Notifications')}
          description={t('notifications.os.enable_desc', 'Native system notifications when AI completes a response. Respects Do Not Disturb.')}
        />

        {osNotificationsEnabled && (
          <>
            <SettingsToggle
              checked={notifyWhenFocused}
              onChange={(checked) => updateSettings({ notifyWhenFocused: checked })}
              name={t('notifications.os.notify_when_focused', 'Notify Even When Focused')}
              description={t('notifications.os.notify_when_focused_desc', 'Show notifications even when the app is focused, unless viewing that session.')}
            />

            <div className="setting-item py-3">
              <div className="setting-text flex flex-col gap-2">
                <span className="setting-description text-xs leading-relaxed text-[var(--nim-text-muted)]">
                  {t('notifications.os.help', 'Electron does not expose a reliable cross-platform notification permission state here. Use a test notification to trigger the OS prompt or verify delivery.')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleTestNotification} className="nim-btn-secondary text-sm">
                    {t('notifications.os.send_test', 'Send Test Notification')}
                  </button>
                  <button onClick={handleOpenNotificationSettings} className="nim-btn-secondary text-sm">
                    {t('notifications.os.open_settings', 'Open System Notification Settings')}
                  </button>
                </div>
                {notificationHelp && (
                  <span className="text-xs leading-relaxed text-[var(--nim-text-muted)]">{notificationHelp}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)] last:border-b-0 last:mb-0 last:pb-0">
        <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('notifications.session_blocked.title', 'Session Blocked Notifications')}</h4>
        <p className="text-sm leading-relaxed text-[var(--nim-text-muted)] mb-4">
          {t('notifications.session_blocked.description', 'Show system notifications when an AI session needs your input.')}
        </p>

        <SettingsToggle
          checked={settings.sessionBlockedNotificationsEnabled}
          onChange={(checked) => updateSettings({ sessionBlockedNotificationsEnabled: checked })}
          name={t('notifications.session_blocked.enable', 'Notify When Session Needs Attention')}
          description={t('notifications.session_blocked.enable_desc', 'Notify when a session is waiting for input (permissions, questions, plan reviews, commits).')}
        />
      </div>
    </div>
  );
}
