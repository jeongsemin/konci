// Parsing of the HIRA (건강보험심사평가원) hospital APIs on apis.data.go.kr.
// Pure helpers only; the network calls live in scripts/import-hira.ts.

export const HIRA_LIST_URL = "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";
export const HIRA_DEPT_URL = "https://apis.data.go.kr/B551182/MadmDtlInfoService2.8/getDgsbjtInfo2.8";

/** 진료과목 code for 피부과. */
export const DERM_CODE = "14";

/** 종별 (clCd) we list: 상급종합, 종합병원, 병원, 의원. Dental, oriental, nursing and psychiatric institutions are left out. */
export const MEDICAL_TYPES = ["01", "11", "21", "31"] as const;

export type HiraItem = {
  ykiho: string;
  yadmNm: string;
  addr?: string;
  clCd?: string | number;
  clCdNm?: string;
  sidoCdNm?: string;
  sgguCdNm?: string;
  telno?: string;
  hospUrl?: string;
  estbDd?: string | number;
  drTotCnt?: string | number;
  XPos?: string | number; // longitude
  YPos?: string | number; // latitude
};

export type HiraRow = {
  external_id: string;
  hira_id: string;
  source: "hira";
  name: string;
  category: string | null;
  road_address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  sido: string | null;
  sgg: string | null;
  type_code: string | null;
  homepage: string | null;
  est_date: string | null;
  doctor_count: number | null;
};

export class HiraError extends Error {}

/**
 * The list/detail APIs wrap results as `body.items.item`, which is an object (not an
 * array) when there is exactly one hit, and `items` is "" when there are none.
 */
export function parseResponse<T>(json: unknown): { items: T[]; totalCount: number } {
  const res = (json as { response?: { header?: { resultCode?: string; resultMsg?: string }; body?: Record<string, unknown> } })?.response;
  const code = res?.header?.resultCode;
  if (code !== "00") throw new HiraError(`HIRA error ${code ?? "?"}: ${res?.header?.resultMsg ?? "no response"}`);
  const body = res?.body ?? {};
  const wrapper = body.items;
  const item = wrapper && typeof wrapper === "object" ? (wrapper as { item?: T | T[] }).item : undefined;
  const items = item === undefined || item === null ? [] : Array.isArray(item) ? item : [item];
  return { items, totalCount: Number(body.totalCount) || 0 };
}

const text = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const int = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

/** Coordinates inside South Korea; anything else (0, swapped, garbage) becomes null. */
export function toCoord(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** 20010419 -> 2001-04-19; impossible dates become null. */
export function toDate(v: unknown): string | null {
  const s = String(v ?? "");
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const valid = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return valid && y >= 1900 ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Only http(s) links are kept: the value is rendered as a link, so `javascript:` must never get through. */
export function toHomepage(v: unknown): string | null {
  const s = text(v);
  if (!s) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `http://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function toRow(item: HiraItem): HiraRow | null {
  const ykiho = text(item.ykiho);
  const name = text(item.yadmNm);
  if (!ykiho || !name) return null;
  return {
    external_id: `hira:${ykiho}`,
    hira_id: ykiho,
    source: "hira",
    name,
    category: text(item.clCdNm),
    road_address: text(item.addr),
    phone: text(item.telno),
    lat: toCoord(item.YPos, 33, 39),
    lng: toCoord(item.XPos, 124, 132),
    sido: text(item.sidoCdNm),
    sgg: text(item.sgguCdNm),
    type_code: text(item.clCd),
    homepage: toHomepage(item.hospUrl),
    est_date: toDate(item.estbDd),
    doctor_count: int(item.drTotCnt),
  };
}

/** The row without the columns an administrator has edited by hand, so a re-import leaves them alone. */
export function withoutLocked<T extends object>(row: T, locked: readonly string[]): Partial<T> {
  return Object.fromEntries(Object.entries(row).filter(([column]) => !locked.includes(column))) as Partial<T>;
}

/** Number of 피부과 specialists from a getDgsbjtInfo response, 0 when it lists no 피부과. */
export function dermSpecialists(departments: { dgsbjtCd?: string | number; dgsbjtPrSdrCnt?: string | number }[]): number {
  const derm = departments.find((d) => String(d.dgsbjtCd) === DERM_CODE);
  return derm ? (int(derm.dgsbjtPrSdrCnt) ?? 0) : 0;
}

/** `serviceKey` is sent as the portal's "Decoding" key, percent-encoded once. */
export function buildUrl(base: string, serviceKey: string, params: Record<string, string | number>): string {
  const query = new URLSearchParams({ _type: "json", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  return `${base}?serviceKey=${encodeURIComponent(serviceKey)}&${query}`;
}
