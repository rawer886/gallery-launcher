const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Menu } = require('obsidian');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VIEW_TYPE = 'gallery-view';
const RENDER_BATCH_SIZE = 100;

const DEFAULT_SETTINGS = {
  excludeDirs: 'assets',
  defaultFolder: '',
  summaryLength: 150,
  cardMinWidth: 200,
  cardMinHeight: 160,
  showTags: true,
  showFolder: true,
  showDate: true,
  sortBy: 'mtime',
  sortOrder: 'desc',
  groupByMonth: true,
};

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  en: {
    allFolders: 'All folders',
    sort: 'Sort',
    sortCTimeDesc: 'Created: newest first',
    sortCTimeAsc: 'Created: oldest first',
    sortMTimeDesc: 'Modified: newest first',
    sortMTimeAsc: 'Modified: oldest first',
    sortTitleAsc: 'Title: A to Z',
    sortTitleDesc: 'Title: Z to A',
    groupByMonth: 'Group notes by month',
    newNote: 'New note',
    newNoteInDir: 'New note in this folder',
    untitledNote: 'Untitled',
    noContent: 'No content',
    emptyGallery: 'No notes found',
    loadMore: 'Load more ({remaining} remaining)',
    noteCount: '{count} notes',
    openGallery: 'Open Gallery',
    settingsTitle: 'Gallery Launcher Settings',
    settingExcludeDirs: 'Excluded folders',
    settingExcludeDirsDesc: 'Extra folders to exclude (comma-separated). Hidden folders starting with . are excluded automatically',
    settingDefaultFolder: 'Default folder',
    settingDefaultFolderDesc: 'Folder selected by default when opening the gallery. Leave empty to show all',
    settingDefaultFolderPlaceholder: 'e.g. Work',
    settingSummaryLength: 'Summary max length',
    settingSummaryLengthDesc: 'Maximum characters for the card content summary',
    settingCardMinWidth: 'Card min width (px)',
    settingCardMinWidthDesc: 'Minimum width of each card in the grid layout',
    settingCardMinHeight: 'Card min height (px)',
    settingCardMinHeightDesc: 'Minimum height of each card',
    settingShowTags: 'Show tags',
    settingShowTagsDesc: 'Display note tags on cards',
    settingShowFolder: 'Show folder path',
    settingShowFolderDesc: 'Display the folder path at the bottom of cards',
    settingShowDate: 'Show date',
    settingShowDateDesc: 'Display the creation date at the bottom of cards',
  },
  zh: {
    allFolders: '全部目录',
    sort: '排序',
    sortCTimeDesc: '按创建时间：最新到最旧',
    sortCTimeAsc: '按创建时间：最旧到最新',
    sortMTimeDesc: '按更新时间：最新到最旧',
    sortMTimeAsc: '按更新时间：最旧到最新',
    sortTitleAsc: '按标题：A 到 Z',
    sortTitleDesc: '按标题：Z 到 A',
    groupByMonth: '按组显示笔记',
    newNote: '新建笔记',
    newNoteInDir: '在此目录新建笔记',
    untitledNote: '未命名笔记',
    noContent: '暂无内容',
    emptyGallery: '暂无笔记',
    loadMore: '加载更多（剩余 {remaining} 篇）',
    noteCount: '{count} 篇',
    openGallery: '打开画廊',
    settingsTitle: 'Gallery Launcher 设置',
    settingExcludeDirs: '排除的目录',
    settingExcludeDirsDesc: '额外排除的目录（逗号分隔）。以 . 开头的隐藏目录已自动排除',
    settingDefaultFolder: '默认选中的目录',
    settingDefaultFolderDesc: '打开画廊时默认选中的目录名称，留空则显示全部目录',
    settingDefaultFolderPlaceholder: '例如: 工作记录',
    settingSummaryLength: '摘要最大字数',
    settingSummaryLengthDesc: '卡片中显示的内容摘要最大字符数',
    settingCardMinWidth: '卡片最小宽度 (px)',
    settingCardMinWidthDesc: '网格布局中每张卡片的最小宽度',
    settingCardMinHeight: '卡片最小高度 (px)',
    settingCardMinHeightDesc: '每张卡片的最小高度',
    settingShowTags: '显示标签',
    settingShowTagsDesc: '在卡片中显示笔记的标签',
    settingShowFolder: '显示目录路径',
    settingShowFolderDesc: '在卡片底部显示笔记所在的目录路径',
    settingShowDate: '显示日期',
    settingShowDateDesc: '在卡片底部显示笔记的创建日期',
  },
};

