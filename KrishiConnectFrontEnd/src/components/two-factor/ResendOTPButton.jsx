import React, { useState, useEffect, useCallback } from 'react';

const DEFAULT_COOLDOWN_SEC = 30;

/**
 * Resend OTP button with cooldown timer. Disabled during cooldown and while onResend is pending.
 * @param {Object} props
 * @param {() => Promise<void>} props.onResend - Called when user clicks resend
 * @param {boolean} [props.isPending] - True while resend request is in progress
 * @param {number} [props.cooldownSeconds]
 * @param {string} [props.className]
 * @param {string} [props.labelResend]
 * @param {string} [props.labelCooldown]
 */
export default function ResendOTPButton({
  onResend,
  isPending = false,
  cooldownSeconds = DEFAULT_COOLDOWN_SEC,
  className = '',
  labelResend = 'Resend OTP',
  labelCooldown = 'Resend in {{seconds}}s',
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [justTriggered, setJustTriggered] = useState(false);

  const startCooldown = useCallback(() => {
    setSecondsLeft(cooldownSeconds);
    setJustTriggered(true);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (justTriggered) setJustTriggered(false);
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, justTriggered]);

  const handleClick = async () => {
    if (secondsLeft > 0 || isPending) return;
    try {
      await onResend();
      startCooldown();
    } catch (_) {
      // Caller shows error toast
    }
  };

  const disabled = isPending || secondsLeft > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={secondsLeft > 0 ? `Resend OTP in ${secondsLeft} seconds` : labelResend}
    >
      {secondsLeft > 0
        ? labelCooldown.replace('{{seconds}}', String(secondsLeft))
        : isPending
        ? 'Sending…'
        : labelResend}
    </button>
  );
}
