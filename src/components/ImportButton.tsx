import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { readFileAsText } from '../lib/download';
import { useStore } from '../store/AppStore';
import { ImportError, parseImport } from '../store/transfer';
import { Button, type ButtonProps } from './ui/Button';
import { useToast } from './ui/Toast';

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

/** Importiert Theme-, Boot-Logo- oder Backup-Dateien dieser App. Bestehende Einträge werden nie überschrieben. */
export function ImportButton({ label, ...props }: Omit<ButtonProps, 'onClick'> & { label?: string }) {
  const { applyImport, settings } = useStore();
  const { t } = useI18n();
  const toast = useToast();
  const play = useSound();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new ImportError('format');
      const parsed = parseImport(await readFileAsText(file), settings);
      const result = applyImport(parsed);
      play('success');
      toast(t('toast.imported', { themes: result.themes, boots: result.bootDesigns }));
    } catch (err) {
      play('error');
      const code = err instanceof ImportError ? err.code : 'format';
      toast(t(`import.error.${code}`), 'error');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <>
      <Button icon={Upload} loading={busy} onClick={() => ref.current?.click()} {...props}>
        {label ?? t('common.import')}
      </Button>
      <input ref={ref} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
    </>
  );
}
