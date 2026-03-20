# Gallery Launcher

An [Obsidian](https://obsidian.md) plugin that lets you browse your vault notes as a visual gallery of cards.

## Features

- **Gallery view** — browse notes as responsive card grid with title, tags, content summary, folder path, and date
- **Folder filtering** — select a specific folder or view all; drag to reorder, right-click to pin/unpin
- **Favorites** — right-click a card to favorite/unfavorite; favorited notes show a star badge and appear in a dedicated collapsible section at the top
- **Card colors** — set a colored border on any card via right-click context menu (stored in frontmatter)
- **Sorting** — sort by created time, modified time, or title (ascending / descending)
- **Group collapse** — collapse/expand individual groups or all groups at once; state persists across sessions
- **Context menu** — right-click cards to create notes/folders, set color, edit timestamps, favorite, reveal in explorer, or delete
- **Edit timestamps** — modify creation and modification times of notes directly from the gallery
- **Batch rendering** — loads notes in batches of 100 for smooth performance on large vaults
- **i18n** — UI automatically switches between English and Chinese based on Obsidian locale
- **Command palette** — open the gallery from the command palette ("Gallery Launcher: Open Gallery")

## Installation

### From Community Plugins (recommended)

1. Open **Settings → Community plugins → Browse**
2. Search for **Gallery Launcher**
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js`, `styles.css`, and `manifest.json` from the [latest release](https://github.com/rawer886/gallery-launcher/releases)
2. Create a folder `<vault>/.obsidian/plugins/gallery-launcher/`
3. Copy the three files into that folder
4. Restart Obsidian and enable the plugin in **Settings → Community plugins**

## Usage

### Opening the Gallery

There are three ways to open the gallery view:

1. **Ribbon icon** — click the grid icon (⊞) in the left sidebar ribbon
2. **Command palette** — press `Ctrl/Cmd + P`, then type `Gallery Launcher: Open Gallery`
3. **Hotkey** — assign a custom hotkey in **Settings → Hotkeys**, search for "Gallery Launcher"

### Browsing Notes

- The gallery displays all your Markdown (`.md`) and Canvas (`.canvas`) files as cards
- Each card shows the **title**, **content summary**, **tags**, **folder path**, and **creation date**
- Click any card to open that note
- Use the **folder tabs** at the top to filter by a specific folder or view all
- **Drag** folder tabs to reorder; **right-click** to pin/unpin a folder to the top

### Sorting & Grouping

- Click the **sort button** in the info bar to access sorting options:
  - Sort by **created time**, **modified time**, or **title**
  - Toggle between ascending and descending order
  - Enable/disable **grouping** to organize notes by month (time sort) or folder (title sort)
- Use the **expand/collapse** buttons to toggle all groups at once

### Context Menu

- **Right-click** on any empty area to create a new note/folder or refresh the gallery
- **Right-click** on a card for actions: favorite, create note/folder, set color, edit timestamps, reveal in explorer, or delete

### Large Vaults

- For vaults with many notes, the gallery loads **100 notes at a time**
- Click the **"Load more"** button at the bottom to load the next batch

## Settings

| Setting | Description | Default |
|---|---|---|
| Excluded folders | Comma-separated folder names to hide (hidden `.` folders are always excluded) | `assets` |
| Default folder | Folder selected on open; leave empty to restore last viewed folder | — |
| Card min width (px) | Minimum card width in the grid | `200` |
| Card min height (px) | Minimum card height | `240` |
| Show tags | Display note tags on cards | `true` |
| Show folder path | Display folder path at card bottom | `true` |
| Show date | Display creation date at card bottom | `true` |

## License

[MIT](./LICENSE)
