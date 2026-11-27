# Project memory

## Product intent & audience

- Browser-based OS simulator ("Nexus OS") with scientific simulations, productivity tools, and an integrated AI assistant.
- Deployed and made permanent via Embarko platform at `https://nexus-os.embarko.app`.
- Target: users wanting a rich, interactive desktop-like web environment.

## Brand personality & voice

- Sophisticated, production-grade, "fully featured" — not a toy/demo.
- Confident, polished, futuristic OS aesthetic implied by "Nexus OS" naming.

## Visual design & UX direction

- OS-style interface: windowed apps, workstations, integrated assistant.
- Built with Tailwind CSS + Lucide React icons + React hooks (per `.bolt/prompt`).
- Design goal: beautiful, non-cookie-cutter, production-worthy UI.

## Decisions, constraints & rationale

- Stack: Vite + React (JSX), Tailwind, Lucide React — no extra UI/icon packages unless explicitly requested.
- Imports use `@/` path alias (maps to `src/`).
- Deployment platform: Embarko; app URL is `nexus-os.embarko.app`.
- Permanent deployment requires an Embarko key emailed to the user; no redeploy needed once key applied.

## Open questions & assumptions

- App feature set (specific simulations, productivity tools, assistant capabilities) not yet detailed in memory.
- UI shell, window manager, and app registry architecture not yet specified.
- User email for Embarko claims: `arhan.akhtae21@gmail.com` (assumed persistent for this project).