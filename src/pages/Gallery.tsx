import { useMemo, useState } from 'react';
import { Copy, Download, FileBraces, Gauge, ImagePlus, Images, Pencil, Play, Power, Search, Sparkles, Trash2, Type } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ImportButton } from '../components/ImportButton';
import { BootCanvas } from '../components/boot/BootCanvas';
import { DisplayScreen, DisplayTile } from '../components/scooter/DisplayScreen';
import { Badge, EmptyState, SectionLabel } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge } from '../components/ui/Compat';
import { Segmented } from '../components/ui/Form';
import { ConfirmDialog, PromptDialog } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { bundledDesignsFor, type BundledDesign } from '../data/bundledDesigns';
import { resolveLayout } from '../data/layouts';
import { BOOT_EXPORT_SIZE, SCOOTERS, screenOf } from '../data/scooters';
import { useNav } from '../hooks/useNav';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { exportBootPng } from '../lib/bootRenderer';
import { cn } from '../lib/cn';
import { downloadBlob, downloadJson, safeFilename } from '../lib/download';
import { useModel, useStore } from '../store/AppStore';
import type { BootDesign, DisplayTheme } from '../store/types';

type Tab = 'themes' | 'boot';
type Pending = { kind: 'theme' | 'boot'; id: string; name: string } | null;

