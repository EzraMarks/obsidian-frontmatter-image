import {
    Extension,
    RangeSetBuilder,
    StateField,
    Transaction,
} from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType,
} from "@codemirror/view";
import FrontmatterImagePlugin from "main";
import { Pos, TFile } from "obsidian";

export interface FrontmatterImageStateFieldValue {
    readonly activeFile: TFile;
    decorationSet?: DecorationSet;
}

export const renderFrontmatterImage = (src: string): HTMLElement => {
	const img = document.createElement("img");
	img.src = src;
	img.style.display = "block";
	return img;
}

export const frontmatterImageEditorExtension = (
    plugin: FrontmatterImagePlugin,
): StateField<FrontmatterImageStateFieldValue | undefined> => {
    const isLivePreview = () => {
        const view = EditorView.findFromDOM(document.body);
        return view?.contentDOM.closest(".is-live-preview") !== null;
    };

    const buildDecorationSet = (
        frontmatterPosition: Pos,
        currentImageValue?: string,
    ) => {
        if (!currentImageValue) return Decoration.none;

        const builder = new RangeSetBuilder<Decoration>();
        builder.add(
            frontmatterPosition.end.offset + 1,
            frontmatterPosition.end.offset + 1,
            Decoration.widget({
                widget: new (class extends WidgetType {
                    toDOM(view: EditorView): HTMLElement {
						return renderFrontmatterImage(currentImageValue);
                    }
                })(),
            }),
        );

        return builder.finish();
    };

    return StateField.define({
        create: (state) => {
            const activeFile = plugin.app.workspace.activeEditor?.file;
            if (!activeFile) return undefined;

            return {
                activeFile: activeFile,
                decorationSet: undefined,
            };
        },
        update: (
            oldValue: FrontmatterImageStateFieldValue | undefined,
            transaction: Transaction,
        ): FrontmatterImageStateFieldValue | undefined => {
			if (!oldValue) return;

            if (!isLivePreview()) {
				return { ...oldValue, decorationSet: undefined };
            }

            const cachedMetadata = plugin.app.metadataCache.getFileCache(oldValue.activeFile);
            const frontmatterCache = cachedMetadata?.frontmatter;
            const frontmatterPosition = cachedMetadata?.frontmatterPosition;
            if (!frontmatterCache || !frontmatterPosition) {
				return { ...oldValue, decorationSet: undefined };
            }

            const currentImageKey = plugin.settings.imageKeys.find(key => frontmatterCache[key]);
            const currentImageValue = currentImageKey && frontmatterCache[currentImageKey];

			return {
				...oldValue,
				decorationSet:  buildDecorationSet(
					frontmatterPosition,
					currentImageValue,
				)
			};
        },
        provide: (
            field: StateField<FrontmatterImageStateFieldValue | undefined>,
        ): Extension => {
            return EditorView.decorations.from(
                field,
                (it) => it?.decorationSet ?? Decoration.none,
            );
        },
    });
};
