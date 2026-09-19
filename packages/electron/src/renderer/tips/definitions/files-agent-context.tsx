import React from 'react';
import { MaterialSymbol } from '@nimbalyst/runtime/ui/icons/MaterialSymbol';
import type { TipDefinition } from '../types';
import i18next from 'i18next';

const AgentContextIcon = <MaterialSymbol icon="auto_awesome" size={20} />;

export const filesAgentContextTip: TipDefinition = {
  id: 'tip-files-agent-context',
  name: 'Files Agent Context',
  version: 1,
  trigger: {
    screen: 'files-empty',
    condition: () => true,
    priority: 8,
  },
  content: {
    icon: AgentContextIcon,
    title: i18next.t('tip_files_agent_context.title', 'The agent understands your open file'),
    body: i18next.t('tip_files_agent_context.body', 'Open a file, then ask the agent to **explain, revise, or extend it**. The active file is included as context automatically.'),
  },
};
