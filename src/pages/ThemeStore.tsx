import { useMemo, useState } from 'react';
import { BookmarkPlus, Check, Eye, Heart, Search, Store, Wand } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DisplayScreen } from '../components/scooter/DisplayScreen';
import { LiveDisplay } from '../components/scooter/LiveDisplay';
import { Badge, EmptyState } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { CompatBadge, PreviewNotice } from '../components/ui/Compat';
import { Select } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { resolveLayout } from '../data/layouts';
import { ORIGINAL_THEMES, STORE_THEMES, THEME_CATEGORIES } from '../data/themes';
import { useNav } from '../hooks/useNav';
import { useSound } from '../hooks/useSound';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { luminance } from '../lib/color';
import { useModel, useStore } from '../store/AppStore';
import type { DisplayTheme, ThemeCategory } from '../store/types';

type Filter = 'all' | 'favorites' | ThemeCategory;
type Sort = 'featured' | 'name' | 'bright' | 'glow';

export function ThemeStore() {
  const model = useModel();
  const { designs, favorites, toggleFavorite, applyTheme, addTheme, customLayouts, preview, settings } = useStore();
  const { t, l } = useI18n();
  const { navigate } = useNav();
  const toast = useToast();
  const play = useSound();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('featured');
  const [previewTheme, setPreviewTheme] = useState<DisplayTheme | null>(null);

  const catalog = useMemo(() => [ORIGINAL_THEMES[model], ...STORE_THEMES], [model]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = catalog.filter((th) => {
      if (filter === 'favorites' && !favorites.includes(th.id)) return false;
      if (filter !== 'all' && filter !== 'favorites' && th.category !== filter) return false;
      if (!q) return true;
      return th.name.toLowerCase().includes(q) || (th.description && l(th.description).toLowerCase().includes(q));
    });
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'bright') list = [...list].sort((a, b) => luminance(b.primary) - luminance(a.primary));
    if (sort === 'glow') list = [...list].sort((a, b) => b.glow - a.glow);
    return list;
  }, [catalog, query, filter, sort, favorites, l]);

  const apply = (theme: DisplayTheme) => {
    applyTheme(model, theme);
    play('success');
    toast(t('toast.applied', { name: theme.name }));
  };

  const saveCopy = (theme: DisplayTheme) => {
    const created = addTheme(theme);
    play('success');
    toast(t('toast.savedToGallery', { name: created.name }));
  };

  const activeId = designs[model].sourceId;
  const filters: Filter[] = ['all', 'favorites', ...THEME_CATEGORIES];

  return (
    <div className="animate-page-in">
      <PageHeader
        icon={Store}
        eyebrow={t('store.eyebrow')}
        title={t('nav.store')}
        subtitle={t('store.subtitle', { count: catalog.length })}
        badge={<Badge tone="ok">{t('store.free')}</Badge>}
        actions={
          <Button icon={Wand} onClick={() => navigate('display')}>
            {t('store.createOwn')}
          </Button>
        }
      />

      <div className="glass mb-5 flex flex-col gap-3 rounded-[var(--radius-card)] p-3 sm:p-4 md:flex-row md:items-end">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('store.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-line bg-base-2/70 pr-3 pl-10 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent/70"
          />
        </label>
        <Select<Sort>
          label={t('store.sort')}
          value={sort}
          onChange={setSort}
          className="md:w-52"
          options={(['featured', 'name', 'bright', 'glow'] as Sort[]).map((s) => ({ value: s, label: t(`store.sort.${s}`) }))}
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t('store.categories')}>
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all',
              filter === f ? 'border-accent/60 bg-accent/15 text-accent' : 'border-line bg-base-2/60 text-muted hover:text-fg',
            )}
          >
            {f === 'favorites' && <Heart className="size-3.5" aria-hidden />}
            {t(`store.filter.${f}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={filter === 'favorites' ? Heart : Search}
          title={filter === 'favorites' ? t('store.empty.favorites') : t('store.empty.title')}
          text={filter === 'favorites' ? t('store.empty.favoritesText') : t('store.empty.text')}
          action={
            <Button
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
            >
              {t('store.showAll')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((theme, i) => {
            const fav = favorites.includes(theme.id);
            const active = activeId === theme.id;
            return (
              <article key={theme.id} className="glass group flex animate-page-in flex-col overflow-hidden rounded-[var(--radius-card)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/40" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <button type="button" onClick={() => setPreviewTheme(theme)} className="relative block" aria-label={t('store.previewOf', { name: theme.name })}>
                  <DisplayScreen theme={theme} layout={resolveLayout(theme.layout, customLayouts[model])} values={preview} units={settings.units} clock24h={settings.clock24h} animated={false} />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      <Eye className="size-3.5" /> {t('store.preview')}
                    </span>
                  </span>
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-fg">{theme.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {theme.category && <Badge tone="accent">{t(`store.filter.${theme.category}`)}</Badge>}
                        <Badge>{t(`font.${theme.font}`)}</Badge>
                        {active && (
                          <Badge tone="ok" icon={Check}>
                            {t('store.active')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <IconButton
                      icon={Heart}
                      size="sm"
                      label={fav ? t('store.unfavorite') : t('store.favorite')}
                      onClick={() => {
                        toggleFavorite(theme.id);
                        play('toggle');
                      }}
                      className={cn(fav && 'text-danger [&_svg]:fill-current')}
                      aria-pressed={fav}
                    />
                  </div>
                  {theme.description && <p className="mb-4 text-xs leading-relaxed text-muted">{l(theme.description)}</p>}
                  <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
                    <Button variant={active ? 'outline' : 'primary'} size="sm" icon={active ? Check : undefined} onClick={() => apply(theme)}>
                      {active ? t('store.applied') : t('common.apply')}
                    </Button>
                    <IconButton icon={BookmarkPlus} variant="secondary" size="sm" label={t('store.saveCopy')} onClick={() => saveCopy(theme)} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PreviewNotice className="mt-6" />

      <Modal
        open={!!previewTheme}
        onClose={() => setPreviewTheme(null)}
        title={previewTheme?.name ?? ''}
        size="lg"
        closeLabel={t('common.close')}
        footer={
          previewTheme && (
            <>
              <Button icon={BookmarkPlus} onClick={() => saveCopy(previewTheme)}>
                {t('store.saveCopy')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  apply(previewTheme);
                  setPreviewTheme(null);
                }}
              >
                {t('common.apply')}
              </Button>
            </>
          )
        }
      >
        {previewTheme && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">{t('store.compare.new')}</p>
                <LiveDisplay model={model} theme={previewTheme} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">{t('store.compare.current')}</p>
                <LiveDisplay model={model} />
              </div>
            </div>
            {previewTheme.description && <p className="text-sm text-muted">{l(previewTheme.description)}</p>}
            <CompatBadge level="app" />
          </div>
        )}
      </Modal>
    </div>
  );
}
