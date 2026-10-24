import type { Locale } from "@/providers/locale-provider";

export type ClinicChargeCategory = "consultation" | "medicine" | "procedure" | "lab" | "other";

export type LabFlag = "normal" | "high" | "low";

export type LabMarker = {
    name: string;
    value: string;
    unit: string;
    range: string;
    flag: LabFlag;
};

export type ClinicChargeLine = {
    id: string;
    category: ClinicChargeCategory;
    item: string;
    detail: string;
    unitPrice: number;
    qty: number;
    markers?: LabMarker[];
};

export type ClinicRecord = {
    id: string;
    patientName: string;
    patientMeta: string;
    doctorId: string;
    doctorName: string;
    doctorPhoto: string;
    specialty: string;
    visitType: string;
    visitedAt: string;
    status: "completed";
    diagnosis: string;
    doctorComment: string;
    medications: string[];
    ward: string;
    charges: ClinicChargeLine[];
    sstRate: number;
};

export type ClinicRecordTotals = {
    subtotal: number;
    sst: number;
    total: number;
};

const photo = (name: string, tone: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${tone}&color=fff&bold=true`;

export const getClinicRecordTotals = (record: ClinicRecord): ClinicRecordTotals => {
    const subtotal = record.charges.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const sst = Number((subtotal * record.sstRate).toFixed(2));
    return { subtotal, sst, total: Number((subtotal + sst).toFixed(2)) };
};

const records: Record<Locale, ClinicRecord[]> = {
    en: [
        {
            id: "CR-2405",
            patientName: "Ahmad Zaki",
            patientMeta: "Male, 34 years",
            doctorId: "lim",
            doctorName: "Dr Lim Wei Hao",
            doctorPhoto: photo("Lim Wei Hao", "0f766e"),
            specialty: "Family medicine",
            visitType: "General consultation",
            visitedAt: "2026-02-12T09:30:00+08:00",
            status: "completed",
            diagnosis: "Upper respiratory tract infection",
            doctorComment: "Rest, fluids, and finish the antibiotic course. Return if fever lasts more than 3 days.",
            medications: ["Amoxicillin 500 mg capsules", "Paracetamol 500 mg tablets"],
            ward: "GP Room 2",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "General consultation", detail: "GP visit · 30 min", unitPrice: 50, qty: 1 },
                { id: "c2", category: "medicine", item: "Amoxicillin 500 mg", detail: "16 capsules", unitPrice: 12.5, qty: 2 },
                { id: "c3", category: "medicine", item: "Paracetamol 500 mg", detail: "20 tablets", unitPrice: 8, qty: 1 },
            ],
        },
        {
            id: "CR-2398",
            patientName: "Ahmad Zaki",
            patientMeta: "Male, 34 years",
            doctorId: "wong",
            doctorName: "Dr Wong Shu Min",
            doctorPhoto: photo("Wong Shu Min", "c2410c"),
            specialty: "Health screening",
            visitType: "Body check",
            visitedAt: "2026-01-20T08:00:00+08:00",
            status: "completed",
            diagnosis: "Annual health screening review",
            doctorComment: "Triglycerides are above the reference range. Repeat the lipid panel in 6 months. The other fasting results are fine.",
            medications: [],
            ward: "Screening Bay 1",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "Health screening consult", detail: "Annual review · 45 min", unitPrice: 80, qty: 1 },
                {
                    id: "c2",
                    category: "lab",
                    item: "Fasting lipid panel",
                    detail: "Blood draw",
                    unitPrice: 65,
                    qty: 1,
                    markers: [
                        { name: "Total cholesterol", value: "4.8", unit: "mmol/L", range: "< 5.2", flag: "normal" },
                        { name: "LDL cholesterol", value: "2.9", unit: "mmol/L", range: "< 3.4", flag: "normal" },
                        { name: "HDL cholesterol", value: "1.4", unit: "mmol/L", range: "> 1.0", flag: "normal" },
                        { name: "Triglycerides", value: "2.4", unit: "mmol/L", range: "< 1.7", flag: "high" },
                    ],
                },
                {
                    id: "c3",
                    category: "lab",
                    item: "Full blood count",
                    detail: "Blood draw",
                    unitPrice: 35,
                    qty: 1,
                    markers: [
                        { name: "Haemoglobin", value: "14.6", unit: "g/dL", range: "13.0–17.0", flag: "normal" },
                        { name: "White cell count", value: "6.8", unit: "×10⁹/L", range: "4.0–11.0", flag: "normal" },
                        { name: "Platelets", value: "248", unit: "×10⁹/L", range: "150–410", flag: "normal" },
                    ],
                },
                { id: "c4", category: "procedure", item: "ECG screening", detail: "Resting ECG", unitPrice: 45, qty: 1 },
            ],
        },
        {
            id: "CR-2311",
            patientName: "Ahmad Zaki",
            patientMeta: "Male, 34 years",
            doctorId: "tan",
            doctorName: "Dr Tan Mei Ling",
            doctorPhoto: photo("Tan Mei Ling", "6d28d9"),
            specialty: "Mental wellness",
            visitType: "Mental wellness",
            visitedAt: "2025-12-08T14:00:00+08:00",
            status: "completed",
            diagnosis: "Work-related stress and sleep disturbance",
            doctorComment: "Sleep hygiene discussed. Follow-up in 4 weeks if symptoms persist.",
            medications: [],
            ward: "Consult Room 3",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "Mental wellness session", detail: "Counselling · 40 min", unitPrice: 120, qty: 1 },
            ],
        },
        {
            id: "CR-2280",
            patientName: "Ahmad Zaki",
            patientMeta: "Male, 34 years",
            doctorId: "raj",
            doctorName: "Dr Rajesh Kumar",
            doctorPhoto: photo("Rajesh Kumar", "1d4ed8"),
            specialty: "General consultation",
            visitType: "General consultation",
            visitedAt: "2025-11-03T21:15:00+08:00",
            status: "completed",
            diagnosis: "Allergic rhinitis flare",
            doctorComment: "Avoid known triggers. Loratadine as needed for sneezing and itch.",
            medications: ["Loratadine 10 mg tablets"],
            ward: "Night GP Room",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "General consultation", detail: "After-hours GP · 30 min", unitPrice: 65, qty: 1 },
                { id: "c2", category: "medicine", item: "Loratadine 10 mg", detail: "10 tablets", unitPrice: 9.5, qty: 1 },
            ],
        },
    ],
    zh: [
        {
            id: "CR-2405",
            patientName: "Ahmad Zaki",
            patientMeta: "男，34 岁",
            doctorId: "lim",
            doctorName: "林伟豪医生",
            doctorPhoto: photo("Lim Wei Hao", "0f766e"),
            specialty: "家庭医学",
            visitType: "普通门诊",
            visitedAt: "2026-02-12T09:30:00+08:00",
            status: "completed",
            diagnosis: "上呼吸道感染",
            doctorComment: "多休息、补充水分，并完成抗生素疗程。若发烧超过 3 天请复诊。",
            medications: ["阿莫西林 500 毫克胶囊", "扑热息痛 500 毫克片剂"],
            ward: "全科诊间 2",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "普通门诊", detail: "全科看诊 · 30 分钟", unitPrice: 50, qty: 1 },
                { id: "c2", category: "medicine", item: "阿莫西林 500 毫克", detail: "16 粒", unitPrice: 12.5, qty: 2 },
                { id: "c3", category: "medicine", item: "扑热息痛 500 毫克", detail: "20 片", unitPrice: 8, qty: 1 },
            ],
        },
        {
            id: "CR-2398",
            patientName: "Ahmad Zaki",
            patientMeta: "男，34 岁",
            doctorId: "wong",
            doctorName: "黄淑敏医生",
            doctorPhoto: photo("Wong Shu Min", "c2410c"),
            specialty: "健康检查",
            visitType: "身体检查",
            visitedAt: "2026-01-20T08:00:00+08:00",
            status: "completed",
            diagnosis: "年度健康检查跟进",
            doctorComment: "甘油三酯高于参考范围。请在 6 个月后复查血脂。其余空腹结果正常。",
            medications: [],
            ward: "检查室 1",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "健康检查咨询", detail: "年度跟进 · 45 分钟", unitPrice: 80, qty: 1 },
                {
                    id: "c2",
                    category: "lab",
                    item: "空腹血脂检查",
                    detail: "抽血",
                    unitPrice: 65,
                    qty: 1,
                    markers: [
                        { name: "总胆固醇", value: "4.8", unit: "mmol/L", range: "< 5.2", flag: "normal" },
                        { name: "低密度脂蛋白", value: "2.9", unit: "mmol/L", range: "< 3.4", flag: "normal" },
                        { name: "高密度脂蛋白", value: "1.4", unit: "mmol/L", range: "> 1.0", flag: "normal" },
                        { name: "甘油三酯", value: "2.4", unit: "mmol/L", range: "< 1.7", flag: "high" },
                    ],
                },
                {
                    id: "c3",
                    category: "lab",
                    item: "全血计数",
                    detail: "抽血",
                    unitPrice: 35,
                    qty: 1,
                    markers: [
                        { name: "血红蛋白", value: "14.6", unit: "g/dL", range: "13.0–17.0", flag: "normal" },
                        { name: "白细胞", value: "6.8", unit: "×10⁹/L", range: "4.0–11.0", flag: "normal" },
                        { name: "血小板", value: "248", unit: "×10⁹/L", range: "150–410", flag: "normal" },
                    ],
                },
                { id: "c4", category: "procedure", item: "心电图筛查", detail: "静息心电图", unitPrice: 45, qty: 1 },
            ],
        },
        {
            id: "CR-2311",
            patientName: "Ahmad Zaki",
            patientMeta: "男，34 岁",
            doctorId: "tan",
            doctorName: "陈美玲医生",
            doctorPhoto: photo("Tan Mei Ling", "6d28d9"),
            specialty: "心理健康",
            visitType: "心理健康",
            visitedAt: "2025-12-08T14:00:00+08:00",
            status: "completed",
            diagnosis: "工作压力与睡眠问题",
            doctorComment: "已讨论睡眠习惯。若症状持续，4 周后复诊。",
            medications: [],
            ward: "诊间 3",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "心理健康咨询", detail: "辅导 · 40 分钟", unitPrice: 120, qty: 1 },
            ],
        },
        {
            id: "CR-2280",
            patientName: "Ahmad Zaki",
            patientMeta: "男，34 岁",
            doctorId: "raj",
            doctorName: "Rajesh Kumar 医生",
            doctorPhoto: photo("Rajesh Kumar", "1d4ed8"),
            specialty: "全科咨询",
            visitType: "普通门诊",
            visitedAt: "2025-11-03T21:15:00+08:00",
            status: "completed",
            diagnosis: "过敏性鼻炎发作",
            doctorComment: "避免已知诱因。如有喷嚏或痕痒可按需服用氯雷他定。",
            medications: ["氯雷他定 10 毫克片剂"],
            ward: "夜间全科诊间",
            sstRate: 0.06,
            charges: [
                { id: "c1", category: "consultation", item: "普通门诊", detail: "夜间全科 · 30 分钟", unitPrice: 65, qty: 1 },
                { id: "c2", category: "medicine", item: "氯雷他定 10 毫克", detail: "10 片", unitPrice: 9.5, qty: 1 },
            ],
        },
    ],
};

export const getClinicRecords = (locale: Locale) => records[locale];

export const getClinicRecordById = (locale: Locale, id: string) => getClinicRecords(locale).find((record) => record.id === id) ?? null;

export const listLabReports = (records: ClinicRecord[]) =>
    records.flatMap((record) =>
        record.charges
            .filter((line) => line.category === "lab" && line.markers && line.markers.length > 0)
            .map((line) => ({ id: `${record.id}-${line.id}`, record, line })),
    );

export const clinicChargeCategoryLabel = (locale: Locale, category: ClinicChargeCategory) => {
    const en: Record<ClinicChargeCategory, string> = {
        consultation: "Consultation",
        medicine: "Medicine",
        procedure: "Procedure",
        lab: "Lab",
        other: "Other",
    };
    const zh: Record<ClinicChargeCategory, string> = {
        consultation: "咨询",
        medicine: "药品",
        procedure: "程序",
        lab: "化验",
        other: "其他",
    };
    return locale === "zh" ? zh[category] : en[category];
};
