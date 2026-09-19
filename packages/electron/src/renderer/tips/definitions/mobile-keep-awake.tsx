/**
 * Tip: Mobile Keep-Awake
 *
 * Shows when user has sync enabled and effective sleep prevention is 'off',
 * suggesting they enable keep-awake so their computer doesn't sleep
 * while mobile sync is active.
 */

import React from 'react';
import { store } from '@nimbalyst/runtime/store';
import { syncConfigAtom, setSyncConfigAtom } from '../../store/atoms/appSettings';
import { openSettingsCommandAtom } from '../../store/atoms/settingsNavigation';
import type { TipDefinition } from '../types';
import i18next from 'i18next';

const PowerIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

export const mobileKeepAwakeTip: TipDefinition = {
  id: 'tip-mobile-keep-awake',
  name: 'Mobile Keep-Awake Suggestion',
  version: 1,
  trigger: {
    screen: '*',
    condition: () => {
      const syncConfig = store.get(syncConfigAtom);
      const effectivePreventSleepMode =
        syncConfig.preventSleepMode ?? (syncConfig.preventSleepWhenSyncing ? 'always' : 'off');

      return syncConfig.enabled && effectivePreventSleepMode === 'off';
    },
    delay: 3000,
    priority: 10,
  },
  content: {
    icon: PowerIcon,
    title: i18next.t('tip_mobile_keep_awake.title', 'Keep your computer awake for mobile prompts'),
    body: i18next.t('tip_mobile_keep_awake.body', 'Your computer going to sleep will disconnect mobile sync. Enable keep-awake while plugged in to prevent this.'),
    action: {
      label: i18next.t('tip_mobile_keep_awake.enable', 'Enable Keep-Awake'),
      onClick: () => {
        window.electronAPI.invoke('sync:set-prevent-sleep', 'pluggedIn');
        // Update local atom so the condition immediately reflects the change
        // setSyncConfigAtom does a partial merge internally
        store.set(setSyncConfigAtom, { preventSleepMode: 'pluggedIn' });
      },
      variant: 'primary',
    },
    secondaryAction: {
      label: i18next.t('tip_mobile_keep_awake.sync_settings', 'Sync Settings'),
      onClick: () => {
        store.set(openSettingsCommandAtom, { category: 'sync', timestamp: Date.now() });
      },
      variant: 'link',
    },
  },
};
