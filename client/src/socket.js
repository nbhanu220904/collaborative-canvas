import { io } from "socket.io-client";

// Ensure this matches your server port
// const URL = "http://localhost:5000";
const URL = "https://collaborative-canvas-backend.vercel.app/";

export const socket = io(URL);
