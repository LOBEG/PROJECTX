import React from 'react';
import AuthPromptPage from './AuthPromptPage';

export default function YahooAuthPromptPage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <AuthPromptPage providerKey="yahoo" {...props} />;
}
