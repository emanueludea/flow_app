# FlowApp

A flowchart-first web application for teaching algorithms to first-semester programming students. Inspired by JavaBlock, built with modern tooling. 100% frontend — no backend required.

**Live:** https://emanueludea.github.io/flow_app/

## Tech stack

Vue 3 · Vite · Vuetify · Vue Flow · Pinia · jexl · TypeScript

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Features

- Drag-and-drop flowchart canvas with custom node types (Start, End, Process, Input, Output, Decision, Comment)
- Step-by-step and auto-play simulator with variable inspector and output log
- jexl-based expression evaluator with implicit multiplication support
- JSON save/load with backward-compatible handle migration
- Deployed via GitHub Actions to GitHub Pages
