import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clinicDescription, clinicJsonLd, jsonLdScript, languageAlternates, pageMetadata, siteUrl } from "../src/lib/seo.ts";

describe("languageAlternates", () => {
  it("lists every locale with BCP-47 codes plus x-default", () => {
    assert.deepEqual(languageAlternates("/search"), {
      en: "/en/search",
      ja: "/ja/search",
      "zh-CN": "/zh/search",
      ko: "/ko/search",
      "x-default": "/en/search",
    });
  });
  it("works for the locale root", () => {
    assert.equal(languageAlternates().ko, "/ko");
  });
});

describe("pageMetadata", () => {
  it("builds canonical, alternates and Open Graph for the current locale", () => {
    const m = pageMetadata({ lang: "ja", path: "/search", title: "検索", description: "説明" });
    assert.equal(m.title, "検索");
    assert.equal(m.alternates?.canonical, "/ja/search");
    assert.equal((m.openGraph as { locale: string }).locale, "ja_JP");
    assert.deepEqual((m.openGraph as { alternateLocale: string[] }).alternateLocale.sort(), ["en_US", "ko_KR", "zh_CN"]);
    assert.equal((m.openGraph as { title: string }).title, "検索 | KONCI");
    assert.equal(m.robots, undefined);
  });
  it("omits title and description fields when not given", () => {
    const m = pageMetadata({ lang: "en" });
    assert.equal("title" in m, false);
    assert.equal("description" in m, false);
    assert.equal("title" in (m.openGraph as object), false);
  });
  it("uses socialTitle for Open Graph when the page has no title of its own", () => {
    const m = pageMetadata({ lang: "ko", socialTitle: "KONCI – 홈" });
    assert.equal("title" in m, false);
    assert.equal((m.openGraph as { title: string }).title, "KONCI – 홈");
    assert.equal((m.twitter as { title: string }).title, "KONCI – 홈");
  });
  it("marks private pages noindex, optionally following links", () => {
    assert.deepEqual(pageMetadata({ lang: "en", noindex: true }).robots, { index: false, follow: false });
    assert.deepEqual(pageMetadata({ lang: "en", noindex: true, follow: true }).robots, { index: false, follow: true });
  });
});

describe("clinicDescription", () => {
  it("adds the rating only when there are reviews", () => {
    assert.equal(clinicDescription({ name: "온유 피부과", address: "서울 강남구" }), "온유 피부과 – 서울 강남구");
    assert.equal(
      clinicDescription({ name: "온유 피부과", address: "서울 강남구", reviewCount: 3, avgRating: 4.75 }),
      "온유 피부과 – 서울 강남구 · ★4.8 (3)",
    );
    assert.equal(clinicDescription({ name: "X" }), "X");
  });
});

describe("siteUrl", () => {
  it("falls back to localhost and strips trailing slashes", () => {
    const old = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(siteUrl(), "http://localhost:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "https://konci.example///";
    assert.equal(siteUrl(), "https://konci.example");
    if (old === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = old;
  });
});

describe("clinicJsonLd", () => {
  const base = { name: "서울맑은피부과의원", url: "https://konci.example/en/hospitals/x", reviewCount: 0, avgRating: null };

  it("describes the clinic and leaves out what is unknown", () => {
    const ld = clinicJsonLd(base);
    assert.equal(ld["@type"], "MedicalClinic");
    assert.equal(ld.name, base.name);
    for (const key of ["address", "telephone", "geo", "aggregateRating"]) assert.ok(!(key in ld), key);
  });

  it("adds the rating only when there are reviews", () => {
    const ld = clinicJsonLd({ ...base, address: "서울 강남구 1", telephone: "+82-2-1234-5678", lat: 37.5, lng: 127, reviewCount: 3, avgRating: 4.666 });
    assert.deepEqual(ld.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.7, reviewCount: 3, bestRating: 5, worstRating: 1 });
    assert.deepEqual(ld.geo, { "@type": "GeoCoordinates", latitude: 37.5, longitude: 127 });
    assert.equal((ld.address as { addressCountry: string }).addressCountry, "KR");
  });

  it("cannot break out of the script tag", () => {
    const html = jsonLdScript(clinicJsonLd({ ...base, name: "</script><script>alert(1)</script>" }));
    assert.ok(!html.includes("</script>"));
    assert.equal((JSON.parse(html) as { name: string }).name, "</script><script>alert(1)</script>");
  });
});

describe("link-preview image", () => {
  it("uses the site card unless the page has its own", () => {
    const site = pageMetadata({ lang: "ja", path: "/search", title: "x" });
    assert.deepEqual((site.openGraph as { images: { url: string }[] }).images.map((i) => i.url), ["/ja/opengraph-image"]);
    assert.deepEqual((site.twitter as { images: string[] }).images, ["/ja/opengraph-image"]);
    const own = pageMetadata({ lang: "ko", path: "/hospitals/1", title: "x", image: "/ko/hospitals/1/opengraph-image" });
    assert.equal((own.openGraph as { images: { url: string }[] }).images[0].url, "/ko/hospitals/1/opengraph-image");
    assert.equal((own.twitter as { card: string }).card, "summary_large_image");
  });
});
