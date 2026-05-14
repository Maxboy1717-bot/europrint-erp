/**
 * @module main
 * @description Source module. See exports for details.
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installFetchInterceptor } from "./lib/fetchInterceptor";

installFetchInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
