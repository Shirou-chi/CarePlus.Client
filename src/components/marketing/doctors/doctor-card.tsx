import { Link } from "react-router";
import { ArrowUpRight } from "@untitledui/icons";
import { RatingStars } from "@/components/foundations/rating-stars";
import type { Copy, Locale } from "@/providers/locale-provider";
import { dayLabel, genderLabel, shiftLabel, type DoctorProfile } from "@/utils/doctors";

export const DoctorCard = ({ doctor, locale, t }: { doctor: DoctorProfile; locale: Locale; t: Copy }) => (
    <Link
        to={`/doctors/${doctor.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
    >
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
            <img
                src={doctor.photo}
                alt=""
                className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{doctor.name}</p>
                        <p className="mt-0.5 truncate text-sm text-white/85">{doctor.specialty}</p>
                    </div>
                    <ArrowUpRight aria-hidden className="size-5 shrink-0 text-white/80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <RatingStars rating={doctor.rating} starClassName="size-4 text-yellow-300" />
                    <span className="text-xs font-medium text-white/90">
                        {doctor.rating.toFixed(1)} · {t.doctorsReviewCount.replace("{count}", String(doctor.reviewCount))}
                    </span>
                </div>
            </div>
        </div>
        <dl className="flex flex-1 flex-col gap-2.5 p-4 text-sm">
            <div>
                <dt className="text-xs font-medium text-quaternary">{t.doctorsQualification}</dt>
                <dd className="mt-0.5 text-secondary">{doctor.qualification}</dd>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                <div>
                    <dt className="text-xs font-medium text-quaternary">{t.doctorsGender}</dt>
                    <dd className="mt-0.5 text-secondary">{genderLabel(locale, doctor.gender)}</dd>
                </div>
                <div className="min-w-0 flex-1">
                    <dt className="text-xs font-medium text-quaternary">{t.doctorsLanguages}</dt>
                    <dd className="mt-0.5 text-secondary">{doctor.languages.join(locale === "zh" ? "、" : ", ")}</dd>
                </div>
            </div>
            <div>
                <dt className="text-xs font-medium text-quaternary">{t.doctorsHours}</dt>
                <dd className="mt-1 space-y-1 text-secondary">
                    {doctor.schedules.map((slot) => (
                        <p key={`${slot.dayKey}-${slot.shift}`} className="flex justify-between gap-3 text-xs sm:text-sm">
                            <span className="font-medium text-primary">{dayLabel(locale, slot.dayKey)}</span>
                            <span className="text-right">{shiftLabel(slot.shift, t.bookMorning, t.bookNight)}</span>
                        </p>
                    ))}
                </dd>
            </div>
        </dl>
    </Link>
);
