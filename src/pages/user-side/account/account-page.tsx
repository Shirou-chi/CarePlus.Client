import { useEffect, useRef, useState, type ReactNode } from "react";
import {
    Camera01,
    Check,
    CreditCard01,
    Edit01,
    Plus,
    Settings01,
    Shield01,
    Trash01,
    User01,
} from "@untitledui/icons";
import { Heading } from "react-aria-components";
import { Navigate } from "react-router";
import { AddressLocator } from "@/components/application/address-map/address-map";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Form } from "@/components/base/form/form";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup, InputPrefix } from "@/components/base/input/input-group";
import { PaymentInput } from "@/components/base/input/input-payment";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { CreditCard } from "@/components/credit-card/credit-card";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import type { Profile } from "@/utils/auth";
import {
    cardBrandFromDigits,
    demoAccountActivity,
    dobFromIdentityCard,
    formatDob,
    isDuplicatePaymentCard,
    previewCardNumber,
    profileInitials,
    readProfileSettings,
    writeProfileSettings,
    type NotificationLevel,
    type PaymentCard,
    type ProfileSettings,
} from "@/utils/profile-settings";
import {
    detectMalaysiaRegion,
    deliveryLabelText,
    isDeliveryLabelId,
    isProfileSyncedAddress,
    PROFILE_ADDRESS_ID,
    splitDeliveryLine,
    syncProfileAddressToDelivery,
    type DeliveryAddress,
} from "@/utils/delivery-address";
import {
    formatPhoneForDisplay,
    validateCardExpiry,
    validateCardHolder,
    validateCardNumber,
    validateCvv,
    validateDeliveryAddress,
    validateDeliveryLabel,
    validatePassword,
    validateProfileField,
    CARD_HOLDER_MAX,
    formatCardExpiryInput,
} from "@/utils/profile-validation";
import { parsePhoneLocal } from "@/utils/phone";
import { cx } from "@/utils/cx";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const SECTIONS = ["profile", "preference", "payment", "security"] as const;
type SectionId = (typeof SECTIONS)[number];

type EditField = "fullName" | "gender" | "address" | "phone" | "email";

type DialogState =
    | { type: "edit"; field: EditField }
    | { type: "notif-disable" }
    | { type: "remove-card"; id: string; label: string }
    | { type: "remove-address"; id: string; label: string };

const genderLabel = (value: string | null, t: Copy) => {
    if (value === "male") return t.settingsGenderMale;
    if (value === "female") return t.settingsGenderFemale;
    if (value === "other") return t.settingsGenderOther;
    return "—";
};

