import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck01, CheckCircle, Clock, Users01 } from "@untitledui/icons";
import { Navigate, useSearchParams } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { queueApi, type QueueOverview } from "@/services/queueApi";

const statusTone = (status: string): "success" | "warning" | "blue" | "gray" => {
    if (status === "Called") return "warning";
    if (status === "InConsultation") return "success";
    if (status === "Waiting") return "blue";
    return "gray";
};

export const QueuePage = () => {
    const { profile, isReady } = useAuth();
    const { locale } = useI18n();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get("appointmentId");
    const [overview, setOverview] = useState<QueueOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const zh = locale === "zh";

    const copy = useMemo(() => ({
        title: zh ? "诊所排队" : "Clinic queue",
        body: zh ? "在预约时间前十分钟报到，并在此查看实时排队进度。" : "Check in ten minutes before your appointment and follow your live queue progress here.",
        loading: zh ? "正在加载排队资料…" : "Loading your queue…",
        emptyTitle: zh ? "目前没有排队号码" : "No active queue right now",
        emptyBody: zh ? "预约开始前十分钟，我们会通过通知提醒您报到。报到时段共 30 分钟，并于预约开始后 20 分钟结束。" : "We will notify you ten minutes before your appointment when check-in opens. The 30-minute window closes twenty minutes after the appointment starts.",
        upcoming: zh ? "即将到来的预约" : "Upcoming appointment",
        appointment: zh ? "预约时间" : "Appointment",
        doctor: zh ? "医生" : "Doctor",
        visitType: zh ? "就诊类型" : "Visit type",
        room: zh ? "诊室" : "Room",
        roomPending: zh ? "尚未分配" : "To be assigned",
        window: zh ? "报到时段" : "Check-in window",
        checkIn: zh ? "立即报到" : "Check in now",
        confirmTitle: zh ? "确认报到？" : "Confirm check-in?",
        confirmBody: zh ? "请仅在您已到达 CarePlus 诊所时进行报到。确认后，系统会为您分配排队号码。若在 30 分钟时段内未报到，预约将自动取消。" : "Only check in when you have arrived at CarePlus Clinic. After confirmation, a queue number will be assigned to you. If you miss the 30-minute window, the appointment will be cancelled automatically.",
        confirm: zh ? "确认并获取排队号码" : "Confirm and get queue number",
        cancel: zh ? "取消" : "Cancel",
        queueNumber: zh ? "您的排队号码" : "Your queue number",
        ahead: zh ? "前方人数" : "People ahead",
        wait: zh ? "预计等候时间" : "Estimated wait",
        minutes: zh ? "分钟" : "minutes",
        checkedAt: zh ? "报到时间" : "Checked in",
        status: zh ? "状态" : "Status",
        refresh: zh ? "排队状态会自动更新。" : "Queue status updates automatically.",
        retry: zh ? "重试" : "Try again",
        visits: zh ? "查看即将到来的预约" : "View upcoming visits",
    }), [zh]);

    const load = useCallback(async (silent = false) => {
        if (!profile) return;
        if (!silent) setLoading(true);
        try {
            const next = await queueApi.overview(appointmentId);
            setOverview(next);
            setError(null);
        } catch (cause) {
            if (!silent) setError(cause instanceof Error ? cause.message : "Unable to load the clinic queue.");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [appointmentId, profile]);

    useEffect(() => {
        void load();
        if (!profile) return;
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") void load(true);
        }, 5_000);
        return () => window.clearInterval(interval);
    }, [load, profile]);

    if (!isReady) return null;
    if (!profile) return <Navigate replace to="/login" />;

    const formatDateTime = (value: string) => new Intl.DateTimeFormat(zh ? "zh-MY" : "en-MY", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(value));
    const typeLabel = (value: string) => value === "VT01" ? (zh ? "普通诊疗" : "General consultation")
        : value === "VT02" ? (zh ? "身体检查" : "Body check")
            : value === "VT03" ? (zh ? "心理健康" : "Mental wellness") : value;
    const statusLabel = (value: string) => {
        if (!zh) return value === "InConsultation" ? "In consultation" : value;
        if (value === "Waiting") return "等候中";
        if (value === "Called") return "已叫号";
        if (value === "InConsultation") return "看诊中";
        return value;
    };
    const active = overview?.activeQueue;
    const checkIn = overview?.checkIn;

    const confirmCheckIn = async () => {
        if (!checkIn) return;
        setCheckingIn(true);
        setError(null);
        try {
            const queue = await queueApi.checkIn(checkIn.appointmentId);
            setOverview({ activeQueue: queue, checkIn: null });
            setNotice(zh ? `报到成功。您的排队号码是 ${queue.queueNumber}。` : `Check-in successful. Your queue number is ${queue.queueNumber}.`);
            setConfirming(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to check in.");
            setConfirming(false);
        } finally {
            setCheckingIn(false);
        }
    };

    return (
        <div className="careplus-landing flex min-h-dvh flex-col overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container flex-1 px-4 py-6 md:px-8 md:py-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{copy.title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{copy.body}</p>

                {error ? (
                    <div className="mt-6 rounded-2xl border border-error-primary bg-error-secondary p-4 text-sm text-error-primary" role="alert">
                        <p className="font-semibold">{error}</p>
                        <Button className="mt-3" color="secondary" size="sm" onClick={() => void load()}>{copy.retry}</Button>
                    </div>
                ) : null}
                {notice ? <p className="mt-6 rounded-2xl bg-success-secondary px-4 py-3 text-sm font-semibold text-success-primary" role="status">{notice}</p> : null}

                {loading ? (
                    <div className="mt-8 rounded-2xl bg-primary p-10 text-center text-sm text-tertiary ring-1 ring-secondary">{copy.loading}</div>
                ) : active ? (
                    <section className="mt-8 overflow-hidden rounded-3xl bg-primary shadow-xs ring-1 ring-secondary">
                        <div className="bg-[#e7f9fb] px-5 py-6 text-center dark:bg-[#123854] sm:px-8 sm:py-8">
                            <p className="text-sm font-semibold text-tertiary">{copy.queueNumber}</p>
                            <p className="mt-2 text-5xl font-bold tracking-tight text-primary sm:text-6xl">{active.queueNumber}</p>
                            <Badge className="mt-4" color={statusTone(active.status)} size="md">{statusLabel(active.status)}</Badge>
                        </div>
                        <div className="grid gap-px bg-border-secondary sm:grid-cols-3">
                            <QueueMetric icon={Users01} label={copy.ahead} value={String(active.peopleAhead)} />
                            <QueueMetric icon={Clock} label={copy.wait} value={`${active.estimatedWaitMinutes} ${copy.minutes}`} />
                            <QueueMetric icon={CheckCircle} label={copy.checkedAt} value={formatDateTime(active.checkedInAt)} />
                        </div>
                        <dl className="grid gap-5 border-t border-secondary px-5 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
                            <QueueDetail label={copy.doctor} value={active.doctorName} />
                            <QueueDetail label={copy.appointment} value={formatDateTime(active.appointmentAt)} />
                            <QueueDetail label={copy.visitType} value={typeLabel(active.visitType)} />
                            <QueueDetail label={copy.room} value={active.roomName || active.roomId || copy.roomPending} />
                        </dl>
                        <p className="border-t border-secondary px-5 py-4 text-center text-xs text-tertiary sm:px-8">{copy.refresh}</p>
                    </section>
                ) : checkIn ? (
                    <section className="mt-8 rounded-3xl bg-primary p-5 shadow-xs ring-1 ring-secondary sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-4">
                                <FeaturedIcon icon={CalendarCheck01} color="brand" theme="light" size="lg" />
                                <div>
                                    <h2 className="text-lg font-semibold text-primary">{copy.upcoming}</h2>
                                    <p className="mt-1 text-sm text-tertiary">{checkIn.message}</p>
                                </div>
                            </div>
                            <Button color="primary" size="lg" isDisabled={!checkIn.canCheckIn} onClick={() => setConfirming(true)}>{copy.checkIn}</Button>
                        </div>
                        <dl className="mt-6 grid gap-4 rounded-2xl bg-secondary p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <QueueDetail label={copy.doctor} value={checkIn.doctorName} />
                            <QueueDetail label={copy.appointment} value={formatDateTime(checkIn.appointmentAt)} />
                            <QueueDetail label={copy.visitType} value={typeLabel(checkIn.visitType)} />
                            <QueueDetail label={copy.window} value={`${formatDateTime(checkIn.checkInOpensAt)} – ${new Intl.DateTimeFormat(zh ? "zh-MY" : "en-MY", { timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(checkIn.checkInClosesAt))}`} />
                        </dl>
                    </section>
                ) : (
                    <section className="mx-auto mt-8 flex max-w-lg flex-col items-center rounded-3xl bg-primary px-6 py-12 text-center shadow-xs ring-1 ring-secondary">
                        <FeaturedIcon icon={Clock} color="gray" theme="light" size="lg" />
                        <h2 className="mt-5 text-lg font-semibold text-primary">{copy.emptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{copy.emptyBody}</p>
                        <Button href="/visits" className="mt-6" color="secondary" size="md">{copy.visits}</Button>
                    </section>
                )}
            </main>
            <LandingFooter />

            <ModalOverlay isDismissable={!checkingIn} isOpen={confirming} onOpenChange={(open) => !open && !checkingIn && setConfirming(false)}>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                        <h2 className="text-lg font-semibold text-primary">{copy.confirmTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{copy.confirmBody}</p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Button color="primary" size="lg" isLoading={checkingIn} onClick={() => void confirmCheckIn()}>{copy.confirm}</Button>
                            <Button color="secondary" size="lg" isDisabled={checkingIn} onClick={() => setConfirming(false)}>{copy.cancel}</Button>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

const QueueMetric = ({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) => (
    <div className="flex items-center gap-3 bg-primary px-5 py-5 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-fg-brand-primary"><Icon className="size-5" /></span>
        <span><span className="block text-xs text-tertiary">{label}</span><strong className="mt-0.5 block text-sm text-primary">{value}</strong></span>
    </div>
);

const QueueDetail = ({ label, value }: { label: string; value: string }) => (
    <div><dt className="text-xs text-tertiary">{label}</dt><dd className="mt-1 text-sm font-semibold text-primary">{value}</dd></div>
);
