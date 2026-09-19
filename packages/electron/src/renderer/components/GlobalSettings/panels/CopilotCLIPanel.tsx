import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProviderConfig } from '../../Settings/SettingsView';
import { SettingsToggle } from '../SettingsToggle';
import { AlphaBadge, SETTINGS_ALPHA_TOOLTIP } from '../../common/AlphaBadge';

interface CopilotCLIPanelProps {
  config: ProviderConfig;
  apiKeys: Record<string, string>;
  availableModels: any[];
  loading: boolean;
  onToggle: (enabled: boolean) => void;
  onApiKeyChange: (key: string, value: string) => void;
  onModelToggle: (modelId: string, enabled: boolean) => void;
  onSelectAllModels: (selectAll: boolean) => void;
  onTestConnection: () => Promise<void>;
  onConfigChange: (updates: Partial<ProviderConfig>) => void;
}

type CLIStatus = 'checking' | 'installed' | 'not-installed' | 'installing' | 'install-error';

export function CopilotCLIPanel({
  config,
  onToggle,
}: CopilotCLIPanelProps) {
  const { t } = useTranslation();
  const [cliStatus, setCLIStatus] = useState<CLIStatus>('checking');
  const [cliVersion, setCLIVersion] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const checkCLI = useCallback(async () => {
    setCLIStatus('checking');
    try {
      const result = await window.electronAPI.invoke('cli:checkInstallation', 'copilot-cli');
      if (result?.installed) {
        setCLIVersion(result.version || null);
        setCLIStatus('installed');
      } else {
        setCLIStatus('not-installed');
      }
    } catch {
      setCLIStatus('not-installed');
    }
  }, []);

  useEffect(() => {
    checkCLI();
  }, [checkCLI]);

  const handleInstall = async () => {
    setCLIStatus('installing');
    setInstallError(null);
    try {
      await window.electronAPI.invoke('cli:install', 'copilot-cli', {});
      await checkCLI();
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : String(err));
      setCLIStatus('install-error');
    }
  };

  return (
    <div className="provider-panel flex flex-col">
      <div className="provider-panel-header mb-6 pb-4 border-b border-[var(--nim-border)]">
        <h3 className="provider-panel-title text-xl font-semibold leading-tight mb-2 text-[var(--nim-text)] flex items-center gap-2">
          {t('copilot_cli.title', 'GitHub Copilot')}
          <AlphaBadge size="sm" tooltip={SETTINGS_ALPHA_TOOLTIP} />
        </h3>
        <p className="provider-panel-description text-sm leading-relaxed text-[var(--nim-text-muted)]">
          {t('copilot_cli.description', 'GitHub Copilot coding agent via the ACP (Agent Communication Protocol) server mode. Uses your existing Copilot CLI login for authentication.')}
        </p>
      </div>

      <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)]">
        <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('copilot_cli.cli_title', 'Copilot CLI')}</h4>

        {cliStatus === 'checking' && (
          <p className="text-[13px] text-[var(--nim-text-muted)]">{t('copilot_cli.checking', 'Checking for Copilot CLI...')}</p>
        )}

        {cliStatus === 'installed' && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--nim-success)] shrink-0" />
            <span className="text-[13px] text-[var(--nim-text)]">
              {t('copilot_cli.installed', { version: cliVersion ? ` (${cliVersion})` : '', defaultValue: `Installed${cliVersion ? ` (${cliVersion})` : ''}` })}
            </span>
          </div>
        )}

        {(cliStatus === 'not-installed' || cliStatus === 'install-error') && (
          <div>
            <p className="text-[13px] text-[var(--nim-text-muted)] mb-3 leading-relaxed">
              {t('copilot_cli.cli_required', 'The GitHub Copilot CLI is required to run the agent. Install it with:')}
            </p>
            <code className="block text-[13px] text-[var(--nim-code-text)] bg-[var(--nim-code-bg)] px-3 py-2 rounded mb-3 select-text">
              npm install -g @github/copilot
            </code>
            <button
              className="inline-flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all bg-[var(--nim-primary)] text-white border border-[var(--nim-primary)] hover:opacity-90"
              onClick={handleInstall}
            >
              {t('copilot_cli.install_cli', 'Install Copilot CLI')}
            </button>
            {installError && (
              <div className="text-xs mt-2 text-[var(--nim-error)]">
                {installError}
                <p className="mt-1 text-[var(--nim-text-muted)]">
                  {t('copilot_cli.manual_install_hint', { cmd: 'npm install -g @github/copilot', defaultValue: 'Try running manually: npm install -g @github/copilot' })}
                </p>
              </div>
            )}
          </div>
        )}

        {cliStatus === 'installing' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[var(--nim-text-muted)]">{t('copilot_cli.installing', 'Installing Copilot CLI...')}</span>
          </div>
        )}

        <p className="text-[13px] text-[var(--nim-text-muted)] mt-3 leading-relaxed">
          {t('copilot_cli.docs_prefix', 'See the')}{' '}
          <a
            href="https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--nim-primary)] hover:underline"
          >
            {t('copilot_cli.docs_link', 'Copilot CLI documentation')}
          </a>
          {' '}{t('copilot_cli.docs_suffix', 'for installation and authentication details.')}
        </p>
      </div>

      <SettingsToggle
        variant="enable"
        name={t('copilot_cli.enable', 'Enable GitHub Copilot')}
        checked={config.enabled || false}
        onChange={onToggle}
      />

      {config.enabled && (
        <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)] last:border-b-0 last:mb-0 last:pb-0">
          <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('copilot_cli.authentication', 'Authentication')}</h4>
          <div className="cli-config-section">
            <p className="text-[13px] text-[var(--nim-text-muted)] mb-3">
              {t('copilot_cli.auth_desc1', { cmd: 'copilot', login: '/login', defaultValue: "GitHub Copilot uses your existing login for authentication. Run copilot and use the /login command to authenticate." })}
            </p>
            <p className="text-[13px] text-[var(--nim-text-muted)]">
              {t('copilot_cli.auth_desc2', 'Model selection is managed by Copilot. No additional API key is required.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
