import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";

type ListPagerProps = {
    page: number;
    pages: number;
    from: number;
    to: number;
    total: number;
    onPage: (page: number) => void;
};

export const ListPager = ({ page, pages, from, to, total, onPage }: ListPagerProps) => {
    const { t } = useI18n();
    if (pages <= 1) return null;

    const label = t.listPageRange.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total));

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-tertiary">{label}</p>
            <div className="flex gap-2">
                <Button color="secondary" size="sm" isDisabled={page <= 1} onClick={() => onPage(page - 1)}>
                    {t.listPagePrev}
                </Button>
                <Button color="secondary" size="sm" isDisabled={page >= pages} onClick={() => onPage(page + 1)}>
                    {t.listPageNext}
                </Button>
            </div>
        </div>
    );
};
