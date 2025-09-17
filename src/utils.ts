import FrontmatterImagePlugin from "./main";

export const getImageSrc = (activeFilePath: string, plugin: FrontmatterImagePlugin): string | undefined => {
    const fileCache = plugin.app.metadataCache.getCache(activeFilePath);
    const frontmatter = fileCache?.frontmatter;
    if (!frontmatter) return;

    let rawValue = plugin.settings.imageKeys
        .map(key => frontmatter[key])
        .find(value => !!value);

    if (!rawValue) return;

    // Extract image from wikilink format: [[img.jpg|...]] or [[img.jpg]]
    const wikilinkMatch = rawValue.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
    if (wikilinkMatch) {
        rawValue = wikilinkMatch[1];
    }

    // Check if it's already a full URL or path
    if (rawValue.startsWith('http') || rawValue.startsWith('/') || rawValue.startsWith('data:')) {
        return rawValue;
    }

    // Try to resolve as an Obsidian file
    const file = plugin.app.metadataCache.getFirstLinkpathDest(rawValue, activeFilePath);
    if (file) {
        return plugin.app.vault.getResourcePath(file);
    }

    // If we can't resolve it, return the original value
    return rawValue;
};

export const appendFrontmatterImage = (containerEl: HTMLElement, src: string): HTMLElement => {
    const img = containerEl.createEl("img");
    img.src = src;
    img.classList.add("frontmatter-image");
    return img;
}
