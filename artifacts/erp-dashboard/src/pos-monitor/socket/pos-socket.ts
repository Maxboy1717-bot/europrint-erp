/**
 * @module pos-socket
 * @description Source module. See exports for details.
 */

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function getPosSocket(): Socket {
  if (!socket) {
    // §1.2: ERP SSO — alohida pos_session token YO'Q. Socket ERP httpOnly
    // access_token cookie (withCredentials) orqali same-origin autentifikatsiya.
    socket = io(`${window.location.origin}/pos`, {
      path: `${BASE_URL}/socket.io`,
      withCredentials: true,
      transports: ["websocket"],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {});
    socket.on("disconnect", () => {});
    socket.on("connect_error", () => {});
  }
  return socket;
}

export function disconnectPosSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type PosSocketEvent =
  | "movement.created"
  | "movement.confirmed"
  | "stock.alert"
  | "notification.new"
  | "terminal.status";
