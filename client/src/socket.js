import { io } from "socket.io-client";

// Ensure this matches your server port
const URL = "http://localhost:5000";

export const socket = io(URL);