function getLocale() {
  try {
    const m = window.moment && window.moment.locale && window.moment.locale();
    if (m && m.startsWith('zh')) return 'zh';
  } catch (_) { /* ignore */ }
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('zh')) return 'zh';
  return 'en';
}

function t(key, params) {
  const locale = getLocale();
  const str = (TRANSLATIONS[locale] && TRANSLATIONS[locale][key]) || TRANSLATIONS.en[key] || key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
}

// ---------------------------------------------------------------------------
// GalleryView
// ---------------------------------------------------------------------------
class GalleryView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Gallery Launcher'; }
  getIcon() { return 'layout-grid'; }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('gallery-page');

    const settings = this.plugin.settings;

    // Collect root-level folders
    const root = this.app.vault.getRoot();
    const excludeDirs = new Set(
      settings.excludeDirs.split(',').map(s => s.trim()).filter(Boolean)
    );
    const folders = root.children
      .filter(f => f.children !== undefined && !f.name.startsWith('.') && !excludeDirs.has(f.name))
      .map(f => f.name)
      .sort();

    // Toolbar
    const toolbar = container.createEl('div', { cls: 'gallery-toolbar' });
    const select = toolbar.createEl('select', { cls: 'gallery-select' });

    select.createEl('option', { text: t('allFolders'), attr: { value: '__all__' } });
    for (const f of folders) {
      const opt = select.createEl('option', { text: f, attr: { value: f } });
      if (settings.defaultFolder && f === settings.defaultFolder) opt.selected = true;
    }

    // Sort button
    const sortBtn = toolbar.createEl('button', { cls: 'gallery-sort-btn', attr: { 'aria-label': t('sort') } });
    sortBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="m3 17 3 3 3-3"/><path d="M6 18V4"/></svg>';

    const SORT_OPTIONS = [
      { key: 'ctime', order: 'desc', label: t('sortCTimeDesc') },
      { key: 'ctime', order: 'asc',  label: t('sortCTimeAsc') },
      { key: 'mtime', order: 'desc', label: t('sortMTimeDesc') },
      { key: 'mtime', order: 'asc',  label: t('sortMTimeAsc') },
      { key: 'title', order: 'asc',  label: t('sortTitleAsc') },
      { key: 'title', order: 'desc', label: t('sortTitleDesc') },
    ];

    sortBtn.addEventListener('click', (e) => {
      const menu = new Menu();
      for (const opt of SORT_OPTIONS) {
        menu.addItem((item) => {
          item.setTitle(opt.label)
            .setChecked(settings.sortBy === opt.key && settings.sortOrder === opt.order)
            .onClick(async () => {
              settings.sortBy = opt.key;
              settings.sortOrder = opt.order;
              await this.plugin.saveData(settings);
              await renderCards(select.value);
            });
        });
      }
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle(t('groupByMonth'))
          .setChecked(settings.groupByMonth)
          .onClick(async () => {
            settings.groupByMonth = !settings.groupByMonth;
            await this.plugin.saveData(settings);
            await renderCards(select.value);
          });
      });
      menu.showAtMouseEvent(e);
    });

    // Card area
    const cardArea = container.createEl('div');

    cardArea.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menu = new Menu();
      menu.addItem((item) => {
        item.setTitle(t('newNote'))
          .setIcon('plus')
          .onClick(async () => {
            const dir = select.value === '__all__' ? '/' : select.value;
            await this.createNewNote(dir);
            await renderCards(select.value);
          });
      });
      menu.showAtMouseEvent(e);
    });

    // ------------------------------------------------------------------
    // renderCards — with batched rendering & empty state
    // ------------------------------------------------------------------
    const renderCards = async (folder) => {
      cardArea.empty();

      // Collect files
      let files = [];
      if (folder === '__all__') {
        for (const f of folders) {
          const folderObj = this.app.vault.getAbstractFileByPath(f);
          if (folderObj && folderObj.children) {
            files.push(...this.collectNoteFiles(folderObj));
          }
        }
      } else {
        const folderObj = this.app.vault.getAbstractFileByPath(folder);
        if (folderObj && folderObj.children) {
          files = this.collectNoteFiles(folderObj);
        }
      }

      // Empty state
      if (files.length === 0) {
        const emptyEl = cardArea.createEl('div', { cls: 'gallery-empty' });
        emptyEl.createEl('div', { text: '📭', cls: 'gallery-empty-icon' });
        emptyEl.createEl('div', { text: t('emptyGallery'), cls: 'gallery-empty-text' });
        return;
      }

      // Sort
      const sortBy = settings.sortBy || 'mtime';
      const sortOrder = settings.sortOrder || 'desc';
      const dir = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'title') {
        files.sort((a, b) => dir * a.basename.localeCompare(b.basename, 'zh'));
      } else if (sortBy === 'ctime') {
        files.sort((a, b) => dir * (a.stat.ctime - b.stat.ctime));
      } else {
        files.sort((a, b) => dir * (a.stat.mtime - b.stat.mtime));
      }

      // Batched render
      let currentLimit = RENDER_BATCH_SIZE;

      const renderBatch = async (limit) => {
        cardArea.empty();
        const visibleFiles = files.slice(0, limit);

        // Group
        const groupByMonth = settings.groupByMonth !== false;
        const groups = {};
        if (groupByMonth) {
          const timeKey = (sortBy === 'ctime') ? 'ctime' : 'mtime';
          for (const file of visibleFiles) {
            const date = new Date(file.stat[timeKey]);
            const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[month]) groups[month] = [];
            groups[month].push(file);
          }
        } else {
          groups['__flat__'] = visibleFiles;
        }

        for (const [month, monthFiles] of Object.entries(groups)) {
          if (groupByMonth) {
            const monthEl = cardArea.createEl('div', { cls: 'gallery-month' });
            monthEl.createSpan({ text: month });
            monthEl.createSpan({ text: t('noteCount', { count: monthFiles.length }), cls: 'gallery-month-count' });
          }

          const grid = cardArea.createEl('div', { cls: 'gallery-container' });

          for (const file of monthFiles) {
            let summary = '';
            try {
              const content = await this.app.vault.cachedRead(file);
              summary = content
                .replace(/^---[\s\S]*?---/m, '')
                .replace(/^#+\s+.*$/gm, '')
                .replace(/```[\s\S]*?```/gm, '')
                .replace(/!?\[\[.*?\]\]/g, '')
                .replace(/!\[.*?\]\(.*?\)/g, '')
                .replace(/\[.*?\]\(.*?\)/g, '')
                .replace(/[-*]\s+\[.\]\s*/g, '')
                .replace(/^\s*[-*+]\s+/gm, '')
                .replace(/[>#\-|]/g, '')
                .replace(/\n{2,}/g, ' ')
                .trim();
              if (summary.length > settings.summaryLength) {
                summary = summary.substring(0, settings.summaryLength) + '...';
              }
            } catch (e) { /* ignore */ }

            const cdate = new Date(file.stat.ctime);
            const dateStr = `${cdate.getFullYear()}/${String(cdate.getMonth() + 1).padStart(2, '0')}/${String(cdate.getDate()).padStart(2, '0')}`;

            const card = grid.createEl('div', { cls: 'gallery-card' });
            card.addEventListener('click', () => {
              this.app.workspace.openLinkText(file.path, '');
            });
            card.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const menu = new Menu();
              menu.addItem((item) => {
                item.setTitle(t('newNoteInDir'))
                  .setIcon('plus')
                  .onClick(async () => {
                    const d = file.parent ? file.parent.path : '/';
                    await this.createNewNote(d);
                    await renderCards(select.value);
                  });
              });
              menu.showAtMouseEvent(e);
            });

            const body = card.createEl('div');
            body.createEl('div', { text: file.basename, cls: 'card-title' });

            // Tags
            if (settings.showTags) {
              const cache = this.app.metadataCache.getFileCache(file);
              const tags = [];
              if (cache) {
                if (cache.frontmatter && cache.frontmatter.tags) {
                  const fmTags = cache.frontmatter.tags;
                  if (Array.isArray(fmTags)) {
                    tags.push(...fmTags.map(tag => String(tag).replace('#', '')));
                  } else if (typeof fmTags === 'string') {
                    tags.push(fmTags.replace('#', ''));
                  }
                }
                if (cache.tags) {
                  for (const tagRef of cache.tags) {
                    const name = tagRef.tag.replace('#', '');
                    if (!tags.includes(name)) tags.push(name);
                  }
                }
              }
              if (tags.length > 0) {
                const tagsEl = body.createEl('div', { cls: 'card-tags' });
                for (const tag of tags) {
                  tagsEl.createEl('span', { text: tag, cls: 'tag-item' });
                }
              }
            }

            body.createEl('div', { text: summary || t('noContent'), cls: 'card-content' });

            const footer = card.createEl('div', { cls: 'card-footer' });
            if (settings.showFolder) {
              const folderPath = file.parent ? file.parent.path : '/';
              footer.createEl('div', { text: folderPath, cls: 'card-folder' });
            }
            if (settings.showDate) {
              footer.createEl('div', { text: dateStr, cls: 'card-date' });
            }
          }
        }

        // "Load more" button
        if (limit < files.length) {
          const remaining = files.length - limit;
          const loadMoreEl = cardArea.createEl('div', { cls: 'gallery-load-more' });
          const btn = loadMoreEl.createEl('button', { text: t('loadMore', { remaining }) });
          btn.addEventListener('click', async () => {
            currentLimit += RENDER_BATCH_SIZE;
            await renderBatch(currentLimit);
          });
        }
      };

      await renderBatch(currentLimit);
    };

    select.addEventListener('change', () => renderCards(select.value));
    await renderCards(select.value);
  }

  collectNoteFiles(folder) {
    let results = [];
    for (const child of folder.children) {
      if (child.extension === 'md' || child.extension === 'canvas') {
        results.push(child);
      } else if (child.children) {
        results.push(...this.collectNoteFiles(child));
      }
    }
    return results;
  }

  async createNewNote(folderPath) {
    const vault = this.app.vault;
    const base = t('untitledNote');
    let fileName = `${base}.md`;
    let filePath = folderPath === '/' ? fileName : `${folderPath}/${fileName}`;
    let counter = 1;
    while (vault.getAbstractFileByPath(filePath)) {
      fileName = `${base} ${counter}.md`;
      filePath = folderPath === '/' ? fileName : `${folderPath}/${fileName}`;
      counter++;
    }
    await vault.create(filePath, '');
    await this.app.workspace.openLinkText(filePath, '');
    return filePath;
  }

  async onClose() {}
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------
class GallerySettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: t('settingsTitle') });

    new Setting(containerEl)
      .setName(t('settingExcludeDirs'))
      .setDesc(t('settingExcludeDirsDesc'))
      .addText(text => text
        .setPlaceholder('assets, templates')
        .setValue(this.plugin.settings.excludeDirs)
        .onChange(async (value) => {
          this.plugin.settings.excludeDirs = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('settingDefaultFolder'))
      .setDesc(t('settingDefaultFolderDesc'))
      .addText(text => text
        .setPlaceholder(t('settingDefaultFolderPlaceholder'))
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('settingSummaryLength'))
      .setDesc(t('settingSummaryLengthDesc'))
      .addText(text => text
        .setPlaceholder('150')
        .setValue(String(this.plugin.settings.summaryLength))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.summaryLength = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName(t('settingCardMinWidth'))
      .setDesc(t('settingCardMinWidthDesc'))
      .addText(text => text
        .setPlaceholder('200')
        .setValue(String(this.plugin.settings.cardMinWidth))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.cardMinWidth = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName(t('settingCardMinHeight'))
      .setDesc(t('settingCardMinHeightDesc'))
      .addText(text => text
        .setPlaceholder('160')
        .setValue(String(this.plugin.settings.cardMinHeight))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.cardMinHeight = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName(t('settingShowTags'))
      .setDesc(t('settingShowTagsDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showTags)
        .onChange(async (value) => {
          this.plugin.settings.showTags = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('settingShowFolder'))
      .setDesc(t('settingShowFolderDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showFolder)
        .onChange(async (value) => {
          this.plugin.settings.showFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('settingShowDate'))
      .setDesc(t('settingShowDateDesc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showDate)
        .onChange(async (value) => {
          this.plugin.settings.showDate = value;
          await this.plugin.saveSettings();
        }));
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
class GalleryLauncherPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new GalleryView(leaf, this));

    this.addSettingTab(new GallerySettingTab(this.app, this));

    // Set CSS custom properties for dynamic values
    this.updateCSSVariables();

    // Ribbon icon
    this.addRibbonIcon('layout-grid', t('openGallery'), () => {
      this.activateView();
    });

    // Command palette
    this.addCommand({
      id: 'open-gallery',
      name: t('openGallery'),
      callback: () => {
        this.activateView();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateCSSVariables();
    this.refreshViews();
  }

  refreshViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view && view.onOpen) {
        view.onOpen();
      }
    }
  }

  updateCSSVariables() {
    document.body.style.setProperty('--gallery-card-min-width', `${this.settings.cardMinWidth}px`);
    document.body.style.setProperty('--gallery-card-min-height', `${this.settings.cardMinHeight}px`);
  }

  async activateView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  onunload() {
    document.body.style.removeProperty('--gallery-card-min-width');
    document.body.style.removeProperty('--gallery-card-min-height');
  }
}

module.exports = GalleryLauncherPlugin;
