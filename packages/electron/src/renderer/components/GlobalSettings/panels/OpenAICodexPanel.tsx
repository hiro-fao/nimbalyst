import { CodexWindowsSandboxSection } from './CodexWindowsSandboxSection';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue, useSetAtom } from 'jotai';
import { ProviderConfig, Model } from '../../Settings/SettingsView';
import { SettingsToggle } from '../SettingsToggle';
import {
  getProviderConfigAtom,
  setProviderConfigAtom,
  hiddenGutterItemsAtom,
  toggleGutterItemHiddenAtom,
} from '../../../store/atoms/appSettings';
import { openAICodexAuthVersionAtom } from '../../../store/atoms/openAICodexAuth';

interface OpenAICodexPanelProps {
  config: ProviderConfig;
  apiKeys: Record<string, string>;
  availableModels: Model[];
  loading: boolean;
  onToggle: (enabled: boolean) => void;
  onApiKeyChange: (key: string, value: string) => void;
  onModelToggle: (modelId: string, enabled: boolean) => void;
  onSelectAllModels: (selectAll: boolean) => void;
  onTestConnection: () => Promise<void>;
  onConfigChange: (updates: Partial<ProviderConfig>) => void;
}

type AuthMethod = 'chatgpt' | 'api-key';

interface CodexAuthStatus {
  installed: boolean;
  isLoggedIn: boolean;
  authMode: 'apikey' | 'chatgpt' | 'chatgptAuthTokens' | null;
  email: string | null;
  planType: string | null;
  message: string;
  error?: string;
}

