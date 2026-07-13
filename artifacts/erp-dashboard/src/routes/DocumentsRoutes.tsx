/**
 * @module DocumentsRoutes
 * @description Erkin hujjatlar (free-form documents) routes — Phase A3 (editor). The
 * "Mening hujjatlarim" list route ('/documents') is added in Phase A4.
 * Order matters: '/documents/new' before '/documents/:id' (wouter Switch = first match).
 */

import { lazy } from "react";

const ErpDocumentEditor = lazy(() => import("@/pages/documents/ErpDocumentEditor"));
const ErpDocumentsList = lazy(() => import("@/pages/documents/ErpDocumentsList"));

export const DOCUMENTS_ROUTES: [string, React.ComponentType][] = [
  ['/documents/new', ErpDocumentEditor], // before :id (wouter Switch = first match)
  ['/documents/:id', ErpDocumentEditor],
  ['/documents', ErpDocumentsList],
];
