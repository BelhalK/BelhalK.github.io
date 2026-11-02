// Elektron's SysEx protocol. Elektron does not document it: this follows the open source
// Elektroid project (github.com/dagargo/elektroid, src/connectors/elektron.c).
// Only read requests live here, so nothing in this file can change what is on the device.

const HEADER = [0xf0, 0x00, 0x20, 0x3c, 0x10, 0x00];
const END = 0xf7;

export const PING = 0x01;
export const SOFTWARE_VERSION = 0x02;
export const DATA_LIST = 0x53;

// Elektroid lists its root "/" under the "/projects" prefix, so the trailing slash is deliberate.
export const PROJECTS_PATH = '/projects/';
// Where the entries begin in a list reply (Elektroid's FS_DATA_START_POS).
const LIST_START = 18;

export type DeviceProject = { slot: number; name: string; bytes: number; hasData: boolean };

const cp1252 = new TextDecoder('windows-1252');

/** Every 7 bytes become 8: a leading byte holds their top bits, first byte in bit 6. */
export function encode(src: number[]) {
  const out: number[] = [];
  for (let j = 0; j < src.length; j += 7) {
    let top = 0;
    const group: number[] = [];
    for (let k = 0; k < 7; k++) {
      top <<= 1;
      if (j + k < src.length) {
        if (src[j + k] & 0x80) top |= 1;
        group.push(src[j + k] & 0x7f);
      }
    }
    out.push(top, ...group);
  }
  return out;
}

function decode(src: Uint8Array) {
  const out: number[] = [];
  for (let i = 0; i < src.length; i += 8) {
    for (let k = 0; k < 7 && i + k + 1 < src.length; k++) {
      out.push(src[i + k + 1] | (src[i] & (0x40 >> k) ? 0x80 : 0));
    }
  }
  return Uint8Array.from(out);
}

/** A complete SysEx message: two sequence bytes, two zero bytes, the command, then its arguments. */
export function encodeRequest(seq: number, command: number, args: number[] = []) {
  return [...HEADER, ...encode([(seq >> 8) & 0xff, seq & 0xff, 0, 0, command, ...args]), END];
}

export function listArgs(path: string) {
  const zeros = [0, 0, 0, 0];
  return [...[...path].map((c) => c.charCodeAt(0)), 0, ...zeros, ...zeros, 1];
}

export type Reply = { seq: number; type: number; data: Uint8Array };

/** Null for any SysEx that is not an Elektron reply. */
export function decodeReply(raw: Uint8Array): Reply | null {
  if (raw.length < 12 || raw[raw.length - 1] !== END || HEADER.some((b, i) => raw[i] !== b)) return null;
  const data = decode(raw.subarray(HEADER.length, raw.length - 1));
  if (data.length < 5) return null;
  return { seq: (data[2] << 8) | data[3], type: data[4], data };
}

const readString = (data: Uint8Array, start: number) => {
  const end = data.indexOf(0, start);
  if (start >= data.length || end < 0) throw new Error('Unterminated string in reply');
  return { text: cp1252.decode(data.subarray(start, end)), next: end + 1 };
};

export const parsePing = (data: Uint8Array) => readString(data, 7 + data[6]).text;
export const parseVersion = (data: Uint8Array) => readString(data, 10).text;
/** A list reply reports failure in its status byte. */
export const replyOk = (data: Uint8Array) => data[5] !== 0;

export function parseProjects(data: Uint8Array): DeviceProject[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const projects: DeviceProject[] = [];
  let pos = LIST_START;
  while (pos < data.length) {
    const { text: name, next } = readString(data, pos);
    const type = data[next + 1];
    pos = next + 2;
    if (type === 1) {
      pos += 4; // A folder, not a project slot.
    } else if (type === 2) {
      if (pos + 12 > data.length) throw new Error('Truncated entry in reply');
      projects.push({ slot: view.getUint32(pos), name, bytes: view.getUint32(pos + 4), hasData: data[pos + 10] !== 0 });
      pos += 12;
    } else {
      throw new Error(`Unknown entry type ${type}`);
    }
  }
  return projects;
}
