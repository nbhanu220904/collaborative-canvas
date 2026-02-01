# Real-Time Collaborative Drawing Canvas

A Magma-style collaborative whiteboard application.

## Setup Instructions

1. **Server**

    ```bash
    cd server
    npm install
    npm run dev
    ```

    Runs on `http://localhost:8080`.

2. **Client**

    ```bash
    cd client
    npm install
    npm run dev
    ```

    Runs on `http://localhost:5173`.

## Features

- **Real-time Collaboration**: Drawing updates instantly across all connected clients.
- **Global Undo/Redo**: Shared state management via server history stack.
- **Magma-inspired UI**: Clean, distraction-free interface with center toolbar.

## How to Test

1. Start Server and Client.
2. Open `http://localhost:5173` in two different browser windows/tabs.
3. Draw in one window -> observe in the other.
4. Click Undo in one window -> observe stroke removal in both.

## Known Limitations

- Drawing history is stored in-memory on the server. Restarting the server clears the canvas.
- Cursor presence is not fully visualized (placeholder implemented data-flow wise).
