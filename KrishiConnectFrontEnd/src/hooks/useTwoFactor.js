/**
 * React Query hooks for Two-Factor Authentication flows.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { privacyKeys } from './usePrivacySecurity';

export function useVerifyPassword(options = {}) {
  return useMutation({
    mutationFn: (payload) => authService.verifyPassword(payload),
    ...options,
  });
}

export function useSend2FAOtp(options = {}) {
  return useMutation({
    mutationFn: () => authService.send2FAOtp(),
    ...options,
  });
}

export function useEnable2FA(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => authService.enable2FA(payload),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.settings() });
      options.onSuccess?.(_, __, ctx);
    },
    ...options,
  });
}

export function useVerifyLoginOTP(options = {}) {
  return useMutation({
    mutationFn: (payload) => authService.verifyLoginOTP(payload),
    ...options,
  });
}
