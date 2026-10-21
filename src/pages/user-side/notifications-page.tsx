import { useState } from "react";
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
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { NotificationItem, noticeKindLabel, noticeMessage, noticeMeta } from "@/components/marketing/notifications/notification-item";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { useNotices } from "@/providers/notification-provider";
import { formatNoticeAge, type ClinicNotice } from "@/utils/notifications";

type TabKey = "all" | "unread";

const idsFromSelection = (selection: Selection, rows: ClinicNotice[]) => {
    if (selection === "all") {
        return rows.map((item) => item.id);
    }
    return rows.map((item) => item.id).filter((id) => selection.has(id));
};

const rowIsSelected = (selection: Selection, id: string) => selection === "all" || (selection instanceof Set && selection.has(id));

export const NotificationsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { items, unread, markRead, markAllRead, remove } = useNotices();
    const [tab, setTab] = useState<TabKey>("all");
    const [selected, setSelected] = useState<Selection>(new Set());
    const [confirming, setConfirming] = useState(false);
    const rows = tab === "unread" ? unread : items;
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

                <Tabs selectedKey={tab} onSelectionChange={(key) => changeTab(String(key) as TabKey)} className="mt-8">
                    <Tabs.List type="button-border" size="sm" className="w-full max-w-md sm:w-auto">
                        <Tabs.Item id="all" className="flex-1 sm:flex-none">
                            <span className="flex items-center gap-1.5">
                                {t.notifAll}
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#0b1f38] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white">
                                    {items.length}
                                </span>
                            </span>
                        </Tabs.Item>
                        <Tabs.Item id="unread" className="flex-1 sm:flex-none">
                            <span className="flex items-center gap-1.5">
                                {t.notifUnread}
                                {unread.length > 0 ? (
                                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-[11px] leading-none font-semibold text-secondary">
                                        {unread.length}
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
                            onClear={markAllRead}
                            onDelete={() => setConfirming(true)}
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
                            onClear={markAllRead}
                            onDelete={() => setConfirming(true)}
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
                                <Button color="secondary" onPress={() => setConfirming(false)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" iconLeading={Trash01} onPress={confirmDelete}>
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
    onClear: () => void;
    onDelete: () => void;
};

const NoticeList = ({ t, locale, rows, tab, selected, unreadCount, onSelectionChange, onOpen, onClear, onDelete }: NoticeListProps) => {
    const selectedCount = idsFromSelection(selected, rows).length;
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

    if (rows.length === 0) {
        return (
            <EmptyState size="sm" className="py-12">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={Bell01} color="gray" theme="modern" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{tab === "unread" ? t.notifEmptyUnread : t.notifEmpty}</EmptyState.Title>
                    <EmptyState.Description>{tab === "unread" ? t.notifEmptyUnreadHint : t.notifEmptyHint}</EmptyState.Description>
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
                <Button color="secondary" size="sm" isDisabled={unreadCount === 0} onPress={onClear}>
                    {t.notifClearAll}
                </Button>
                {selectedCount > 0 ? (
                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onPress={onDelete}>
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
                        <NotificationItem
                            actor={item.actor}
                            initials={item.initials}
                            message={noticeMessage(item, t)}
                            meta={noticeMeta(item, t, locale)}
                            unread={item.unread}
                            href={item.href}
                            onOpen={() => onOpen(item.id)}
                        />
                    </li>
                ))}
            </ul>

            <TableCard.Root className="hidden md:block">
                <Table aria-label={t.notifPageTitle} selectionMode="multiple" selectedKeys={selected} onSelectionChange={onSelectionChange}>
                    <Table.Header>
                        <Table.Head label={t.notifColNotice} isRowHeader />
                        <Table.Head label={t.notifColCategory} />
                        <Table.Head label={t.notifColWhen} />
                        <Table.Head label={t.notifColStatus} className="w-24" />
                    </Table.Header>
                    <Table.Body items={rows}>
                        {(item) => (
                            <Table.Row id={item.id}>
                                <Table.Cell>
                                    <a
                                        href={item.href}
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
                                <Table.Cell>
                                    <Badge color="gray" size="sm" type="modern">
                                        {noticeKindLabel(item.kind, t)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>{formatNoticeAge(item.createdAt, Date.now(), locale)}</Table.Cell>
                                <Table.Cell>
                                    {item.unread ? (
                                        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                            <span aria-hidden="true" className="size-2 rounded-full bg-[#0b1f38]" />
                                            {t.notifUnreadLabel}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-tertiary">{t.notifReadLabel}</span>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>
        </div>
    );
};
