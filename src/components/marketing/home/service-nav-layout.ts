/** Width that leaves half of the next tile visible when the row overflows. */
export const peekItemWidth = (clientWidth: number, natural: number, gap: number, count: number) => {
    if (clientWidth <= 0 || natural <= 0 || count < 2) return null;
    const content = count * natural + (count - 1) * gap;
    if (content <= clientWidth + 1) return null;
    const stride = natural + gap;
    let slots = Math.max(1, Math.floor((clientWidth + gap) / stride));
    if (slots >= count) slots = count - 1;
    const width = (clientWidth - slots * gap) / (slots + 0.5);
    if (width < 64) return null;
    return width;
};
