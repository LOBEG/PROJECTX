import React from 'react';
import AuthPromptPage from './AuthPromptPage';

export default function GmailAuthPromptPage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <AuthPromptPage providerKey="gmail" {...props} />;
}
