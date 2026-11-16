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
  sido: string | null;
  sgg: string | null;
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
    // The area filter reads these, so they take the HIRA forms ("서울", "강남구").
    ...region(item.roadAddress || item.address),
  };
}

// Province names in addresses, and the short forms the HIRA data (and so the area filter) uses.
const SIDO: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "전남광주",
  전남광주통합특별시: "전남광주",
  전라남도: "전남광주", // merged with 광주; the HIRA data files both under 전남광주
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종시",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

/**
 * The province and district of an address, as HIRA writes them: "서울특별시 강남구 …" gives 서울 / 강남구,
 * "경기도 고양시 덕양구 …" gives 경기 / 고양덕양구, "광주광역시 광산구 …" gives 전남광주 / 광주광산구.
 */
export function region(address: string | null | undefined): { sido: string | null; sgg: string | null } {
  const [first, second, third] = (address ?? "").trim().split(/\s+/);
  const sido = first ? (SIDO[first] ?? null) : null;
  if (!sido) return { sido: null, sgg: null };
  if (sido === "세종시") return { sido, sgg: "세종시" };
  if (!second || !/[시군구]$/.test(second)) return { sido, sgg: null };
  let sgg = second;
  if (/시$/.test(second) && third && /구$/.test(third)) sgg = second.slice(0, -1) + third;
  else if ((first === "광주광역시" || first === "전남광주통합특별시") && /구$/.test(second)) sgg = `광주${second}`;
  return { sido, sgg };
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

// Kinds the site leaves out, as it does with the HIRA data (dental, oriental medicine, nursing), and vets.
const LEFT_OUT = /(한의원|한방|치과|요양병원|요양원|동물병원|동물의료|애견|반려)/;

/** Keep results that look like medical facilities of the kinds we list. */
export function isMedical(item: NaverLocalItem): boolean {
  const title = stripTags(item.title);
  if (LEFT_OUT.test(item.category) || LEFT_OUT.test(title)) return false;
  return MEDICAL.test(item.category) || MEDICAL.test(title);
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
