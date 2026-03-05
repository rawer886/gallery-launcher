# Gallery Launcher

An [Obsidian](https://obsidian.md) plugin that lets you browse your vault notes as a visual gallery of cards.

## Features

- **Gallery view** — browse notes as responsive card grid with title, tags, content summary, folder path, and date
- **Folder filtering** — select a specific folder or view all folders at once
- **Sorting** — sort by created time, modified time, or title (ascending / descending)
- **Month grouping** — optionally group notes by month
- **Quick note creation** — right-click to create a new note in any folder
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

- Click the grid icon in the left ribbon, or
- Open the command palette and run **Gallery Launcher: Open Gallery**

## Settings

| Setting | Description | Default |
|---|---|---|
| Excluded folders | Comma-separated folder names to hide (hidden `.` folders are always excluded) | `assets` |
| Default folder | Folder selected on open; leave empty for all | — |
| Summary max length | Max characters for the card content preview | `150` |
| Card min width (px) | Minimum card width in the grid | `200` |
| Card min height (px) | Minimum card height | `160` |
| Show tags | Display note tags on cards | `true` |
| Show folder path | Display folder path at card bottom | `true` |
| Show date | Display creation date at card bottom | `true` |

## License

[MIT](./LICENSE)
