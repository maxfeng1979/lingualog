# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguaLog is a Tauri v2 desktop app for language learning through diary writing. Users write entries, submit them to an AI API, and receive organized/polished text with translations. Built with React 19 + TypeScript + Vite on the frontend, Rust on the backend.

## Commands

```bash
npm run dev          # Start Vite dev server (port 1420)
npm run build        # TypeScript check + Vite production build
npm run tauri dev    # Start Tauri in dev mode (launches desktop window with hot reload)
npm run tauri build  # Production build of the desktop app
```

No test framework or linter is configured.

## Architecture

**Single-page app with sidebar navigation.** `App.tsx` manages page state (`write` | `result` | `settings` | `favorites`) and wraps everything in `SettingsProvider`.

**Data flow:** WritePage → AI processing → ResultPage. The user writes text, selects diary/target languages, and submits. `useAI` hook calls `aiService.callAI()`, which returns `DiaryEntry[]`. Results display on `ResultPage` with blur-reveal cards.

**Persistence:** All state (AI config, vocabulary, export dir, word cache) is stored via `@tauri-apps/plugin-store` in a single `settings.json` file. Access goes through `SettingsContext` for app settings and `cacheService.ts` for word lookup caching (7-day TTL).

**Tauri commands (Rust):** `export_diary(path, content)` — the only custom command, writes markdown files to disk. Uses plugins: `opener`, `dialog`, `store`.

**AI providers:** Supports OpenAI-compatible and Anthropic APIs. Provider selection in settings determines request format (Authorization header vs x-api-key, messages structure). Has special handling for `bigmodel.cn` endpoints (auto-appends `/chat/completions`).

**TTS:** Browser-native `SpeechSynthesisUtterance` via `ttsService.ts`. English voices only, with male/female selection.

## Key Types

- `AIConfig` (`src/types/ai.ts`) — provider, endpoint, apiKey, model
- `DiaryEntry` — original, organized, translated, polished fields from AI response
- `WordEntry` (`src/types/vocabulary.ts`) — vocabulary card with mastery tracking and cached definitions

## Development Notes

- Vite dev server runs on fixed port 1420 (required by Tauri)
- The app UI is in Chinese; keep Chinese labels when modifying UI text
- `src-tauri/` contains the Rust backend — rebuild with `npm run tauri dev` after Rust changes
- Capabilities are defined in `src-tauri/capabilities/default.json`
