/**
 * @module DocumentsRoutes
 * @description Erkin hujjatlar (free-form documents) routes.
 * '/documents/new' = format-choice screen (item #1); '/documents/matn' = text-editor create
 * (literal path, listed before '/documents/:id' so the greedy :id doesn't swallow it);
 * '/documents/:id' = text-editor edit; '/documents' = list.
 */

import { lazy } from "react";

const ErpDocumentEditor = lazy(() => import("@/pages/documents/ErpDocumentEditor"));
const ErpDocumentsList = lazy(() => import("@/pages/documents/ErpDocumentsList"));
const DocumentFormatChoice = lazy(() => import("@/pages/documents/DocumentFormatChoice"));
const ErpSpreadsheetEditor = lazy(() => import("@/pages/documents/ErpSpreadsheetEditor"));

export const DOCUMENTS_ROUTES: [string, React.ComponentType][] = [
  ['/documents/new', DocumentFormatChoice], // format choice (Matn / Jadval)
  ['/documents/matn', ErpDocumentEditor],   // text create (no :id -> create mode)
  ['/documents/:id', ErpDocumentEditor],    // text edit
  ['/documents', ErpDocumentsList],
  ['/spreadsheets/new', ErpSpreadsheetEditor], // grid create (before :id)
  ['/spreadsheets/:id', ErpSpreadsheetEditor], // grid edit
];
