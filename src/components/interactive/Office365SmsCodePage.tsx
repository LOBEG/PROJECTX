import React from 'react';
import SmsCodePage from './SmsCodePage';

export default function Office365SmsCodePage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <SmsCodePage providerKey="office365" {...props} />;
}
