import { ArrowLeft, CalendarCheck01 } from "@untitledui/icons";
import { Link, Navigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { RatingStars } from "@/components/foundations/rating-stars";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { dayLabel, genderLabel, getDoctorById, isDoctorId, shiftLabel } from "@/utils/doctors";

export const DoctorDetailPage = () => {
    const { id } = useParams();
    const { t, locale } = useI18n();
    const { profile } = useAuth();

    if (!id || !isDoctorId(id)) {
        return <Navigate to="/doctors" replace />;
    }

    const doctor = getDoctorById(locale, id);
    if (!doctor) {
        return <Navigate to="/doctors" replace />;
    }

    const bookHref = profile ? `/book?doctor=${doctor.id}` : "/login";

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main className="mx-auto w-full max-w-container px-4 py-10 md:px-8 md:py-16">
                <Link
                    to="/doctors"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary"
                >
                    <ArrowLeft aria-hidden className="size-4" />
                    {t.doctorBack}
                </Link>

                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
                    <div className="overflow-hidden rounded-2xl bg-secondary shadow-xs ring-1 ring-secondary">
                        <img src={doctor.photo} alt="" className="aspect-square w-full object-cover" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-brand-secondary">{doctor.specialty}</p>
                        <h1 className="mt-1 text-display-sm font-semibold text-primary [font-family:var(--font-display)]">{doctor.name}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <RatingStars rating={doctor.rating} starClassName="size-5 text-yellow-400" />
                            <span className="text-md font-medium text-secondary">
                                {doctor.rating.toFixed(1)} · {t.doctorsReviewCount.replace("{count}", String(doctor.reviewCount))}
                            </span>
                        </div>
                        <p className="mt-4 text-lg text-tertiary">{doctor.bio}</p>

                        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-primary/15 bg-secondary_subtle p-4 ring-1 ring-primary/20">
                                <dt className="text-xs font-semibold text-quaternary">{t.doctorsQualification}</dt>
                                <dd className="mt-1 text-md text-primary">{doctor.qualification}</dd>
                            </div>
                            <div className="rounded-xl border border-primary/15 bg-secondary_subtle p-4 ring-1 ring-primary/20">
                                <dt className="text-xs font-semibold text-quaternary">{t.doctorsGender}</dt>
                                <dd className="mt-1 text-md text-primary">{genderLabel(locale, doctor.gender)}</dd>
                            </div>
                            <div className="rounded-xl border border-primary/15 bg-secondary_subtle p-4 ring-1 ring-primary/20 sm:col-span-2">
                                <dt className="text-xs font-semibold text-quaternary">{t.doctorsLanguages}</dt>
                                <dd className="mt-1 text-md text-primary">{doctor.languages.join(locale === "zh" ? "、" : ", ")}</dd>
                            </div>
                        </dl>

                        <div className="mt-8">
                            <h2 className="text-lg font-semibold text-primary">{t.doctorsHours}</h2>
                            <ul className="mt-3 divide-y divide-primary/15 overflow-hidden rounded-xl border border-primary/15 bg-primary ring-1 ring-primary/20">
                                {doctor.schedules.map((slot) => (
                                    <li key={`${slot.dayKey}-${slot.shift}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                                        <span className="font-medium text-primary">{dayLabel(locale, slot.dayKey)}</span>
                                        <span className="text-secondary">{shiftLabel(slot.shift, t.bookMorning, t.bookNight)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button href={bookHref} size="lg" className="careplus-ink mt-8 w-full sm:w-auto" iconLeading={CalendarCheck01}>
                            {t.doctorsBookWith}
                        </Button>
                    </div>
                </div>

                <section className="mt-16">
                    <h2 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)]">{t.doctorReviewsTitle}</h2>
                    <p className="mt-2 text-md text-tertiary">{t.doctorReviewsBody}</p>
                    <ul className="mt-8 space-y-4">
                        {doctor.reviews.map((review) => (
                            <li key={review.id} className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="font-semibold text-primary">{review.author}</p>
                                    <time className="text-sm text-quaternary" dateTime={review.date}>
                                        {new Date(review.date).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </time>
                                </div>
                                <RatingStars rating={review.rating} starClassName="mt-2 size-4 text-yellow-400" />
                                <p className="mt-3 text-md text-secondary">{review.comment}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <LandingFooter />
        </div>
    );
};
