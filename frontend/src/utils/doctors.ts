import type { Locale } from "@/providers/locale-provider";
import type { ClinicDoctor } from "@/utils/booking";

export type DoctorReview = {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
};

export type ClinicShift = "morning" | "night";

export type DoctorSchedule = {
    dayKey: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    shift: ClinicShift;
};

export type DoctorProfile = {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    qualification: string;
    gender: "male" | "female";
    languages: string[];
    rating: number;
    reviewCount: number;
    photo: string;
    schedules: DoctorSchedule[];
    reviews: DoctorReview[];
};

const photo = (name: string, tone: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=512&background=${tone}&color=fff&bold=true`;

export const DOCTOR_IDS = ["lim", "tan", "raj", "wong", "lee"] as const;
export type DoctorId = (typeof DOCTOR_IDS)[number];

const schedules: Record<DoctorId, DoctorSchedule[]> = {
    lim: [
        { dayKey: "mon", shift: "morning" },
        { dayKey: "tue", shift: "morning" },
        { dayKey: "wed", shift: "morning" },
        { dayKey: "thu", shift: "morning" },
        { dayKey: "fri", shift: "morning" },
    ],
    tan: [
        { dayKey: "tue", shift: "morning" },
        { dayKey: "wed", shift: "morning" },
        { dayKey: "thu", shift: "morning" },
        { dayKey: "sat", shift: "morning" },
    ],
    raj: [
        { dayKey: "mon", shift: "night" },
        { dayKey: "tue", shift: "night" },
        { dayKey: "wed", shift: "night" },
        { dayKey: "thu", shift: "night" },
        { dayKey: "fri", shift: "night" },
        { dayKey: "sat", shift: "morning" },
    ],
    wong: [
        { dayKey: "mon", shift: "morning" },
        { dayKey: "wed", shift: "morning" },
        { dayKey: "fri", shift: "morning" },
    ],
    lee: [
        { dayKey: "sun", shift: "night" },
        { dayKey: "mon", shift: "night" },
        { dayKey: "tue", shift: "night" },
        { dayKey: "wed", shift: "night" },
        { dayKey: "thu", shift: "night" },
        { dayKey: "fri", shift: "night" },
        { dayKey: "sat", shift: "night" },
    ],
};

const catalog: Record<Locale, DoctorProfile[]> = {
    en: [
        {
            id: "lim",
            name: "Dr Lim Wei Hao",
            specialty: "Family medicine",
            bio: "Weekday GP clinics and long-term follow-up for chronic conditions.",
            qualification: "MBBS (UM), MRCGP",
            gender: "male",
            languages: ["English", "Malay", "Mandarin"],
            rating: 4.8,
            reviewCount: 126,
            photo: photo("Lim Wei Hao", "0f766e"),
            schedules: schedules.lim,
            reviews: [
                { id: "1", author: "Aina R.", rating: 5, date: "2026-02-12", comment: "Clear advice and never rushed, even on a busy morning." },
                { id: "2", author: "Jason T.", rating: 5, date: "2026-01-28", comment: "Good follow-up on my blood pressure meds." },
                { id: "3", author: "Priya S.", rating: 4, date: "2026-01-05", comment: "Friendly and thorough with my child's fever visit." },
            ],
        },
        {
            id: "tan",
            name: "Dr Tan Mei Ling",
            specialty: "Mental wellness",
            bio: "Talks through stress, sleep, and mood at a steady pace.",
            qualification: "MD (UKM), MRCPsych",
            gender: "female",
            languages: ["English", "Mandarin", "Cantonese"],
            rating: 4.9,
            reviewCount: 89,
            photo: photo("Tan Mei Ling", "6d28d9"),
            schedules: schedules.tan,
            reviews: [
                { id: "1", author: "Wei L.", rating: 5, date: "2026-02-20", comment: "Felt heard. She explained options without pushing medication." },
                { id: "2", author: "Farah M.", rating: 5, date: "2026-01-14", comment: "Calm session. Helpful for work stress and sleep." },
            ],
        },
        {
            id: "raj",
            name: "Dr Rajesh Kumar",
            specialty: "General consultation",
            bio: "Acute visits, fever, and same-day concerns.",
            qualification: "MBBS (Manipal), AMC",
            gender: "male",
            languages: ["English", "Malay", "Tamil"],
            rating: 4.7,
            reviewCount: 102,
            photo: photo("Rajesh Kumar", "1d4ed8"),
            schedules: schedules.raj,
            reviews: [
                { id: "1", author: "Hafiz K.", rating: 5, date: "2026-02-08", comment: "Quick diagnosis for my sore throat. Pharmacy pickup was smooth." },
                { id: "2", author: "Mei Y.", rating: 4, date: "2025-12-19", comment: "Professional and direct. Wait time was reasonable." },
            ],
        },
        {
            id: "wong",
            name: "Dr Wong Shu Min",
            specialty: "Health screening",
            bio: "Body checks and screening follow-up.",
            qualification: "MBBS (UM), Dip Public Health",
            gender: "female",
            languages: ["English", "Mandarin", "Malay"],
            rating: 4.6,
            reviewCount: 74,
            photo: photo("Wong Shu Min", "c2410c"),
            schedules: schedules.wong,
            reviews: [
                { id: "1", author: "Daniel C.", rating: 5, date: "2026-01-30", comment: "Explained every screening result in plain language." },
                { id: "2", author: "Siti N.", rating: 4, date: "2025-11-22", comment: "Organised annual check. Reports ready on time." },
            ],
        },
        {
            id: "lee",
            name: "Dr Lee Jun Jie",
            specialty: "After-hours GP",
            bio: "Night shift coverage for the 24-hour clinic.",
            qualification: "MBBS (UKM), MEM",
            gender: "male",
            languages: ["English", "Malay", "Mandarin"],
            rating: 4.5,
            reviewCount: 58,
            photo: photo("Lee Jun Jie", "334155"),
            schedules: schedules.lee,
            reviews: [
                { id: "1", author: "Karen O.", rating: 5, date: "2026-02-02", comment: "Came in past midnight with food poisoning. Efficient care." },
                { id: "2", author: "Arvin G.", rating: 4, date: "2026-01-11", comment: "Reliable night doctor when other clinics are closed." },
            ],
        },
    ],
    zh: [
        {
            id: "lim",
            name: "林伟豪医生",
            specialty: "家庭医学",
            bio: "负责平日全科门诊与慢性病的长期跟进。",
            qualification: "MBBS (马来亚大学), MRCGP",
            gender: "male",
            languages: ["英语", "马来语", "华语"],
            rating: 4.8,
            reviewCount: 126,
            photo: photo("Lim Wei Hao", "0f766e"),
            schedules: schedules.lim,
            reviews: [
                { id: "1", author: "Aina R.", rating: 5, date: "2026-02-12", comment: "解释清楚，即使早上很忙也不会赶人。" },
                { id: "2", author: "Jason T.", rating: 5, date: "2026-01-28", comment: "血压药物跟进做得很好。" },
                { id: "3", author: "Priya S.", rating: 4, date: "2026-01-05", comment: "孩子发烧来看诊，态度亲切又仔细。" },
            ],
        },
        {
            id: "tan",
            name: "陈美玲医生",
            specialty: "心理健康",
            bio: "以稳定节奏讨论压力、睡眠与情绪问题。",
            qualification: "MD (UKM), MRCPsych",
            gender: "female",
            languages: ["英语", "华语", "粤语"],
            rating: 4.9,
            reviewCount: 89,
            photo: photo("Tan Mei Ling", "6d28d9"),
            schedules: schedules.tan,
            reviews: [
                { id: "1", author: "Wei L.", rating: 5, date: "2026-02-20", comment: "有被认真倾听的感觉，不会强推用药。" },
                { id: "2", author: "Farah M.", rating: 5, date: "2026-01-14", comment: "过程很平静，对工作压力和睡眠很有帮助。" },
            ],
        },
        {
            id: "raj",
            name: "Rajesh Kumar 医生",
            specialty: "全科咨询",
            bio: "处理急性症状、发烧与当日就诊需求。",
            qualification: "MBBS (Manipal), AMC",
            gender: "male",
            languages: ["英语", "马来语", "淡米尔语"],
            rating: 4.7,
            reviewCount: 102,
            photo: photo("Rajesh Kumar", "1d4ed8"),
            schedules: schedules.raj,
            reviews: [
                { id: "1", author: "Hafiz K.", rating: 5, date: "2026-02-08", comment: "喉咙痛诊断很快，取药流程也顺利。" },
                { id: "2", author: "Mei Y.", rating: 4, date: "2025-12-19", comment: "专业直接，等候时间可以接受。" },
            ],
        },
        {
            id: "wong",
            name: "黄淑敏医生",
            specialty: "健康检查",
            bio: "负责体检与筛查后的跟进。",
            qualification: "MBBS (马来亚大学), 公共卫生文凭",
            gender: "female",
            languages: ["英语", "华语", "马来语"],
            rating: 4.6,
            reviewCount: 74,
            photo: photo("Wong Shu Min", "c2410c"),
            schedules: schedules.wong,
            reviews: [
                { id: "1", author: "Daniel C.", rating: 5, date: "2026-01-30", comment: "每项筛查结果都用简单的话解释清楚。" },
                { id: "2", author: "Siti N.", rating: 4, date: "2025-11-22", comment: "年度体检安排有条理，报告准时。" },
            ],
        },
        {
            id: "lee",
            name: "李俊杰医生",
            specialty: "夜间全科",
            bio: "负责 24 小时诊所的夜班门诊。",
            qualification: "MBBS (UKM), MEM",
            gender: "male",
            languages: ["英语", "马来语", "华语"],
            rating: 4.5,
            reviewCount: 58,
            photo: photo("Lee Jun Jie", "334155"),
            schedules: schedules.lee,
            reviews: [
                { id: "1", author: "Karen O.", rating: 5, date: "2026-02-02", comment: "半夜因食物中毒来诊，处理很有效率。" },
                { id: "2", author: "Arvin G.", rating: 4, date: "2026-01-11", comment: "其他诊所关门时还能找到可靠的夜班医生。" },
            ],
        },
    ],
};

export const isDoctorId = (id: string | undefined): id is DoctorId =>
    !!id && (DOCTOR_IDS as readonly string[]).includes(id);

export const getDoctorCatalog = (locale: Locale) => catalog[locale];

export const getDoctorById = (locale: Locale, id: string) => getDoctorCatalog(locale).find((doctor) => doctor.id === id) ?? null;

export const getClinicDoctorsForBooking = (locale: Locale): ClinicDoctor[] =>
    getDoctorCatalog(locale).map(({ id, name, specialty, bio }) => ({ id, name, specialty, bio }));

export const dayLabel = (locale: Locale, key: DoctorSchedule["dayKey"]) => {
    const en: Record<DoctorSchedule["dayKey"], string> = {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
    };
    const zh: Record<DoctorSchedule["dayKey"], string> = {
        mon: "星期一",
        tue: "星期二",
        wed: "星期三",
        thu: "星期四",
        fri: "星期五",
        sat: "星期六",
        sun: "星期日",
    };
    return locale === "zh" ? zh[key] : en[key];
};

export const genderLabel = (locale: Locale, gender: DoctorProfile["gender"]) =>
    locale === "zh" ? (gender === "male" ? "男" : "女") : gender === "male" ? "Male" : "Female";

export const shiftLabel = (shift: ClinicShift, morning: string, night: string) => (shift === "morning" ? morning : night);
