import {
    App,
    MarkdownPostProcessorContext,
    Plugin,
    PluginSettingTab,
    Setting
} from "obsidian";
import { frontmatterImageEditorExtension, } from "src/frontmatterImageEditorExtension";
import { getImageSrc, appendFrontmatterImage } from "./utils";

interface FrontmatterImagePluginSettings {
    imageKeys: string[];
}

const DEFAULT_SETTINGS: FrontmatterImagePluginSettings = {
    imageKeys: [],
};

export default class FrontmatterImagePlugin extends Plugin {
    settings: FrontmatterImagePluginSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new FrontmatterImageSettingTab(this.app, this));

        // Register editor extension for editor view (live preview)
        this.registerEditorExtension(frontmatterImageEditorExtension(this));

        // Register markdown post-processor for reading view
        this.registerMarkdownPostProcessor(
            (element: HTMLElement, context: MarkdownPostProcessorContext) => {
                if (!element.hasClass("mod-frontmatter")) return;

                const imageSrc = getImageSrc(context.sourcePath, this);
                if (!imageSrc) return;

                const div = element.createDiv();
                appendFrontmatterImage(div, imageSrc);
                div.createEl("br");
            },
        );
    }

    onunload() { }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class FrontmatterImageSettingTab extends PluginSettingTab {
    plugin: FrontmatterImagePlugin;

    constructor(app: App, plugin: FrontmatterImagePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("YAML keys")
            .setDesc(
                "Frontmatter keys that contain image source; one per line. Only the first populated key's image will be rendered.",
            )
            .addTextArea((text) =>
                text
                    .setPlaceholder("Enter your keys")
                    .setValue(this.plugin.settings.imageKeys.join("\n"))
                    .onChange(async (value) => {
                        this.plugin.settings.imageKeys = value.split("\n").map(key => key.trim()).filter(key => key.length > 0);
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
