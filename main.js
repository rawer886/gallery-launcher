const { Plugin, ItemView, Notice, PluginSettingTab, Setting, Menu, Modal } = require('obsidian');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VIEW_TYPE = 'gallery-view';
const RENDER_BATCH_SIZE = 100;
const FOLDER_ALL = '__all__';
const GROUP_FLAT = '__flat__';
const CSS_VAR_MIN_WIDTH = '--gallery-card-min-width';
const CSS_VAR_MIN_HEIGHT = '--gallery-card-min-height';
const DEBOUNCE_MS = 500;

const CARD_COLORS = [
  { name: 'red',    value: '#fc3d39' },
  { name: 'orange', value: '#ff9500' },
  { name: 'yellow', value: '#ffcc00' },
  { name: 'green',  value: '#34c759' },
  { name: 'blue',   value: '#007aff' },
  { name: 'purple', value: '#af52de' },
  { name: 'gray',   value: '#8e8e93' },
];

const DEFAULT_SETTINGS = {
  excludeDirs: 'assets',
  defaultFolder: '',
  lastSelectedFolder: '',
  summaryLength: 150,
  cardMinWidth: 200,
  cardMinHeight: 160,
  showTags: true,
  showFolder: true,
  showDate: true,
  sortBy: 'mtime',
  sortOrder: 'desc',
  groupByMonth: true,
  pinnedFolders: [],
  folderOrder: [],
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
    newNoteTitle: 'New note',
    newNoteConfirmDir: 'A new note will be created in <strong>{dir}</strong>.',
    deleteNote: 'Delete note',
    deleteNoteTitle: 'Delete note',
    deleteNoteConfirm: 'Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    pinFolder: 'Pin to top',
    unpinFolder: 'Unpin',
    untitledNote: 'Untitled',
    noContent: 'No content',
    emptyGallery: 'No notes found',
    loadMore: 'Load more ({remaining} remaining)',
    noteCount: 'Total {count} notes',
    groupNoteCount: '{count} notes',
    refresh: 'Refresh',
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
    revealInExplorer: 'Show in explorer',
    editTime: 'Edit time',
    editTimeTitle: 'Edit note time',
    createdTime: 'Created',
    modifiedTime: 'Modified',
    save: 'Save',
    cardColor: 'Set color',
    removeColor: 'Remove color',
    colorRed: 'Red',
    colorOrange: 'Orange',
    colorYellow: 'Yellow',
    colorGreen: 'Green',
    colorBlue: 'Blue',
    colorPurple: 'Purple',
    colorGray: 'Gray',
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
    newNoteTitle: '新建笔记',
    newNoteConfirmDir: '将在 <strong>{dir}</strong> 目录下新建笔记。',
    deleteNote: '删除笔记',
    deleteNoteTitle: '删除笔记',
    deleteNoteConfirm: '确定要删除 <strong>{name}</strong> 吗？此操作无法撤销。',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    pinFolder: '置顶',
    unpinFolder: '取消置顶',
    untitledNote: '未命名笔记',
    noContent: '暂无内容',
    emptyGallery: '暂无笔记',
    loadMore: '加载更多（剩余 {remaining} 篇）',
    noteCount: '总笔记篇数 {count} 篇',
    groupNoteCount: '{count} 篇',
    refresh: '刷新',
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
    revealInExplorer: '在文件管理器中显示',
    editTime: '修改时间',
    editTimeTitle: '修改笔记时间',
    createdTime: '创建时间',
    modifiedTime: '更新时间',
    save: '保存',
    cardColor: '设置颜色',
    removeColor: '移除颜色',
    colorRed: '红色',
    colorOrange: '橙色',
    colorYellow: '黄色',
    colorGreen: '绿色',
    colorBlue: '蓝色',
    colorPurple: '紫色',
    colorGray: '灰色',
  },
};

// Cache locale once — it doesn't change during a session
const _locale = (() => {
  try {
    const m = window.moment && window.moment.locale && window.moment.locale();
    if (m && m.startsWith('zh')) return 'zh';
  } catch (_) { /* ignore */ }
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('zh')) return 'zh';
  return 'en';
})();

function t(key, params) {
  const str = (TRANSLATIONS[_locale] && TRANSLATIONS[_locale][key]) || TRANSLATIONS.en[key] || key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date, includeDay = true) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  if (!includeDay) return `${y}/${m}`;
  return `${y}/${m}/${String(date.getDate()).padStart(2, '0')}`;
}

