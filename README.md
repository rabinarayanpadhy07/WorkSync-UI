# WorkSync UI 🚀

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Workspace routes & messaging features

### Workspace-scoped routes

All workspace features are mounted under the `/workspaces/:workspaceId/...` prefix:

- `/workspaces/:workspaceId` – workspace shell (navbar, sidebar, content layout).
- `/workspaces/:workspaceId/channels/:channelId` – channel messages view.
- `/workspaces/:workspaceId/members/:memberId` – direct messages (DM) conversation with a specific member.
- `/workspaces/:workspaceId/threads` – workspace threads overview.
- `/workspaces/:workspaceId/drafts` – drafts & sends view.

All of these are rendered through `WorkspaceLayout` inside a protected route.

### Current feature status

- **Channels**: production flow (backed by APIs + sockets). `Channel` page uses channel hooks and the shared `Message` / `ChatInput` components.
- **Direct messages (DMs)**: **MVP UI**.
  - Routes and layout are wired and use the same `Message` and `ChatInput` components as channels.
  - Hooks `useGetDirectMessages(memberId, workspaceId)` and `useSendDirectMessage()` currently return mock data / echo payloads.
  - TODO: plug in real DM APIs + socket events.
- **Threads**: **MVP shell**.
  - `/workspaces/:workspaceId/threads` renders a header plus an empty-state area that is ready for a future threads list.
- **Drafts & Sends**: **MVP shell**.
  - `/workspaces/:workspaceId/drafts` renders a header plus an empty-state area for a future drafts list.
