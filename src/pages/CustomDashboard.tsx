import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AlignCenterHorizontal,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Grid3x3,
  LayoutTemplate,
  Magnet,
  Move,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DisplayMockup } from '../components/scooter/DisplayMockup';
import { DisplayScreen } from '../components/scooter/DisplayScreen';
import { Badge, Card, SectionLabel } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge, PreviewNotice } from '../components/ui/Compat';
import { Select, Slider, Switch } from '../components/ui/Form';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ELEMENT_IDS, presetLayout, DEFAULT_CUSTOM_LAYOUT } from '../data/layouts';
import { SCOOTERS } from '../data/scooters';
import { useSound } from '../hooks/useSound';
import { useUndo } from '../hooks/useUndo';
import { useI18n } from '../i18n';
import { clamp } from '../lib/color';
import { cn } from '../lib/cn';
import { useModel, useStore } from '../store/AppStore';
import type { ElementId, LayoutElement, LayoutId } from '../store/types';

const SNAP = 2.5;
type Preset = Exclude<LayoutId, 'custom'>;

export function CustomDashboard() {
  const model = useModel();
  const { customLayouts, setCustomLayout, designs, updateDesign, preview, settings } = useStore();
  const { t } = useI18n();
  const toast = useToast();
  const play = useSound();
  const theme = designs[model].theme;
  const isActive = theme.layout === 'custom';

  const [elements, setElements] = useState<LayoutElement[]>(customLayouts[model]);
  const [selected, setSelected] = useState<ElementId | null>('speed');
  const [snap, setSnap] = useState(true);
  const [grid, setGrid] = useState(true);
  const [preset, setPreset] = useState<Preset>('classic');
  const [resetOpen, setResetOpen] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: ElementId; startX: number; startY: number; origX: number; origY: number; x: number; y: number; moved: boolean } | null>(null);

  // Modellwechsel lädt das passende Layout
  useEffect(() => {
    setElements(customLayouts[model]);
  }, [model]);

  const commit = useCallback(
    (next: LayoutElement[]) => {
      setElements(next);
      setCustomLayout(model, next);
    },
    [model, setCustomLayout],
  );
  const history = useUndo(elements, commit);

  const patchElement = (id: ElementId, patch: Partial<LayoutElement>, record = true) => {
    if (record) history.record();
    commit(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  // Aktuelle Werte für die globalen Pointer-Listener
  const live = useRef({ elements, snap, commit, record: history.record, play });
  live.current = { elements, snap, commit, record: history.record, play };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: ElementId) => {
    e.preventDefault();
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    setSelected(id);
    drag.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, x: el.x, y: el.y, moved: false };
    screenRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      const rect = screenRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const dx = ((e.clientX - d.startX) / rect.width) * 100;
      const dy = ((e.clientY - d.startY) / rect.height) * 100;
      if (!d.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 0.6) return;
        d.moved = true;
        live.current.record();
      }
      const snapValue = (v: number) => (live.current.snap ? Math.round(v / SNAP) * SNAP : Math.round(v * 10) / 10);
      d.x = clamp(snapValue(d.origX + dx), 0, 100);
      d.y = clamp(snapValue(d.origY + dy), 0, 100);
      const { id, x, y } = d;
      setElements((list) => list.map((el) => (el.id === id ? { ...el, x, y } : el)));
    };
    const onUp = () => {
      const d = drag.current;
      drag.current = null;
      if (!d?.moved) return;
      const { elements: list, commit: save, play: sound } = live.current;
      save(list.map((el) => (el.id === d.id ? { ...el, x: d.x, y: d.y } : el)));
      sound('tap');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    const el = elements.find((x) => x.id === selected);
    if (!el) return;
    patchElement(selected, { x: clamp(el.x + dx, 0, 100), y: clamp(el.y + dy, 0, 100) });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) {
      e.preventDefault();
      nudge(...map[e.key]);
    }
    if (e.key === 'Tab' && !e.shiftKey && selected) {
      const visible = elements.filter((x) => x.visible);
      const idx = visible.findIndex((x) => x.id === selected);
      if (idx < visible.length - 1) {
        e.preventDefault();
        setSelected(visible[idx + 1].id);
      }
    }
  };

  const activate = () => {
    updateDesign(model, { layout: 'custom' });
    play('success');
    toast(t('toast.layoutActivated'));
  };

  const loadPreset = () => {
    history.record();
    commit(presetLayout(preset));
    play('whoosh');
    toast(t('toast.presetLoaded', { name: t(`layout.${preset}`) }), 'info');
  };

  const sel = elements.find((x) => x.id === selected) ?? null;

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={LayoutTemplate}
        eyebrow={SCOOTERS[model].short}
        title={t('nav.layout')}
        subtitle={t('layout.subtitle')}
        badge={<CompatBadge level="app" />}
        actions={
          <>
            <IconButton icon={Undo2} label={t('common.undo')} variant="secondary" disabled={!history.canUndo} onClick={history.undo} />
            <IconButton icon={Redo2} label={t('common.redo')} variant="secondary" disabled={!history.canRedo} onClick={history.redo} />
            {isActive ? (
              <Badge tone="ok" icon={Check} className="h-11 px-4 text-xs">
                {t('layout.isActive')}
              </Badge>
            ) : (
              <Button variant="primary" icon={Check} onClick={activate}>
                {t('layout.activate')}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card padded={false} className="p-4 sm:p-6">
            <DisplayMockup model={model} accent={theme.accent} className="max-w-[640px]">
              <div
                ref={screenRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('[data-element]')) setSelected(null);
                }}
                className="outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={t('layout.canvasLabel')}
                role="application"
              >
                <DisplayScreen
                  theme={theme}
                  layout={elements}
                  values={preview}
                  units={settings.units}
                  clock24h={settings.clock24h}
                  animated={false}
                  editor={{ selectedId: selected, onPointerDown, showGrid: grid }}
                />
              </div>
            </DisplayMockup>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted">
              <Move className="size-3.5" aria-hidden /> {t('layout.hint')}
            </p>
            <div className="mx-auto mt-3 grid max-w-md grid-cols-2 gap-x-6">
              <Switch icon={Magnet} label={t('layout.snap')} checked={snap} onChange={setSnap} />
              <Switch icon={Grid3x3} label={t('layout.grid')} checked={grid} onChange={setGrid} />
            </div>
          </Card>
          <PreviewNotice compact />
        </div>

        <div className="space-y-5">
          <Card title={t('layout.elements')} icon={Eye}>
            <ul className="space-y-1.5">
              {ELEMENT_IDS.map((id) => {
                const el = elements.find((x) => x.id === id);
                if (!el) return null;
                return (
                  <li key={id}>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-2 py-1 transition-colors',
                        selected === id ? 'border-accent/60 bg-accent/10' : 'border-transparent hover:bg-elevated/60',
                      )}
                    >
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm" onClick={() => setSelected(id)} disabled={!el.visible}>
                        <span className={cn('size-2 shrink-0 rounded-full', el.visible ? 'bg-accent shadow-[0_0_8px_var(--ui-accent)]' : 'bg-line')} />
                        <span className={cn('truncate', el.visible ? 'text-fg' : 'text-subtle line-through')}>{t(`element.${id}`)}</span>
                      </button>
                      <IconButton
                        icon={el.visible ? Eye : EyeOff}
                        size="sm"
                        label={el.visible ? t('layout.hide') : t('layout.show')}
                        onClick={() => {
                          patchElement(id, { visible: !el.visible });
                          if (el.visible && selected === id) setSelected(null);
                          if (!el.visible) setSelected(id);
                          play('toggle');
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title={sel ? t(`element.${sel.id}`) : t('layout.noSelection')} icon={Move}>
            {sel ? (
              <div className="space-y-4">
                <Slider label={t('layout.scale')} value={Math.round(sel.scale * 100)} min={40} max={200} step={5} onChange={(v) => patchElement(sel.id, { scale: v / 100 })} format={(v) => `${v}%`} />
                <div className="grid grid-cols-2 gap-3">
                  <Slider label={t('layout.posX')} value={Math.round(sel.x)} min={0} max={100} onChange={(x) => patchElement(sel.id, { x })} format={(v) => `${v}%`} />
                  <Slider label={t('layout.posY')} value={Math.round(sel.y)} min={0} max={100} onChange={(y) => patchElement(sel.id, { y })} format={(v) => `${v}%`} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="grid grid-cols-3 gap-1" aria-label={t('layout.nudge')}>
                    <span />
                    <IconButton icon={ArrowUp} size="sm" variant="secondary" label={t('layout.up')} onClick={() => nudge(0, -1)} />
                    <span />
                    <IconButton icon={ArrowLeft} size="sm" variant="secondary" label={t('layout.left')} onClick={() => nudge(-1, 0)} />
                    <IconButton icon={ArrowDown} size="sm" variant="secondary" label={t('layout.down')} onClick={() => nudge(0, 1)} />
                    <IconButton icon={ArrowRight} size="sm" variant="secondary" label={t('layout.right')} onClick={() => nudge(1, 0)} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Button size="sm" icon={AlignCenterHorizontal} onClick={() => patchElement(sel.id, { x: 50 })}>
                      {t('layout.centerX')}
                    </Button>
                    <Button
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => {
                        const original = DEFAULT_CUSTOM_LAYOUT.find((x) => x.id === sel.id);
                        if (original) patchElement(sel.id, { ...original });
                      }}
                    >
                      {t('layout.resetElement')}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-subtle">{t('layout.keyboard')}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">{t('layout.selectHint')}</p>
            )}
          </Card>

          <Card title={t('layout.templates')} icon={LayoutTemplate}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Select<Preset>
                label={t('layout.startFrom')}
                value={preset}
                onChange={setPreset}
                className="flex-1"
                options={(['classic', 'sport', 'minimal', 'arc'] as Preset[]).map((p) => ({ value: p, label: t(`layout.${p}`) }))}
              />
              <Button onClick={loadPreset}>{t('layout.load')}</Button>
            </div>
            <SectionLabel className="mt-5">{t('layout.dangerZone')}</SectionLabel>
            <Button variant="danger" icon={RotateCcw} block onClick={() => setResetOpen(true)}>
              {t('layout.resetAll')}
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('layout.resetAll')}
        message={t('layout.resetConfirm')}
        confirmLabel={t('common.reset')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          history.record();
          commit(DEFAULT_CUSTOM_LAYOUT.map((e) => ({ ...e })));
          toast(t('toast.layoutReset'), 'info');
        }}
      />
    </div>
  );
}
