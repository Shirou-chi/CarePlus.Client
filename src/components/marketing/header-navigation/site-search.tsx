import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, SearchMd, Trash01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Copy, type Locale } from "@/providers/locale-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { announcementApi, type ApiAnnouncement } from "@/services/announcementApi";
import { doctorApi, type DoctorRecord } from "@/services/doctorApi";
import { overdueSafeHref } from "@/utils/invoices";

type SearchItem = {
    title: string;
    description: string;
    href: string;
    category: "page" | "doctor" | "medicine" | "announcement";
    keywords?: string;
};

const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();
const historyKeyFor = (patientId?: string) => `careplus-site-search:${patientId ?? "guest"}`;
const readHistory = (key: string): string[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
    } catch {
        return [];
    }
};

const pageItems = (t: Copy, signedIn: boolean, overdue: boolean): SearchItem[] => {
    const page = (href: string, title: string, description: string, keywords: string): SearchItem => ({
        href, title, description, keywords, category: "page",
    });
    const chat = page(
        "/chat",
        t.chatTitle,
        t.chatSubhead,
        "chat chatbot chai ai assistant help support careplus bot 聊天 助手 聊天机器人 智能客服",
    );
    const common = [
        page(signedIn ? "/home" : "/", t.home, t.clinicName, "landing homepage 首页 主页"),
        page("/about", t.aboutUs, t.aboutBody, "about clinic 关于 诊所"),
        page("/contact", t.contactTitle, t.contactBody, "contact address phone email hours map 联系 地址 电话 邮箱 营业时间"),
        page("/announcements", t.announcements, t.announcementsBody, "news notices updates clinic announcement 公告 新闻 通知"),
        chat,
    ];
    if (!signedIn) {
        return [
            ...common,
            page("/doctors", t.doctorsTitle, t.doctorsBody, "doctor physician browse 医生 医师"),
            page("/login", t.logIn, t.signIn, "sign in account login 登录"),
            page("/register", t.signUp, t.signUp, "register create account 注册 开户"),
            page("/forgot-password", t.forgotPassword, t.forgotPassword, "reset password recovery 忘记密码 重置密码"),
        ];
    }
    const account = page("/account", t.viewProfile, t.viewProfile, "account profile settings preferences security card address 账户 个人资料 设置 地址 银行卡");
    const invoices = page("/invoices", t.invoices, t.invoicesHint, "bill due overdue payment unpaid invoice 账单 逾期 未付款");
    if (overdue) return [...common.filter((item) => item.href !== "/chat"), account, invoices];
    return [
        ...common,
        page("/book", t.bookVisit, t.bookVisitHint, "booking appointment schedule timeslot consultation 预约 挂号 时段"),
        page("/visits", t.upcomingVisits, t.upcomingVisitsHint, "upcoming appointment reschedule cancel 即将就诊 改期 取消"),
        page("/history", t.visitHistory, t.visitHistoryHint, "visit history past cancelled completed 就诊记录 历史"),
        page("/queue", "Clinic queue", "Check in and follow your live queue progress", "queue check in waiting number clinic 排队 报到 叫号"),
        page("/doctors", t.doctorsTitle, t.doctorsBody, "doctor physician browse 医生 医师"),
        page("/medicine", t.medTitle, t.medSearch, "medicine pharmacy drug prescribed buy 药物 药房 处方"),
        page("/cart", t.cart, t.medCartEmptyHint, "shopping basket checkout 购物车 结算"),
        page("/orders", t.ordersTitle, t.ordersHint, "order history tracking delivery pickup 订单 物流 自提"),
        page("/dispensing-history", t.dispensingTitle, t.dispensingBody, "dispensing history completed picked up delivered 发药 领取 送达"),
        page("/clinic-records", t.clinicRecordsTitle, t.clinicRecordsNavHint, "clinic records diagnosis prescription consultation 病历 诊断 处方"),
        page("/records", t.phrTitle, t.phrNavHint, "personal health records allergies blood pressure pdf 健康档案 过敏 血压"),
        page("/family", t.familyProfiles, t.familyProfilesHint, "family member invitation parent child 家人 家庭 邀请"),
        invoices,
        page("/payments", t.payments, t.paymentsHint, "receipt paid bills history 收据 付款记录"),
        page("/notifications", t.notifPageTitle, t.notifications, "reminders alerts invitation notices 通知 提醒 邀请"),
        account,
    ];
};

