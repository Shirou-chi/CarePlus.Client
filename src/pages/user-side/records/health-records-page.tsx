import { useMemo, useState, type ReactNode } from "react";
import { Edit01, Plus, Trash01 } from "@untitledui/icons";
import { Navigate } from "react-router";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
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
import {
    dummyHistory,
    dummyItems,
    dummyReadings,
    isValidBloodPressure,
    newRecordId,
    scoreHealth,
    type BloodPressureReading,
    type HealthItem,
    type HealthItemKind,
    type MedicalHistoryEntry,
} from "@/utils/health-records";

const pad = (value: number) => String(value).padStart(2, "0");

const localDateTimeValue = (date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const localDateValue = (iso?: string) => {
    const date = iso ? new Date(iso) : new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const fromLocalInput = (value: string) => new Date(value).toISOString();

type DialogState =
    | { type: "bp"; item?: BloodPressureReading }
    | { type: "item"; kind: HealthItemKind; item?: HealthItem }
    | { type: "history"; item?: MedicalHistoryEntry }
    | { type: "delete"; target: "bp" | "item" | "history"; id: string; label: string };

export const HealthRecordsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [readings, setReadings] = useState(dummyReadings);
    const [items, setItems] = useState(dummyItems);
    const [history, setHistory] = useState(dummyHistory);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [tab, setTab] = useState<HealthItemKind>("allergy");

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
                <FormStatus error={error} />

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
                        <Tabs.List type="underline" size="sm">
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
                            <Button color="primary" size="sm" iconLeading={Plus} onClick={() => setDialog({ type: "history" })}>
                                {t.phrAddRecord}
                            </Button>
                        }
                    />
                    <Table aria-label={t.phrTableTitle}>
                        <Table.Header>
                            <Table.Head label={t.phrTreatment} isRowHeader />
                            <Table.Head label={t.phrFacility} />
                            <Table.Head label={t.phrDate} />
                            <Table.Head label={t.phrNotes} />
                            <Table.Head className="w-16" />
                        </Table.Header>
                        <Table.Body
                            items={history}
                            renderEmptyState={() => <p className="px-6 py-8 text-sm text-tertiary">{t.phrTableEmpty}</p>}
                        >
                            {(item) => (
                                <Table.Row id={item.id}>
                                    <Table.Cell className="font-medium text-primary">{item.treatment}</Table.Cell>
                                    <Table.Cell>{item.facility}</Table.Cell>
                                    <Table.Cell>{formatDay(item.treatedAt)}</Table.Cell>
                                    <Table.Cell>{item.notes || "—"}</Table.Cell>
                                    <Table.Cell>
                                        <Dropdown.Root>
                                            <Dropdown.DotsButton />
                                            <Dropdown.Popover className="w-min">
                                                <Dropdown.Menu>
                                                    <Dropdown.Item icon={Edit01} onAction={() => setDialog({ type: "history", item })}>
                                                        <span className="pr-4">{t.phrEdit}</span>
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        icon={Trash01}
                                                        onAction={() => setDialog({ type: "delete", target: "history", id: item.id, label: item.treatment })}
                                                    >
                                                        <span className="pr-4">{t.phrDelete}</span>
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown.Popover>
                                        </Dropdown.Root>
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
                        if (!isValidBloodPressure(payload.systolic, payload.diastolic)) {
                            setError("Systolic must be higher than diastolic, in a realistic range.");
                            return;
                        }
                        const next: BloodPressureReading = {
                            id: dialog.item?.id ?? newRecordId(),
                            systolic: payload.systolic,
                            diastolic: payload.diastolic,
                            recordedAt: payload.recordedAt,
                            notes: payload.notes ?? null,
                        };
                        setReadings((list) =>
                            [...(dialog.item ? list.filter((item) => item.id !== dialog.item!.id) : list), next].sort((left, right) =>
                                left.recordedAt.localeCompare(right.recordedAt),
                            ),
                        );
                        closeDialog();
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
                        const next: HealthItem = {
                            id: dialog.item?.id ?? newRecordId(),
                            kind: payload.kind,
                            label,
                            notes: payload.notes ?? null,
                        };
                        setItems((list) => (dialog.item ? list.map((item) => (item.id === dialog.item!.id ? next : item)) : [...list, next]));
                        closeDialog();
                    }}
                />
            ) : null}

            {dialog?.type === "history" ? (
                <HistoryDialog
                    t={t}
                    error={error}
                    item={dialog.item}
                    onClose={closeDialog}
                    onSave={(payload) => {
                        if (!payload.treatment.trim() || !payload.facility.trim() || !payload.treatedAt) {
                            setError("Fill in the treatment, clinic, and date.");
                            return;
                        }
                        const next: MedicalHistoryEntry = {
                            id: dialog.item?.id ?? newRecordId(),
                            treatment: payload.treatment.trim(),
                            facility: payload.facility.trim(),
                            treatedAt: new Date(`${payload.treatedAt}T00:00:00`).toISOString(),
                            notes: payload.notes ?? null,
                        };
                        setHistory((list) => {
                            const without = dialog.item ? list.filter((item) => item.id !== dialog.item!.id) : list;
                            return [...without, next].sort((left, right) => right.treatedAt.localeCompare(left.treatedAt));
                        });
                        closeDialog();
                    }}
                />
            ) : null}

            {dialog?.type === "delete" ? (
                <DeleteDialog
                    t={t}
                    label={dialog.label}
                    onClose={closeDialog}
                    onConfirm={() => {
                        if (dialog.target === "bp") {
                            setReadings((list) => list.filter((item) => item.id !== dialog.id));
                        } else if (dialog.target === "item") {
                            setItems((list) => list.filter((item) => item.id !== dialog.id));
                        } else {
                            setHistory((list) => list.filter((item) => item.id !== dialog.id));
                        }
                        closeDialog();
                    }}
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
    const [recordedAt, setRecordedAt] = useState(item ? localDateTimeValue(new Date(item.recordedAt)) : localDateTimeValue());
    const [notes, setNotes] = useState(item?.notes ?? "");

    return (
        <FormDialog title={item ? t.phrEditBp : t.phrAddBp} error={error} onClose={onClose}>
            <form
                className="flex w-full min-w-0 flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave({
                        systolic: Number(systolic),
                        diastolic: Number(diastolic),
                        recordedAt: fromLocalInput(recordedAt),
                        notes: notes.trim() || undefined,
                    });
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input className="w-full" label={t.phrSystolic} type="number" value={systolic} onChange={setSystolic} isRequired />
                    <Input className="w-full" label={t.phrDiastolic} type="number" value={diastolic} onChange={setDiastolic} isRequired />
                </div>
                <Input className="w-full" label={t.phrRecordedAt} type="datetime-local" value={recordedAt} onChange={setRecordedAt} isRequired />
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

const HistoryDialog = ({
    t,
    error,
    item,
    onClose,
    onSave,
}: {
    t: Copy;
    error: string | null;
    item?: MedicalHistoryEntry;
    onClose: () => void;
    onSave: (payload: { treatment: string; facility: string; treatedAt: string; notes?: string }) => void;
}) => {
    const [treatment, setTreatment] = useState(item?.treatment ?? "");
    const [facility, setFacility] = useState(item?.facility ?? "");
    const [treatedAt, setTreatedAt] = useState(localDateValue(item?.treatedAt));
    const [notes, setNotes] = useState(item?.notes ?? "");

    return (
        <FormDialog title={item ? t.phrEditRecord : t.phrAddRecord} error={error} onClose={onClose}>
            <form
                className="flex w-full min-w-0 flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave({ treatment, facility, treatedAt, notes: notes.trim() || undefined });
                }}
            >
                <Input className="w-full" label={t.phrTreatment} value={treatment} onChange={setTreatment} isRequired maxLength={120} />
                <Input className="w-full" label={t.phrFacility} value={facility} onChange={setFacility} isRequired maxLength={120} />
                <Input className="w-full" label={t.phrDate} type="date" value={treatedAt} onChange={setTreatedAt} isRequired />
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
