import { useEffect, useMemo, useState } from "react";
import { getLocalTimeZone, today, type DateValue } from "@internationalized/date";
import { CheckCircle } from "@untitledui/icons";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { DatePicker } from "@/components/application/date-picker/date-picker";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ProgressSteps } from "@/components/application/progress-steps/progress-steps";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy } from "@/providers/locale-provider";
import { familyApi, type FamilyMember } from "@/services/familyApi";
import {
    appointmentApi,
    type Appointment,
    type AvailableDoctorRecord,
    type BookingCatalog,
    type BookingSlots,
    type TimeSlot,
} from "@/services/appointmentApi";
import { cx } from "@/utils/cx";

const ANY_DOCTOR = "any";

const relationLabel = (t: Copy, relation: string) => {
    if (relation === "parent") return t.familyRelationParent;
    if (relation === "child") return t.familyRelationChild;
    if (relation === "spouse") return t.familyRelationSpouse;
    if (relation === "other") return t.familyRelationOther;
    return relation;
};

type FamilyBookingRestriction = "underage" | "age-unavailable" | "child-self-only" | null;

const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;

    const birth = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const birthdayHasPassed =
        now.getMonth() > birth.getMonth()
        || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!birthdayHasPassed) age--;
    return age >= 0 ? age : null;
};

