import type { Locale } from "@/providers/locale-provider";

export type ClinicAnnouncement = {
    id: string;
    postedOn: string;
    title: string;
    body: string;
};

const announcements: Record<Locale, ClinicAnnouncement[]> = {
    en: [
        {
            id: "flu-2026-10",
            postedOn: "2026-10-18",
            title: "Flu vaccination walk-in this week",
            body: "Reception is taking flu shot walk-ins from 18 to 24 October, 9:00 am to 5:00 pm. Bring your identity card. No appointment is needed.",
        },
        {
            id: "screening-2026-10",
            postedOn: "2026-10-12",
            title: "Saturday morning screening",
            body: "Dengue and blood pressure screening is open this Saturday, 8:00 am to 12:00 pm, at the waiting lounge. The screening is free for CarePlus patients and guests.",
        },
        {
            id: "hours-2026-10",
            postedOn: "2026-10-02",
            title: "Night clinic and pharmacy pickup",
            body: "The clinic stays open overnight. Pharmacy pickup for ready prescriptions closes at 10:00 pm. After that, collect the medicine the next morning.",
        },
    ],
    zh: [
        {
            id: "flu-2026-10",
            postedOn: "2026-10-18",
            title: "本周可直接接种流感疫苗",
            body: "10 月 18 日至 24 日，上午 9 点至下午 5 点，可在前台直接接种流感疫苗。请携带身份证，不需要预约。",
        },
        {
            id: "screening-2026-10",
            postedOn: "2026-10-12",
            title: "周六上午体检",
            body: "本周六上午 8 点至中午 12 点，候诊区提供登革热和血压检查。CarePlus 病人和访客都可以免费参加。",
        },
        {
            id: "hours-2026-10",
            postedOn: "2026-10-02",
            title: "夜间门诊与取药时间",
            body: "诊所通宵开放。已备好的处方可在晚上 10 点前到药房领取，过了这个时间请于次日早上领取。",
        },
    ],
};

export const getAnnouncements = (locale: Locale) => announcements[locale];
