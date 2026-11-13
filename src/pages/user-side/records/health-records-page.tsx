import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Navigate } from "react-router";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { TextArea } from "@/components/base/textarea/textarea";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { BpLineChart } from "@/components/marketing/health/bp-line-chart";
import { HealthScoreCard } from "@/components/marketing/health/health-score-card";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { personalHealthRecordApi, type PersonalRecord } from "@/services/personalHealthRecordApi";
import {
    scoreHealth,
    type BloodPressureReading,
    type HealthItem,
    type HealthItemKind,
} from "@/utils/health-records";

const pad = (value: number) => String(value).padStart(2, "0");

const localDateTimeValue = (date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const fromLocalInput = (value: string) => new Date(value).toISOString();

type DialogState =
    | { type: "bp"; item?: BloodPressureReading }
    | { type: "item"; kind: HealthItemKind; item?: HealthItem }
    | { type: "delete"; target: "bp" | "item" | "history"; id: string; label: string };

export const HealthRecordsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [readings, setReadings] = useState<BloodPressureReading[]>([]);
    const [items, setItems] = useState<HealthItem[]>([]);
    const [history, setHistory] = useState<PersonalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [tab, setTab] = useState<HealthItemKind>("allergy");

    const load = async () => {
        const records = await personalHealthRecordApi.list();
        setReadings(records.filter((r) => r.type === "bp" && r.systolic != null && r.diastolic != null).map((r) => ({
            id: r.id, systolic: r.systolic!, diastolic: r.diastolic!, recordedAt: r.recordedAt, notes: r.notes,
        })));
        setItems(records.filter((r) => r.type === "allergy" || r.type === "condition" || r.type === "history").map((r) => ({
            id: r.id, kind: r.type as HealthItemKind, label: r.label ?? "", notes: r.notes,
        })));
        setHistory(records.filter((r) => r.type === "medical"));
    };

    useEffect(() => {
        if (!profile) return;
        let active = true;
        personalHealthRecordApi.list().then((records) => {
            if (!active) return;
            setReadings(records.filter((r) => r.type === "bp" && r.systolic != null && r.diastolic != null).map((r) => ({
                id: r.id, systolic: r.systolic!, diastolic: r.diastolic!, recordedAt: r.recordedAt, notes: r.notes,
            })));
            setItems(records.filter((r) => r.type === "allergy" || r.type === "condition" || r.type === "history").map((r) => ({
                id: r.id, kind: r.type as HealthItemKind, label: r.label ?? "", notes: r.notes,
            })));
            setHistory(records.filter((r) => r.type === "medical"));
        }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load health records."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [profile?.id]);

    const save = async (action: () => Promise<unknown>) => {
        setSaving(true);
        setError(null);
        try {
            await action();
            await load();
            closeDialog();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to save health record.");
        } finally {
            setSaving(false);
        }
    };

    const score = useMemo(() => scoreHealth(readings, items), [items, readings]);

    const itemsByKind = useMemo(() => {
        const groups: Record<HealthItemKind, HealthItem[]> = { allergy: [], condition: [], history: [] };
        for (const item of items) {
            groups[item.kind].push(item);
        }
        return groups;
    }, [items]);

    const dateLocale = locale === "zh" ? "zh-MY" : "en-MY";
    const formatWhen = (iso: string) =>
        new Date(iso).toLocaleString(dateLocale, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });
    const formatDay = (iso: string) =>
        new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

    const scoreBody = (copy: Copy) => {
        if (score.band === "empty") {
            return copy.phrScoreEmptyBody;
        }
        if (score.band === "good") return copy.phrScoreGood;
        if (score.band === "fair") return copy.phrScoreFair;
        if (score.band === "watch") return copy.phrScoreWatch;
        return copy.phrScoreAttention;
    };

    const closeDialog = () => {
        setError(null);
        setDialog(null);
    };

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.phrTitle}</h1>
                <p className="mt-2 max-w-2xl text-md text-tertiary">{t.phrBody}</p>
                <FormStatus error={dialog ? null : error} />
                {loading ? <p className="mt-4 text-sm text-tertiary">{locale === "zh" ? "正在加载健康记录…" : "Loading health records…"}</p> : null}

                <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <BpLineChart
                            readings={readings}
                            locale={dateLocale}
                            title={t.phrBpTitle}
                            hint={t.phrBpHint}
                            emptyTitle={t.phrBpEmpty}
                            emptyBody={t.phrBpEmptyBody}
                            systolicLabel={t.phrSystolic}
                            diastolicLabel={t.phrDiastolic}
                            axisLabel={t.phrMmHg}
                            addLabel={t.phrAddBp}
                            onAdd={() => setDialog({ type: "bp" })}
                            onEdit={(item) => setDialog({ type: "bp", item })}
                            formatWhen={formatWhen}
                        />
                    </div>
                    <HealthScoreCard
                        score={score}
                        title={t.phrScoreTitle}
                        subtitle={t.phrScoreHint}
                        heading={t.phrScoreValue}
                        body={scoreBody(t)}
                        emptyLabel={t.phrScoreEmpty}
                    />
                </div>

                <section className="mt-6 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-md font-semibold text-primary">{t.phrTagsTitle}</h2>
                            <p className="mt-1 text-sm text-tertiary">{t.phrTagsHint}</p>
                        </div>
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setDialog({ type: "item", kind: tab })}>
                            {t.phrAddItem}
                        </Button>
                    </div>
                    <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key) as HealthItemKind)} className="mt-5">
                        <Tabs.List type="underline" size="sm" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <Tabs.Item id="allergy" label={t.phrAllergy} badge={itemsByKind.allergy.length} />
                            <Tabs.Item id="condition" label={t.phrCondition} badge={itemsByKind.condition.length} />
                            <Tabs.Item id="history" label={t.phrHistoryTags} badge={itemsByKind.history.length} />
                        </Tabs.List>
                        {(["allergy", "condition", "history"] as const).map((kind) => (
                            <Tabs.Panel key={kind} id={kind} className="pt-4">
                                {itemsByKind[kind].length === 0 ? (
                                    <p className="text-sm text-tertiary">{t.phrTagsEmpty}</p>
                                ) : (
                                    <TagGroup label={kind} size="md">
                                        <TagList className="flex flex-wrap gap-2">
                                            {itemsByKind[kind].map((item) => (
                                                <Tag
                                                    key={item.id}
                                                    id={item.id}
                                                    onClose={() => setDialog({ type: "delete", target: "item", id: item.id, label: item.label })}
                                                >
                                                    <button type="button" className="text-left" onClick={() => setDialog({ type: "item", kind, item })}>
                                                        {item.label}
                                                    </button>
                                                </Tag>
                                            ))}
                                        </TagList>
                                    </TagGroup>
                                )}
                            </Tabs.Panel>
                        ))}
                    </Tabs>
                </section>

                <TableCard.Root className="mt-6" id="medical-records">
                    <TableCard.Header
                        title={t.phrTableTitle}
                        description={t.phrTableHint}
                        badge={history.length}
                        contentTrailing={
                            <Button color="primary" size="sm" iconLeading={Plus} onClick={() => fileInput.current?.click()} isDisabled={saving}>
                                {t.phrAddRecord}
                            </Button>
                        }
                    />
                    <input ref={fileInput} className="sr-only" type="file" accept="application/pdf,.pdf" aria-label={t.phrAddRecord}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024 || (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf")) {
                                setError(locale === "zh" ? "请选择小于 10 MB 的 PDF 文件。" : "Choose a PDF smaller than 10 MB.");
                                return;
                            }
                            void save(() => personalHealthRecordApi.uploadPdf(file));
                        }} />
                    <Table aria-label={t.phrTableTitle}>
                        <Table.Header>
                            <Table.Head label={locale === "zh" ? "PDF 文件" : "PDF document"} isRowHeader />
                            <Table.Head label={locale === "zh" ? "上传日期" : "Uploaded"} className="max-md:hidden" />
                            <Table.Head label="" />
                        </Table.Header>
                        <Table.Body
                            items={history}
                            renderEmptyState={() => <p className="px-6 py-8 text-sm text-tertiary">{loading ? "…" : locale === "zh" ? "尚未上传 PDF 病历。" : "No PDF medical records uploaded yet."}</p>}
                        >
                            {(item) => (
                                <Table.Row id={item.id}>
                                    <Table.Cell className="max-w-[9rem] truncate font-medium text-primary md:max-w-none">
                                        {item.pdfFileName}
                                        <span className="mt-0.5 block text-xs font-normal text-tertiary md:hidden">{formatDay(item.recordedAt)}</span>
                                    </Table.Cell>
                                    <Table.Cell className="max-md:hidden">{formatDay(item.recordedAt)}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-end gap-2">
                                            <Button color="secondary" size="sm" onClick={async () => {
                                                const newTab = window.open("", "_blank");
                                                try {
                                                    const url = await personalHealthRecordApi.viewPdf(item.id);
                                                    if (!newTab) { URL.revokeObjectURL(url); setError("Allow pop-ups to view this PDF."); }
                                                    else { newTab.location.href = url; window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
                                                } catch (cause) { newTab?.close(); setError(cause instanceof Error ? cause.message : "Unable to open this PDF."); }
                                            }}>{locale === "zh" ? "查看" : "View"}</Button>
                                            <Button color="primary-destructive" size="sm" onClick={() => setDialog({ type: "delete", target: "history", id: item.id, label: item.pdfFileName ?? "PDF" })}>{t.phrDelete}</Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            </main>
            <LandingFooter />

            {dialog?.type === "bp" ? (
                <BpDialog
                    t={t}
                    error={error}
                    item={dialog.item}
                    onClose={closeDialog}
                    onSave={(payload) => {
                        void save(() => personalHealthRecordApi.save({ type: "bp", ...payload }, dialog.item?.id));
                    }}
                    onDelete={
                        dialog.item
                            ? () => setDialog({ type: "delete", target: "bp", id: dialog.item!.id, label: `${dialog.item!.systolic}/${dialog.item!.diastolic}` })
                            : undefined
                    }
                />
            ) : null}

            {dialog?.type === "item" ? (
                <ItemDialog
                    t={t}
                    error={error}
                    kind={dialog.kind}
                    item={dialog.item}
                    onClose={closeDialog}
                    onSave={(payload) => {
                        const label = payload.label.trim();
                        if (!label) {
                            setError("Give this item a short name.");
                            return;
                        }
                        const clash = items.some(
                            (item) => item.kind === payload.kind && item.id !== dialog.item?.id && item.label.toLowerCase() === label.toLowerCase(),
                        );
                        if (clash) {
                            setError("That item is already on your list.");
                            return;
                        }
                        void save(() => personalHealthRecordApi.save({ type: payload.kind, label, notes: payload.notes }, dialog.item?.id));
                    }}
                />
            ) : null}

            {dialog?.type === "delete" ? (
                <DeleteDialog
                    t={t}
                    label={dialog.label}
                    onClose={closeDialog}
                    onConfirm={() => { void save(() => personalHealthRecordApi.remove(dialog.id)); }}
                />
            ) : null}
        </div>
    );
};

const BpDialog = ({
    t,
    error,
    item,
    onClose,
    onSave,
    onDelete,
}: {
    t: Copy;
    error: string | null;
    item?: BloodPressureReading;
    onClose: () => void;
    onSave: (payload: { systolic: number; diastolic: number; recordedAt: string; notes?: string }) => void;
    onDelete?: () => void;
}) => {
    const [systolic, setSystolic] = useState(item ? String(item.systolic) : "");
    const [diastolic, setDiastolic] = useState(item ? String(item.diastolic) : "");
    const [readingErrors, setReadingErrors] = useState<{ systolic?: string; diastolic?: string }>({});
    const [recordedAt, setRecordedAt] = useState(item ? localDateTimeValue(new Date(item.recordedAt)) : localDateTimeValue());
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [timeError, setTimeError] = useState<string | null>(null);
    const [notes, setNotes] = useState(item?.notes ?? "");
    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);
    const today = localDateTimeValue(currentTime).slice(0, 10);
    const selectedDate = recordedAt.slice(0, 10);
    const selectedHour = Number(recordedAt.slice(11, 13));
    const selectedMinute = Number(recordedAt.slice(14, 16));
    const isToday = selectedDate === today;
    const hourOptions = Array.from({ length: 24 }, (_, hour) => hour);
    const minuteOptions = Array.from({ length: 60 }, (_, minute) => minute);

    const changeDate = (value: string) => {
        const now = new Date();
        setCurrentTime(now);
        const maxDate = localDateTimeValue(now).slice(0, 10);
        if (value > maxDate) {
            setTimeError(t.phrFutureTimeError);
            return;
        }
        const next = `${value}T${recordedAt.slice(11, 16)}`;
        setRecordedAt(value === maxDate && new Date(next).getTime() > now.getTime() ? localDateTimeValue(now) : next);
        setTimeError(null);
    };
    const changeTime = (hour: number, minute: number) => {
        const now = new Date();
        setCurrentTime(now);
        if (selectedDate === localDateTimeValue(now).slice(0, 10) && hour > now.getHours()) {
            setTimeError(t.phrFutureTimeError);
            return;
        }
        if (selectedDate === localDateTimeValue(now).slice(0, 10) && hour === now.getHours() && minute > now.getMinutes()) {
            minute = now.getMinutes();
        }
        setRecordedAt(`${selectedDate}T${pad(hour)}:${pad(minute)}`);
        setTimeError(null);
    };

    return (
        <FormDialog title={item ? t.phrEditBp : t.phrAddBp} error={error} onClose={onClose}>
            <form
                className="flex w-full min-w-0 flex-col gap-4"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    const nextErrors: { systolic?: string; diastolic?: string } = {};
                    const systolicValue = Number(systolic);
                    const diastolicValue = Number(diastolic);
                    if (!systolic.trim()) nextErrors.systolic = t.phrSystolicRequired;
                    else if (!Number.isInteger(systolicValue) || systolicValue < 70 || systolicValue > 250)
                        nextErrors.systolic = t.phrSystolicRange;
                    if (!diastolic.trim()) nextErrors.diastolic = t.phrDiastolicRequired;
                    else if (!Number.isInteger(diastolicValue) || diastolicValue < 40 || diastolicValue > 150)
                        nextErrors.diastolic = t.phrDiastolicRange;
                    if (!nextErrors.systolic && !nextErrors.diastolic && systolicValue <= diastolicValue)
                        nextErrors.systolic = t.phrSystolicAboveDiastolic;
                    setReadingErrors(nextErrors);
                    const selectedTime = new Date(recordedAt);
                    if (!recordedAt || Number.isNaN(selectedTime.getTime()) || selectedTime.getTime() > Date.now()) {
                        setTimeError(t.phrFutureTimeError);
                        return;
                    }
                    if (Object.keys(nextErrors).length > 0) return;
                    setTimeError(null);
                    onSave({
                        systolic: systolicValue,
                        diastolic: diastolicValue,
                        recordedAt: fromLocalInput(recordedAt),
                        notes: notes.trim() || undefined,
                    });
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input className="w-full" label={t.phrSystolic} type="number" value={systolic}
                        onChange={(value) => { setSystolic(value); setReadingErrors({}); }} isRequired
                        isInvalid={!!readingErrors.systolic} hint={readingErrors.systolic}
                        wrapperClassName={readingErrors.systolic ? "ring-2 ring-error" : undefined} />
                    <Input className="w-full" label={t.phrDiastolic} type="number" value={diastolic}
                        onChange={(value) => { setDiastolic(value); setReadingErrors({}); }} isRequired
                        isInvalid={!!readingErrors.diastolic} hint={readingErrors.diastolic}
                        wrapperClassName={readingErrors.diastolic ? "ring-2 ring-error" : undefined} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Input className="w-full" label={t.phrDate} type="date" value={selectedDate} max={today}
                        onFocus={() => setCurrentTime(new Date())} onChange={changeDate} isRequired isInvalid={!!timeError} />
                    <div className="min-w-0">
                        <span className="mb-1.5 block text-sm font-medium text-secondary">{t.phrTime} *</span>
                        <div className="flex min-w-0 items-center gap-2">
                            <select aria-label={t.phrHour} value={selectedHour} onFocus={() => setCurrentTime(new Date())}
                                onChange={(event) => changeTime(Number(event.target.value), selectedMinute)}
                                className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 text-primary shadow-xs ring-1 ring-primary focus:outline-2 focus:outline-brand">
                                {hourOptions.map((hour) => <option key={hour} value={hour} disabled={isToday && hour > currentTime.getHours()}>{pad(hour)}</option>)}
                            </select>
                            <span aria-hidden="true">:</span>
                            <select aria-label={t.phrMinute} value={selectedMinute} onFocus={() => setCurrentTime(new Date())}
                                onChange={(event) => changeTime(selectedHour, Number(event.target.value))}
                                className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 text-primary shadow-xs ring-1 ring-primary focus:outline-2 focus:outline-brand">
                                {minuteOptions.map((minute) => <option key={minute} value={minute}
                                    disabled={isToday && selectedHour === currentTime.getHours() && minute > currentTime.getMinutes()}>{pad(minute)}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p role={timeError ? "alert" : undefined} className={timeError ? "text-sm font-medium text-error-primary" : "text-sm text-tertiary"}>
                        {timeError ?? t.phrFutureTimeHint}
                    </p>
                    <Button color="secondary" size="sm" type="button" onClick={() => {
                        const now = new Date();
                        setCurrentTime(now);
                        setRecordedAt(localDateTimeValue(now));
                        setTimeError(null);
                    }}>{t.phrUseCurrentTime}</Button>
                </div>
                <TextArea className="w-full" label={t.phrNotes} value={notes} onChange={setNotes} rows={3} />
                <div className="flex flex-wrap justify-end gap-3">
                    {onDelete ? (
                        <Button color="primary-destructive" type="button" onClick={onDelete}>
                            {t.phrDelete}
                        </Button>
                    ) : null}
                    <Button color="secondary" type="button" onClick={onClose}>
                        {t.phrCancel}
                    </Button>
                    <Button color="primary" type="submit">
                        {t.phrSave}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
};

const ItemDialog = ({
    t,
    error,
    kind,
    item,
    onClose,
    onSave,
}: {
    t: Copy;
    error: string | null;
    kind: HealthItemKind;
    item?: HealthItem;
    onClose: () => void;
    onSave: (payload: { kind: HealthItemKind; label: string; notes?: string }) => void;
}) => {
    const [label, setLabel] = useState(item?.label ?? "");
    const [notes, setNotes] = useState(item?.notes ?? "");
    const title = kind === "allergy" ? t.phrAllergy : kind === "condition" ? t.phrCondition : t.phrHistoryTags;

    return (
        <FormDialog title={item ? t.phrEditItem : `${t.phrAddItem}: ${title}`} error={error} onClose={onClose}>
            <form
                className="flex w-full min-w-0 flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave({ kind, label, notes: notes.trim() || undefined });
                }}
            >
                <Input className="w-full" label={t.phrItemName} value={label} onChange={setLabel} isRequired maxLength={80} />
                <TextArea className="w-full" label={t.phrNotes} value={notes} onChange={setNotes} rows={3} />
                <div className="flex justify-end gap-3">
                    <Button color="secondary" type="button" onClick={onClose}>
                        {t.phrCancel}
                    </Button>
                    <Button color="primary" type="submit">
                        {t.phrSave}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
};

const DeleteDialog = ({
    t,
    label,
    onClose,
    onConfirm,
}: {
    t: Copy;
    label: string;
    onClose: () => void;
    onConfirm: () => void;
}) => (
    <FormDialog title={t.phrDeleteTitle} onClose={onClose}>
        <p className="text-sm text-tertiary">{t.phrDeleteBody.replace("{name}", label)}</p>
        <div className="mt-6 flex justify-end gap-3">
            <Button color="secondary" onClick={onClose}>
                {t.phrCancel}
            </Button>
            <Button color="primary-destructive" iconLeading={Trash01} onClick={onConfirm}>
                {t.phrDelete}
            </Button>
        </div>
    </FormDialog>
);

const FormDialog = ({ title, error, onClose, children }: { title: string; error?: string | null; onClose: () => void; children: ReactNode }) => (
    <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
        <Modal className="w-full max-w-2xl">
            <Dialog className="flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-6 shadow-xl outline-hidden ring-1 ring-secondary">
                <h2 className="w-full text-lg font-semibold text-primary">{title}</h2>
                <div className="mt-4 flex w-full min-w-0 flex-col gap-4 *:w-full">
                    <FormStatus error={error} />
                    {children}
                </div>
            </Dialog>
        </Modal>
    </ModalOverlay>
);