export const BookingPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const presetDoctor = searchParams.get("doctor");
    const [step, setStep] = useState(0);
    const [catalog, setCatalog] = useState<BookingCatalog | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [familyId, setFamilyId] = useState("");
    const [familyLoading, setFamilyLoading] = useState(false);
    const [familyBookingRestriction, setFamilyBookingRestriction] = useState<FamilyBookingRestriction>(null);
    const [doctorId, setDoctorId] = useState(() => presetDoctor || ANY_DOCTOR);
    const [date, setDate] = useState<DateValue>(today(getLocalTimeZone()));
    const [shift, setShift] = useState<"morning" | "night">("morning");
    const [slot, setSlot] = useState<TimeSlot | null>(null);
    const [slots, setSlots] = useState<BookingSlots | null>(null);
    const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctorRecord[]>([]);
    const [availableDoctorsLoading, setAvailableDoctorsLoading] = useState(false);
    const [visitType, setVisitType] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [booked, setBooked] = useState<Appointment | null>(null);

    useEffect(() => {
        if (!profile) {
            return;
        }

        let active = true;
        const ownMember: FamilyMember = {
            id: profile.id,
            familyMemberId: 0,
            name: profile.fullName,
            email: profile.email,
            relation: "parent",
            permission: "parent",
            status: "active",
            isOwner: true,
        };
        setFamilyMembers([ownMember]);
        setFamilyId(profile.id);
        setFamilyLoading(true);
        setLoading(true);
        appointmentApi
            .catalog()
            .then((next) => {
                if (!active) return;
                setCatalog(next);
                if (presetDoctor && next.doctors.some((doctor) => doctor.id === presetDoctor)) setDoctorId(presetDoctor);
            })
            .catch((cause) => active && setError(cause instanceof Error ? cause.message : t.authFailed))
            .finally(() => active && setLoading(false));

        familyApi
            .overview()
            .then((overview) => {
                if (!active) return;
                const members = overview.family?.members.filter((member) => member.status === "active") ?? [];
                if (members.length > 0) {
                    setFamilyMembers(members);
                    const currentMember = members.find((member) => member.id === overview.currentPatientId);
                    if (currentMember?.relation === "child") {
                        const age = calculateAge(profile.dateOfBirth);
                        setFamilyBookingRestriction(age === null ? "age-unavailable" : age < 12 ? "underage" : "child-self-only");
                    } else {
                        setFamilyBookingRestriction(null);
                    }
                } else {
                    setFamilyBookingRestriction(null);
                }
            })
            .catch(() => active && setFamilyBookingRestriction(null))
            .finally(() => active && setFamilyLoading(false));

        return () => {
            active = false;
        };
    }, [profile, presetDoctor, t.authFailed]);

    useEffect(() => {
        if (!profile || step !== 1) {
            return;
        }

        let active = true;
        setLoading(true);
        appointmentApi
            .slots(date.toString(), doctorId)
            .then((next) => {
                if (!active) return;
                setSlots(next);
                setSlot((current) => {
                    const all = [...next.morning, ...next.night];
                    const stillOpen = current && all.some((item) => item.startAt === current.startAt && !item.booked);
                    if (current && !stillOpen) {
                        setError(t.bookSlotTaken);
                        return null;
                    }
                    return current;
                });
            })
            .catch((cause) => {
                if (!active) return;
                setError(cause instanceof Error ? cause.message : t.authFailed);
                setSlots(null);
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [date, doctorId, profile, step, t.authFailed, t.bookSlotTaken]);

    useEffect(() => {
        if (!profile || step !== 2 || !slot) {
            return;
        }

        let active = true;
        setAvailableDoctorsLoading(true);
        setError(null);
        appointmentApi
            .retrieveAvailableDoctors(slot.startAt.slice(0, 10), slot.startAt.slice(11, 16))
            .then((next) => {
                if (!active) return;
                setAvailableDoctors(next);
                if (next.length === 0) {
                    setDoctorId(ANY_DOCTOR);
                    setSlot(null);
                    setStep(1);
                    setError(t.bookSlotTaken);
                    return;
                }
                setDoctorId((current) => (current === ANY_DOCTOR || next.some((item) => item.id === current) ? current : ANY_DOCTOR));
            })
            .catch((cause) => {
                if (!active) return;
                setAvailableDoctors([]);
                setError(cause instanceof Error ? cause.message : t.authFailed);
            })
            .finally(() => active && setAvailableDoctorsLoading(false));

        return () => {
            active = false;
        };
    }, [profile, slot?.startAt, step, t.authFailed, t.bookSlotTaken]);

    const selectedFamilyMember = familyMembers.find((member) => member.id === familyId);
    const family = selectedFamilyMember
        ? { ...selectedFamilyMember, isYou: selectedFamilyMember.id === profile?.id }
        : undefined;
    const doctor =
        doctorId === ANY_DOCTOR
            ? null
            : availableDoctors.find((item) => item.id === doctorId) ?? catalog?.doctors.find((item) => item.id === doctorId);
    const openSlots = slots ? (shift === "morning" ? slots.morning : slots.night).filter((item) => !item.booked) : [];
    const openCount = openSlots.length;

    const steps = useMemo(
        () => [
            { title: t.bookStepFamily, description: t.bookStepFamilyHint },
            { title: t.bookStepWhen, description: t.bookStepWhenHint },
            { title: t.bookStepDoctor, description: t.bookStepDoctorHint },
            { title: t.bookStepType, description: t.bookStepTypeHint },
            { title: t.bookStepSummary, description: t.bookStepSummaryHint },
        ],
        [t],
    );

    const typeLabel = (id: string) => {
        if (id === "VT01") return t.visitGeneral;
        if (id === "VT02") return t.visitScreening;
        if (id === "VT03") return t.visitMental;
        return id;
    };

    const formatWhen = (iso: string) =>
        new Date(iso).toLocaleString(locale === "zh" ? "zh-MY" : "en-MY", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const canContinue =
        step === 0
            ? Boolean(familyId) && !familyLoading && familyBookingRestriction !== "underage" && familyBookingRestriction !== "age-unavailable"
            : step === 1
              ? Boolean(slot)
              : step === 2
                ? Boolean(slot)
                  && availableDoctors.length > 0
                  && !availableDoctorsLoading
                  && (doctorId === ANY_DOCTOR || availableDoctors.some((item) => item.id === doctorId))
                : step === 3
                  ? Boolean(visitType)
                  : Boolean(family && slot && visitType);

    const isSlotConflict = (message: string) =>
        message.toLowerCase().includes("slot") || message.toLowerCase().includes("booked") || message.toLowerCase().includes("free");

    const bookingRuleMessage = (message: string) => {
        if (message === "booking-closed") return t.visitsBookingBlocked;
        if (message === "upcoming-limit") return t.visitsUpcomingLimit;
        if (message === "same-day-session-limit") return t.visitsSameDaySessionLimit;
        if (message === "child-underage-booking") return t.bookChildUnderage;
        if (message === "child-self-only") return t.bookChildSelfOnly;
        if (message === "age-verification-required") return t.bookAgeUnavailable;
        return isSlotConflict(message) ? t.bookSlotTaken : message;
    };

    const resetDoctorSelection = () => {
        setDoctorId(ANY_DOCTOR);
        setAvailableDoctors([]);
        setAvailableDoctorsLoading(false);
    };

    const selectStep = (nextStep: number) => {
        if (step >= 2 && nextStep <= 1) {
            resetDoctorSelection();
        }
        setError(null);
        setStep(nextStep);
    };

    const goBack = () => {
        if (step === 2) {
            resetDoctorSelection();
        }
        setError(null);
        setStep((current) => Math.max(0, current - 1));
    };

    const selectDate = (next: DateValue | null) => {
        if (!next) return;
        setDate(next);
        setSlot(null);
        setSlots(null);
        setAvailableDoctors([]);
        setError(null);
    };

    const selectShift = (next: "morning" | "night") => {
        if (next === shift) return;
        setShift(next);
        setSlot(null);
        setAvailableDoctors([]);
        setError(null);
    };

    const selectSlot = (next: TimeSlot) => {
        setSlot(next);
        setAvailableDoctors([]);
        setError(null);
    };

    const goNext = async () => {
        if (step !== 1) {
            setError(null);
            setStep((current) => current + 1);
            return;
        }

        if (!slot) {
            return;
        }

        setLoading(true);
        try {
            const next = await appointmentApi.slots(date.toString(), doctorId);
            setSlots(next);
            const all = [...next.morning, ...next.night];
            const selected = all.find((item) => item.startAt === slot.startAt);
            if (!selected || selected.booked) {
                setSlot(null);
                setError(t.bookSlotTaken);
                return;
            }
            setError(null);
            setStep(2);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t.authFailed);
        } finally {
            setLoading(false);
        }
    };

    const confirm = async () => {
        if (!profile || !family || !slot || !visitType) {
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const result = await appointmentApi.book({
                doctorId,
                startAt: slot.startAt,
                type: visitType,
                patientId: family.id,
                forName: family.name,
                notes: notes.trim() || undefined,
            });
            setBooked(result);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : t.authFailed;
            if (isSlotConflict(message)) {
                setStep(1);
                setSlot(null);
            }
            setError(bookingRuleMessage(message));
        } finally {
            setSaving(false);
        }
    };

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] pb-24 md:pt-22 lg:pb-0">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.bookTitle}</h1>
                <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.bookBody}</p>
                <p className="mt-4 max-w-3xl rounded-xl bg-secondary px-4 py-3 text-sm text-tertiary ring-1 ring-secondary">{t.bookLimitNote}</p>
                {catalog?.bookingClosed ? (
                    <p role="status" className="mt-4 rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">
                        {t.visitsBookingBlocked}
                    </p>
                ) : null}

                <div className="mt-6 rounded-2xl bg-primary px-3 py-4 ring-1 ring-secondary sm:px-4 md:mt-8 md:px-6 md:py-5">
                    <ProgressSteps steps={steps} current={step} onSelect={selectStep} />
                </div>

                <div className="mt-4 grid items-start gap-4 md:mt-6 md:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="min-w-0 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary sm:p-5 md:p-8">
                        {step === 0 ? (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-semibold text-primary">{t.bookWhoTitle}</h2>
                                <p className="text-sm text-tertiary">{t.bookWhoHint}</p>
                                {familyBookingRestriction === "underage" ? <p role="status" className="rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">{t.bookChildUnderage}</p> : null}
                                {familyBookingRestriction === "age-unavailable" ? <p role="status" className="rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">{t.bookAgeUnavailable}</p> : null}
                                {familyBookingRestriction === "child-self-only" ? <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-sm text-tertiary">{t.bookChildSelfOnly}</p> : null}
                                <Select
                                    label={t.bookFamilyLabel}
                                    selectedKey={familyId}
                                    onSelectionChange={(key) => setFamilyId(String(key))}
                                    isDisabled={familyLoading || familyBookingRestriction === "underage" || familyBookingRestriction === "age-unavailable"}
                                    items={familyMembers.filter((item) => familyBookingRestriction !== "child-self-only" || item.id === profile?.id).map((item) => ({
                                        id: item.id,
                                        label: item.name,
                                        supportingText: item.id === profile?.id ? t.bookPrimaryContact : relationLabel(t, item.relation),
                                    }))}
                                >
                                    {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                                </Select>
                                {family?.isYou ? (
                                    <div className="flex gap-2">
                                        <Badge color="brand" size="sm">
                                            {t.bookYou}
                                        </Badge>
                                        <Badge color="gray" size="sm">
                                            {t.bookPrimaryContact}
                                        </Badge>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-semibold text-primary">{t.bookDoctorTitle}</h2>
                                <p className="text-sm text-tertiary">{t.bookDoctorHint}</p>
                                {availableDoctorsLoading ? <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-tertiary">{t.bookLoadingDoctors}</p> : null}
                                {!availableDoctorsLoading && availableDoctors.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        <DoctorChoice
                                            selected={doctorId === ANY_DOCTOR}
                                            title={t.bookAnyDoctor}
                                            subtitle={t.bookAnyDoctorHint}
                                            onSelect={() => {
                                                setError(null);
                                                setDoctorId(ANY_DOCTOR);
                                            }}
                                        />
                                        {availableDoctors.map((item) => (
                                            <DoctorChoice
                                                key={item.id}
                                                selected={doctorId === item.id}
                                                title={item.name}
                                                subtitle={`${item.specialty} · ${item.bio}`}
                                                onSelect={() => {
                                                    setError(null);
                                                    setDoctorId(item.id);
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                                {!availableDoctorsLoading && availableDoctors.length === 0 && !error ? (
                                    <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-tertiary">{t.bookNoDoctors}</p>
                                ) : null}
                            </div>
                        ) : null}

                        {step === 1 ? (
                            <div className="flex flex-col gap-5 sm:gap-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold text-primary">{t.bookWhenTitle}</h2>
                                        <p className="mt-1 text-sm text-tertiary">{doctor ? t.bookWhenDoctor.replace("{name}", doctor.name) : t.bookWhenAny}</p>
                                    </div>
                                    <div className="w-full sm:w-auto sm:shrink-0">
                                        <DatePicker aria-label={t.bookPickDate} value={date} minValue={today(getLocalTimeZone())} onChange={selectDate} />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <ShiftCard
                                        active={shift === "morning"}
                                        title={t.bookMorning}
                                        range={t.bookMorningRange}
                                        countLabel={t.bookTimesCount.replace("{count}", String(slots?.morning.filter((item) => !item.booked).length ?? 0))}
                                        onSelect={() => selectShift("morning")}
                                    />
                                    <ShiftCard
                                        active={shift === "night"}
                                        title={t.bookNight}
                                        range={t.bookNightRange}
                                        countLabel={t.bookTimesCount.replace("{count}", String(slots?.night.filter((item) => !item.booked).length ?? 0))}
                                        onSelect={() => selectShift("night")}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                                    {openSlots.map((item) => (
                                        <button
                                            key={item.startAt}
                                            type="button"
                                            onClick={() => selectSlot(item)}
                                            className={cx(
                                                "min-h-11 rounded-xl px-2 py-2.5 text-sm font-semibold ring-1 transition sm:px-3 sm:py-3",
                                                slot?.startAt === item.startAt && "bg-primary text-brand-secondary ring-2 ring-brand-solid dark:bg-white/15 dark:ring-brand-300",
                                                slot?.startAt !== item.startAt && "bg-primary text-primary ring-secondary hover:ring-brand dark:bg-white/12 dark:ring-white/40",
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-tertiary">{t.bookSlotsOpen.replace("{count}", String(openCount))}</p>
                                <FormStatus error={error} />
                            </div>
                        ) : null}

                        {step === 3 ? (
                            <div className="flex flex-col gap-6">
                                <h2 className="text-lg font-semibold text-primary">{t.bookTypeTitle}</h2>
                                <RadioGroup value={visitType} onChange={setVisitType} size="md" className="gap-3" aria-label={t.bookTypeTitle}>
                                    {(catalog?.types ?? []).map((item) => (
                                        <div key={item.id} className={cx("rounded-xl px-4 py-3 ring-1", visitType === item.id ? "bg-primary ring-2 ring-brand-solid" : "bg-secondary ring-secondary")}>
                                            <RadioButton value={item.id} label={typeLabel(item.id)} hint={item.id === "VT01" ? t.visitGeneralHint : item.id === "VT03" ? t.visitMentalHint : t.visitScreeningHint} size="md" />
                                        </div>
                                    ))}
                                </RadioGroup>
                                <TextArea label={t.bookNotes} hint={t.bookNotesHint} value={notes} onChange={setNotes} rows={4} maxLength={500} />
                            </div>
                        ) : null}

                        {step === 4 ? (
                            <div className="flex flex-col gap-5">
                                <h2 className="text-lg font-semibold text-primary">{t.bookSummaryTitle}</h2>
                                <dl className="divide-y divide-secondary">
                                    <SummaryRow label={t.bookWhoTitle} value={family?.name ?? "—"} />
                                    <SummaryRow label={t.bookStepWhen} value={slot ? formatWhen(slot.startAt) : "—"} />
                                    <SummaryRow label={t.bookStepDoctor} value={doctor?.name ?? t.bookAnyDoctor} />
                                    <SummaryRow label={t.bookStepType} value={visitType ? typeLabel(visitType) : "—"} />
                                    <SummaryRow label={t.bookNotes} value={notes.trim() || t.bookNoNotes} />
                                </dl>
                            </div>
                        ) : null}

                        {step !== 1 ? <FormStatus error={error} /> : null}
                    </section>

                    <aside className="hidden min-w-0 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary sm:p-5 lg:sticky lg:top-28 lg:block lg:p-5">
                        <h2 className="text-md font-semibold text-primary">{t.bookSidebarTitle}</h2>
                        <dl className="mt-4 flex flex-col gap-3 text-sm">
                            <SummaryRow label={t.bookStepFamily} value={family?.name ?? "—"} compact />
                            <SummaryRow label={t.bookStepWhen} value={slot ? formatWhen(slot.startAt) : t.bookNotPicked} compact />
                            <SummaryRow label={t.bookStepDoctor} value={doctor?.name ?? t.bookAnyDoctor} compact />
                            <SummaryRow label={t.bookStepType} value={visitType ? typeLabel(visitType) : t.bookNotPicked} compact />
                        </dl>
                        <div className="mt-6 hidden flex-col gap-3 lg:flex">
                            {step > 0 ? (
                                <Button color="secondary" size="lg" onClick={goBack}>
                                    {t.bookBack}
                                </Button>
                            ) : null}
                            {step < 4 ? (
                                <Button color="primary" size="lg" isDisabled={!canContinue || loading} onClick={() => void goNext()}>
                                    {t.bookContinue}
                                </Button>
                            ) : (
                                <Button color="primary" size="lg" isDisabled={!canContinue || saving || catalog?.bookingClosed} onClick={() => void confirm()}>
                                    {saving ? t.bookSaving : t.bookConfirm}
                                </Button>
                            )}
                        </div>
                    </aside>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-secondary bg-primary/95 px-4 py-3 shadow-lg backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
                    <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <SummaryRow label={t.bookStepFamily} value={family?.name ?? "—"} compact mobile />
                        <SummaryRow label={t.bookStepWhen} value={slot ? formatWhen(slot.startAt) : t.bookNotPicked} compact mobile />
                    </dl>
                    <div className="flex gap-2">
                        {step > 0 ? (
                            <Button color="secondary" size="md" className="flex-1" onClick={goBack}>
                                {t.bookBack}
                            </Button>
                        ) : null}
                        {step < 4 ? (
                            <Button color="primary" size="md" className="flex-1" isDisabled={!canContinue || loading} onClick={() => void goNext()}>
                                {t.bookContinue}
                            </Button>
                        ) : (
                            <Button color="primary" size="md" className="flex-1" isDisabled={!canContinue || saving || catalog?.bookingClosed} onClick={() => void confirm()}>
                                {saving ? t.bookSaving : t.bookConfirm}
                            </Button>
                        )}
                    </div>
                </div>
            </main>
            <LandingFooter />

            <ModalOverlay isDismissable isOpen={booked !== null} onOpenChange={(open) => !open && navigate("/home")}>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                        {booked ? (
                            <>
                                <CheckCircle className="size-10 text-fg-success-primary" />
                                <h2 className="mt-4 text-lg font-semibold text-primary">{t.bookDoneTitle}</h2>
                                <p className="mt-2 text-sm text-tertiary">{t.bookDoneBody}</p>
                                <dl className="mt-4 flex flex-col gap-2 text-sm">
                                    <SummaryRow label={t.bookStepFamily} value={booked.forName} compact />
                                    <SummaryRow label={t.bookStepWhen} value={formatWhen(booked.startAt)} compact />
                                    <SummaryRow label={t.bookStepDoctor} value={booked.doctorId === "any" ? t.bookAnyDoctor : booked.doctorName} compact />
                                    <SummaryRow label={t.bookStepType} value={typeLabel(visitType) || booked.type} compact />
                                </dl>
                                <div className="mt-6 flex flex-col gap-3">
                                    <Button color="primary" size="lg" onClick={() => navigate("/home")}>
                                        {t.backToHome}
                                    </Button>
                                    <Button color="secondary" size="lg" onClick={() => navigate("/visits")}>
                                        {t.bookViewBooking}
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

const DoctorChoice = ({ selected, title, subtitle, onSelect }: { selected: boolean; title: string; subtitle: string; onSelect: () => void }) => (
    <button
        type="button"
        onClick={onSelect}
        className={cx(
            "w-full rounded-xl px-4 py-3 text-left ring-1 transition",
            selected ? "bg-brand-primary ring-2 ring-brand-solid dark:bg-white/12 dark:ring-brand-300" : "bg-primary ring-secondary hover:ring-brand",
        )}
    >
        <span className="block text-sm font-semibold text-primary">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-tertiary">{subtitle}</span>
    </button>
);

const ShiftCard = ({
    active,
    title,
    range,
    countLabel,
    onSelect,
}: {
    active: boolean;
    title: string;
    range: string;
    countLabel: string;
    onSelect: () => void;
}) => (
    <button
        type="button"
        onClick={onSelect}
        className={cx(
            "rounded-xl px-4 py-3 text-left ring-1 transition dark:bg-white/10",
            active ? "ring-2 ring-brand-solid dark:ring-brand-300" : "ring-secondary hover:ring-brand dark:ring-white/40",
        )}
    >
        <span className="block text-sm font-semibold text-primary">{title}</span>
        <span className="mt-1 block text-sm text-tertiary">{range}</span>
        <span className={cx("mt-2 block text-sm font-semibold", active ? "text-brand-secondary" : "text-tertiary")}>{countLabel}</span>
    </button>
);

const SummaryRow = ({ label, value, compact, mobile }: { label: string; value: string; compact?: boolean; mobile?: boolean }) => (
    <div className={cx("flex min-w-0 items-start justify-between gap-2", compact ? (mobile ? "gap-1.5" : "gap-3") : "py-3")}>
        <dt className={cx("shrink-0 text-tertiary", mobile && "text-[11px]")}>{label}</dt>
        <dd className={cx("min-w-0 text-right font-medium break-words text-primary", mobile ? "text-[11px] leading-snug" : "text-sm")}>{value}</dd>
    </div>
);