export const AccountPage = () => {
    const { profile, isReady, updateProfile } = useAuth();
    const { t, locale, setLocale } = useI18n();
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<SectionId>("profile");
    const [settings, setSettings] = useState<ProfileSettings>(() =>
        profile ? readProfileSettings(profile.id) : readProfileSettings("guest"),
    );
    const [editingCardId, setEditingCardId] = useState<string | "new" | null>(null);
    const [editingAddressId, setEditingAddressId] = useState<string | "new" | null>(null);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [profileNotice, setProfileNotice] = useState<{ success?: string; error?: string } | null>(null);
    const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({ profile: null, preference: null, payment: null, security: null });
    const photoInputRef = useRef<HTMLInputElement>(null);
    const scrollingRef = useRef(false);

    useEffect(() => {
        if (profile) {
            const loaded = readProfileSettings(profile.id);
            const synced = syncProfileAddressToDelivery(loaded, profile.address, t.settingsProfileAddressLabel);
            setSettings(synced);
            if (JSON.stringify(synced.deliveryAddresses) !== JSON.stringify(loaded.deliveryAddresses)) {
                writeProfileSettings(profile.id, synced);
            }
        }
    }, [profile?.id, profile?.address, t.settingsProfileAddressLabel]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (scrollingRef.current) {
                    return;
                }
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                const next = visible[0]?.target.id as SectionId | undefined;
                if (next && SECTIONS.includes(next)) {
                    setActiveSection(next);
                }
            },
            { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
        );

        SECTIONS.forEach((id) => {
            const node = sectionRefs.current[id];
            if (node) {
                observer.observe(node);
            }
        });

        return () => observer.disconnect();
    }, [profile]);

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    const dob = dobFromIdentityCard(profile.identityCard) ?? profile.dateOfBirth;
    const activity = demoAccountActivity(locale);
    const phoneDisplay = formatPhoneForDisplay(profile.phone);

    const persistSettings = (next: ProfileSettings) => {
        setSettings(next);
        writeProfileSettings(profile.id, next);
    };

    const scrollToSection = (id: SectionId) => {
        setActiveSection(id);
        scrollingRef.current = true;
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => {
            scrollingRef.current = false;
        }, 600);
    };

    const saveProfileField = (field: EditField, value: string) => {
        if (field === "gender") {
            updateProfile({ gender: value });
            setDialog(null);
            setProfileNotice({ success: t.settingsSaved });
            return;
        }
        const validated = validateProfileField(field, value, t);
        if (!validated.ok) {
            return validated.message;
        }
        updateProfile({ [field]: validated.value } as Partial<Profile>);
        if (field === "address") {
            persistSettings(syncProfileAddressToDelivery(settings, validated.value, t.settingsProfileAddressLabel));
        }
        setDialog(null);
        setProfileNotice({ success: t.settingsSaved });
        return null;
    };

    const onPhotoSelected = (file: File | undefined) => {
        if (!file) {
            return;
        }
        if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
            setProfileNotice({ error: t.settingsInvalidPhoto });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            updateProfile({ avatarUrl: String(reader.result) });
            setProfileNotice({ success: t.settingsSaved });
        };
        reader.readAsDataURL(file);
    };

    const setNotificationLevel = (level: NotificationLevel) => {
        if (level === "none" && settings.notificationLevel !== "none") {
            setDialog({ type: "notif-disable" });
            return;
        }
        persistSettings({ ...settings, notificationLevel: level });
    };

    const confirmDisableNotifications = () => {
        persistSettings({ ...settings, notificationLevel: "none" });
        setDialog(null);
    };

    const savePaymentCard = (
        cardId: string | "new",
        payload: { number: string; expiry: string; holderName: string; cvv: string },
    ): string | null => {
        const number = validateCardNumber(payload.number, t);
        const expiry = validateCardExpiry(payload.expiry, t);
        const holder = validateCardHolder(payload.holderName, t);
        const cvv = validateCvv(payload.cvv, t);
        if (!number.ok) return number.message;
        if (!expiry.ok) return expiry.message;
        if (!holder.ok) return holder.message;
        if (!cvv.ok) return cvv.message;

        const fingerprint = number.value;
        if (isDuplicatePaymentCard(settings.paymentCards, fingerprint, cardId === "new" ? undefined : cardId)) {
            return t.settingsDuplicateCard;
        }

        const brand = cardBrandFromDigits(number.value);
        if (cardId === "new") {
            const card: PaymentCard = {
                id: crypto.randomUUID(),
                brand,
                last4: number.value.slice(-4),
                expiry: expiry.value,
                holderName: holder.value,
                fingerprint,
            };
            const cards = [...settings.paymentCards, card];
            persistSettings({
                ...settings,
                paymentCards: cards,
                defaultCardId: settings.defaultCardId ?? card.id,
            });
        } else {
            const cards = settings.paymentCards.map((card) =>
                card.id === cardId
                    ? {
                          ...card,
                          brand,
                          last4: number.value.slice(-4),
                          expiry: expiry.value,
                          holderName: holder.value,
                          fingerprint,
                      }
                    : card,
            );
            persistSettings({ ...settings, paymentCards: cards });
        }
        setEditingCardId(null);
        setPaymentNotice(t.settingsSaved);
        return null;
    };

    const removeCard = (id: string) => {
        const cards = settings.paymentCards.filter((card) => card.id !== id);
        persistSettings({
            ...settings,
            paymentCards: cards,
            defaultCardId: settings.defaultCardId === id ? (cards[0]?.id ?? null) : settings.defaultCardId,
        });
        if (editingCardId === id) {
            setEditingCardId(null);
        }
        setDialog(null);
    };

    const setDefaultCard = (id: string) => {
        persistSettings({ ...settings, defaultCardId: id });
    };

    const saveDeliveryAddress = (addressId: string | "new", payload: { label: string; unit: string; line: string }): string | null => {
        if (addressId === PROFILE_ADDRESS_ID) {
            return null;
        }
        const label = validateDeliveryLabel(payload.label, t);
        const line = validateDeliveryAddress(payload.unit, payload.line, t);
        if (!label.ok) return label.message;
        if (!line.ok) return line.message;

        const region = detectMalaysiaRegion(line.value);

        if (addressId === "new") {
            const address: DeliveryAddress = {
                id: crypto.randomUUID(),
                label: label.value,
                line: line.value,
                region,
            };
            const addresses = [...settings.deliveryAddresses, address];
            persistSettings({
                ...settings,
                deliveryAddresses: addresses,
                defaultDeliveryAddressId: settings.defaultDeliveryAddressId ?? address.id,
            });
        } else {
            const addresses = settings.deliveryAddresses.map((address) =>
                address.id === addressId
                    ? { ...address, label: label.value, line: line.value, region }
                    : address,
            );
            persistSettings({ ...settings, deliveryAddresses: addresses });
        }
        setEditingAddressId(null);
        setProfileNotice({ success: t.settingsSaved });
        return null;
    };

    const removeDeliveryAddress = (id: string) => {
        if (isProfileSyncedAddress(id)) {
            return;
        }
        const addresses = settings.deliveryAddresses.filter((address) => address.id !== id);
        persistSettings({
            ...settings,
            deliveryAddresses: addresses,
            defaultDeliveryAddressId: settings.defaultDeliveryAddressId === id ? (addresses[0]?.id ?? null) : settings.defaultDeliveryAddressId,
        });
        if (editingAddressId === id) {
            setEditingAddressId(null);
        }
        setDialog(null);
    };

    const setDefaultDeliveryAddress = (id: string) => {
        persistSettings({ ...settings, defaultDeliveryAddressId: id });
    };

    return (
        <div className="careplus-landing careplus-account min-h-dvh pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full min-w-0 max-w-container px-4 py-8 md:px-8 md:py-10">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.settingsPageTitle}</h1>
                    <p className="mt-2 max-w-3xl text-md text-tertiary">{t.settingsPageBody}</p>
                </div>

                <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
                    <aside className="sticky top-[4.5rem] z-20 -mx-4 min-w-0 border-b border-secondary bg-brand-primary px-4 py-2 md:top-22 md:bg-primary/95 md:backdrop-blur-md lg:top-28 lg:mx-0 lg:max-h-[calc(100dvh-8rem)] lg:border-b-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                        <nav aria-label={t.settingsPageTitle} className="grid min-w-0 grid-cols-4 gap-1 md:flex md:gap-2 lg:flex-col lg:gap-1">
                            <SidebarLink
                                label={t.settingsNavProfile}
                                icon={User01}
                                active={activeSection === "profile"}
                                onClick={() => scrollToSection("profile")}
                            />
                            <SidebarLink
                                label={t.settingsNavPreference}
                                icon={Settings01}
                                active={activeSection === "preference"}
                                onClick={() => scrollToSection("preference")}
                            />
                            <SidebarLink
                                label={t.settingsNavPayment}
                                icon={CreditCard01}
                                active={activeSection === "payment"}
                                onClick={() => scrollToSection("payment")}
                            />
                            <SidebarLink
                                label={t.settingsNavSecurity}
                                icon={Shield01}
                                active={activeSection === "security"}
                                onClick={() => scrollToSection("security")}
                            />
                        </nav>
                    </aside>

                    <div className="flex min-w-0 flex-col gap-16 pb-16">
                        <section
                            id="profile"
                            ref={(node) => {
                                sectionRefs.current.profile = node;
                            }}
                            className="scroll-mt-28"
                        >
                            <SectionHeader title={t.settingsNavProfile} />
                            <FormStatus success={profileNotice?.success} error={profileNotice?.error} className="mt-4" />
                            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                                <div className="flex flex-col items-start gap-2">
                                    <Tooltip title={t.settingsChangePhoto} trigger="focus">
                                        <TooltipTrigger
                                            aria-label={t.settingsChangePhoto}
                                            className="group relative rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                            onPress={() => photoInputRef.current?.click()}
                                        >
                                            <AvatarProfilePhoto
                                                size="lg"
                                                src={profile.avatarUrl ?? undefined}
                                                alt={profile.fullName}
                                                initials={profileInitials(profile.fullName)}
                                                verified
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                                                <Camera01 aria-hidden className="size-8 text-white" />
                                            </span>
                                        </TooltipTrigger>
                                    </Tooltip>
                                    <p className="text-xs text-tertiary md:hidden">{t.settingsChangePhotoHint}</p>
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(event) => onPhotoSelected(event.target.files?.[0])}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="line-clamp-2 text-xl font-semibold text-primary">{profile.fullName}</h2>
                                    <p className="mt-1 truncate text-md text-tertiary">{profile.email}</p>
                                </div>
                            </div>

                            <div className="mt-8 rounded-2xl bg-primary p-1 shadow-xs ring-1 ring-secondary">
                                <h3 className="px-5 pt-5 text-md font-semibold text-primary">{t.settingsPersonalDetails}</h3>
                                <dl className="mt-2 divide-y divide-secondary px-5 pb-2">
                                    <DetailRow label={t.fullName} value={profile.fullName} onEdit={() => setDialog({ type: "edit", field: "fullName" })} />
                                    <DetailRow
                                        label={t.settingsDob}
                                        value={formatDob(dob, locale)}
                                        hint={t.settingsDobHint}
                                    />
                                    <DetailRow
                                        label={t.settingsGender}
                                        value={genderLabel(profile.gender, t)}
                                        onEdit={() => setDialog({ type: "edit", field: "gender" })}
                                    />
                                    <DetailRow
                                        label={t.settingsNationality}
                                        value={t.settingsNationalityMalaysian}
                                        hint={t.settingsNationalityHint}
                                    />
                                    <DetailRow
                                        label={t.settingsAddress}
                                        value={profile.address ?? "—"}
                                        onEdit={() => setDialog({ type: "edit", field: "address" })}
                                    />
                                    <DetailRow
                                        label={t.phone}
                                        value={
                                            <span className="inline-flex items-center justify-end gap-2">
                                                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-tertiary ring-1 ring-secondary ring-inset">
                                                    {phoneDisplay.region}
                                                </span>
                                                <span>{phoneDisplay.local}</span>
                                            </span>
                                        }
                                        onEdit={() => setDialog({ type: "edit", field: "phone" })}
                                    />
                                    <DetailRow label={t.email} value={profile.email} onEdit={() => setDialog({ type: "edit", field: "email" })} />
                                </dl>
                            </div>

                            <div className="mt-8 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                                <h3 className="text-md font-semibold text-primary">{t.settingsDeliveryAddresses}</h3>
                                <p className="mt-1 text-sm text-tertiary">{t.settingsDeliveryAddressesHint}</p>

                                <div className="mt-6 flex flex-col gap-3">
                                    {settings.deliveryAddresses.map((address) => (
                                        <DeliveryAddressRow
                                            key={address.id}
                                            t={t}
                                            address={address}
                                            isProfileSynced={isProfileSyncedAddress(address.id)}
                                            isDefault={settings.defaultDeliveryAddressId === address.id}
                                            isEditing={editingAddressId === address.id}
                                            onEdit={() => setEditingAddressId(address.id)}
                                            onCancel={() => setEditingAddressId(null)}
                                            onSave={(payload) => saveDeliveryAddress(address.id, payload)}
                                            onSetDefault={() => setDefaultDeliveryAddress(address.id)}
                                            onRemove={() =>
                                                setDialog({
                                                    type: "remove-address",
                                                    id: address.id,
                                                    label: `${deliveryLabelText(address.label, t)}, ${address.line}`,
                                                })
                                            }
                                        />
                                    ))}

                                    {editingAddressId === "new" ? (
                                        <DeliveryAddressRow
                                            t={t}
                                            isEditing
                                            isNew
                                            onCancel={() => setEditingAddressId(null)}
                                            onSave={(payload) => saveDeliveryAddress("new", payload)}
                                        />
                                    ) : (
                                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setEditingAddressId("new")}>
                                            {t.settingsAddDeliveryAddress}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section
                            id="preference"
                            ref={(node) => {
                                sectionRefs.current.preference = node;
                            }}
                            className="scroll-mt-28"
                        >
                            <SectionHeader title={t.settingsNavPreference} />
                            <div className="mt-6 flex flex-col gap-8">
                                <PreferenceBlock title={t.settingsAppearance}>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            color={theme === "light" ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => setTheme("light")}
                                        >
                                            {t.settingsThemeLight}
                                        </Button>
                                        <Button
                                            color={theme === "dark" ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => setTheme("dark")}
                                        >
                                            {t.settingsThemeDark}
                                        </Button>
                                    </div>
                                </PreferenceBlock>

                                <PreferenceBlock title={t.language}>
                                    <Select
                                        selectedKey={locale}
                                        onSelectionChange={(key) => setLocale(String(key) as "en" | "zh")}
                                        size="sm"
                                        className="w-full max-w-md"
                                        items={[
                                            { id: "en", label: "English" },
                                            { id: "zh", label: "中文" },
                                        ]}
                                    >
                                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                                    </Select>
                                </PreferenceBlock>

                                <PreferenceBlock title={t.settingsNotifications}>
                                    <RadioGroup
                                        value={settings.notificationLevel}
                                        onChange={(value) => setNotificationLevel(value as NotificationLevel)}
                                        className="gap-5"
                                    >
                                        <RadioButton value="all" label={t.settingsNotifAll} hint={t.settingsNotifAllHint} />
                                        <RadioButton value="reminder" label={t.settingsNotifReminder} hint={t.settingsNotifReminderHint} />
                                        <RadioButton value="none" label={t.settingsNotifNone} hint={t.settingsNotifNoneHint} />
                                    </RadioGroup>
                                </PreferenceBlock>
                            </div>
                        </section>

                        <section
                            id="payment"
                            ref={(node) => {
                                sectionRefs.current.payment = node;
                            }}
                            className="scroll-mt-28"
                        >
                            <SectionHeader title={t.settingsNavPayment} description={t.settingsPaymentBody} />
                            <FormStatus success={paymentNotice} className="mt-4" />

                            <div className="mt-6 flex flex-col gap-4">
                                {settings.paymentCards.map((card) => (
                                    <PaymentCardRow
                                        key={card.id}
                                        t={t}
                                        card={card}
                                        isDefault={settings.defaultCardId === card.id}
                                        isEditing={editingCardId === card.id}
                                        onEdit={() => {
                                            setPaymentNotice(null);
                                            setEditingCardId(card.id);
                                        }}
                                        onCancel={() => setEditingCardId(null)}
                                        onSave={(payload) => savePaymentCard(card.id, payload)}
                                        onSetDefault={() => setDefaultCard(card.id)}
                                        onRemove={() => setDialog({ type: "remove-card", id: card.id, label: `${card.brand} ···· ${card.last4}` })}
                                    />
                                ))}

                                {editingCardId === "new" ? (
                                    <PaymentCardRow
                                        t={t}
                                        isEditing
                                        isNew
                                        onCancel={() => setEditingCardId(null)}
                                        onSave={(payload) => savePaymentCard("new", payload)}
                                    />
                                ) : (
                                    <div className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between">
                                        <CreditCard width={180} type="gray-light" company="CarePlus" cardNumber="•••• •••• •••• ••••" cardHolder="YOUR NAME" cardExpiration="MM/YY" />
                                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => {
                                            setPaymentNotice(null);
                                            setEditingCardId("new");
                                        }}>
                                            {t.settingsAddCard}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="security"
                            ref={(node) => {
                                sectionRefs.current.security = node;
                            }}
                            className="scroll-mt-28"
                        >
                            <SectionHeader title={t.settingsNavSecurity} />
                            <div className="mt-6 flex flex-col gap-8">
                                <ChangePasswordForm t={t} />

                                <PreferenceBlock title={t.settingsTwoFactor}>
                                    <Toggle
                                        isSelected={settings.twoFactorEnabled}
                                        onChange={(enabled) => persistSettings({ ...settings, twoFactorEnabled: enabled })}
                                        label={t.settingsTwoFactor}
                                        hint={t.settingsTwoFactorHint}
                                        size="md"
                                    />
                                </PreferenceBlock>

                                <PreferenceBlock title={t.settingsAccountActivity}>
                                    <TableCard.Root className="overflow-hidden">
                                        <Table aria-label={t.settingsAccountActivity}>
                                            <Table.Header>
                                                <Table.Head label={t.settingsActivityDevice} isRowHeader />
                                                <Table.Head label={t.settingsActivityLocation} />
                                                <Table.Head label={t.settingsActivityWhen} />
                                            </Table.Header>
                                            <Table.Body items={activity}>
                                                {(item) => (
                                                    <Table.Row id={item.id}>
                                                        <Table.Cell>
                                                            <span className="font-medium text-primary">{item.device}</span>
                                                            {item.current ? (
                                                                <Badge color="success" size="sm" className="ml-2">
                                                                    {locale === "zh" ? "当前" : "Current"}
                                                                </Badge>
                                                            ) : null}
                                                        </Table.Cell>
                                                        <Table.Cell>{item.location}</Table.Cell>
                                                        <Table.Cell>{item.when}</Table.Cell>
                                                    </Table.Row>
                                                )}
                                            </Table.Body>
                                        </Table>
                                    </TableCard.Root>
                                </PreferenceBlock>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <LandingFooter />

            {dialog?.type === "edit" ? (
                <EditFieldDialog
                    t={t}
                    field={dialog.field}
                    profile={profile}
                    onClose={() => setDialog(null)}
                    onSave={(value) => saveProfileField(dialog.field, value)}
                />
            ) : null}

            {dialog?.type === "remove-address" ? (
                <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && setDialog(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.settingsRemoveAddressTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">{t.settingsRemoveAddressBody.replace("{address}", dialog.label)}</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onClick={() => setDialog(null)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" onClick={() => removeDeliveryAddress(dialog.id)}>
                                    {t.settingsRemoveDeliveryAddress}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}

            {dialog?.type === "remove-card" ? (
                <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && setDialog(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.settingsRemoveCardTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">{t.settingsRemoveCardBody.replace("{card}", dialog.label)}</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onClick={() => setDialog(null)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" onClick={() => removeCard(dialog.id)}>
                                    {t.settingsRemoveCard}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}

            {dialog?.type === "notif-disable" ? (
                <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && setDialog(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.settingsNotifDisableTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">{t.settingsNotifDisableBody}</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onClick={() => setDialog(null)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" onClick={confirmDisableNotifications}>
                                    {t.settingsNotifNone}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </div>
    );
};

const SidebarLink = ({
    label,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    icon: typeof User01;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={cx(
            "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center text-xs font-medium transition duration-100 md:w-auto md:shrink-0 md:flex-row md:justify-start md:gap-2 md:px-3 md:text-left md:text-sm",
            active ? "bg-secondary text-primary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
        )}
    >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span className="max-w-full leading-tight md:whitespace-nowrap">{label}</span>
    </button>
);

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-tertiary">{description}</p> : null}
    </div>
);

const PreferenceBlock = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
        <h3 className="text-md font-semibold text-primary">{title}</h3>
        <div className="mt-4">{children}</div>
    </div>
);

const DetailRow = ({
    label,
    value,
    hint,
    onEdit,
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    onEdit?: () => void;
}) => (
    <div className="flex items-start justify-between gap-4 py-4">
        <dt className="w-36 shrink-0 text-sm font-medium text-tertiary">{label}</dt>
        <dd className="flex min-w-0 flex-1 items-start justify-end gap-2 text-right text-sm font-medium text-primary">
            <span className="min-w-0 max-w-md break-words">
                {typeof value === "string" ? <span className="line-clamp-3">{value}</span> : value}
                {hint ? <span className="mt-1 block text-xs font-normal text-tertiary">{hint}</span> : null}
            </span>
            {onEdit ? <ButtonUtility color="tertiary" size="sm" icon={Edit01} tooltip={label} aria-label={label} onClick={onEdit} /> : null}
        </dd>
    </div>
);

const FormDialog = ({ title, error, onClose, children }: { title: string; error?: string | null; onClose: () => void; children: ReactNode }) => (
    <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
        <Modal className="w-full max-w-xl">
            <Dialog className="flex max-h-[85vh] w-full flex-col items-stretch overflow-y-auto rounded-2xl bg-primary p-6 shadow-xl outline-hidden ring-1 ring-secondary">
                <Heading slot="title" className="text-lg font-semibold text-primary">
                    {title}
                </Heading>
                <Form className="mt-4 flex w-full flex-col gap-4">
                    <FormStatus error={error} />
                    {children}
                </Form>
            </Dialog>
        </Modal>
    </ModalOverlay>
);

const EditFieldDialog = ({
    t,
    field,
    profile,
    onClose,
    onSave,
}: {
    t: Copy;
    field: EditField;
    profile: Profile;
    onClose: () => void;
    onSave: (value: string) => string | null | void;
}) => {
    const labels: Record<EditField, string> = {
        fullName: t.fullName,
        gender: t.settingsGender,
        address: t.settingsAddress,
        phone: t.phone,
        email: t.email,
    };

    const defaults: Record<EditField, string> = {
        fullName: profile.fullName,
        gender: profile.gender ?? "male",
        address: profile.address ?? "",
        phone: parsePhoneLocal(profile.phone),
        email: profile.email,
    };

    const [value, setValue] = useState(defaults[field]);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [sentCode, setSentCode] = useState<{ email: string; code: string } | null>(null);
    const [emailCode, setEmailCode] = useState("");

    const limits: Partial<Record<EditField, number>> = {
        fullName: 80,
        address: 200,
        phone: 10,
        email: 254,
    };

    const submit = () => {
        if (field === "gender") {
            const message = onSave(value);
            if (typeof message === "string") {
                setFieldError(message);
            }
            return;
        }
        const validated = validateProfileField(field, value, t);
        if (!validated.ok) {
            setFieldError(validated.message);
            return;
        }
        if (field === "email" && validated.value !== profile.email.trim().toLowerCase()) {
            if (!sentCode || sentCode.email !== validated.value) {
                setFieldError(t.settingsEmailCodeRequired);
                return;
            }
            if (emailCode.trim() !== sentCode.code) {
                setFieldError(t.settingsEmailCodeMismatch);
                return;
            }
        }
        const message = onSave(validated.value);
        if (typeof message === "string") {
            setFieldError(message);
        }
    };

    return (
        <FormDialog title={labels[field]} error={fieldError} onClose={onClose}>
            {field === "gender" ? (
                <Select selectedKey={value} onSelectionChange={(key) => setValue(String(key))} size="md" className="w-full" items={[
                    { id: "male", label: t.settingsGenderMale },
                    { id: "female", label: t.settingsGenderFemale },
                    { id: "other", label: t.settingsGenderOther },
                ]}>
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                </Select>
            ) : field === "phone" ? (
                <InputGroup size="md" label={t.phone} value={value} onChange={setValue} isRequired className="w-full" leadingAddon={<InputPrefix>+60</InputPrefix>}>
                    <InputBase placeholder={t.phonePlaceholder} inputMode="numeric" maxLength={11} />
                </InputGroup>
            ) : field === "address" ? (
                <AddressLocator
                    t={t}
                    label={labels.address}
                    value={value}
                    maxLength={limits.address}
                    onChange={(next) => {
                        setValue(next);
                        setFieldError(null);
                    }}
                />
            ) : field === "email" ? (
                <>
                    <Input
                        label={labels.email}
                        size="md"
                        className="w-full"
                        value={value}
                        onChange={(next) => {
                            setValue(next);
                            setFieldError(null);
                        }}
                        isInvalid={!!fieldError}
                        isRequired
                        maxLength={limits.email}
                        type="email"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            color="secondary"
                            size="sm"
                            onClick={() => {
                                const validated = validateProfileField("email", value, t);
                                if (!validated.ok) {
                                    setFieldError(validated.message);
                                    return;
                                }
                                if (validated.value === profile.email.trim().toLowerCase()) {
                                    setFieldError(t.settingsEmailSame);
                                    setSentCode(null);
                                    return;
                                }
                                const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
                                setSentCode({ email: validated.value, code });
                                setEmailCode("");
                                setFieldError(null);
                            }}
                        >
                            {t.settingsSendCode}
                        </Button>
                    </div>
                    {sentCode ? (
                        <>
                            <FormStatus success={t.settingsCodeSent.replace("{email}", sentCode.email).replace("{code}", sentCode.code)} />
                            <Input
                                label={t.settingsEmailCode}
                                size="md"
                                className="w-full"
                                value={emailCode}
                                onChange={(next) => setEmailCode(next.replace(/\D/g, "").slice(0, 6))}
                                isRequired
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                            />
                        </>
                    ) : null}
                </>
            ) : (
                <Input
                    label={labels[field]}
                    size="md"
                    className="w-full"
                    value={value}
                    onChange={(next) => {
                        setValue(next);
                        setFieldError(null);
                    }}
                    isInvalid={!!fieldError}
                    isRequired
                    maxLength={limits[field]}
                />
            )}
            <div className="flex justify-end gap-3 pt-2">
                <Button color="secondary" onClick={onClose}>
                    {t.notifCancel}
                </Button>
                <Button color="primary" isDisabled={!value.trim()} onClick={submit}>
                    {t.settingsSave}
                </Button>
            </div>
        </FormDialog>
    );
};

const ChangePasswordForm = ({ t }: { t: Copy }) => {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [fieldSuccess, setFieldSuccess] = useState<string | null>(null);

    return (
        <PreferenceBlock title={t.settingsChangePassword}>
            <Form
                className="max-w-3xl"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!current.trim()) {
                        setFieldSuccess(null);
                        setFieldError(t.authFailed);
                        return;
                    }
                    const nextValid = validatePassword(next, t);
                    if (!nextValid.ok) {
                        setFieldSuccess(null);
                        setFieldError(nextValid.message);
                        return;
                    }
                    if (next !== confirm) {
                        setFieldSuccess(null);
                        setFieldError(t.settingsPasswordMismatch);
                        return;
                    }
                    setCurrent("");
                    setNext("");
                    setConfirm("");
                    setFieldError(null);
                    setFieldSuccess(t.settingsPasswordChanged);
                }}
            >
                <FormStatus error={fieldError} success={fieldSuccess} className="mb-4" />
                <div className="grid w-full max-w-2xl gap-4">
                    <Input type="password" label={t.settingsCurrentPassword} size="md" value={current} onChange={setCurrent} isRequired maxLength={72} className="w-full" />
                    <Input type="password" label={t.settingsNewPassword} size="md" value={next} onChange={setNext} isRequired maxLength={72} hint={t.passwordHint} className="w-full" />
                    <Input type="password" label={t.confirmPassword} size="md" value={confirm} onChange={setConfirm} isRequired maxLength={72} className="w-full" />
                    <div>
                        <Button type="submit" color="primary" size="sm">
                            {t.settingsSave}
                        </Button>
                    </div>
                </div>
            </Form>
        </PreferenceBlock>
    );
};

const PaymentCardRow = ({
    t,
    card,
    isDefault,
    isEditing,
    isNew,
    onEdit,
    onCancel,
    onSave,
    onSetDefault,
    onRemove,
}: {
    t: Copy;
    card?: PaymentCard;
    isDefault?: boolean;
    isEditing?: boolean;
    isNew?: boolean;
    onEdit?: () => void;
    onCancel: () => void;
    onSave: (payload: { number: string; expiry: string; holderName: string; cvv: string }) => string | null;
    onSetDefault?: () => void;
    onRemove?: () => void;
}) => {
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState(card?.expiry ?? "");
    const [holderName, setHolderName] = useState(card?.holderName ?? "");
    const [cvv, setCvv] = useState("");
    const [cvvFocused, setCvvFocused] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const cvvFieldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = cvvFieldRef.current;
        if (!node || !isEditing) return;
        const showBack = () => setCvvFocused(true);
        const showFront = (event: FocusEvent) => {
            const next = event.relatedTarget;
            if (next instanceof Node && node.contains(next)) return;
            setCvvFocused(false);
        };
        node.addEventListener("focusin", showBack);
        node.addEventListener("focusout", showFront);
        return () => {
            node.removeEventListener("focusin", showBack);
            node.removeEventListener("focusout", showFront);
        };
    }, [isEditing]);

    const digits = number.replace(/\D/g, "");
    const previewBrand = digits ? cardBrandFromDigits(digits) : (card?.brand ?? "CarePlus");
    const previewNumber = digits ? previewCardNumber(digits) : card ? `•••• •••• •••• ${card.last4}` : previewCardNumber("");
    const previewHolder = (holderName.trim() || card?.holderName || "YOUR NAME").slice(0, CARD_HOLDER_MAX);
    const previewExpiry = expiry.trim() || card?.expiry || "MM/YY";

    return (
        <div className="rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <CreditCard
                    width={200}
                    type={isDefault ? "brand-dark" : "gray-dark"}
                    company={isEditing ? previewBrand : (card?.brand ?? "CarePlus")}
                    cardNumber={isEditing ? previewNumber : card ? `•••• •••• •••• ${card.last4}` : "•••• •••• •••• ••••"}
                    cardHolder={isEditing ? previewHolder : (card?.holderName ?? "YOUR NAME")}
                    cardExpiration={isEditing ? previewExpiry : (card?.expiry ?? "MM/YY")}
                    flipped={isEditing ? cvvFocused : undefined}
                    cvv={cvv}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {!isEditing && card ? (
                        <>
                            <div>
                                <p className="font-medium text-primary">
                                    {card.brand} ·••• {card.last4}
                                </p>
                                <p className="text-sm text-tertiary">
                                    {card.holderName} · {card.expiry}
                                </p>
                                {isDefault ? (
                                    <Badge color="brand" size="sm" className="mt-2">
                                        {t.settingsDefaultCard}
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button color="secondary" size="sm" iconLeading={Edit01} onClick={onEdit}>
                                    {t.settingsEdit}
                                </Button>
                                {!isDefault && onSetDefault ? (
                                    <Button color="secondary" size="sm" iconLeading={Check} onClick={onSetDefault}>
                                        {t.settingsSetDefault}
                                    </Button>
                                ) : null}
                                {onRemove ? (
                                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={onRemove}>
                                        {t.settingsRemoveCard}
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    ) : isEditing ? (
                        <Form
                            className="grid w-full max-w-2xl gap-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const numberValid = validateCardNumber(number, t);
                                const expiryValid = validateCardExpiry(expiry, t);
                                const holderValid = validateCardHolder(holderName, t);
                                const cvvValid = validateCvv(cvv, t);
                                if (!numberValid.ok) {
                                    setFieldError(numberValid.message);
                                    return;
                                }
                                if (!expiryValid.ok) {
                                    setFieldError(expiryValid.message);
                                    return;
                                }
                                if (!holderValid.ok) {
                                    setFieldError(holderValid.message);
                                    return;
                                }
                                if (!cvvValid.ok) {
                                    setFieldError(cvvValid.message);
                                    return;
                                }
                                setFieldError(null);
                                const message = onSave({
                                    number: numberValid.value,
                                    expiry: expiryValid.value,
                                    holderName: holderValid.value,
                                    cvv: cvvValid.value,
                                });
                                if (message) {
                                    setFieldError(message);
                                }
                            }}
                        >
                            <FormStatus error={fieldError} className="sm:col-span-2" />
                            <PaymentInput label={t.settingsCardNumber} size="md" value={number} onChange={setNumber} isRequired className="w-full sm:col-span-2" />
                            <Input label={t.settingsCardExpiry} placeholder="MM/YY" size="md" value={expiry} onChange={(value) => setExpiry(formatCardExpiryInput(value))} isRequired maxLength={5} className="w-full" />
                            <div ref={cvvFieldRef} className="w-full">
                                <Input label={t.settingsCardCvv} placeholder="123" size="md" value={cvv} onChange={setCvv} isRequired maxLength={4} inputMode="numeric" type="password" autoComplete="off" className="w-full" />
                            </div>
                            <Input label={t.settingsCardHolder} size="md" value={holderName} onChange={setHolderName} isRequired maxLength={CARD_HOLDER_MAX} className="w-full sm:col-span-2" />
                            <div className="flex flex-wrap gap-2 sm:col-span-2">
                                <Button type="submit" color="primary" size="sm">
                                    {isNew ? t.settingsAddCard : t.settingsSave}
                                </Button>
                                <Button color="secondary" size="sm" onClick={onCancel}>
                                    {t.notifCancel}
                                </Button>
                            </div>
                        </Form>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const DeliveryAddressRow = ({
    t,
    address,
    isProfileSynced,
    isDefault,
    isEditing,
    isNew,
    onEdit,
    onCancel,
    onSave,
    onSetDefault,
    onRemove,
}: {
    t: Copy;
    address?: DeliveryAddress;
    isProfileSynced?: boolean;
    isDefault?: boolean;
    isEditing?: boolean;
    isNew?: boolean;
    onEdit?: () => void;
    onCancel: () => void;
    onSave: (payload: { label: string; unit: string; line: string }) => string | null;
    onSetDefault?: () => void;
    onRemove?: () => void;
}) => {
    const split = splitDeliveryLine(address?.line ?? "");
    const [label, setLabel] = useState(address && isDeliveryLabelId(address.label) ? address.label : "home");
    const [unit, setUnit] = useState(split.unit);
    const [line, setLine] = useState(split.street);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const labelItems = [
        { id: "home", label: t.settingsLabelHome },
        { id: "office", label: t.settingsLabelOffice },
        { id: "other", label: t.settingsLabelOther },
    ];

    const region = detectMalaysiaRegion(unit.trim() ? `${unit.trim()}, ${line}` : line || address?.line || "");
    const regionLabel = region === "east" ? t.medCartEastMalaysia : t.medCartWestMalaysia;

    return (
        <div className="rounded-xl bg-secondary_alt p-4 ring-1 ring-secondary">
            {!isEditing && address ? (
                <>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-medium text-primary">{deliveryLabelText(address.label, t)}</p>
                            <p className="mt-1 text-sm text-tertiary">{address.line}</p>
                            <p className="mt-1 text-xs text-tertiary">
                                {address.region === "east" ? t.medCartEastMalaysia : t.medCartWestMalaysia}
                            </p>
                            {isProfileSynced ? (
                                <p className="mt-2 text-xs text-tertiary">{t.settingsProfileAddressSyncedHint}</p>
                            ) : null}
                            {isDefault ? (
                                <Badge color="brand" size="sm" className="mt-2">
                                    {t.settingsDefaultDeliveryAddress}
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                    {!isProfileSynced ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button color="secondary" size="sm" iconLeading={Edit01} onClick={onEdit}>
                                {t.settingsEdit}
                            </Button>
                            {!isDefault && onSetDefault ? (
                                <Button color="secondary" size="sm" iconLeading={Check} onClick={onSetDefault}>
                                    {t.settingsSetDefault}
                                </Button>
                            ) : null}
                            {onRemove ? (
                                <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={onRemove}>
                                    {t.settingsRemoveDeliveryAddress}
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </>
            ) : isEditing ? (
                <Form
                    className="flex w-full max-w-2xl flex-col gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const message = onSave({ label, unit, line });
                        if (message) {
                            setFieldError(message);
                        }
                    }}
                >
                    <FormStatus error={fieldError} />
                    <Select
                        label={t.settingsDeliveryLabel}
                        placeholder={t.settingsDeliveryLabelPlaceholder}
                        size="md"
                        selectedKey={label}
                        onSelectionChange={(key) => {
                            const next = String(key);
                            if (isDeliveryLabelId(next)) setLabel(next);
                        }}
                        isRequired
                        className="w-full"
                        items={labelItems}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    <Input
                        label={t.settingsDeliveryUnit}
                        placeholder={t.settingsDeliveryUnitPlaceholder}
                        size="md"
                        value={unit}
                        onChange={(next) => {
                            setUnit(next);
                            setFieldError(null);
                        }}
                        isRequired
                        maxLength={30}
                        className="w-full"
                    />
                    <AddressLocator
                        t={t}
                        label={t.settingsAddress}
                        value={line}
                        maxLength={168}
                        onChange={(next) => {
                            setLine(next);
                            setFieldError(null);
                        }}
                    />
                    <p className="text-sm text-tertiary">
                        {t.settingsDeliveryRegion}: {regionLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" color="primary" size="sm">
                            {isNew ? t.settingsAddDeliveryAddress : t.settingsSave}
                        </Button>
                        <Button color="secondary" size="sm" onClick={onCancel}>
                            {t.notifCancel}
                        </Button>
                    </div>
                </Form>
            ) : null}
        </div>
    );
};
