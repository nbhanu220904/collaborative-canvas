# Architecture

## 1. System Overview

**Collaborative Canvas** is a real-time drawing application built on the MERN stack (minus database for now, using in-memory storage) + WebSockets.

* **Frontend**: React, Vite, Tailwind CSS, HTML5 Canvas API.
* **Backend**: Node.js, Express, Socket.io.
* **Communication**: Real-time bidirectional event stream via Socket.io.

## 2. High-Level Architecture

```mermaid
graph TD
    subgraph Client [Client Browser]
        UI[React UI Components]
        Canvas[Canvas Engine]
        Socket[Socket.io Client]
    end

    subgraph Server [Node.js Server]
        SocketS[Socket.io Server]
        Store[In-Memory History Store]
        Logic[Business Logic]
    end

    UI -->|Select Tool / Color| Canvas
    Canvas -->|Generate Strokes| Socket
    Socket <-->|Bi-directional Events| SocketS
    SocketS -->|Persist/Retrieve| Store
    SocketS -->|Broadcast Updates| Socket
```

## 3. Data Data Model

The core data unit is the **StrokeObject**. We do not store raw pixels; we store vector-like instructions.

### `StrokeObject` Structure

```javascript
{
  id: "unique_id_string",
  pageId: 1,              // Which canvas page this belongs to
  tool: "brush" | "rectangle" | "circle" | "text" | ...,
  points: [{x, y}, ...],  // For freehand brush
  start: {x, y},          // For shapes
  end: {x, y},            // For shapes
  color: "#ff0000",
  fillColor: "transparent",
  width: 5,
  text: "Hello"           // Only for text tool
}
```

### Server Store

```javascript
let history = [ StrokeObject, StrokeObject, ... ];
let redoStack = [ StrokeObject, ... ];
```

## 4. Key Workflows

### 4.1. Drawing Flow

The user draws a shape. The client shows it immediately (optimistic UI), then commits it to the server.

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant Peer as Peer Client

    User->>Client: Mouse Down (Start)
    Client->>Client: Create Ephemeral Stroke
    
    loop Mouse Move
        User->>Client: Drag
        Client->>Client: Update Ephemeral Stroke (Preview)
    end
    
    User->>Client: Mouse Up (End)
    Client->>Client: Commit to Local State
    Client->>Server: emit('stroke_end', strokeData)
    Server->>Server: Push to History
    Server->>Peer: emit('stroke_end', strokeData)
    Peer->>Peer: Render New Stroke
```

### 4.2. Stroke-Based Undo/Redo

We use a complete stroke replacement strategy for robust undo.

```mermaid
flowchart LR
    A[User Clicks Undo] --> B(Client Emits 'undo')
    B --> C{Server History > 0?}
    C -- Yes --> D[Pop Last Stroke]
    D --> E[Push to Redo Stack]
    E --> F[Broadcast Full 'history']
    F --> G[Clients Re-render All]
    C -- No --> H[Ignore]
```

### 4.3. Object Manipulation (Move/Fill)

Modifying an existing object (Moving or Filling) updates its properties or replaces it.

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server

    User->>Client: Select Object & Drag
    Client->>Client: Update Local Position (Optimistic)
    Client->>Server: emit('stroke_update', updatedObject)
    
    par Broadcast
        Server->>Server: Find & Update Object in History
        Server->>OtherClients: emit('stroke_update', updatedObject)
    end
```

### 4.4. Multi-Canvas (Pages)

```mermaid
graph TD
    A[User Clicks 'New Canvas'] --> B[Client Updates Page State]
    B --> C[Set Active Page ID = New ID]
    C --> D[Canvas Renders Filtered View]
    D --> E{Draw Action?}
    E -- Yes --> F[Attach activePageId to Stroke]
    F --> G[Send to Server]
```

## 5. Event Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `connection` | S -> C | `socket.id` | Initial handshake. |
| `history` | S -> C | `Array<StrokeObject>` | Sent on connect or massive change (Undo/Redo). |
| `stroke_end` | C <-> S | `StrokeObject` | Sent when a shape/stroke is finished or created. |
| `stroke_update` | C <-> S | `StrokeObject` | Sent when an object is modified (Moved). |
| `undo` | C -> S | `null` | Request to undo last action. |
| `redo` | C -> S | `null` | Request to redo. |
| `clear` | C -> S | `null` | Request to wipe canvas. |
