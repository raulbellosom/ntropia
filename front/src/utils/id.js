// src/utils/id.js
import { v4 as uuidv4 } from "uuid";

/**
 * generateId: Genera un identificador único usando UUID v4.
 * @returns {string} ID único
 */
export function generateId() {
  return uuidv4();
}
