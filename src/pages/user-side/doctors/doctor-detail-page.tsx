import { useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck01, ChevronDown } from "@untitledui/icons";
import { Link, Navigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { doctorApi, doctorPhotoUrl, type DoctorRecord, type DoctorSchedule } from "@/services/doctorApi";

const formatScheduleTime = (value: string) => {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

    const suffix = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const ScheduleRow = ({ schedule, locale }: { schedule: DoctorSchedule; locale: "en" | "zh" }) => (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-sm">
        <span className="font-medium text-primary">
            {new Date(schedule.workingDate).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
                weekday: "long",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kuala_Lumpur",
            })}
        </span>
        <span className="whitespace-nowrap text-right text-secondary tabular-nums">
            {formatScheduleTime(schedule.startTime)} – {formatScheduleTime(schedule.endTime)}
        </span>
    </li>
);

export const DoctorDetailPage = () => {
    const { id } = useParams();
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllSchedules, setShowAllSchedules] = useState(false);

    useEffect(() => {
        if (!id) return;
        let active = true;
        setShowAllSchedules(false);
        setLoading(true);
        setError(null);
        doctorApi
            .get(id)
            .then((record) => active && setDoctor(record))
            .catch((cause) => active && setError(cause instanceof Error ? cause.message : t.doctorNotFound))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [id, t.doctorNotFound]);

    if (!id) return <Navigate to="/doctors" replace />;

    const bookHref = profile ? `/book?doctor=${encodeURIComponent(id)}` : "/login";
    const schedulePreviewCount = 7;
    const hiddenScheduleCount = Math.max(0, (doctor?.schedules.length ?? 0) - schedulePreviewCount);
    const visibleSchedules = doctor?.schedules.slice(0, showAllSchedules ? undefined : schedulePreviewCount) ?? [];

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-10 md:px-8 md:py-16">
                <Link
                    to="/doctors"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover"
                >
                    <ArrowLeft aria-hidden className="size-4" />
                    {t.doctorBack}
                </Link>

                {loading ? <p className="mt-8 rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">{t.phrLoading}</p> : null}
                {error ? <p role="alert" className="mt-8 rounded-2xl bg-error-solid px-6 py-4 text-sm font-semibold text-white">{error}</p> : null}

                {!loading && !error && doctor ? (
                    <>
                        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
                            <div className="overflow-hidden rounded-2xl bg-secondary shadow-xs ring-1 ring-secondary">
                                <img src={doctorPhotoUrl(doctor.name)} alt="" className="aspect-square w-full object-cover" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-brand-secondary">{doctor.specialization}</p>
                                <h1 className="mt-1 text-display-sm font-semibold text-primary [font-family:var(--font-display)]">{doctor.name}</h1>
                                <p className="mt-4 text-lg text-tertiary">
                                    {doctor.qualification}. {t.doctorsYears.replace("{count}", String(doctor.yearsOfExperience))}.
                                </p>

                                <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-secondary bg-primary p-4 ring-1 ring-secondary">
                                        <dt className="text-xs font-semibold text-quaternary">{t.doctorsQualification}</dt>
                                        <dd className="mt-1 text-md text-primary">{doctor.qualification}</dd>
                                    </div>
                                    <div className="rounded-xl border border-secondary bg-primary p-4 ring-1 ring-secondary">
                                        <dt className="text-xs font-semibold text-quaternary">{t.doctorsExperience}</dt>
                                        <dd className="mt-1 text-md text-primary">{t.doctorsYears.replace("{count}", String(doctor.yearsOfExperience))}</dd>
                                    </div>
                                </dl>

                                <div className="mt-8">
                                    <h2 className="text-lg font-semibold text-primary">{t.doctorsHours}</h2>
                                    {doctor.schedules.length > 0 ? (
                                        <div className="mt-3 overflow-hidden rounded-xl border border-primary/15 bg-primary ring-1 ring-primary/20">
                                            <ul
                                                id="doctor-working-hours"
                                                className="divide-y divide-primary/15 overflow-y-auto overscroll-contain [scrollbar-color:var(--color-border-primary)_transparent]"
                                                style={{ maxHeight: showAllSchedules ? "32rem" : "none" }}
                                            >
                                                {visibleSchedules.map((schedule) => (
                                                    <ScheduleRow key={`${schedule.workingDate}-${schedule.startTime}`} schedule={schedule} locale={locale} />
                                                ))}
                                            </ul>
                                            {hiddenScheduleCount > 0 ? (
                                                <button
                                                    type="button"
                                                    aria-controls="doctor-working-hours"
                                                    aria-expanded={showAllSchedules}
                                                    onClick={() => setShowAllSchedules((current) => !current)}
                                                    className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border-t border-primary/15 bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary outline-focus-ring transition hover:bg-secondary_hover hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                                                >
                                                    {showAllSchedules
                                                        ? t.doctorsShowLessHours
                                                        : t.doctorsShowMoreHours.replace("{count}", String(hiddenScheduleCount))}
                                                    <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 ${showAllSchedules ? "rotate-180" : ""}`} />
                                                </button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm text-tertiary ring-1 ring-secondary">{t.doctorsHoursUnavailable}</p>
                                    )}
                                </div>

                                <Button href={bookHref} size="lg" className="careplus-ink mt-8 w-full sm:w-auto" iconLeading={CalendarCheck01}>
                                    {t.doctorsBookWith}
                                </Button>
                            </div>
                        </div>

                        <section className="mt-16">
                            <h2 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)]">{t.doctorReviewsTitle}</h2>
                            <p className="mt-2 text-md text-tertiary">{t.doctorReviewsBody}</p>
                            {doctor.reviews?.length ? (
                                <div className="mt-6 space-y-3">
                                    <p className="text-sm font-semibold text-primary">
                                        {(doctor.reviews.reduce((sum, review) => sum + review.rating, 0) / doctor.reviews.length).toFixed(1)} / 5
                                        <span className="ml-2 font-normal text-tertiary">{t.doctorsReviewCount.replace("{count}", String(doctor.reviews.length))}</span>
                                    </p>
                                    {doctor.reviews.map((review, index) => (
                                        <article key={`${review.createdAt}-${index}`} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-primary">{review.isAnonymous ? t.doctorReviewAnonymous : (review.authorName || t.doctorReviewAuthor)}</p>
                                                <time className="text-xs text-tertiary" dateTime={review.createdAt}>
                                                    {new Date(review.createdAt).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", { day: "numeric", month: "short", year: "numeric" })}
                                                </time>
                                            </div>
                                            <p className="mt-2 text-lg text-warning-primary" aria-label={`${review.rating} / 5`}>{"★".repeat(review.rating)}<span className="text-quaternary">{"☆".repeat(5 - review.rating)}</span></p>
                                            {review.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{review.description}</p> : null}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-8 rounded-2xl bg-primary p-6 text-sm text-tertiary ring-1 ring-secondary">{t.doctorNoReviews}</div>
                            )}
                        </section>
                    </>
                ) : null}
            </main>
            <LandingFooter />
        </div>
    );
};
