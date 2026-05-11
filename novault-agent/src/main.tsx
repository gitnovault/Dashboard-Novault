import { Buffer } from "buffer";
import process from "process";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
(globalThis as unknown as { global: typeof globalThis }).global = globalThis;
(globalThis as unknown as { process: typeof process }).process = process;

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
