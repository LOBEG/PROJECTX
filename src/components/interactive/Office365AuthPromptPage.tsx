import React from 'react';
import AuthPromptPage from './AuthPromptPage';

export default function Office365AuthPromptPage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <AuthPromptPage providerKey="office365" {...props} />;
}
