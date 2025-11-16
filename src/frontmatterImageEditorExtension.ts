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
import FrontmatterImagePlugin from "./main";
import { Pos, TFile, editorLivePreviewField } from "obsidian";
import { getImageSrc, appendFrontmatterImage } from "./utils";

export interface FrontmatterImageStateFieldValue {
    readonly activeFile: TFile;
    decorationSet?: DecorationSet;
}

export const frontmatterImageEditorExtension = (
    plugin: FrontmatterImagePlugin,
): StateField<FrontmatterImageStateFieldValue | undefined> => {
    const buildDecorationSet = (
        frontmatterPosition: Pos,
        resolvedImageSrc?: string,
    ) => {
        if (!resolvedImageSrc) return Decoration.none;

        const builder = new RangeSetBuilder<Decoration>();
        builder.add(
            frontmatterPosition.end.offset + 1,
            frontmatterPosition.end.offset + 1,
            Decoration.widget({
                widget: new (class extends WidgetType {
                    toDOM(view: EditorView): HTMLElement {
                        return appendFrontmatterImage(view.contentDOM, resolvedImageSrc);
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

            const isLivePreview = transaction.state.field(editorLivePreviewField);
            if (!isLivePreview) {
                return { ...oldValue, decorationSet: undefined };
            }

            const cachedMetadata = plugin.app.metadataCache.getFileCache(oldValue.activeFile);
            const frontmatterPosition = cachedMetadata?.frontmatterPosition;
            if (!frontmatterPosition) {
                return { ...oldValue, decorationSet: undefined };
            }

            const imageSrc = getImageSrc(oldValue.activeFile.path, plugin);

            return {
                ...oldValue,
                decorationSet: buildDecorationSet(
                    frontmatterPosition,
                    imageSrc,
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
