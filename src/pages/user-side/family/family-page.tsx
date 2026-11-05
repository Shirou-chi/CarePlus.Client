import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FormStatus } from "@/components/application/form-status";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { familyApi, type FamilyMember, type FamilyOverview, type FamilyPermission, type FamilyRelation } from "@/services/familyApi";

const relations: FamilyRelation[] = ["parent", "child"];
const grantPermissions: FamilyPermission[] = ["parent", "child"];

const relationLabel = (t: Copy, relation: FamilyRelation | "you" | string) => {
    if (relation === "you") return t.bookYou;
    if (relation === "parent") return t.familyRelationParent;
    if (relation === "child") return t.familyRelationChild;
    if (relation === "spouse") return t.familyRelationSpouse;
    return t.familyRelationOther;
};

const permissionLabel = (t: Copy, permission: FamilyPermission) => (permission === "parent" ? t.familyRelationParent : t.familyRelationChild);

const initials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const dialogClass = "flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-5 ring-1 ring-secondary outline-hidden sm:p-6";

export const FamilyPage = () => {
    const { profile, isReady } = useAuth();
    const { t } = useI18n();
    const [overview, setOverview] = useState<FamilyOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renamingSelf, setRenamingSelf] = useState(false);
    const [creating, setCreating] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let requestInFlight = false;

        if (!profile) {
            setOverview(null);
            setLoading(false);
            return;
        }

        const loadOverview = async (silent = false) => {
            if (requestInFlight) return;

            requestInFlight = true;
            if (!silent) {
                setLoading(true);
                setLoadError(null);
            }

            try {
                const next = await familyApi.overview();
                if (!cancelled) {
                    setOverview(next);
                }
            } catch (cause) {
                if (!cancelled && !silent) {
                    setLoadError(cause instanceof Error ? cause.message : t.authFailed);
                }
            } finally {
                requestInFlight = false;
                if (!cancelled && !silent) {
                    setLoading(false);
                }
            }
        };

        void loadOverview();
        const refreshInterval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void loadOverview(true);
            }
        }, 2_000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void loadOverview(true);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            cancelled = true;
            window.clearInterval(refreshInterval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [profile?.id, t.authFailed]);

    const family = overview?.family ?? null;
    const invites = overview?.invites ?? [];

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    const currentPatientId = overview?.currentPatientId || profile.id;
    const mine = family?.members.find((member) => member.id === currentPatientId) ?? null;
    const isParent = mine?.permission === "parent";
    const active = family?.members.filter((member) => member.status === "active") ?? [];
    const pending = family?.members.filter((member) => member.status === "pending") ?? [];
    const openPerson = family?.members.find((member) => member.id === openId) ?? null;

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8 md:py-10">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.familyProfiles}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.familyBody}</p>
                </div>
                {loadError ? <p role="alert" className="mt-5 rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">{loadError}</p> : null}
                {loading && !overview ? <p className="mt-5 rounded-xl bg-primary px-4 py-3 text-sm text-tertiary ring-1 ring-secondary">{t.phrLoading}</p> : null}

                {invites.length > 0 && !family ? (
                    <ul className="mt-6 flex flex-col gap-3">
                        {invites.map((invite) => (
                            <li key={invite.member.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                <p className="text-md font-semibold text-primary">{t.familyIncomingTitle.replace("{family}", invite.family.name)}</p>
                                <p className="mt-1 text-sm text-tertiary">
                                    {t.familyIncomingBody.replace("{name}", invite.family.members.find((member) => member.permission === "parent")?.name ?? invite.family.name).replace("{relation}", relationLabel(t, invite.member.relation))}
                                </p>
                                <p className="mt-2 text-sm text-secondary">{permissionLabel(t, invite.member.permission)}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        onClick={() => void familyApi.acceptInvite(invite.member.familyMemberId).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed))}
                                    >
                                        {t.familyAccept}
                                    </Button>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        onClick={() => void familyApi.declineInvite(invite.member.familyMemberId).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed))}
                                    >
                                        {t.familyDecline}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {!family ? (
                    <div className="mt-6 rounded-2xl bg-primary px-5 py-8 ring-1 ring-secondary">
                        <h2 className="text-lg font-semibold text-primary">{t.familyNone}</h2>
                        <p className="mt-2 max-w-xl text-sm text-tertiary">{t.familyNoneBody}</p>
                        <Button color="primary" size="sm" className="mt-4" onClick={() => setCreating(true)}>
                            {t.familyCreate}
                        </Button>
                    </div>
                ) : (
                    <>
                        <section className="mt-6 divide-y divide-secondary rounded-2xl bg-primary ring-1 ring-secondary">
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                                <div>
                                    <p className="text-sm text-tertiary">{t.familyName}</p>
                                    <p className="mt-1 text-md font-semibold text-primary">{family.name}</p>
                                </div>
                                {mine?.isOwner ? (
                                    <Button color="secondary" size="sm" onClick={() => setRenaming(true)}>
                                        {t.familyChange}
                                    </Button>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
                                <Button color="secondary" size="sm" onClick={() => setLeaving(true)}>
                                    {t.familyLeave}
                                </Button>
                                {mine?.isOwner ? (
                                    <Button color="secondary-destructive" size="sm" onClick={() => setDeleting(true)}>
                                        {t.familyDelete}
                                    </Button>
                                ) : null}
                            </div>
                        </section>

                        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-primary">{t.familyMembers}</h2>
                                <p className="mt-1 text-sm text-tertiary">{t.familyMemberCount.replace("{count}", String(active.length))}</p>
                            </div>
                            {mine?.isOwner ? (
                                <Button color="primary" size="sm" onClick={() => setAdding(true)}>
                                    {t.familyAdd}
                                </Button>
                            ) : null}
                        </div>

                        <ul className="mt-4 divide-y divide-secondary rounded-2xl bg-primary ring-1 ring-secondary">
                            {active.map((person) => (
                                <MemberRow key={person.id} person={person} isSelf={person.id === currentPatientId} onOpen={() => setOpenId(person.id)} />
                            ))}
                        </ul>

                        {isParent && pending.length > 0 ? (
                            <>
                                <h2 className="mt-8 text-lg font-semibold text-primary">{t.familyPending}</h2>
                                <p className="mt-1 max-w-2xl text-sm text-tertiary">{t.familyPendingHint}</p>
                                <ul className="mt-4 divide-y divide-secondary rounded-2xl bg-primary ring-1 ring-secondary">
                                    {pending.map((person) => (
                                        <MemberRow key={person.id} person={person} pending isSelf={false} onOpen={() => setOpenId(person.id)} />
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </>
                )}
            </main>
            <LandingFooter />

            {renaming && family ? (
                <RenameDialog
                    current={family.name}
                    onClose={() => setRenaming(false)}
                    onSave={(name) => {
                        void familyApi.rename(name).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setRenaming(false);
                    }}
                />
            ) : null}
            {creating ? (
                <RenameDialog
                    current=""
                    title={t.familyCreate}
                    onClose={() => setCreating(false)}
                    onSave={(name) => {
                        void familyApi.create(name).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setCreating(false);
                    }}
                />
            ) : null}
            {adding ? (
                <AddDialog
                    onClose={() => setAdding(false)}
                    onSave={(person) => {
                        void familyApi.invite(person.email, person.relation).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setAdding(false);
                        return null;
                    }}
                />
            ) : null}
            {renamingSelf && mine ? (
                <RenameDialog
                    current={mine.name}
                    title={t.familyDisplayNameChange}
                    label={t.familyDisplayName}
                    requiredMessage={t.familyDisplayNameRequired}
                    onClose={() => setRenamingSelf(false)}
                    onSave={(name) => {
                        void familyApi.renameSelf(name).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setRenamingSelf(false);
                    }}
                />
            ) : null}
            {openPerson ? (
                <MemberDialog
                    person={openPerson}
                    isParent={Boolean(mine?.isOwner)}
                    isSelf={openPerson.id === currentPatientId}
                    onClose={() => setOpenId(null)}
                    onRenameSelf={() => {
                        setOpenId(null);
                        setRenamingSelf(true);
                    }}
                    onPermission={(permission) => {
                        void familyApi.updateAccess(openPerson.familyMemberId, permission).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                    }}
                    onRemove={
                        mine?.isOwner && openPerson.id !== currentPatientId
                            ? () => {
                                  const operation = openPerson.status === "pending" ? familyApi.cancelInvite(openPerson.familyMemberId) : familyApi.removeMember(openPerson.familyMemberId);
                                  void operation.then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                                  setOpenId(null);
                              }
                            : undefined
                    }
                />
            ) : null}
            {leaving && family ? (
                <LeaveDialog
                    people={active.filter((member) => member.id !== currentPatientId)}
                    mustTransfer={Boolean(mine?.isOwner && active.length > 1)}
                    onClose={() => setLeaving(false)}
                    onLeave={(transferToId) => {
                        const transferMember = active.find((member) => member.id === transferToId);
                        void familyApi.leave(transferMember?.familyMemberId).then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setLeaving(false);
                        return null;
                    }}
                />
            ) : null}
            {deleting ? (
                <ConfirmDialog
                    title={t.familyDelete}
                    body={t.familyDeleteBody}
                    confirm={t.familyDelete}
                    onClose={() => setDeleting(false)}
                    onConfirm={() => {
                        void familyApi.delete().then(setOverview).catch((cause) => setLoadError(cause instanceof Error ? cause.message : t.authFailed));
                        setDeleting(false);
                    }}
                />
            ) : null}
        </div>
    );
};

const MemberRow = ({ person, pending = false, isSelf, onOpen }: { person: FamilyMember; pending?: boolean; isSelf: boolean; onOpen: () => void }) => {
    const { t } = useI18n();
    return (
        <li>
            <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left outline-focus-ring hover:bg-quaternary sm:px-5" onClick={onOpen}>
                <Avatar size="md" initials={initials(person.name)} alt={person.name} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary">
                        {person.name}
                        {isSelf ? <span className="ml-1 font-medium text-brand-secondary">({t.familyMyself})</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-tertiary">{person.email}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                    <Badge color={person.permission === "parent" ? "brand" : "gray"} size="sm">
                        {permissionLabel(t, person.permission)}
                    </Badge>
                    {pending ? (
                        <Badge color="warning" size="sm">
                            {t.familyPending}
                        </Badge>
                    ) : null}
                </span>
            </button>
        </li>
    );
};

const RenameDialog = ({ current, title, label, requiredMessage, onClose, onSave }: { current: string; title?: string; label?: string; requiredMessage?: string; onClose: () => void; onSave: (name: string) => void }) => {
    const { t } = useI18n();
    const [name, setName] = useState(current);
    const [error, setError] = useState<string | null>(null);

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className={dialogClass}>
                    <h2 className="text-lg font-semibold text-primary">{title ?? t.familyName}</h2>
                    <form
                        className="mt-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (name.trim().length < 2 || name.trim().length > 100) {
                                setError(requiredMessage ?? t.familyNameRequired);
                                return;
                            }
                            onSave(name);
                        }}
                    >
                        <Input label={label ?? t.familyName} value={name} onChange={setName} maxLength={100} />
                        <FormStatus error={error} />
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" color="tertiary" size="md" onClick={onClose}>
                                {t.notifCancel}
                            </Button>
                            <Button type="submit" color="primary" size="md">
                                {t.familySave}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const AddDialog = ({ onClose, onSave }: { onClose: () => void; onSave: (person: { email: string; relation: FamilyRelation }) => string | null }) => {
    const { t } = useI18n();
    const [email, setEmail] = useState("");
    const [relation, setRelation] = useState<FamilyRelation>("child");
    const [fieldError, setFieldError] = useState<string | null>(null);
    const relationOptions = relations.map((id) => ({ id, label: relationLabel(t, id) }));

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className={dialogClass}>
                    <h2 className="text-lg font-semibold text-primary">{t.familyAdd}</h2>
                    <form
                        className="mt-4 flex flex-col gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!emailOk(email.trim())) {
                                setFieldError(t.familyEmailInvalid);
                                return;
                            }
                            const message = onSave({ email, relation });
                            if (message) setFieldError(message);
                        }}
                    >
                        <Input
                            label={t.email}
                            type="email"
                            value={email}
                            onChange={(value) => {
                                setEmail(value);
                                if (fieldError) setFieldError(null);
                            }}
                            isInvalid={Boolean(fieldError)}
                            hint={fieldError ?? undefined}
                        />
                        <Select label={t.familyRelation} selectedKey={relation} onSelectionChange={(key) => key && setRelation(String(key) as FamilyRelation)} items={relationOptions}>
                            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                        </Select>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" color="tertiary" size="md" onClick={onClose}>
                                {t.notifCancel}
                            </Button>
                            <Button type="submit" color="primary" size="md">
                                {t.familyInvite}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const MemberDialog = ({
    person,
    isParent,
    isSelf,
    onClose,
    onPermission,
    onRemove,
    onRenameSelf,
}: {
    person: FamilyMember;
    isParent: boolean;
    isSelf: boolean;
    onClose: () => void;
    onPermission: (permission: FamilyPermission) => void;
    onRemove?: () => void;
    onRenameSelf: () => void;
}) => {
    const { t } = useI18n();
    const [permission, setGrant] = useState<FamilyPermission>(person.permission);
    const [confirming, setConfirming] = useState<"remove" | null>(null);
    const options = grantPermissions.map((id) => ({ id, label: permissionLabel(t, id) }));

    if (confirming === "remove") {
        return (
            <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
                <Modal className="w-full max-w-md">
                    <Dialog className={dialogClass}>
                        <h2 className="text-lg font-semibold text-primary">{t.familyRemove}</h2>
                        <p className="mt-2 text-sm text-tertiary">{t.familyRemoveAsk.replace("{name}", person.name)}</p>
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button color="tertiary" size="md" onClick={() => setConfirming(null)}>
                                {t.notifCancel}
                            </Button>
                            <Button color="primary-destructive" size="md" onClick={onRemove}>
                                {t.familyRemove}
                            </Button>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className={dialogClass}>
                    <div className="flex items-center gap-3">
                        <Avatar size="lg" initials={initials(person.name)} alt={person.name} />
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-primary">
                                {person.name}
                                {isSelf ? <span className="ml-1 text-md font-medium text-brand-secondary">({t.familyMyself})</span> : null}
                            </h2>
                            <Badge color={person.permission === "parent" ? "brand" : "gray"} size="sm" className="mt-1">
                                {permissionLabel(t, person.permission)}
                            </Badge>
                        </div>
                    </div>
                    <dl className="mt-5 space-y-3 text-sm">
                        <div>
                            <dt className="text-tertiary">{t.email}</dt>
                            <dd className="mt-0.5 break-all font-medium text-primary">{person.email}</dd>
                        </div>
                        <div>
                            <dt className="text-tertiary">{t.familyRelation}</dt>
                            <dd className="mt-0.5 font-medium text-primary">{relationLabel(t, person.relation)}</dd>
                        </div>
                    </dl>
                    {isParent && !isSelf ? (
                        <div className="mt-4">
                            <Select label={t.familyPermission} selectedKey={permission} onSelectionChange={(key) => key && setGrant(String(key) as FamilyPermission)} items={options}>
                                {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                            </Select>
                        </div>
                    ) : null}
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        {isSelf ? (
                            <Button color="secondary" size="md" onClick={onRenameSelf}>
                                {t.familyDisplayNameChange}
                            </Button>
                        ) : null}
                        {onRemove ? (
                            <Button color="secondary-destructive" size="md" onClick={() => (person.status === "pending" ? onRemove?.() : setConfirming("remove"))}>
                                {person.status === "pending" ? t.familyCancelInvite : t.familyRemove}
                            </Button>
                        ) : null}
                        {isParent && !isSelf && permission !== person.permission ? (
                            <Button color="primary" size="md" onClick={() => onPermission(permission)}>
                                {t.familySave}
                            </Button>
                        ) : null}
                        <Button color="tertiary" size="md" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const LeaveDialog = ({
    people,
    mustTransfer,
    onClose,
    onLeave,
}: {
    people: FamilyMember[];
    mustTransfer: boolean;
    onClose: () => void;
    onLeave: (transferToId?: string) => string | null;
}) => {
    const { t } = useI18n();
    const [transferTo, setTransferTo] = useState(people[0]?.id ?? "");
    const [error, setError] = useState<string | null>(null);
    const options = people.map((person) => ({ id: person.id, label: person.name }));
    const targetName = people.find((person) => person.id === transferTo)?.name ?? "";

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className={dialogClass}>
                    <h2 className="text-lg font-semibold text-primary">{t.familyLeave}</h2>
                    <p className="mt-2 text-sm text-tertiary">
                        {mustTransfer ? t.familyTransferLeaveAsk.replace("{name}", targetName) : t.familyLeaveAsk}
                    </p>
                    {mustTransfer && people.length === 0 ? <p className="mt-3 text-sm text-error-primary">{t.familyNeedTransfer}</p> : null}
                    {mustTransfer && people.length > 0 ? (
                        <div className="mt-4">
                            <Select label={t.familyTransfer} selectedKey={transferTo} onSelectionChange={(key) => key && setTransferTo(String(key))} items={options}>
                                {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                            </Select>
                        </div>
                    ) : null}
                    <FormStatus error={error} />
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" color="tertiary" size="md" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button color="primary-destructive" size="md" isDisabled={mustTransfer && people.length === 0} onClick={() => setError(onLeave(mustTransfer ? transferTo : undefined))}>
                            {t.familyLeave}
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const ConfirmDialog = ({ title, body, confirm, onClose, onConfirm }: { title: string; body: string; confirm: string; onClose: () => void; onConfirm: () => void }) => {
    const { t } = useI18n();
    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className={dialogClass}>
                    <h2 className="text-lg font-semibold text-primary">{title}</h2>
                    <p className="mt-2 text-sm text-tertiary">{body}</p>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button color="tertiary" size="md" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button color="primary-destructive" size="md" onClick={onConfirm}>
                            {confirm}
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
