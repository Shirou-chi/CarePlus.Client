import { Link } from "react-router";
import { ArrowUpRight } from "@untitledui/icons";
import type { Copy, Locale } from "@/providers/locale-provider";
import { doctorPhotoUrl, type DoctorRecord } from "@/services/doctorApi";

export const DoctorCard = ({ doctor, locale: _locale, t }: { doctor: DoctorRecord; locale: Locale; t: Copy }) => (
    <Link
        to={`/doctors/${doctor.staffId}`}
        className="group flex flex-col overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
    >
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
            <img
                src={doctorPhotoUrl(doctor.name)}
                alt=""
                className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{doctor.name}</p>
                        <p className="mt-0.5 truncate text-sm text-white/85">{doctor.specialization}</p>
                    </div>
                    <ArrowUpRight aria-hidden className="size-5 shrink-0 text-white/80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </div>
        </div>
        <dl className="flex flex-1 flex-col gap-2.5 p-4 text-sm">
            <div>
                <dt className="text-xs font-medium text-quaternary">{t.doctorsQualification}</dt>
                <dd className="mt-0.5 text-secondary">{doctor.qualification}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-quaternary">{t.doctorsExperience}</dt>
                <dd className="mt-0.5 text-secondary">{t.doctorsYears.replace("{count}", String(doctor.yearsOfExperience))}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-quaternary">{t.doctorsHours}</dt>
                <dd className="mt-0.5 text-secondary">{doctor.schedules.length > 0 ? t.doctorsHoursAvailable : t.doctorsHoursUnavailable}</dd>
            </div>
        </dl>
    </Link>
);
