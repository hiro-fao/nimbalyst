/**
 * The document view's right-panel surfaces, in one place: the panel renders
 * them, the window top bar's split button lists them.
 *
 * Kept out of `TrackerDocumentPanel` so WindowTopBar doesn't drag the whole
 * chat stack in behind a list of two labels.
 */

import type { TrackerDocumentPanelMode } from '../../store/atoms/trackers';

export interface TrackerDocumentPanelModeOption {
  id: TrackerDocumentPanelMode;
  /** English fallback label; render via i18next using `labelKey`. */
  label: string;
  /** i18next key for the translated label (namespace: tracker_document_panel_modes). */
  labelKey: string;
  icon: string;
}

export const TRACKER_DOCUMENT_PANEL_MODES: readonly TrackerDocumentPanelModeOption[] = [
  { id: 'chat', label: 'Chat about this item', labelKey: 'tracker_document_panel_modes.chat', icon: 'forum' },
  { id: 'discussion', label: 'Discussion', labelKey: 'tracker_document_panel_modes.discussion', icon: 'chat' },
];
