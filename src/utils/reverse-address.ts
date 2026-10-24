import { nearestPlace } from "@/utils/malaysia-places";

type NominatimAddress = {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    industrial?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
};

export const formatPlottedAddress = (address: NominatimAddress, fallbackPostcode?: string) => {
    const street = [address.house_number, address.road].filter(Boolean).join(" ");
    const area = address.suburb || address.neighbourhood || address.city_district || address.industrial || "";
    const city = address.city || address.town || address.village || "";
    const postcode = address.postcode || fallbackPostcode || "";
    const locality = [postcode, city].filter(Boolean).join(" ");
    const parts = [street, area, locality, address.state].filter((part): part is string => Boolean(part));
    return parts.filter((part, index) => parts.findIndex((other) => other.toLowerCase() === part.toLowerCase()) === index).join(", ");
};

export type AddressHit = {
    label: string;
    lat: number;
    lng: number;
    zoom: number;
};

const nominatimHeaders = (language: string) => ({
    Accept: "application/json",
    "Accept-Language": language,
});

const nominatimLanguage = (language: string) => (language.startsWith("zh") ? "zh" : "en");

export const reverseAddress = async (lat: number, lng: number, language = "en") => {
    const lang = nominatimLanguage(language);
    const nearest = nearestPlace(lat, lng);
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", lang);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    const response = await fetch(url, { headers: nominatimHeaders(lang) });
    if (!response.ok) {
        throw new Error("reverse");
    }
    const data = (await response.json()) as { address?: NominatimAddress };
    if (!data.address) {
        throw new Error("reverse");
    }
    const formatted = formatPlottedAddress(data.address, nearest.place.postcode);
    if (/\b\d{5}\b/.test(formatted)) {
        return formatted;
    }
    throw new Error("reverse");
};

export const searchAddressHits = async (query: string, language = "en"): Promise<AddressHit[]> => {
    const q = query.trim().replace(/[,\s]+$/g, "");
    if (q.length < 2) return [];
    const lang = nominatimLanguage(language);
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "my");
    url.searchParams.set("limit", "6");
    url.searchParams.set("accept-language", lang);
    url.searchParams.set("q", q);
    const response = await fetch(url, { headers: nominatimHeaders(lang) });
    if (!response.ok) return [];
    const rows = (await response.json()) as Array<{ lat: string; lon: string; address?: NominatimAddress }>;
    const hits: AddressHit[] = [];
    for (const row of rows) {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !row.address) continue;
        const label = formatPlottedAddress(row.address, nearestPlace(lat, lng).place.postcode);
        if (!/\b\d{5}\b/.test(label) || hits.some((hit) => hit.label === label)) continue;
        hits.push({ label, lat, lng, zoom: 16 });
    }
    return hits;
};

const sample = formatPlottedAddress({
    road: "Jalan Usahawan 5",
    suburb: "Setapak",
    city: "Kuala Lumpur",
    postcode: "53300",
});
if (!sample.includes("Jalan Usahawan 5") || !sample.includes("53300")) {
    throw new Error("formatPlottedAddress must keep the street and postal code");
}
