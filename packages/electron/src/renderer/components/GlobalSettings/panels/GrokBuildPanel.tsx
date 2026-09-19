import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProviderConfig } from '../../Settings/SettingsView';
import { HeadlessCliProviderPanel } from './HeadlessCliProviderPanel';

interface GrokBuildPanelProps {
  config: ProviderConfig;
  onToggle: (enabled: boolean) => void;
}

export function GrokBuildPanel({ config, onToggle }: GrokBuildPanelProps) {
  const { t } = useTranslation();
  return (
    <HeadlessCliProviderPanel
      config={config}
      onToggle={onToggle}
      toolId="grok-build"
      title={t('grok_build.title', 'Grok Build')}
      description={t('grok_build.description', "xAI's Grok Build coding agent, run headlessly against your project. Uses your existing Grok CLI login.")}
      commandName="Grok"
      loginCommand="grok login"
      docsUrl="https://docs.x.ai/build/cli/headless-scripting"
      docsLabel="Grok Build CLI documentation"
      // Grok has no delete or move tool, so removals only appear as shell
      // commands and the filesystem watcher has to catch them.
      fileChangeFidelity="tool-args"
    />
  );
}
