import { useMemo, useState } from "react";
import { File06 } from "@untitledui/icons";
import { Navigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { getClinicRecords, type ClinicRecord } from "@/utils/clinic-records";

export const ConsultationNotesPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [doctor, setDoctor] = useState("all");
    const [openId, setOpenId] = useState<string | null>(null);

    const notes = useMemo(() => getClinicRecords(locale), [locale]);
    const doctorOptions = useMemo(() => {
        const seen = new Map<string, string>();
        notes.forEach((note) => seen.set(note.doctorId, note.doctorName));
        return [...seen].map(([id, label]) => ({ id, label }));
    }, [notes]);
    const filtered = useMemo(() => notes.filter((note) => doctor === "all" || note.doctorId === doctor), [notes, doctor]);
    const openNote = notes.find((note) => note.id === openId) ?? null;

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kuala_Lumpur",
        });

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8 md:py-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.notes}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.notesBody}</p>
                    </div>
                    <div className="w-full sm:w-72">
                        <Select
                            label={t.clinicRecordsDoctor}
                            size="sm"
                            selectedKey={doctor}
                            onSelectionChange={(key) => key && setDoctor(String(key))}
                            items={[{ id: "all", label: t.historyAll }, ...doctorOptions]}
                        >
                            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                        </Select>
                        {doctor !== "all" ? (
                            <Button color="link-gray" size="sm" className="mt-2" onClick={() => setDoctor("all")}>
                                {t.historyClear}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={File06} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{notes.length === 0 ? t.notesEmptyTitle : t.notesNoMatch}</h2>
                        <p className="mt-2 text-sm text-tertiary">{notes.length === 0 ? t.notesEmptyBody : t.historyNoMatchBody}</p>
                    </div>
                ) : (
                    <ul className="mt-6 grid gap-3 lg:grid-cols-2">
                        {filtered.map((note) => (
                            <li key={note.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                <p className="text-sm font-semibold text-brand-secondary">{note.id}</p>
                                <p className="mt-1 text-md font-semibold text-primary">{note.diagnosis}</p>
                                <p className="mt-1 text-sm text-tertiary">
                                    {note.doctorName} · {note.visitType}
                                </p>
                                <p className="mt-1 text-sm text-tertiary">{formatDate(note.visitedAt)}</p>
                                <p className="mt-3 line-clamp-3 text-sm text-secondary">{note.doctorComment}</p>
                                <Button color="secondary" size="sm" className="mt-4" onClick={() => setOpenId(note.id)}>
                                    {t.clinicRecordsView}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
            <LandingFooter />
            {openNote ? <NoteDetail note={openNote} formatDate={formatDate} onClose={() => setOpenId(null)} /> : null}
        </div>
    );
};

const NoteDetail = ({ note, formatDate, onClose }: { note: ClinicRecord; formatDate: (iso: string) => string; onClose: () => void }) => {
    const { t } = useI18n();

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold text-primary">{note.diagnosis}</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            {note.doctorName} · {note.visitType}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">
                            {formatDate(note.visitedAt)} · {note.ward}
                        </p>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                        <h3 className="text-sm font-semibold text-primary">{t.clinicRecordsComment}</h3>
                        <p className="mt-2 text-sm text-secondary">{note.doctorComment}</p>
                        <h3 className="mt-5 text-sm font-semibold text-primary">{t.clinicRecordsMedications}</h3>
                        {note.medications.length === 0 ? (
                            <p className="mt-2 text-sm text-tertiary">{t.clinicRecordsNoMeds}</p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary">
                                {note.medications.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button href={`/clinic-records?record=${note.id}&from=notes`} color="primary" size="md" className="w-full sm:w-auto">
                            {t.invoicesViewVisit}
                        </Button>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
