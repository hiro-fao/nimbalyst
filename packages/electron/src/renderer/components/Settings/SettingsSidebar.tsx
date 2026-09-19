import React, { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  FloatingPortal,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { windowControlsClearance } from '@nimbalyst/runtime/ui/floating/windowControlsClearance';
import { MaterialSymbol } from '@nimbalyst/runtime/ui/icons/MaterialSymbol';
import { getProviderIcon } from '@nimbalyst/runtime/ui/icons/ProviderIcons';
import { AlphaBadge, SETTINGS_ALPHA_TOOLTIP } from '../common/AlphaBadge';
import { TEAM_BETA_TOOLTIP } from '../common/TeamBetaNotice';
import { useTranslation } from 'react-i18next';
import { developerModeAtom } from '../../store/atoms/appSettings';
import { teamsConfiguredAtom } from '../../store/atoms/settingsDomains';
import {
  getSettingsRoutesForScope,
  type SettingsCategory,
  type ExtensionSettingsRoute,
  type SettingsRoute,
  type SettingsScope,
} from './settingsRoutes';

export type { SettingsCategory, SettingsScope } from './settingsRoutes';

interface SettingsSidebarProps {
  selectedCategory: SettingsCategory | string;
  onSelectCategory: (category: SettingsCategory | string) => void;
  providerStatus?: Record<string, { enabled: boolean; testStatus?: string }>;
  scope?: SettingsScope;
  showDirectChatProviders: boolean;
  extensionRoutes?: readonly ExtensionSettingsRoute[];
}

function routeIcon(route: SettingsRoute): React.ReactNode {
  if (['claude-code', 'claude', 'openai', 'openai-codex', 'opencode', 'copilot-cli', 'grok-build', 'cursor-agent', 'antigravity-gemini-agent', 'lmstudio'].includes(route.id)) {
    const providerId = route.id === 'openai-codex' ? 'openai' : route.id;
    return getProviderIcon(providerId, { size: 16 });
  }
  return <MaterialSymbol icon={route.icon} size={16} />;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  providerStatus = {},
  scope = 'application',
  showDirectChatProviders,
  extensionRoutes = [],
}) => {
  const { t } = useTranslation();
  const developerMode = useAtomValue(developerModeAtom);
  const teamsConfigured = useAtomValue(teamsConfiguredAtom);
  const [extAgentProviders, setExtAgentProviders] = useState<
    Array<{ id: string; name: string; icon?: string; status: string }>
  >([]);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const { refs, floatingStyles } = useFloating({
    open: tooltipText !== null,
    placement: 'right',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 }), windowControlsClearance()],
  });

  useEffect(() => {
    let cancelled = false;
    const invoke = window.electronAPI?.invoke;
    if (!invoke) return;
    invoke('agent-providers:list')
      .then((res: { success?: boolean; data?: Array<{ id: string; name: string; icon?: string; status: string }> }) => {
        if (!cancelled && res?.success && Array.isArray(res.data)) setExtAgentProviders(res.data);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map<string, Array<SettingsRoute | { id: string; label: string; icon?: string; status: string }>>();
    for (const route of getSettingsRoutesForScope(
      scope,
      { developerMode, showDirectChatProviders, teamsConfigured },
      extensionRoutes,
    )) {
      const entries = grouped.get(route.group) ?? [];
      entries.push(route);
      grouped.set(route.group, entries);
    }
    if (scope === 'application' && extAgentProviders.length > 0) {
      const entries = grouped.get('Agent Providers') ?? [];
      entries.push(...extAgentProviders.map((provider) => ({ ...provider, label: provider.name })));
      grouped.set('Agent Providers', entries);
    }
    return [...grouped.entries()];
  }, [developerMode, extAgentProviders, extensionRoutes, scope, showDirectChatProviders, teamsConfigured]);

  return (
    <aside
      className=\"settings-sidebar w-[240px] shrink-0 border-r border-[var(--nim-border)] bg-[var(--nim-bg)] overflow-y-auto\"
      data-testid=\"settings-sidebar\"
      data-component=\"SettingsSidebar\"
    >
      <div className=\"settings-sidebar-content p-3\">\n        {groups.map(([group, routes]) => (\n          <section key={group} className=\"settings-sidebar-group mb-4\" data-testid={`settings-group-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>\n            <div className=\"settings-sidebar-group-title flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--nim-text-muted)]\">\n              {t(`settings.groups.${group}`, group)}\n              {t(`settings.group_descriptions.${group}`, '').length > 0 && (\n                <button\n                  type=\"button\"\n                  className=\"settings-sidebar-group-info inline-flex border-0 bg-transparent p-0 text-[var(--nim-text-faint)] hover:text-[var(--nim-text-muted)]\"\n                  aria-label={`About ${group}`}\n                  onMouseEnter={(event) => {\n                    refs.setReference(event.currentTarget);\n                    setTooltipText(t(`settings.group_descriptions.${group}`, ''));\n                  }}\n                  onMouseLeave={() => setTooltipText(null)}\n                  onFocus={(event) => {\n                    refs.setReference(event.currentTarget);\n                    setTooltipText(t(`settings.group_descriptions.${group}`, ''));\n                  }}\n                  onBlur={() => setTooltipText(null)}\n                >\n                  <MaterialSymbol icon=\"info\" size={14} />\n                </button>\n              )}\n            </div>\n            {routes.map((route) => {\n              const isSettingsRoute = 'source' in route;\n              const id = route.id;\n              const providerState = providerStatus[id];\n              const status = !isSettingsRoute\n                ? route.status\n                : providerState?.enabled ? providerState.testStatus : undefined;\n              return (\n                <button\n                  key={id}\n                  type=\"button\"\n                  data-testid={`settings-route-${id}`}\n                  className={`settings-sidebar-item w-full flex items-center gap-2 px-2 py-1.5 rounded text-left cursor-pointer text-sm transition-colors ${\n                    selectedCategory === id\n                      ? 'bg-[var(--nim-bg-selected)] text-[var(--nim-text)]'\n                      : 'bg-transparent text-[var(--nim-text-muted)] hover:bg-[var(--nim-bg-hover)] hover:text-[var(--nim-text)]'\n                  }`}\n                  onClick={() => onSelectCategory(id)}\n                >\n                  <span className=\"settings-sidebar-item-icon flex items-center justify-center w-5 h-5 shrink-0 text-[var(--nim-text-muted)]\">\n                    {isSettingsRoute\n                      ? routeIcon(route)\n                      : route.icon ? <MaterialSymbol icon={route.icon} size={16} /> : getProviderIcon(id, { size: 16 })}\n                  </span>\n                  <span className=\"settings-sidebar-item-name flex-1 truncate\">{t(`settings.labels.${route.label}`, route.label)}</span>\n                  {isSettingsRoute && route.source === 'builtin' && route.isAlpha && (\n                    <AlphaBadge\n                      size=\"xs\"\n                      stage={route.id === 'project-sharing' ? 'beta' : 'alpha'}\n                      tooltip={route.id === 'project-sharing' ? TEAM_BETA_TOOLTIP : SETTINGS_ALPHA_TOOLTIP}\n                    />\n                  )}\n                  {(status === 'success' || status === 'active' || status === 'error' || status === 'denied') && (\n                    <span className={`settings-sidebar-item-status h-2 w-2 rounded-full ${status === 'success' || status === 'active' ? 'bg-[var(--nim-success)]' : 'bg-[var(--nim-error)]'}`} />\n                  )}\n                </button>\n              );\n            })}\n          </section>\n        ))}\n      </div>\n\n      {tooltipText && (\n        <FloatingPortal>\n          <div\n            ref={refs.setFloating}\n            style={floatingStyles}\n            role=\"tooltip\"\n            className=\"settings-sidebar-tooltip z-[10000] max-w-[280px] rounded-lg border border-[var(--nim-border)] bg-[var(--nim-bg-tertiary)] px-3 py-2 text-sm text-[var(--nim-text)] shadow-lg\"\n          >\n            {tooltipText}\n          </div>\n        </FloatingPortal>\n      )}\n  );\n};\n