/**
 * @module documentEditorConfig
 * @description Shared TipTap extension set for the erkin-hujjat editor (Google-Docs-style
 * redesign, Variant B — visual only). One config so the toolbar and the canvas use the same
 * editor. StarterKit v3 bundles bold/italic/underline/strike/code/headings/lists/blockquote/
 * link/history; TableKit adds tables; TextAlign/TextStyle+Color/Highlight/Image add the
 * remaining Google-Docs-common controls. NB: content is still TipTap JSON in our own DB —
 * no data-model change. (TextStyleKit could later add font-family/size/line-height.)
 */

import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import type { Extensions } from '@tiptap/react';

export const documentEditorExtensions: Extensions = [
  StarterKit,
  TableKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  FontFamily,
  FontSize,
  Color,
  Highlight.configure({ multicolor: true }),
  Image.configure({ inline: false, allowBase64: false }),
];