const matches = (item: SearchItem, query: string) => {
    const haystack = normalize([item.title, item.description, item.keywords].join(" "));
    return normalize(query).split(/\s+/).every((word) => haystack.includes(word));
};

const score = (item: SearchItem, query: string) => {
    const title = normalize(item.title);
    const needle = normalize(query);
    return title === needle ? 0 : title.startsWith(needle) ? 1 : title.includes(needle) ? 2 : item.category === "page" ? 3 : 4;
};

export const SiteSearch = () => {
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const { overdue } = useOutstandingInvoices();
    const { medicines } = useMedicineCatalog();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
    const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>([]);
    const [loading, setLoading] = useState(false);
    const [historyByKey, setHistoryByKey] = useState<Record<string, string[]>>({});
    const historyKey = historyKeyFor(profile?.id);
    const history = useMemo(() => historyByKey[historyKey] ?? readHistory(historyKey), [historyByKey, historyKey]);

    const saveSearch = (value: string) => {
        const term = value.trim().replace(/\s+/g, " ");
        if (!term) return;
        const next = [term, ...history.filter((previous) => normalize(previous) !== normalize(term))].slice(0, 8);
        try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* Search remains available when storage is blocked. */ }
        setHistoryByKey((previous) => ({ ...previous, [historyKey]: next }));
    };

    const clearHistory = () => {
        try { localStorage.removeItem(historyKey); } catch { /* Clear the visible list even when storage is blocked. */ }
        setHistoryByKey((previous) => ({ ...previous, [historyKey]: [] }));
    };

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        setLoading(true);
        void Promise.allSettled([
            profile && overdue ? Promise.resolve([]) : doctorApi.list(),
            announcementApi.list(),
        ]).then(([doctorResult, announcementResult]) => {
            if (!active) return;
            setDoctors(doctorResult.status === "fulfilled" ? doctorResult.value : []);
            setAnnouncements(announcementResult.status === "fulfilled" ? announcementResult.value : []);
            setLoading(false);
        });
        return () => { active = false; };
    }, [isOpen, profile, overdue]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const pages = pageItems(t, Boolean(profile), Boolean(profile && overdue));
        const live: SearchItem[] = [
            ...doctors.map((doctor) => ({
                title: doctor.name,
                description: `${doctor.specialization} · ${doctor.qualification}`,
                keywords: `${doctor.staffId} ${t.doctorsTitle}`,
                href: `/doctors/${encodeURIComponent(doctor.staffId)}`,
                category: "doctor" as const,
            })),
            ...(!profile || overdue ? [] : medicines.map((medicine) => ({
                title: medicine.name,
                description: medicine.description,
                keywords: `${medicine.id} ${medicine.kind} ${medicine.form} ${medicine.pack}`,
                href: `/medicine/${encodeURIComponent(medicine.id)}`,
                category: "medicine" as const,
            }))),
            ...announcements.map((announcement) => ({
                title: locale === "zh" ? announcement.titleZh || announcement.title : announcement.title,
                description: locale === "zh" ? announcement.bodyZh || announcement.body : announcement.body,
                keywords: `${announcement.title} ${announcement.body} ${announcement.titleZh} ${announcement.bodyZh}`,
                href: `/announcements#${encodeURIComponent(announcement.id)}`,
                category: "announcement" as const,
            })),
        ];
        return [...pages, ...live].filter((item) => matches(item, query)).sort((a, b) => score(a, query) - score(b, query)).slice(0, 12);
    }, [t, profile, overdue, query, doctors, announcements, medicines, locale]);

    const openResult = (href: string) => {
        saveSearch(query);
        setIsOpen(false);
        setQuery("");
        navigate(overdue ? overdueSafeHref(href, true) : href);
    };
    const categoryName = (category: SearchItem["category"], language: Locale) => ({
        page: language === "zh" ? "页面" : "Page",
        doctor: language === "zh" ? "医生" : "Doctor",
        medicine: language === "zh" ? "药物" : "Medicine",
        announcement: language === "zh" ? "公告" : "Announcement",
    })[category];

    return (
        <AriaDialogTrigger isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { saveSearch(query); setQuery(""); } }}>
            <AriaButton aria-label={t.search} className="inline-flex cursor-pointer items-center justify-center rounded-md p-2 lg:p-1.5 text-fg-quaternary outline-focus-ring hover:text-[#456f75] focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-brand-300 dark:hover:text-white">
                <SearchMd className="size-5" />
            </AriaButton>
            <AriaPopover className="w-[min(28rem,calc(100vw-1.5rem))] shadow-lg" offset={8} placement="bottom end">
                <AriaDialog className="outline-hidden" aria-label={t.search}>
                    <div className="careplus-panel overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt">
                        <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                            <SearchMd aria-hidden="true" className="size-5 shrink-0 text-tertiary" />
                            <input
                                autoFocus
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && results.length) openResult(results[0].href);
                                }}
                                aria-label={t.search}
                                placeholder={locale === "zh" ? "搜索页面、医生、药物或公告" : "Search pages, doctors, medicine, or notices"}
                                className="min-w-0 flex-1 bg-transparent text-md text-primary lg:text-sm outline-none placeholder:text-placeholder"
                            />
                        </div>
                        <div className="max-h-[min(65dvh,30rem)] overflow-y-auto p-2">
                            {!query.trim() ? (
                                <section aria-label={locale === "zh" ? "最近搜索" : "Recent searches"}>
                                    <div className="flex items-center justify-between gap-3 px-3 py-1.5">
                                        <h2 className="text-xs font-semibold text-tertiary">{locale === "zh" ? "最近搜索" : "Recent searches"}</h2>
                                        {history.length ? (
                                            <button type="button" onClick={clearHistory} className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-primary_hover hover:text-primary">
                                                <Trash01 aria-hidden="true" className="size-3.5" />
                                                {locale === "zh" ? "清除记录" : "Clear history"}
                                            </button>
                                        ) : null}
                                    </div>
                                    {history.length ? (
                                        <ul>
                                            {history.map((term) => (
                                                <li key={term}>
                                                    <button type="button" onClick={() => setQuery(term)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-primary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2">
                                                        <SearchMd aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
                                                        <span className="min-w-0 flex-1 truncate">{term}</span>
                                                        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-quaternary" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="px-3 py-5 text-center text-sm text-tertiary">{locale === "zh" ? "还没有搜索记录。" : "No recent searches yet."}</p>}
                                </section>
                            ) : results.length ? (
                                <ul>
                                    {results.map((item) => (
                                        <li key={item.href}>
                                            <button
                                                type="button"
                                                onClick={() => openResult(item.href)}
                                                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-2">
                                                        <span className="truncate text-sm font-semibold text-primary">{item.title}</span>
                                                        <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary">{categoryName(item.category, locale)}</span>
                                                    </span>
                                                    <span className="mt-0.5 block truncate text-xs text-tertiary">{item.description}</span>
                                                </span>
                                                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-quaternary group-hover:text-primary" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-3 py-6 text-center text-sm text-tertiary">
                                    {loading ? (locale === "zh" ? "正在搜索…" : "Searching…") : (locale === "zh" ? "没有找到相关结果。" : "No matching results found.")}
                                </p>
                            )}
                        </div>
                    </div>
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );
};
