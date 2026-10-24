import { useEffect, useRef, useState } from "react";
import { MarkerPin01, Minus, NavigationPointer01, Plus } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { labelForPoint, pinFromAddress, searchPlaces, type MalaysiaPlace } from "@/utils/malaysia-places";
import { reverseAddress, searchAddressHits, type AddressHit } from "@/utils/reverse-address";
import { cx } from "@/utils/cx";

const TILE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));

const toWorld = (lat: number, lng: number, zoom: number) => {
    const size = TILE * 2 ** zoom;
    const x = ((lng + 180) / 360) * size;
    const sine = Math.sin((lat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size;
    return { x, y };
};

const fromWorld = (x: number, y: number, zoom: number) => {
    const size = TILE * 2 ** zoom;
    const lng = (x / size) * 360 - 180;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI;
    return { lat, lng };
};

const tilesFor = (lat: number, lng: number, zoom: number, width: number, height: number) => {
    const center = toWorld(lat, lng, zoom);
    const left = center.x - width / 2;
    const top = center.y - height / 2;
    const n = 2 ** zoom;
    const tiles = [];
    for (let x = Math.floor(left / TILE); x <= Math.floor((left + width) / TILE); x++) {
        for (let y = Math.floor(top / TILE); y <= Math.floor((top + height) / TILE); y++) {
            if (y < 0 || y >= n) continue;
            const wrapped = ((x % n) + n) % n;
            tiles.push({
                key: `${zoom}-${x}-${y}`,
                src: `https://tile.openstreetmap.org/${zoom}/${wrapped}/${y}.png`,
                left: x * TILE - left,
                top: y * TILE - top,
            });
        }
    }
    return { tiles, left, top };
};

type Pin = { lat: number; lng: number; zoom: number };

export const AddressLocator = ({
    t,
    label,
    value,
    onChange,
    maxLength = 200,
    error = null,
}: {
    t: Copy;
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    error?: string | null;
}) => {
    const { locale } = useI18n();
    const language = locale === "zh" ? "zh" : "en";
    const mapRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ x: number; y: number; lat: number; lng: number; moved: boolean } | null>(null);
    const wheelRef = useRef(0);
    const lookupRef = useRef(0);
    const searchRef = useRef(0);
    const [pin, setPin] = useState<Pin>(() => pinFromAddress(value));
    const [size, setSize] = useState({ width: 480, height: 224 });
    const [focused, setFocused] = useState(false);
    const [locating, setLocating] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [locError, setLocError] = useState<string | null>(null);
    const [hits, setHits] = useState<AddressHit[]>([]);
    const localMatches = focused && !lookingUp ? searchPlaces(value).slice(0, 3) : [];

    useEffect(() => {
        const node = mapRef.current;
        if (!node) return;
        const update = () => setSize({ width: node.clientWidth || 480, height: node.clientHeight || 224 });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            wheelRef.current += event.deltaY;
            if (Math.abs(wheelRef.current) < 50) return;
            const step = wheelRef.current > 0 ? -1 : 1;
            wheelRef.current = 0;
            setPin((current) => ({ ...current, zoom: clampZoom(current.zoom + step) }));
        };
        node.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            observer.disconnect();
            node.removeEventListener("wheel", onWheel);
        };
    }, []);

    useEffect(() => {
        const node = fieldRef.current;
        if (!node) return;
        const show = () => setFocused(true);
        const hide = (event: FocusEvent) => {
            const next = event.relatedTarget;
            if (next instanceof Node && node.contains(next)) return;
            setFocused(false);
        };
        node.addEventListener("focusin", show);
        node.addEventListener("focusout", hide);
        return () => {
            node.removeEventListener("focusin", show);
            node.removeEventListener("focusout", hide);
        };
    }, []);

    useEffect(() => {
        if (!focused || lookingUp) {
            searchRef.current += 1;
            setHits([]);
            return;
        }
        const query = value.trim().replace(/[,\s]+$/g, "");
        if (query.length < 2) {
            searchRef.current += 1;
            setHits([]);
            return;
        }
        const searchId = ++searchRef.current;
        const timer = window.setTimeout(() => {
            void searchAddressHits(query, language).then((next) => {
                if (searchRef.current !== searchId) return;
                setHits(next);
            });
        }, 400);
        return () => window.clearTimeout(timer);
    }, [focused, lookingUp, value, language]);

    const commitPoint = (lat: number, lng: number, zoom = pin.zoom) => {
        const lookupId = ++lookupRef.current;
        setPin({ lat, lng, zoom });
        setLocError(null);
        setLookingUp(true);
        setHits([]);
        onChange(labelForPoint(lat, lng).slice(0, maxLength));
        void reverseAddress(lat, lng, language)
            .then((line) => {
                if (lookupRef.current !== lookupId) return;
                setLookingUp(false);
                onChange(line.slice(0, maxLength));
            })
            .catch(() => {
                if (lookupRef.current !== lookupId) return;
                setLookingUp(false);
                setLocError(t.settingsAddressLookupFailed);
            });
    };

    const choose = (place: MalaysiaPlace) => {
        setFocused(false);
        setHits([]);
        commitPoint(place.lat, place.lng, place.zoom);
    };

    const chooseHit = (hit: AddressHit) => {
        lookupRef.current += 1;
        setFocused(false);
        setHits([]);
        setLookingUp(false);
        setLocError(null);
        setPin({ lat: hit.lat, lng: hit.lng, zoom: hit.zoom });
        onChange(hit.label.slice(0, maxLength));
    };

    const streetHits = hits
        .filter((hit) => !localMatches.some((place) => hit.label.toLowerCase().includes(place.name.toLowerCase())))
        .slice(0, 6 - localMatches.length);

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocError(t.settingsLocationDenied);
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                commitPoint(position.coords.latitude, position.coords.longitude, 15);
            },
            () => {
                setLocating(false);
                setLocError(t.settingsLocationDenied);
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const { tiles } = tilesFor(pin.lat, pin.lng, pin.zoom, size.width, size.height);

    return (
        <div className="flex flex-col gap-3">
            <div ref={fieldRef} className="relative">
                <Input
                    label={label}
                    size="md"
                    className="w-full"
                    value={value}
                    onChange={onChange}
                    isRequired
                    maxLength={maxLength}
                    autoComplete="off"
                    isInvalid={Boolean(error)}
                    hint={error ?? undefined}
                />
                {localMatches.length > 0 || streetHits.length > 0 ? (
                    <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary" role="listbox">
                        {localMatches.map((place) => (
                            <li key={place.name}>
                                <button
                                    type="button"
                                    role="option"
                                    className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        choose(place);
                                    }}
                                >
                                    {place.name}, {place.postcode}
                                </button>
                            </li>
                        ))}
                        {streetHits.map((hit) => (
                            <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
                                <button
                                    type="button"
                                    role="option"
                                    className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        chooseHit(hit);
                                    }}
                                >
                                    {hit.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            <div
                ref={mapRef}
                className="relative h-56 overflow-hidden rounded-xl bg-secondary ring-1 ring-secondary"
                onPointerDown={(event) => {
                    if ((event.target as HTMLElement).closest("button, a")) return;
                    dragRef.current = { x: event.clientX, y: event.clientY, lat: pin.lat, lng: pin.lng, moved: false };
                    event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                    const drag = dragRef.current;
                    if (!drag) return;
                    const dx = event.clientX - drag.x;
                    const dy = event.clientY - drag.y;
                    if (Math.hypot(dx, dy) > 4) drag.moved = true;
                    const start = toWorld(drag.lat, drag.lng, pin.zoom);
                    const next = fromWorld(start.x - dx, start.y - dy, pin.zoom);
                    setPin((current) => ({ ...current, lat: next.lat, lng: next.lng }));
                }}
                onPointerUp={(event) => {
                    const drag = dragRef.current;
                    dragRef.current = null;
                    if (!drag || !mapRef.current) return;
                    if (!drag.moved) {
                        const rect = mapRef.current.getBoundingClientRect();
                        const origin = toWorld(drag.lat, drag.lng, pin.zoom);
                        const next = fromWorld(origin.x - rect.width / 2 + (event.clientX - rect.left), origin.y - rect.height / 2 + (event.clientY - rect.top), pin.zoom);
                        commitPoint(next.lat, next.lng);
                        return;
                    }
                    const start = toWorld(drag.lat, drag.lng, pin.zoom);
                    const next = fromWorld(start.x - (event.clientX - drag.x), start.y - (event.clientY - drag.y), pin.zoom);
                    commitPoint(next.lat, next.lng);
                }}
            >
                {tiles.map((tile) => (
                    <img key={tile.key} src={tile.src} alt="" width={TILE} height={TILE} className="absolute max-w-none" style={{ left: tile.left, top: tile.top }} draggable={false} />
                ))}
                <MarkerPin01 className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-full text-fg-error-primary drop-shadow-md" aria-hidden="true" />
                <div className="absolute top-3 right-3 flex flex-col overflow-hidden rounded-lg bg-primary shadow-md ring-1 ring-secondary">
                    <button
                        type="button"
                        aria-label={t.settingsZoomIn}
                        disabled={pin.zoom >= MAX_ZOOM}
                        onClick={() => setPin((current) => ({ ...current, zoom: clampZoom(current.zoom + 1) }))}
                        className="flex size-9 items-center justify-center text-fg-secondary hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="size-5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        aria-label={t.settingsZoomOut}
                        disabled={pin.zoom <= MIN_ZOOM}
                        onClick={() => setPin((current) => ({ ...current, zoom: clampZoom(current.zoom - 1) }))}
                        className="flex size-9 items-center justify-center border-t border-secondary text-fg-secondary hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Minus className="size-5" aria-hidden="true" />
                    </button>
                </div>
                <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] text-tertiary"
                >
                    {t.settingsMapAttribution}
                </a>
                <button
                    type="button"
                    aria-label={t.settingsUseCurrentLocation}
                    disabled={locating}
                    onClick={useCurrentLocation}
                    className={cx(
                        "absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-lg bg-primary text-fg-secondary shadow-md ring-1 ring-secondary",
                        "hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                >
                    <NavigationPointer01 className="size-5" aria-hidden="true" />
                </button>
            </div>
            {lookingUp ? <p className="text-sm text-tertiary">{t.settingsAddressLookup}</p> : null}
            {locError ? <p className="text-sm text-error-primary">{locError}</p> : null}
        </div>
    );
};
