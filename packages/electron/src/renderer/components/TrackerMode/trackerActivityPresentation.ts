import type { TFunction } from 'react-i18next';

interface TrackerActivityLike {
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

function quoted(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  const bounded = compact.length > 80 ? `${compact.slice(0, 77)}…` : compact;
  return `“${bounded}”`;
}

function changed(label: string, entry: TrackerActivityLike, t: TFunction): string {
  if (entry.oldValue !== undefined && entry.newValue !== undefined) {
    return t('tracker_activity_presentation.changed_from_to', 'changed {{label}} from {{oldValue}} to {{newValue}}', {
      label,
      oldValue: quoted(entry.oldValue),
      newValue: quoted(entry.newValue),
    });
  }
  if (entry.newValue !== undefined) {
    return t('tracker_activity_presentation.changed_to', 'changed {{label}} to {{newValue}}', {
      label,
      newValue: quoted(entry.newValue),
    });
  }
  return t('tracker_activity_presentation.updated', 'updated {{label}}', { label });
}

export function formatTrackerActivity(entry: TrackerActivityLike, t: TFunction): string {
  if (entry.action === 'created') return t('tracker_activity_presentation.created', 'created this item');
  if (entry.action === 'commented') return t('tracker_activity_presentation.commented', 'added a comment');
  if (entry.action === 'comment_updated') {
    if (entry.oldValue !== undefined && entry.newValue !== undefined) {
      return t('tracker_activity_presentation.comment_updated_from_to', 'edited a comment from {{oldValue}} to {{newValue}}', {
        oldValue: quoted(entry.oldValue),
        newValue: quoted(entry.newValue),
      });
    }
    return t('tracker_activity_presentation.comment_updated', 'edited a comment');
  }
  if (entry.action === 'comment_deleted') {
    return entry.oldValue !== undefined
      ? t('tracker_activity_presentation.comment_deleted_with_value', 'deleted comment {{value}}', { value: quoted(entry.oldValue) })
      : t('tracker_activity_presentation.comment_deleted', 'deleted a comment');
  }
  if (entry.action === 'archived') {
    return entry.newValue === 'true'
      ? t('tracker_activity_presentation.archived', 'archived this item')
      : t('tracker_activity_presentation.unarchived', 'unarchived this item');
  }
  if (entry.action === 'status_changed') return changed(t('tracker_activity_presentation.field_status', 'status'), entry, t);
  if (entry.action === 'type_changed') return changed(t('tracker_activity_presentation.field_type', 'type'), entry, t);
  if (entry.field) return changed(entry.field, entry, t);
  return entry.action.replace(/_/g, ' ');
}
