import { useId, useState } from "react";
import { Heading, type Selection } from "react-aria-components";
import { Bell01, Trash01 } from "@untitledui/icons";
import { Navigate } from "react-router";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { Tabs } from "@/components/application/tabs/tabs";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { NotificationItem, noticeKindLabel, noticeMessage, noticeMeta } from "@/components/marketing/notifications/notification-item";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { useNotices } from "@/providers/notification-provider";
import { clinicAnnouncementNav, formatNoticeAge, sortNotices, type ClinicNotice, type NoticeOrder } from "@/utils/notifications";

type TabKey = "all" | "unread";

const idsFromSelection = (selection: Selection, rows: ClinicNotice[]) => {
    if (selection === "all") {
        return rows.map((item) => item.id);
    }
    return rows.map((item) => item.id).filter((id) => selection.has(id));
};

const rowIsSelected = (selection: Selection, id: string) => selection === "all" || (selection instanceof Set && selection.has(id));

const leaveCheckbox = (event: { stopPropagation: () => void }) => event.stopPropagation();

const NoticeDateField = ({
    label,
    anyLabel,
    locale,
    value,
    onChange,
}: {
    label: string;
    anyLabel: string;
    locale: "en" | "zh";
    value: string;
    onChange: (value: string) => void;
}) => {
    const id = useId();
    const shown = value
        ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`))
        : anyLabel;

    return (
        <div className="flex w-full max-w-xs flex-col gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative flex items-center rounded-lg bg-primary px-3 py-2 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand">
                <span className="pointer-events-none min-w-0 flex-1 truncate">{shown}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none size-4 shrink-0 text-fg-quaternary">
                    <rect x="3" y="4" width="14" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 8h14M7 2.5v3M13 2.5v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                    id={id}
                    type="date"
                    value={value}
                    aria-label={label}
                    onChange={(event) => onChange(event.target.value)}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        try {
                            event.currentTarget.showPicker();
                        } catch {
                            event.currentTarget.focus();
                        }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
            </div>
        </div>
    );
};

export const NotificationsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { items, unread, markRead, markReadMany, markAllRead, remove } = useNotices();
    const [tab, setTab] = useState<TabKey>("all");
    const [order, setOrder] = useState<NoticeOrder>("latest");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selected, setSelected] = useState<Selection>(new Set());
    const [confirming, setConfirming] = useState(false);
    const allRows = sortNotices(items, order, startDate, endDate);
    const unreadRows = sortNotices(unread, order, startDate, endDate);
    const dateLimited = order === "date" && Boolean(startDate || endDate);
    const rows = tab === "unread" ? unreadRows : allRows;
    const selectedIds = idsFromSelection(selected, rows);

    const changeTab = (key: TabKey) => {
        setTab(key);
        setSelected(new Set());
        setConfirming(false);
    };

    const confirmDelete = () => {
        if (selectedIds.length === 0) {
            setConfirming(false);
            return;
        }
        remove(selectedIds);
        setSelected(new Set());
        setConfirming(false);
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
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.notifPageTitle}</h1>
                <p className="mt-2 max-w-2xl text-md text-tertiary">{t.notifPageBody}</p>
                <Button color="secondary" size="md" className="mt-4" href={clinicAnnouncementNav.href}>
                    {t[clinicAnnouncementNav.copyKey]}
                </Button>

                <div className="mt-6 flex flex-wrap items-end gap-3">
                    <Select
                        label={t.notifSort}
                        size="sm"
                        className="w-full max-w-xs"
                        selectedKey={order}
                        onSelectionChange={(key) => {
                            setOrder(String(key) as NoticeOrder);
                            setSelected(new Set());
                        }}
                        items={[
                            { id: "latest", label: t.notifSortLatest },
                            { id: "oldest", label: t.notifSortOldest },
                            { id: "date", label: t.notifSortDate },
                        ]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    {order === "date" ? (
                        <>
                            <NoticeDateField
                                label={t.notifSortStart}
                                anyLabel={t.notifSortAny}
                                locale={locale}
                                value={startDate}
                                onChange={(value) => {
                                    setStartDate(value);
                                    setSelected(new Set());
                                }}
                            />
                            <NoticeDateField
                                label={t.notifSortEnd}
                                anyLabel={t.notifSortAny}
                                locale={locale}
                                value={endDate}
                                onChange={(value) => {
                                    setEndDate(value);
                                    setSelected(new Set());
                                }}
                            />
                        </>
                    ) : null}
                </div>

                <Tabs selectedKey={tab} onSelectionChange={(key) => changeTab(String(key) as TabKey)} className="mt-8">
                    <Tabs.List type="button-border" size="sm" fullWidth className="w-full">
                        <Tabs.Item id="all" className="flex-1">
                            <span className="flex items-center gap-1.5">
                                {t.notifAll}
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#0b1f38] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white">
                                    {allRows.length}
                                </span>
                            </span>
                        </Tabs.Item>
                        <Tabs.Item id="unread" className="flex-1">
                            <span className="flex items-center gap-1.5">
                                {t.notifUnread}
                                {unreadRows.length > 0 ? (
                                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-[11px] leading-none font-semibold text-secondary">
                                        {unreadRows.length}
                                    </span>
                                ) : null}
                            </span>
                        </Tabs.Item>
                    </Tabs.List>

                    <Tabs.Panel id="all" className="pt-5">
                        <NoticeList
                            t={t}
                            locale={locale}
                            rows={rows}
                            tab="all"
                            selected={selected}
                            unreadCount={unread.length}
                            onSelectionChange={setSelected}
                            onOpen={markRead}
                            onMarkRead={markReadMany}
                            onClear={markAllRead}
                            onDelete={() => setConfirming(true)}
                            emptyTitle={dateLimited ? t.notifEmptyDate : undefined}
                            emptyHint={dateLimited ? t.notifEmptyDateHint : undefined}
                        />
                    </Tabs.Panel>
                    <Tabs.Panel id="unread" className="pt-5">
                        <NoticeList
                            t={t}
                            locale={locale}
                            rows={rows}
                            tab="unread"
                            selected={selected}
                            unreadCount={unread.length}
                            onSelectionChange={setSelected}
                            onOpen={markRead}
                            onMarkRead={markReadMany}
                            onClear={markAllRead}
                            onDelete={() => setConfirming(true)}
                            emptyTitle={dateLimited ? t.notifEmptyDate : undefined}
                            emptyHint={dateLimited ? t.notifEmptyDateHint : undefined}
                        />
                    </Tabs.Panel>
                </Tabs>
            </main>
            <LandingFooter />

            {confirming ? (
                <ModalOverlay isDismissable isOpen className="z-[70]" onOpenChange={(open) => !open && setConfirming(false)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.notifDeleteTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">{t.notifDeleteBody.replace("{count}", String(selectedIds.length))}</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onClick={() => setConfirming(false)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" iconLeading={Trash01} onClick={confirmDelete}>
                                    {t.notifDelete}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </div>
    );
};

type NoticeListProps = {
    t: Copy;
    locale: "en" | "zh";
    rows: ClinicNotice[];
    tab: TabKey;
    selected: Selection;
    unreadCount: number;
    onSelectionChange: (keys: Selection) => void;
    onOpen: (id: string) => void;
    onMarkRead: (ids: string[]) => void;
    onClear: () => void;
    onDelete: () => void;
    emptyTitle?: string;
    emptyHint?: string;
};

const NoticeList = ({ t, locale, rows, tab, selected, unreadCount, onSelectionChange, onOpen, onMarkRead, onClear, onDelete, emptyTitle, emptyHint }: NoticeListProps) => {
    const selectedCount = idsFromSelection(selected, rows).length;
    const selectedUnreadIds = idsFromSelection(selected, rows).filter((id) => rows.some((item) => item.id === id && item.unread));
    const allSelected = rows.length > 0 && selectedCount === rows.length;
    const someSelected = selectedCount > 0 && selectedCount < rows.length;

    const toggleOne = (id: string, isSelected: boolean) => {
        if (selected === "all") {
            const next = new Set(rows.map((item) => item.id));
            if (!isSelected) {
                next.delete(id);
            }
            onSelectionChange(next);
            return;
        }
        const next = new Set(selected);
        if (isSelected) {
            next.add(id);
        } else {
            next.delete(id);
        }
        onSelectionChange(next);
    };

    // React Aria may reuse/mutate its Set instance. Clone it so React receives
    // a new reference and row actions update immediately after a selection.
    const handleTableSelectionChange = (next: Selection) => {
        onSelectionChange(next === "all" ? "all" : new Set(next));
    };

    if (rows.length === 0) {
        return (
            <EmptyState size="sm" className="py-12">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={Bell01} color="gray" theme="modern" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{emptyTitle ?? (tab === "unread" ? t.notifEmptyUnread : t.notifEmpty)}</EmptyState.Title>
                    <EmptyState.Description>{emptyHint ?? (tab === "unread" ? t.notifEmptyUnreadHint : t.notifEmptyHint)}</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
        );
    }

    return (
        <div className="[&_.bg-brand-solid]:bg-[#0b1f38] [&_.ring-brand-solid]:ring-[#0b1f38]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Checkbox
                    size="md"
                    className="md:hidden"
                    label={t.notifSelectAll}
                    isSelected={allSelected}
                    isIndeterminate={someSelected}
                    onChange={(isSelected) => onSelectionChange(isSelected ? "all" : new Set())}
                />
                <Button
                    color="secondary"
                    size="sm"
                    isDisabled={selectedUnreadIds.length === 0 && unreadCount === 0}
                    onClick={() => (selectedUnreadIds.length > 0 ? onMarkRead(selectedUnreadIds) : onClear())}
                >
                    {t.notifClearAll}
                </Button>
                {selectedCount > 0 ? (
                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={onDelete}>
                        {`${t.notifDelete} (${selectedCount})`}
                    </Button>
                ) : null}
            </div>

            <ul className="flex flex-col gap-1 md:hidden">
                {rows.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 border-b border-secondary last:border-b-0">
                        <Checkbox
                            size="md"
                            className="mt-3 shrink-0"
                            aria-label={noticeMessage(item, t)}
                            isSelected={rowIsSelected(selected, item.id)}
                            onChange={(isSelected) => toggleOne(item.id, isSelected)}
                        />
                        <div className="min-w-0 flex-1">
                            <NotificationItem
                                actor={item.actor}
                                initials={item.initials}
                                message={noticeMessage(item, t)}
                                meta={noticeMeta(item, t, locale)}
                                unread={item.unread}
                                href={item.href}
                                onOpen={() => onOpen(item.id)}
                            />
                            {item.unread ? (
                                <Button color="secondary" size="sm" className="mb-2 ml-14" onClick={() => onOpen(item.id)}>
                                    {t.notifMarkRead}
                                </Button>
                            ) : null}
                        </div>
                        {rowIsSelected(selected, item.id) ? (
                            <Button
                                color="secondary-destructive"
                                size="md"
                                iconLeading={Trash01}
                                aria-label={`${t.notifDelete}: ${noticeMessage(item, t)}`}
                                className="mt-2 shrink-0"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDelete();
                                }}
                            />
                        ) : null}
                    </li>
                ))}
            </ul>

            <TableCard.Root className="hidden md:block">
                <Table
                    aria-label={t.notifPageTitle}
                    selectionMode="multiple"
                    selectedKeys={selected}
                    onSelectionChange={handleTableSelectionChange}
                >
                    <Table.Header>
                        <Table.Head label={t.notifColNotice} isRowHeader />
                        <Table.Head label={t.notifColCategory} />
                        <Table.Head label={t.notifColWhen} />
                        <Table.Head label={t.notifColStatus} />
                    </Table.Header>
                    <Table.Body items={rows} dependencies={[selected]}>
                        {(item) => (
                            <Table.Row id={item.id}>
                                <Table.Cell onPointerDown={leaveCheckbox}
                                    onPointerUp={leaveCheckbox}>
                                    <a
                                        href={item.href}
                                        onPointerDown={leaveCheckbox}
                                    onPointerUp={leaveCheckbox}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onOpen(item.id);
                                        }}
                                        className="flex items-start gap-3 rounded-lg outline-focus-ring focus-visible:outline-2"
                                    >
                                        <Avatar size="md" initials={item.initials} alt={item.actor} />
                                        <span className="min-w-0">
                                            <span className="block font-medium text-primary">{noticeMessage(item, t)}</span>
                                            <span className="mt-0.5 block text-xs text-tertiary">{item.actor}</span>
                                        </span>
                                    </a>
                                </Table.Cell>
                                <Table.Cell onPointerDown={leaveCheckbox}
                                    onPointerUp={leaveCheckbox}>
                                    <Badge color="gray" size="sm" type="modern">
                                        {noticeKindLabel(item.kind, t)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell onPointerDown={leaveCheckbox}
                                    onPointerUp={leaveCheckbox}>{formatNoticeAge(item.createdAt, Date.now(), locale)}</Table.Cell>
                                <Table.Cell onPointerDown={leaveCheckbox}
                                    onPointerUp={leaveCheckbox}>
                                    <div className="flex items-center justify-between gap-3">
                                        {item.unread ? (
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                                <span aria-hidden="true" className="size-2 rounded-full bg-[#0b1f38]" />
                                                {t.notifUnreadLabel}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-tertiary">{t.notifReadLabel}</span>
                                        )}
                                        <span
                                            className="ml-auto flex items-center gap-2"
                                            onClick={(event) => event.stopPropagation()}
                                            onPointerDown={leaveCheckbox}
                                            onPointerUp={leaveCheckbox}
                                        >
                                            {item.unread ? (
                                                <Button color="secondary" size="sm" onClick={() => onOpen(item.id)}>
                                                    {t.notifMarkRead}
                                                </Button>
                                            ) : null}
                                            {rowIsSelected(selected, item.id) ? (
                                                <Button
                                                    color="secondary-destructive"
                                                    size="sm"
                                                    iconLeading={Trash01}
                                                    aria-label={`${t.notifDelete}: ${noticeMessage(item, t)}`}
                                                    onClick={onDelete}
                                                />
                                            ) : null}
                                        </span>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>
        </div>
    );
};
