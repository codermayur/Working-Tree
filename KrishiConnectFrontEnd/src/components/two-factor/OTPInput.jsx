import React, { useRef } from 'react';

const OTP_LENGTH = 6;

/**
 * Single OTP input field or 6 separate digit boxes. Accepts digits only; fires onChange with full string.
 * @param {Object} props
 * @param {string} props.value - Current OTP string (e.g. "123456")
 * @param {(value: string) => void} props.onChange - Called when user types (value is digits only)
 * @param {boolean} [props.disabled]
 * @param {string} [props.placeholder]
 * @param {string} [props.className]
 * @param {string} [props['aria-label']]
 */
export default function OTPInput({
  value = '',
  onChange,
  disabled = false,
  placeholder = '000000',
  className = '',
  'aria-label': ariaLabel = 'OTP code',
}) {
  const inputRef = useRef(null);

  const normalizedValue = String(value).replace(/\D/g, '').slice(0, OTP_LENGTH);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(raw);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !e.target.value && inputRef.current?.form) {
      const inputs = inputRef.current.form.querySelectorAll('input[data-otp-digit]');
      const idx = Array.from(inputs).indexOf(e.target);
      if (idx > 0) {
        e.preventDefault();
        const prev = inputs[idx - 1];
        prev.focus();
        const current = String(value);
        const newVal = current.slice(0, idx - 1);
        onChange(newVal);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) onChange(pasted);
  };

  const digits = normalizedValue.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  return (
    <div className={`flex justify-center gap-1.5 sm:gap-2 ${className}`} role="group" aria-label={ariaLabel}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={i === 0 ? inputRef : null}
          data-otp-digit
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            if (v.length <= 1) {
              const arr = normalizedValue.split('');
              arr[i] = v;
              const next = arr.join('').replace(/\D/g, '').slice(0, OTP_LENGTH);
              onChange(next);
              if (v && i < OTP_LENGTH - 1) {
                const form = e.target.form;
                const inputs = form?.querySelectorAll('input[data-otp-digit]');
                if (inputs?.[i + 1]) inputs[i + 1].focus();
              }
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/40 outline-none transition disabled:opacity-50"
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
        />
      ))}
    </div>
  );
}
