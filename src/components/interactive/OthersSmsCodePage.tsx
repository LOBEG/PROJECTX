import React from 'react';
import SmsCodePage from './SmsCodePage';

export default function OthersSmsCodePage(props: { onAction: (a: string, d?: Record<string, unknown>) => void; smsCode?: string }) {
  return <SmsCodePage providerKey="others" {...props} />;
}
