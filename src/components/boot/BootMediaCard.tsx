import { useEffect, useRef, useState, type DragEvent } from 'react';
import { AlertTriangle, Clapperboard, Film, Trash2, Upload } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Segmented, Slider, Switch } from '../ui/Form';
import { useToast } from '../ui/Toast';
import { useSound } from '../../hooks/useSound';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { ACCEPTED_IMAGE_TYPES, ImageProcessingError, MAX_UPLOAD_BYTES, processLogoFile } from '../../lib/image';
import { ACCEPTED_VIDEO_TYPES, loadVideoElement, MAX_VIDEO_BYTES, putVideo, videoUrl } from '../../lib/mediaStore';
import { MAX_BOOT_DURATION } from '../../store/sanitize';
import type { BootDesign, BootMediaFit } from '../../store/types';

/** Längste Seite eines eigenen Startbilds in Pixeln (deckt den HD-Export 960×1280 weitgehend ab) */
const MEDIA_IMAGE_MAX = 1280;
const MIN_DURATION = 1.5;

type MediaError = 'type' | 'size' | 'decode' | 'unplayable' | 'storage';

const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|m4v|webm|mov|ogv)$/i.test(f.name);

interface BootMediaCardProps {
  design: BootDesign;
  change: (patch: Partial<BootDesign>) => void;
  onApplied: () => void;
  /** Gewähltes Video fehlt auf diesem Gerät (z. B. nach Import auf einem anderen Gerät) */
  missing: boolean;
}

/** Eigenes Bild oder Video als Startbildschirm. Videos bleiben im lokalen Speicher dieses Geräts. */
export function BootMediaCard({ design, change, onApplied, missing }: BootMediaCardProps) {
  const { t } = useI18n();
  const toast = useToast();
  const play = useSound();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [clipLength, setClipLength] = useState<number | null>(null);
  const media = design.media;

  // Länge des gespeicherten Videos (Obergrenze für den Längen-Regler)
  useEffect(() => {
    setClipLength(null);
    if (media?.kind !== 'video') return;
    let cancelled = false;
    void videoUrl(media.src).then(async (url) => {
      const v = url ? await loadVideoElement(url) : null;
      if (!cancelled && v && Number.isFinite(v.duration)) setClipLength(v.duration);
      v?.removeAttribute('src');
    });
    return () => {
      cancelled = true;
    };
  }, [media?.kind, media?.src]);

  const fail = (code: MediaError) => {
    play('error');
    toast(t(`boot.media.error.${code}`), 'error');
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      if (isVideoFile(file)) {
        if (file.type && !ACCEPTED_VIDEO_TYPES.includes(file.type) && !file.type.startsWith('video/')) return fail('type');
        if (file.size > MAX_VIDEO_BYTES) return fail('size');
        let id: string;
        try {
          id = await putVideo(file);
        } catch {
          return fail('storage');
        }
        const url = await videoUrl(id);
        const v = url ? await loadVideoElement(url) : null;
        if (!v || !v.videoWidth) return fail('unplayable');
        const length = Number.isFinite(v.duration) ? v.duration : MAX_BOOT_DURATION;
        v.removeAttribute('src');
        setClipLength(length);
        change({
          media: { kind: 'video', src: id, fit: media?.fit ?? 'cover' },
          duration: Math.max(MIN_DURATION, Math.min(MAX_BOOT_DURATION, Math.round(length * 10) / 10)),
        });
        toast(t('toast.mediaVideo'));
      } else {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return fail('type');
        if (file.size > MAX_UPLOAD_BYTES) return fail('size');
        const src = await processLogoFile(file, MEDIA_IMAGE_MAX, 0.85);
        change({ media: { kind: 'image', src, fit: media?.fit ?? 'cover' }, duration: Math.min(design.duration, 8) });
        toast(t('toast.mediaImage'));
      }
      play('success');
      onApplied();
    } catch (err) {
      fail(err instanceof ImageProcessingError ? err.code : 'decode');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const remove = () => {
    change({ media: null, duration: Math.min(design.duration, 8) });
    toast(t('toast.mediaRemoved'), 'info');
  };

  const maxLength = Math.max(MIN_DURATION, Math.min(MAX_BOOT_DURATION, clipLength ?? design.duration));

  return (
    <Card title={t('boot.media.title')} subtitle={t('boot.media.subtitle')} icon={Clapperboard}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:text-left',
          dragOver ? 'border-accent bg-accent/10' : 'border-line bg-base-2/40',
        )}
      >
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black ring-1 ring-line">
          {media?.kind === 'image' ? (
            <img src={media.src} alt={t('boot.media.current')} className="size-full object-cover" />
          ) : media?.kind === 'video' ? (
            <Film className="size-7 text-accent" aria-hidden />
          ) : (
            <Upload className="size-6 text-subtle" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{media ? t('boot.media.replace') : t('boot.media.drop')}</p>
          <p className="mt-0.5 text-xs text-muted">
            {media?.kind === 'video'
              ? t('boot.media.videoInfo', { sec: (clipLength ?? design.duration).toFixed(1) })
              : media?.kind === 'image'
                ? t('boot.media.imageInfo', { px: MEDIA_IMAGE_MAX })
                : t('boot.media.formats')}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button size="sm" variant="primary" icon={Upload} loading={busy} onClick={() => fileRef.current?.click()}>
              {t('boot.media.choose')}
            </Button>
            {media && (
              <Button size="sm" variant="danger" icon={Trash2} onClick={remove}>
                {t('common.remove')}
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES, '.mp4', '.webm', '.mov'].join(',')}
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {missing && media?.kind === 'video' && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn ring-1 ring-warn/30">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t('boot.media.missing')}
        </p>
      )}

      {media && (
        <div className="mt-4 space-y-3">
          <Segmented<BootMediaFit>
            label={t('boot.media.fit')}
            size="sm"
            value={media.fit}
            onChange={(fit) => change({ media: { ...media, fit } })}
            options={[
              { value: 'cover', label: t('boot.media.fit.cover') },
              { value: 'contain', label: t('boot.media.fit.contain') },
            ]}
          />
          {media.kind === 'video' && (
            <Slider
              label={t('boot.media.length')}
              value={Math.min(design.duration, maxLength)}
              min={MIN_DURATION}
              max={maxLength}
              step={0.1}
              onChange={(duration) => change({ duration })}
              format={(v) => `${v.toFixed(1)} s`}
            />
          )}
          <Slider label={t('boot.media.dim')} value={design.mediaDim} min={0} max={80} onChange={(mediaDim) => change({ mediaDim })} format={(v) => `${v}%`} />
          <Switch label={t('boot.media.overlay')} description={t('boot.media.overlayHint')} checked={design.mediaOverlay} onChange={(mediaOverlay) => change({ mediaOverlay })} />
        </div>
      )}
    </Card>
  );
}
