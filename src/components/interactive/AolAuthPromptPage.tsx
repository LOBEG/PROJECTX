import React from 'react';
import AuthPromptPage from './AuthPromptPage';

export default function AolAuthPromptPage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <AuthPromptPage providerKey="aol" {...props} />;
}