function stripMarkdown(content, maxLen) {
  return content
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
    .trim()
    .substring(0, maxLen);
}

function getParentPath(file) {
  return file.parent ? file.parent.path : '/';
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ---------------------------------------------------------------------------
// ConfirmModal
// ---------------------------------------------------------------------------
class ConfirmModal extends Modal {
  /**
   * @param {App} app
   * @param {object} opts
   * @param {string} opts.title - Modal title
   * @param {string} opts.message - Body text
   * @param {string} [opts.confirmText] - Confirm button label
   * @param {string} [opts.cancelText] - Cancel button label
   * @param {'default'|'danger'} [opts.confirmStyle] - Confirm button style
   * @param {() => void|Promise<void>} opts.onConfirm - Callback on confirm
   */
  constructor(app, opts) {
    super(app);
    this.opts = opts;
  }

  onOpen() {
    const { contentEl, opts } = this;
    contentEl.empty();
    contentEl.addClass('gallery-confirm-modal');

    contentEl.createEl('h3', { text: opts.title });
    const msgEl = contentEl.createEl('p');
    msgEl.innerHTML = opts.message;

    const btnRow = contentEl.createEl('div', { cls: 'gallery-confirm-actions' });

    const cancelBtn = btnRow.createEl('button', {
      text: opts.cancelText || t('cancel'),
      cls: 'gallery-confirm-btn gallery-confirm-btn-cancel',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const confirmBtn = btnRow.createEl('button', {
      text: opts.confirmText || t('confirm'),
      cls: `gallery-confirm-btn gallery-confirm-btn-ok${opts.confirmStyle === 'danger' ? ' mod-warning' : ''}`,
    });
    confirmBtn.addEventListener('click', async () => {
      this.close();
      if (opts.onConfirm) await opts.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ---------------------------------------------------------------------------
// EditTimeModal
// ---------------------------------------------------------------------------
function toLocalDatetime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

class EditTimeModal extends Modal {
  constructor(app, file, onSave) {
    super(app);
    this.file = file;
    this.onSave = onSave;
  }

  onOpen() {
    const { contentEl, file } = this;
    contentEl.empty();
    contentEl.addClass('gallery-edit-time-modal');

    contentEl.createEl('h3', { text: t('editTimeTitle') });

    const form = contentEl.createEl('div', { cls: 'gallery-edit-time-form' });

    // Created time
    const ctimeRow = form.createEl('div', { cls: 'gallery-edit-time-row' });
    ctimeRow.createEl('label', { text: t('createdTime') });
    const ctimeInput = ctimeRow.createEl('input', { type: 'datetime-local' });
    ctimeInput.value = toLocalDatetime(file.stat.ctime);

    // Modified time
    const mtimeRow = form.createEl('div', { cls: 'gallery-edit-time-row' });
    mtimeRow.createEl('label', { text: t('modifiedTime') });
    const mtimeInput = mtimeRow.createEl('input', { type: 'datetime-local' });
    mtimeInput.value = toLocalDatetime(file.stat.mtime);

    // Save button
    const btnRow = form.createEl('div', { cls: 'gallery-edit-time-actions' });
    const saveBtn = btnRow.createEl('button', { text: t('save'), cls: 'mod-cta' });
    saveBtn.addEventListener('click', async () => {
      try {
        const fs = require('fs');
        const { execSync } = require('child_process');
        const fullPath = this.app.vault.adapter.getFullPath(file.path);

        const newCtime = new Date(ctimeInput.value);
        const newMtime = new Date(mtimeInput.value);

        // Set atime & mtime via Node.js fs
        fs.utimesSync(fullPath, newMtime, newMtime);

        // On macOS, set birthtime (creation time) via SetFile or touch
        if (process.platform === 'darwin') {
          const pad = (n) => String(n).padStart(2, '0');
          // touch -t format: [[CC]YY]MMDDhhmm[.SS]
          const touchDate = `${newCtime.getFullYear()}${pad(newCtime.getMonth() + 1)}${pad(newCtime.getDate())}${pad(newCtime.getHours())}${pad(newCtime.getMinutes())}.${pad(newCtime.getSeconds())}`;
          execSync(`touch -t ${touchDate} "${fullPath}"`);
          // Restore mtime after touch changed it
          fs.utimesSync(fullPath, newMtime, newMtime);
        }

        // Refresh Obsidian's internal file cache
        this.app.vault.adapter.reconcileFile(file.path, file.path);

        this.close();
        if (this.onSave) await this.onSave();
        new Notice(t('editTime') + ' ✓');
      } catch (e) {
        console.error('EditTimeModal: failed to update time', e);
        new Notice('Error: ' + e.message);
      }
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ---------------------------------------------------------------------------
// ColorPickerModal
// ---------------------------------------------------------------------------
class ColorPickerModal extends Modal {
  constructor(app, file, onSave) {
    super(app);
    this.file = file;
    this.onSave = onSave;
  }

  onOpen() {
    const { contentEl, file } = this;
    contentEl.empty();
    contentEl.addClass('gallery-color-picker');

    contentEl.createEl('h3', { text: t('cardColor') });

    // Read current color from frontmatter
    const cache = this.app.metadataCache.getFileCache(file);
    const currentColor = cache?.frontmatter?.['gallery-color'] || '';

    // Color dots grid
    const grid = contentEl.createEl('div', { cls: 'gallery-color-grid' });
    for (const color of CARD_COLORS) {
      const dot = grid.createEl('button', {
        cls: 'gallery-color-dot',
        attr: { 'aria-label': t(`color${color.name.charAt(0).toUpperCase() + color.name.slice(1)}`) },
      });
      dot.style.backgroundColor = color.value;
      if (currentColor === color.name) dot.addClass('is-active');
      dot.addEventListener('click', async () => {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          fm['gallery-color'] = color.name;
        });
        this.close();
        // Wait for metadataCache to update before refreshing
        setTimeout(async () => {
          if (this.onSave) await this.onSave();
        }, 200);
      });
    }

    // "No color" button
    const noneBtn = contentEl.createEl('button', {
      text: t('removeColor'),
      cls: 'gallery-color-none',
    });
    if (!currentColor) noneBtn.addClass('is-active');
    noneBtn.addEventListener('click', async () => {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        delete fm['gallery-color'];
      });
      this.close();
      setTimeout(async () => {
        if (this.onSave) await this.onSave();
      }, 200);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
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

    // Folder tabs — horizontal tag buttons (first row)
    const initialFolder = settings.lastSelectedFolder || settings.defaultFolder || '';
    let currentFolder = (initialFolder && folders.includes(initialFolder)) ? initialFolder : FOLDER_ALL;
    const folderBar = container.createEl('div', { cls: 'gallery-folder-bar' });

    const tabEls = [];

    const setActiveTab = (value) => {
      currentFolder = value;
      for (const tab of tabEls) {
        tab.toggleClass('is-active', tab.dataset.folder === value);
      }
    };

    // Sort folders: use saved order, pinned first, new folders appended alphabetically
    const getSortedFolders = () => {
      const order = settings.folderOrder || [];
      const pinned = settings.pinnedFolders || [];
      // Folders in saved order (filter out deleted ones)
      const ordered = order.filter(f => folders.includes(f));
      // New folders not yet in order
      const newFolders = folders.filter(f => !order.includes(f)).sort((a, b) => a.localeCompare(b, 'zh'));
      const all = [...ordered, ...newFolders];
      // Pinned first, rest keep their order
      const pinnedItems = all.filter(f => pinned.includes(f));
      const unpinnedItems = all.filter(f => !pinned.includes(f));
      return [...pinnedItems, ...unpinnedItems];
    };

    let draggedFolder = null;

    const renderFolderTabs = () => {
      folderBar.empty();
      tabEls.length = 0;
      const currentPinned = settings.pinnedFolders || [];
      const sorted = getSortedFolders();
      const items = [{ value: FOLDER_ALL, label: t('allFolders') }, ...sorted.map(f => ({ value: f, label: f }))];

      for (const { value, label } of items) {
        const isPinned = value !== FOLDER_ALL && currentPinned.includes(value);
        const tab = folderBar.createEl('button', { cls: 'gallery-folder-tab' });
        if (isPinned) {
          const pinEl = tab.createEl('span', { cls: 'pin-icon' });
          pinEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>';
        }
        tab.appendText(label);
        tab.dataset.folder = value;
        if (value === currentFolder) tab.addClass('is-active');
        if (isPinned) tab.addClass('is-pinned');
        tab.addEventListener('click', async () => {
          setActiveTab(value);
          settings.lastSelectedFolder = value === FOLDER_ALL ? '' : value;
          await this.plugin.saveData(settings);
          await renderCards(currentFolder);
        });

        // Drag & drop reorder (skip "All" tab)
        if (value !== FOLDER_ALL) {
          tab.setAttribute('draggable', 'true');
          tab.addEventListener('dragstart', (e) => {
            draggedFolder = value;
            tab.addClass('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
          });
          tab.addEventListener('dragend', () => {
            tab.removeClass('is-dragging');
            draggedFolder = null;
            folderBar.querySelectorAll('.drag-over').forEach(el => el.removeClass('drag-over'));
          });
          tab.addEventListener('dragover', (e) => {
            if (!draggedFolder || draggedFolder === value) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            tab.addClass('drag-over');
          });
          tab.addEventListener('dragleave', () => {
            tab.removeClass('drag-over');
          });
          tab.addEventListener('drop', async (e) => {
            e.preventDefault();
            tab.removeClass('drag-over');
            if (!draggedFolder || draggedFolder === value) return;
            // Compute new order
            const sorted = getSortedFolders();
            const from = sorted.indexOf(draggedFolder);
            const to = sorted.indexOf(value);
            if (from === -1 || to === -1) return;
            sorted.splice(from, 1);
            sorted.splice(to, 0, draggedFolder);
            settings.folderOrder = sorted;
            await this.plugin.saveData(settings);
            renderFolderTabs();
          });

          // Right-click context menu for pin/unpin
          tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const menu = new Menu();
            const folderPinned = (settings.pinnedFolders || []).includes(value);
            menu.addItem((item) => {
              item.setTitle(folderPinned ? t('unpinFolder') : t('pinFolder'))
                .setIcon(folderPinned ? 'pin-off' : 'pin')
                .onClick(async () => {
                  if (folderPinned) {
                    settings.pinnedFolders = (settings.pinnedFolders || []).filter(f => f !== value);
                  } else {
                    settings.pinnedFolders = [...(settings.pinnedFolders || []), value];
                  }
                  await this.plugin.saveData(settings);
                  renderFolderTabs();
                });
            });
            menu.showAtMouseEvent(e);
          });
        }
        tabEls.push(tab);
      }
    };

    renderFolderTabs();

    // Info bar — note count (left) + sort button (right)
    const infoBar = container.createEl('div', { cls: 'gallery-info-bar' });
    const noteCountEl = infoBar.createEl('span', { cls: 'gallery-note-count' });
    const sortBtn = infoBar.createEl('button', { cls: 'gallery-sort-btn', attr: { 'aria-label': t('sort') } });
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
              await this.plugin.saveSettings();
              await renderCards(currentFolder);
            });
        });
      }
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle(t('groupByMonth'))
          .setChecked(settings.groupByMonth)
          .onClick(async () => {
            settings.groupByMonth = !settings.groupByMonth;
            await this.plugin.saveSettings();
            await renderCards(currentFolder);
          });
      });
      menu.showAtMouseEvent(e);
    });

    // Card area
    const cardArea = container.createEl('div');

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const menu = new Menu();
      menu.addItem((item) => {
        item.setTitle(t('newNote'))
          .setIcon('plus')
          .onClick(async () => {
            const dir = currentFolder === FOLDER_ALL ? '/' : currentFolder;
            await this.createNewNote(dir);
            await renderCards(currentFolder);
          });
      });
      menu.addItem((item) => {
        item.setTitle(t('refresh'))
          .setIcon('refresh-cw')
          .onClick(async () => {
            await renderCards(currentFolder);
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
      if (folder === FOLDER_ALL) {
        for (const folderName of folders) {
          const folderObj = this.app.vault.getAbstractFileByPath(folderName);
          if (folderObj && folderObj.children) {
            this.collectNoteFiles(folderObj, files);
          }
        }
      } else {
        const folderObj = this.app.vault.getAbstractFileByPath(folder);
        if (folderObj && folderObj.children) {
          this.collectNoteFiles(folderObj, files);
        }
      }

      // Update note count in info bar
      noteCountEl.textContent = t('noteCount', { count: files.length });

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
            const month = formatDate(new Date(file.stat[timeKey]), false);
            if (!groups[month]) groups[month] = [];
            groups[month].push(file);
          }
        } else {
          groups[GROUP_FLAT] = visibleFiles;
        }

        for (const [month, monthFiles] of Object.entries(groups)) {
          if (groupByMonth) {
            const monthEl = cardArea.createEl('div', { cls: 'gallery-month' });
            monthEl.createSpan({ text: month });
            monthEl.createSpan({ text: t('groupNoteCount', { count: monthFiles.length }), cls: 'gallery-month-count' });
          }

          const grid = cardArea.createEl('div', { cls: 'gallery-container' });

          for (const file of monthFiles) {
            let summary = '';
            try {
              const content = await this.app.vault.cachedRead(file);
              summary = stripMarkdown(content, settings.summaryLength);
              if (summary.length >= settings.summaryLength) {
                summary += '...';
              }
            } catch (e) { /* ignore */ }

            const card = grid.createEl('div', { cls: 'gallery-card' });
            const cardCache = this.app.metadataCache.getFileCache(file);
            const cardColor = cardCache?.frontmatter?.['gallery-color'];
            if (cardColor) {
              const colorDef = CARD_COLORS.find(c => c.name === cardColor);
              if (colorDef) {
                card.style.borderColor = colorDef.value;
                card.classList.add('gallery-card-colored');
              }
            }
            card.addEventListener('click', () => {
              this.app.workspace.openLinkText(file.path, '');
            });
            card.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const menu = new Menu();
              // -- 创建 --
              menu.addItem((item) => {
                item.setTitle(t('newNote'))
                  .setIcon('plus')
                  .onClick(() => {
                    const dir = getParentPath(file);
                    new ConfirmModal(this.app, {
                      title: t('newNoteTitle'),
                      message: t('newNoteConfirmDir', { dir }),
                      confirmText: t('confirm'),
                      onConfirm: async () => {
                        await this.createNewNote(dir);
                        await renderCards(currentFolder);
                      },
                    }).open();
                  });
              });
              menu.addSeparator();
              // -- 设置颜色 --
              menu.addItem((item) => {
                item.setTitle(t('cardColor'))
                  .setIcon('palette')
                  .onClick(() => {
                    new ColorPickerModal(this.app, file, async () => {
                      await renderCards(currentFolder);
                    }).open();
                  });
              });
              // -- 编辑时间 --
              menu.addItem((item) => {
                item.setTitle(t('editTime'))
                  .setIcon('clock')
                  .onClick(() => {
                    new EditTimeModal(this.app, file, async () => {
                      await renderCards(currentFolder);
                    }).open();
                  });
              });
              menu.addSeparator();
              // -- 在系统资源管理器中显示 --
              menu.addItem((item) => {
                item.setTitle(t('revealInExplorer'))
                  .setIcon('folder-open')
                  .onClick(() => {
                    const fullPath = this.app.vault.adapter.getFullPath(file.path);
                    const { shell } = require('electron');
                    shell.showItemInFolder(fullPath);
                  });
              });
              menu.addSeparator();
              // -- 危险操作 --
              menu.addItem((item) => {
                item.setTitle(t('deleteNote'))
                  .setIcon('trash')
                  .onClick(() => {
                    new ConfirmModal(this.app, {
                      title: t('deleteNoteTitle'),
                      message: t('deleteNoteConfirm', { name: file.basename }),
                      confirmText: t('delete'),
                      confirmStyle: 'danger',
                      onConfirm: async () => {
                        await this.app.vault.trash(file, true);
                        await renderCards(currentFolder);
                      },
                    }).open();
                  });
              });
              menu.addSeparator();
              // -- 刷新 --
              menu.addItem((item) => {
                item.setTitle(t('refresh'))
                  .setIcon('refresh-cw')
                  .onClick(async () => {
                    await renderCards(currentFolder);
                  });
              });
              menu.showAtMouseEvent(e);
            });

            const body = card.createEl('div');
            body.createEl('div', { text: file.basename, cls: 'card-title' });

            // Tags
            if (settings.showTags) {
              const cache = this.app.metadataCache.getFileCache(file);
              const tagSet = new Set();
              if (cache) {
                if (cache.frontmatter && cache.frontmatter.tags) {
                  const fmTags = cache.frontmatter.tags;
                  if (Array.isArray(fmTags)) {
                    fmTags.forEach(tag => tagSet.add(String(tag).replace(/^#/, '')));
                  } else if (typeof fmTags === 'string') {
                    tagSet.add(fmTags.replace(/^#/, ''));
                  }
                }
                if (cache.tags) {
                  for (const tagRef of cache.tags) {
                    tagSet.add(tagRef.tag.replace(/^#/, ''));
                  }
                }
              }
              if (tagSet.size > 0) {
                const tagsEl = body.createEl('div', { cls: 'card-tags' });
                for (const tagName of tagSet) {
                  tagsEl.createEl('span', { text: tagName, cls: 'tag-item' });
                }
              }
            }

            body.createEl('div', { text: summary || t('noContent'), cls: 'card-content' });

            const footer = card.createEl('div', { cls: 'card-footer' });
            if (settings.showFolder) {
              footer.createEl('div', { text: getParentPath(file), cls: 'card-folder' });
            }
            if (settings.showDate) {
              footer.createEl('div', { text: formatDate(new Date(file.stat.ctime)), cls: 'card-date' });
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

    // Auto-refresh when switching back to gallery tab
    this._renderCards = renderCards;
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf === this.leaf) {
          renderCards(currentFolder);
        }
      })
    );

    await renderCards(currentFolder);
  }

  collectNoteFiles(folder, results = []) {
    for (const child of folder.children) {
      if (child.extension === 'md' || child.extension === 'canvas') {
        results.push(child);
      } else if (child.children) {
        this.collectNoteFiles(child, results);
      }
    }
    return results;
  }

  async createNewNote(folderPath) {
    const vault = this.app.vault;
    const base = t('untitledNote');
    const buildPath = (name) => folderPath === '/' ? name : `${folderPath}/${name}`;
    let fileName = `${base}.md`;
    let filePath = buildPath(fileName);
    let counter = 1;
    while (vault.getAbstractFileByPath(filePath)) {
      fileName = `${base} ${counter}.md`;
      filePath = buildPath(fileName);
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
    this._debouncedSave = debounce(() => this.plugin.saveSettings(), DEBOUNCE_MS);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: t('settingsTitle') });

    this._addTextSetting(containerEl, 'settingExcludeDirs', 'settingExcludeDirsDesc', 'assets, templates', 'excludeDirs');
    this._addTextSetting(containerEl, 'settingDefaultFolder', 'settingDefaultFolderDesc', t('settingDefaultFolderPlaceholder'), 'defaultFolder');
    this._addNumericSetting(containerEl, 'settingSummaryLength', 'settingSummaryLengthDesc', '150', 'summaryLength');
    this._addNumericSetting(containerEl, 'settingCardMinWidth', 'settingCardMinWidthDesc', '200', 'cardMinWidth');
    this._addNumericSetting(containerEl, 'settingCardMinHeight', 'settingCardMinHeightDesc', '160', 'cardMinHeight');
    this._addToggleSetting(containerEl, 'settingShowTags', 'settingShowTagsDesc', 'showTags');
    this._addToggleSetting(containerEl, 'settingShowFolder', 'settingShowFolderDesc', 'showFolder');
    this._addToggleSetting(containerEl, 'settingShowDate', 'settingShowDateDesc', 'showDate');
  }

  _addTextSetting(containerEl, nameKey, descKey, placeholder, settingsKey) {
    new Setting(containerEl)
      .setName(t(nameKey))
      .setDesc(t(descKey))
      .addText(text => text
        .setPlaceholder(placeholder)
        .setValue(this.plugin.settings[settingsKey])
        .onChange((value) => {
          this.plugin.settings[settingsKey] = value;
          this._debouncedSave();
        }));
  }

  _addNumericSetting(containerEl, nameKey, descKey, placeholder, settingsKey) {
    new Setting(containerEl)
      .setName(t(nameKey))
      .setDesc(t(descKey))
      .addText(text => text
        .setPlaceholder(placeholder)
        .setValue(String(this.plugin.settings[settingsKey]))
        .onChange((value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings[settingsKey] = num;
            this._debouncedSave();
          }
        }));
  }

  _addToggleSetting(containerEl, nameKey, descKey, settingsKey) {
    new Setting(containerEl)
      .setName(t(nameKey))
      .setDesc(t(descKey))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings[settingsKey])
        .onChange(async (value) => {
          this.plugin.settings[settingsKey] = value;
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
    await this.refreshViews();
  }

  async refreshViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view && view.onOpen) {
        await view.onOpen();
      }
    }
  }

  updateCSSVariables() {
    document.body.style.setProperty(CSS_VAR_MIN_WIDTH, `${this.settings.cardMinWidth}px`);
    document.body.style.setProperty(CSS_VAR_MIN_HEIGHT, `${this.settings.cardMinHeight}px`);
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
    document.body.style.removeProperty(CSS_VAR_MIN_WIDTH);
    document.body.style.removeProperty(CSS_VAR_MIN_HEIGHT);
  }
}

module.exports = GalleryLauncherPlugin;
