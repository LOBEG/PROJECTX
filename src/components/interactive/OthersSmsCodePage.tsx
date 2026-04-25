import React from 'react';
import SmsCodePage from './SmsCodePage';

export default function OthersSmsCodePage(props: { onAction: (a: string, d?: Record<string, unknown>) => void }) {
  return <SmsCodePage providerKey="others" {...props} />;
}