export function OpenAICodexPanel({
  config,
  onToggle,
}: OpenAICodexPanelProps) {
  const { t } = useTranslation();
  // Usage indicator visibility (rail gutter is the single source of truth --
  // see NavigationGutter's "Show Codex Usage" / "Customize Gutter…" restore
  // affordances, which read the same hiddenGutterItems set this toggle does).
  const hiddenGutterItems = useAtomValue(hiddenGutterItemsAtom);
  const toggleGutterItemHidden = useSetAtom(toggleGutterItemHiddenAtom);
  const usageIndicatorEnabled = !hiddenGutterItems.includes('codex-usage');
  const setUsageIndicatorEnabled = (checked: boolean) =>
    toggleGutterItemHidden({ id: 'codex-usage', hidden: !checked });

  const acpConfigAtom = useMemo(() => getProviderConfigAtom('openai-codex-acp'), []);
  const acpConfig = useAtomValue(acpConfigAtom);
  const setProviderConfig = useSetAtom(setProviderConfigAtom);
  const acpEnabled = acpConfig?.enabled === true;
  const handleAcpToggle = (enabled: boolean) => {
    setProviderConfig({
      providerId: 'openai-codex-acp',
      config: { enabled },
    });
  };

  const [authStatus, setAuthStatus] = useState<CodexAuthStatus | null>(null);
  const [authBusy, setAuthBusy] = useState<'checking' | 'chatgpt' | 'apikey' | 'logout' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingApiKey, setPendingApiKey] = useState('');
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<AuthMethod>('chatgpt');

  const checkStatus = useCallback(async () => {
    setAuthBusy('checking');
    setAuthError(null);
    try {
      const result = await window.electronAPI.invoke('openai-codex:check-login') as CodexAuthStatus;
      setAuthStatus(result);
      if (result.error) setAuthError(result.error);
      if (result.authMode === 'apikey') setSelectedAuthMethod('api-key');
      else if (result.authMode === 'chatgpt') setSelectedAuthMethod('chatgpt');
    } catch (err: any) {
      setAuthError(err?.message ?? t('openai_codex.check_status_failed', 'Failed to check Codex auth status'));
    } finally {
      setAuthBusy(null);
    }
  }, []);

  // Re-check whenever the central listener reports the CLI's auth state moved
  // (login/logout writes auth.json outside the app). Counter-atom pattern from
  // docs/IPC_LISTENERS.md -- this panel must not subscribe to IPC itself.
  const authVersion = useAtomValue(openAICodexAuthVersionAtom);
  useEffect(() => {
    if (!config.enabled) return;
    checkStatus();
  }, [config.enabled, checkStatus, authVersion]);

  const handleChatGptLogin = async () => {
    setAuthBusy('chatgpt');
    setAuthError(null);
    try {
      const result = await window.electronAPI.invoke('openai-codex:login-chatgpt') as { success: boolean; error?: string };
      if (!result.success) {
        setAuthError(result.error ?? t('openai_codex.login_failed', 'Login failed'));
      }
    } catch (err: any) {
      setAuthError(err?.message ?? t('openai_codex.login_failed', 'Login failed'));
    } finally {
      setAuthBusy(null);
    }
  };

  const handleApiKeyLogin = async () => {
    if (!pendingApiKey.trim()) {
      setAuthError(t('openai_codex.enter_api_key_first', 'Enter an API key first'));
      return;
    }
    setAuthBusy('apikey');
    setAuthError(null);
    try {
      const result = await window.electronAPI.invoke('openai-codex:login-apikey', pendingApiKey.trim()) as { success: boolean; error?: string };
      if (!result.success) {
        setAuthError(result.error ?? t('openai_codex.login_failed', 'Login failed'));
      } else {
        setPendingApiKey('');
        await checkStatus();
      }
    } catch (err: any) {
      setAuthError(err?.message ?? t('openai_codex.login_failed', 'Login failed'));
    } finally {
      setAuthBusy(null);
    }
  };

  const handleLogout = async () => {
    setAuthBusy('logout');
    setAuthError(null);
    try {
      const result = await window.electronAPI.invoke('openai-codex:logout') as { success: boolean; error?: string };
      if (!result.success) {
        setAuthError(result.error ?? t('openai_codex.logout_failed', 'Logout failed'));
      } else {
        await checkStatus();
      }
    } catch (err: any) {
      setAuthError(err?.message ?? t('openai_codex.logout_failed', 'Logout failed'));
    } finally {
      setAuthBusy(null);
    }
  };

  const isLoggedIn = !!authStatus?.isLoggedIn;
  const planLabel = authStatus?.planType ? ` • ${authStatus.planType}` : '';

  return (
    <div className="provider-panel flex flex-col">
      <div className="provider-panel-header mb-6 pb-4 border-b border-[var(--nim-border)]">
        <h3 className="provider-panel-title text-xl font-semibold leading-tight mb-2 text-[var(--nim-text)]">{t('openai_codex.title', 'OpenAI Codex')}</h3>
        <p className="provider-panel-description text-sm leading-relaxed text-[var(--nim-text-muted)]">
          {t('openai_codex.description', 'Advanced code generation and completion powered by OpenAI Codex models. Provides intelligent code suggestions and automated programming assistance.')}
        </p>
      </div>

      <SettingsToggle
        variant="enable"
        name={t('openai_codex.enable', 'Enable OpenAI Codex')}
        checked={config.enabled || false}
        onChange={onToggle}
      />

      <SettingsToggle
        variant="enable"
        name={t('openai_codex.show_usage', 'Show Usage Indicator')}
        description={t('openai_codex.show_usage_desc', 'Display Codex usage limits in the navigation gutter')}
        checked={usageIndicatorEnabled}
        onChange={setUsageIndicatorEnabled}
      />

      {config.enabled && process.platform === 'win32' && <CodexWindowsSandboxSection />}

      {acpEnabled && (
        <div className="provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)]">
          <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">
            {t('openai_codex.acp_transport', 'ACP Transport')} <span className="text-xs font-normal text-[var(--nim-text-muted)]">({t('openai_codex.acp_legacy', 'legacy')})</span>
          </h4>
          <p className="text-[13px] text-[var(--nim-text-muted)] mb-3 leading-relaxed">
            {t('openai_codex.acp_notice', { name: 'OpenAI Codex (ACP)', main: 'OpenAI Codex', defaultValue: 'OpenAI Codex (ACP) is already enabled for this installation, but new Codex sessions now use the app-server transport through the main OpenAI Codex provider.' })}
          </p>
          <SettingsToggle
            variant="enable"
            name={t('openai_codex.acp_enable', 'Enable ACP transport')}
            description={t('openai_codex.acp_enable_desc', "Keeps the separate 'OpenAI Codex (ACP)' legacy provider available")}
            checked={acpEnabled}
            onChange={handleAcpToggle}
          />
        </div>
      )}

      {config.enabled && (
        <div data-testid="codex-auth-section" className="codex-auth-section provider-panel-section py-4 mb-4 border-b border-[var(--nim-border)] last:border-b-0 last:mb-0 last:pb-0">
          <h4 className="provider-panel-section-title text-base font-semibold mb-3 text-[var(--nim-text)]">{t('openai_codex.sign_in', 'Sign In')}</h4>

          {isLoggedIn ? (
            <div className="status-box-success mb-4 py-3.5 px-4 rounded-lg text-[13px] flex items-center gap-3 justify-between bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-3 flex-1">
                <span className="status-box-icon text-xl leading-none shrink-0 text-[var(--nim-success)]">✓</span>
                <div className="status-box-content flex flex-col gap-1 flex-1">
                  <span className="status-box-title font-semibold text-sm text-[var(--nim-text)]">
                    {authStatus?.authMode === 'chatgpt' ? t('openai_codex.signed_in_chatgpt', 'Signed in with ChatGPT') : authStatus?.authMode === 'apikey' ? t('openai_codex.signed_in_apikey', 'Signed in with API key') : t('openai_codex.signed_in', 'Signed in')}
                  </span>
                  {(authStatus?.email || authStatus?.planType) && (
                    <span className="status-box-subtitle text-xs text-[var(--nim-text-muted)]">
                      {authStatus?.email ?? ''}{planLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="status-box-actions flex gap-2 shrink-0">
                <button
                  className="btn-small py-1.5 px-3 rounded text-xs font-medium cursor-pointer transition-all bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)] text-[var(--nim-text)] hover:bg-[var(--nim-bg-hover)]"
                  onClick={checkStatus}
                  disabled={authBusy !== null}
                >
                  {t('openai_codex.refresh', 'Refresh')}
                </button>
                <button
                  className="btn-small py-1.5 px-3 rounded text-xs font-medium cursor-pointer transition-all bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)] text-[var(--nim-text)] hover:bg-[var(--nim-bg-hover)]"
                  onClick={handleLogout}
                  disabled={authBusy !== null}
                  data-testid="codex-logout"
                >
                  {authBusy === 'logout' ? t('openai_codex.signing_out', 'Signing out…') : t('openai_codex.sign_out', 'Sign out')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-method-row flex gap-2 mb-4">
                <button
                  className={`auth-method-button flex-1 py-2.5 px-4 rounded-md text-[13px] font-medium cursor-pointer transition-all border ${
                    selectedAuthMethod === 'chatgpt'
                      ? 'border-2 border-[var(--nim-primary)] bg-[rgba(59,130,246,0.1)] text-[var(--nim-primary)]'
                      : 'border-[var(--nim-border)] bg-[var(--nim-bg-secondary)] text-[var(--nim-text)] hover:bg-[var(--nim-bg-hover)] hover:border-[var(--nim-border-focus)]'
                  }`}
                  onClick={() => setSelectedAuthMethod('chatgpt')}
                  data-testid="codex-auth-method-chatgpt"
                >
                  {t('openai_codex.auth_chatgpt', 'ChatGPT (Recommended)')}
                </button>
                <button
                  className={`auth-method-button flex-1 py-2.5 px-4 rounded-md text-[13px] font-medium cursor-pointer transition-all border ${
                    selectedAuthMethod === 'api-key'
                      ? 'border-2 border-[var(--nim-primary)] bg-[rgba(59,130,246,0.1)] text-[var(--nim-primary)]'
                      : 'border-[var(--nim-border)] bg-[var(--nim-bg-secondary)] text-[var(--nim-text)] hover:bg-[var(--nim-bg-hover)] hover:border-[var(--nim-border-focus)]'
                  }`}
                  onClick={() => setSelectedAuthMethod('api-key')}
                  data-testid="codex-auth-method-apikey"
                >
                  {t('openai_codex.auth_api_key', 'API Key')}
                </button>
              </div>

              {selectedAuthMethod === 'chatgpt' && (
                <div className="mb-4 p-4 bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)] rounded-lg">
                  <p className="text-xs leading-relaxed text-[var(--nim-text-muted)] mb-3">
                    {t('openai_codex.chatgpt_desc', 'Authenticate with your ChatGPT Pro, Plus, or Team subscription. No API credits needed.')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="nim-btn-primary flex-1"
                      onClick={handleChatGptLogin}
                      disabled={authBusy !== null}
                      data-testid="codex-login-chatgpt"
                    >
                      {authBusy === 'chatgpt' ? t('openai_codex.opening_browser', 'Opening browser…') : t('openai_codex.sign_in_chatgpt', 'Sign in with ChatGPT')}
                    </button>
                    <button
                      className="nim-btn-secondary"
                      onClick={checkStatus}
                      disabled={authBusy !== null}
                    >
                      {t('openai_codex.refresh', 'Refresh')}
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--nim-text-faint)] mt-2">
                    {t('openai_codex.chatgpt_note', 'Opens your default browser. Complete the OpenAI sign-in flow; Nimbalyst updates automatically when you return.')}
                  </p>
                </div>
              )}

              {selectedAuthMethod === 'api-key' && (
                <div className="mb-4 p-4 bg-[var(--nim-bg-secondary)] border border-[var(--nim-border)] rounded-lg">
                  <p className="text-xs leading-relaxed text-[var(--nim-text-muted)] mb-3">
                    {t('openai_codex.api_key_desc', 'Use an OpenAI API key. Pay-per-use with API credits — more expensive than the ChatGPT subscription path.')}
                  </p>
                  <div className="api-key-row flex gap-2 items-center">
                    <input
                      type="password"
                      value={pendingApiKey}
                      onChange={(e) => setPendingApiKey(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="sk-..."
                      className="api-key-input flex-1 py-2 px-3 rounded-md bg-[var(--nim-bg)] border border-[var(--nim-border)] text-[var(--nim-text)] outline-none font-mono focus:border-[var(--nim-primary)]"
                      data-testid="codex-apikey-input"
                    />
                    <button
                      className="nim-btn-primary"
                      onClick={handleApiKeyLogin}
                      disabled={authBusy !== null || !pendingApiKey.trim()}
                      data-testid="codex-login-apikey"
                    >
                      {authBusy === 'apikey' ? t('openai_codex.saving', 'Saving…') : t('openai_codex.save', 'Save')}
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--nim-text-faint)] mt-2">
                    {t('openai_codex.api_key_storage_note', { path: '~/.codex/auth.json', defaultValue: 'Stored by Codex in ~/.codex/auth.json, not in Nimbalyst settings.' })}
                  </p>
                </div>
              )}
            </>
          )}

          {authError && (
            <p className="text-xs text-[var(--nim-error)] mt-2" data-testid="codex-auth-error">{authError}</p>
          )}
        </div>
      )}
    </div>
  );
}
