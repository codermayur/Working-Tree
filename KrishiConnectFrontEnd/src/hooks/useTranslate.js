/**
 * Optional convenience hook that re-exports useTranslation.
 * Use: const t = useTranslate(); t('nav.home')
 * Or: const { t, i18n } = useTranslation();
 */
import { useTranslation } from 'react-i18next';

export function useTranslate() {
  const { t, i18n } = useTranslation();
  return { t, i18n };
}

export default useTranslate;