export function Gallery() {
  const model = useModel();
  const store = useStore();
  const { savedThemes, bootDesigns, customLayouts, preview, settings, designs } = store;
  const { t, l, locale } = useI18n();
  const { navigate } = useNav();
  const toast = useToast();
  const play = useSound();
  const [tab, setTab] = useState<Tab>('themes');
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Pending>(null);
  const [deleting, setDeleting] = useState<Pending>(null);

  const q = query.trim().toLowerCase();
  const themes = useMemo(() => savedThemes.filter((th) => th.name.toLowerCase().includes(q)), [savedThemes, q]);
  const boots = useMemo(() => bootDesigns.filter((b) => b.name.toLowerCase().includes(q)), [bootDesigns, q]);
  const date = (ms: number) => new Date(ms).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  const applyTheme = (theme: DisplayTheme) => {
    store.applyTheme(model, theme);
    play('success');
    toast(t('toast.applied', { name: theme.name }));
  };

  /** Lädt ein mitgeliefertes Design: Theme und Boot-Logo nur, wenn sie noch fehlen; das Layout wird immer gesetzt. */
  const loadBundled = (design: BundledDesign) => {
    store.applyImport({
      ...design.data,
      themes: design.data.themes.filter((th) => !savedThemes.some((s) => s.id === th.id)),
      bootDesigns: design.data.bootDesigns.filter((b) => !bootDesigns.some((s) => s.id === b.id)),
    });
    applyTheme(design.theme);
  };

  const editTheme = (theme: DisplayTheme) => {
    store.editTheme(model, theme);
    navigate('display');
  };

  const editBoot = (design: BootDesign) => {
    if (design.model !== model) store.selectModel(design.model);
    store.editBoot(design);
    navigate('boot');
  };

  const exportBoot = async (design: BootDesign) => {
    try {
      const { w, h } = BOOT_EXPORT_SIZE[screenOf(design.model)];
      downloadBlob(await exportBootPng(design, w, h), `${safeFilename(design.name, 'boot-logo')}-${w}x${h}.png`);
      toast(t('toast.exported'));
    } catch {
      toast(t('toast.exportFailed'), 'error');
    }
  };

  const exportAll = () => {
    if (tab === 'themes') downloadJson(store.exportThemes(), `escooter-themes-${new Date().toISOString().slice(0, 10)}.ecp-theme.json`);
    else downloadJson(store.exportBootDesigns(), `escooter-boot-logos-${new Date().toISOString().slice(0, 10)}.ecp-boot.json`);
    toast(t('toast.exported'));
  };

  const count = tab === 'themes' ? savedThemes.length : bootDesigns.length;
  const bundledDesigns = bundledDesignsFor(model);
  const screen = screenOf(model);
  const maxKmh = SCOOTERS[model].previewMaxKmh;

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={Images}
        eyebrow={t('gallery.eyebrow')}
        title={t('nav.gallery')}
        subtitle={t('gallery.subtitle')}
        badge={<CompatBadge level="app" />}
        actions={
          <>
            <ImportButton />
            <Button icon={Download} onClick={exportAll} disabled={count === 0}>
              {t('gallery.exportAll')}
            </Button>
          </>
        }
      />

      {bundledDesigns.length > 0 && (
        <section className="mb-6">
          <SectionLabel>{t('gallery.bundled.title')}</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            {bundledDesigns.map((design) => {
              const active = designs[model].sourceId === design.theme.id;
              return (
                <article key={design.theme.id} className="glass neon-border flex items-center gap-4 rounded-[var(--radius-card)] p-3 sm:p-4">
                  <div className={cn('shrink-0 overflow-hidden rounded-xl', screenOf(design.model) === 'portrait' ? 'w-24 sm:w-32' : 'w-32 sm:w-44')}>
                    <DisplayScreen theme={design.theme} layout={design.layout} orientation={screenOf(design.model)} maxSpeed={SCOOTERS[design.model].previewMaxKmh} values={preview} units={settings.units} clock24h={settings.clock24h} animated={false} label={design.theme.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-fg">{design.theme.name}</h3>
                      {active && <Badge tone="ok">{t('store.active')}</Badge>}
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{l(design.description)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-subtle">{t('gallery.bundled.note')}</p>
                    <Button size="sm" variant="primary" icon={Sparkles} onClick={() => loadBundled(design)} className="mt-3">
                      {t('gallery.bundled.load')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented<Tab>
          className="sm:w-96"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'themes', label: `${t('gallery.tab.themes')} (${savedThemes.length})`, icon: Gauge },
            { value: 'boot', label: `${t('gallery.tab.boot')} (${bootDesigns.length})`, icon: Power },
          ]}
        />
        <label className="relative flex-1">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('gallery.search')}
            className="h-11 w-full rounded-xl border border-line bg-base-2/70 pr-3 pl-10 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent/70"
          />
        </label>
      </div>

      {tab === 'themes' &&
        (themes.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title={q ? t('gallery.noResults') : t('gallery.empty.themes')}
            text={q ? t('gallery.noResultsText') : t('gallery.empty.themesText')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={() => navigate('display')}>
                  {t('gallery.create')}
                </Button>
                <Button onClick={() => navigate('store')}>{t('nav.store')}</Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {themes.map((theme) => {
              const active = designs[model].sourceId === theme.id;
              return (
                <article key={theme.id} className="glass flex flex-col overflow-hidden rounded-[var(--radius-card)]">
                  <button type="button" onClick={() => applyTheme(theme)} aria-label={t('gallery.applyNamed', { name: theme.name })}>
                    <DisplayTile theme={theme} layout={resolveLayout(theme.layout, customLayouts[model], screen)} orientation={screen} maxSpeed={maxKmh} values={preview} units={settings.units} clock24h={settings.clock24h} animated={false} />
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-fg">{theme.name}</h3>
                        <p className="text-xs text-subtle">{t('gallery.updated', { date: date(theme.updatedAt) })}</p>
                      </div>
                      {active && <Badge tone="ok">{t('store.active')}</Badge>}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      <Button size="sm" variant="primary" onClick={() => applyTheme(theme)} className="flex-1">
                        {t('common.apply')}
                      </Button>
                      <IconButton icon={Pencil} size="sm" variant="secondary" label={t('common.edit')} onClick={() => editTheme(theme)} />
                      <IconButton icon={Type} size="sm" variant="secondary" label={t('common.rename')} onClick={() => setRenaming({ kind: 'theme', id: theme.id, name: theme.name })} />
                      <IconButton
                        icon={Copy}
                        size="sm"
                        variant="secondary"
                        label={t('common.duplicate')}
                        onClick={() => {
                          const copy = store.duplicateTheme(theme.id, t('common.copySuffix'));
                          if (copy) toast(t('toast.duplicated', { name: copy.name }));
                        }}
                      />
                      <IconButton
                        icon={FileBraces}
                        size="sm"
                        variant="secondary"
                        label={t('common.exportJson')}
                        onClick={() => {
                          downloadJson(store.exportThemes([theme.id]), `${safeFilename(theme.name, 'theme')}.ecp-theme.json`);
                          toast(t('toast.exported'));
                        }}
                      />
                      <IconButton icon={Trash2} size="sm" variant="danger" label={t('common.delete')} onClick={() => setDeleting({ kind: 'theme', id: theme.id, name: theme.name })} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      {tab === 'boot' &&
        (boots.length === 0 ? (
          <EmptyState
            icon={Power}
            title={q ? t('gallery.noResults') : t('gallery.empty.boot')}
            text={q ? t('gallery.noResultsText') : t('gallery.empty.bootText')}
            action={
              <Button variant="primary" onClick={() => navigate('boot')}>
                {t('gallery.createBoot')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boots.map((design) => (
              <article key={design.id} className="glass flex flex-col overflow-hidden rounded-[var(--radius-card)]">
                <div
                  className="relative"
                  onMouseEnter={() => setHovered(design.id)}
                  onMouseLeave={() => setHovered((h) => (h === design.id ? null : h))}
                >
                  <BootCanvas design={design} playing={hovered === design.id} label={design.name} tile />
                  <button
                    type="button"
                    onClick={() => setHovered((h) => (h === design.id ? null : design.id))}
                    className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
                  >
                    <Play className="size-3" /> {t('boot.play')}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-fg">{design.name}</h3>
                      <p className="text-xs text-subtle">{t('gallery.updated', { date: date(design.updatedAt) })}</p>
                    </div>
                    <Badge tone="accent">{SCOOTERS[design.model].short}</Badge>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <Button size="sm" variant="primary" icon={Pencil} onClick={() => editBoot(design)} className="flex-1">
                      {t('common.edit')}
                    </Button>
                    <IconButton icon={Type} size="sm" variant="secondary" label={t('common.rename')} onClick={() => setRenaming({ kind: 'boot', id: design.id, name: design.name })} />
                    <IconButton
                      icon={Copy}
                      size="sm"
                      variant="secondary"
                      label={t('common.duplicate')}
                      onClick={() => {
                        const copy = store.duplicateBoot(design.id, t('common.copySuffix'));
                        if (copy) toast(t('toast.duplicated', { name: copy.name }));
                      }}
                    />
                    <IconButton icon={ImagePlus} size="sm" variant="secondary" label={t('gallery.exportPng')} onClick={() => void exportBoot(design)} />
                    <IconButton
                      icon={FileBraces}
                      size="sm"
                      variant="secondary"
                      label={t('common.exportJson')}
                      onClick={() => {
                        downloadJson(store.exportBootDesigns([design.id]), `${safeFilename(design.name, 'boot-logo')}.ecp-boot.json`);
                        toast(t('toast.exported'));
                      }}
                    />
                    <IconButton icon={Trash2} size="sm" variant="danger" label={t('common.delete')} onClick={() => setDeleting({ kind: 'boot', id: design.id, name: design.name })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}

      <PromptDialog
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={t('common.rename')}
        label={t('common.name')}
        initialValue={renaming?.name ?? ''}
        confirmLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        emptyError={t('common.nameRequired')}
        onSubmit={(name) => {
          if (!renaming) return;
          if (renaming.kind === 'theme') store.renameTheme(renaming.id, name);
          else store.renameBoot(renaming.id, name);
          toast(t('toast.renamed', { name }));
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('gallery.deleteTitle')}
        message={t('gallery.deleteText', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          if (!deleting) return;
          if (deleting.kind === 'theme') store.deleteTheme(deleting.id);
          else store.deleteBoot(deleting.id);
          play('whoosh');
          toast(t('toast.deleted', { name: deleting.name }), 'info');
        }}
      />
    </div>
  );
}
