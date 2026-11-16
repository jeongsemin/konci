// Naver local search (NAVER API HUB, or the legacy openapi.naver.com host): request building and parsing.
// Pure helpers only; the network call lives in the route handler.
import { createHash } from "node:crypto";

export type NaverLocalItem = {
  title: string;
  link: string;
  category: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string; // longitude * 1e7
  mapy: string; // latitude * 1e7
};

export type HospitalCandidate = {
  external_id: string;
  name: string;
  category: string | null;
  address: string | null;
  road_address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  naver_link: string | null;
  derm_listed: boolean;
};

const stripTags = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

/** Naver has no stable place id in this API, so derive one from name + address. */
export function externalId(name: string, roadAddress: string, address: string): string {
  return createHash("sha1")
    .update(`${name}|${roadAddress || address}`.replace(/\s+/g, ""))
    .digest("hex");
}

function coord(raw: string, divisor: number): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n !== 0 ? n / divisor : null;
}

export function toCandidate(item: NaverLocalItem): HospitalCandidate {
  const name = stripTags(item.title);
  return {
    external_id: externalId(name, item.roadAddress, item.address),
    name,
    category: item.category || null,
    address: item.address || null,
    road_address: item.roadAddress || null,
    phone: item.telephone || null,
    lat: coord(item.mapy, 1e7),
    lng: coord(item.mapx, 1e7),
    naver_link: item.link || null,
    // Naver files dermatology clinics under "…>피부과" whatever their name, so "피부과" searches find them.
    derm_listed: /피부과/.test(item.category),
  };
}

/**
 * A clinic name without spaces, brackets or the branch after it: "데이뷰의원 강남점" and "데이뷰의원"
 * give "데이뷰의원", "오라클피부과의원" and "오라클 피부과 신사점" give "오라클피부과".
 */
export function nameKey(name: string): string {
  const flat = name.replace(/\(.*?\)|\[.*?\]/g, "").replace(/\s+/g, "").toLowerCase();
  const end = flat.search(/피부과|성형외과|의원|병원|클리닉|clinic/);
  if (end < 0) return flat;
  const suffix = flat.slice(end).match(/^(피부과|성형외과|의원|병원|클리닉|clinic)/)![0];
  return flat.slice(0, end + suffix.length);
}

/** The road and building number of a road address: "서울특별시 강남구 강남대로 494, 2층" gives "강남대로 494". */
export function roadKey(address: string | null | undefined): string | null {
  const m = address?.match(/([가-힣A-Za-z0-9.]+(?:로|길))\s*(\d+(?:-\d+)?)/);
  return m ? `${m[1]} ${m[2]}` : null;
}

/** Metres between two points (close enough for the few hundred metres compared here). */
function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

type Place = { name: string; road_address: string | null; lat: number | null; lng: number | null };

/**
 * Whether a Naver result is a clinic we already have: the same name (branch left aside) at the same
 * road address, or within 150 m. Two different clinics in one building keep their different names.
 */
export function sameClinic(a: Place, b: Place): boolean {
  if (nameKey(a.name) !== nameKey(b.name)) return false;
  const ra = roadKey(a.road_address);
  if (ra && ra === roadKey(b.road_address)) return true;
  if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
    return distance({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < 150;
  }
  return false;
}

const MEDICAL = /(병원|의원|피부|성형|클리닉|한의원|치과|의료|메디컬|medical|clinic|hospital)/i;

/** Keep results that look like medical facilities. */
export function isMedical(item: NaverLocalItem): boolean {
  return MEDICAL.test(item.category) || MEDICAL.test(stripTags(item.title));
}

/**
 * Where and how to call Naver local search. New keys come only from NAVER API HUB (Naver Cloud
 * Platform) since the Developers Center stopped issuing search keys on 2026-07-31; old Developers
 * Center keys keep working on the legacy host until 2027-06-30. Both take the same query and return
 * the same items. Returns null when no keys are set.
 */
export function naverLocalRequest(
  env: Record<string, string | undefined>,
  query: string,
): { url: string; headers: Record<string, string> } | null {
  const id = env.NAVER_SEARCH_CLIENT_ID?.trim();
  const secret = env.NAVER_SEARCH_CLIENT_SECRET?.trim();
  if (!id || !secret) return null;
  const legacy = env.NAVER_SEARCH_API?.trim().toLowerCase() === "legacy";
  const url = new URL(legacy ? "https://openapi.naver.com/v1/search/local.json" : "https://naverapihub.apigw.ntruss.com/search/v1/local");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5"); // local search returns at most 5 results
  url.searchParams.set("sort", "comment");
  const headers: Record<string, string> = legacy
    ? { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret }
    : { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret };
  return { url: url.toString(), headers };
}
