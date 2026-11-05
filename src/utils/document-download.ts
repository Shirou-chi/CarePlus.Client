import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

export type PdfDocumentSection = {
    heading: string;
    lines?: string[];
    table?: {
        head: string[];
        body: string[][];
    };
};

const loadPdfImage = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
});

export const downloadPdfDocument = async (title: string, filename: string, sections: PdfDocumentSection[]) => {
    const document = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 16;
    const pageWidth = document.internal.pageSize.getWidth();
    const pageHeight = document.internal.pageSize.getHeight();
    let cursorY = 42;
    const logo = await loadPdfImage("/clinic-logo.png");

    document.setProperties({ title });
    document.setTextColor(11, 31, 56);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.setTextColor(0, 133, 150);
    document.text("CAREPLUS CLINIC", margin, 14);
    document.setFont("helvetica", "bold");
    document.setFontSize(17);
    document.setTextColor(11, 31, 56);
    document.text(title, margin, 24);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(90, 105, 120);
    document.text("Patient clinic report", margin, 31);
    if (logo) {
        document.addImage(logo, "PNG", pageWidth - margin - 24, 9, 24, 24);
    }
    document.setDrawColor(0, 133, 150);
    document.setLineWidth(0.6);
    document.line(margin, 37, pageWidth - margin, 37);

    sections.forEach((section) => {
        if (cursorY > pageHeight - 28) {
            document.addPage();
            cursorY = 20;
        }

        document.setFont("helvetica", "bold");
        document.setFontSize(12);
        document.setTextColor(0, 110, 125);
        document.text(section.heading, margin, cursorY);
        document.setDrawColor(220, 228, 232);
        document.setLineWidth(0.25);
        document.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 8;

        if (section.lines?.length) {
            document.setFont("helvetica", "normal");
            document.setFontSize(10);
            document.setTextColor(50, 65, 80);
            section.lines.forEach((line) => {
                const wrapped = document.splitTextToSize(line || "—", pageWidth - margin * 2);
                if (cursorY + wrapped.length * 5 > pageHeight - 18) {
                    document.addPage();
                    cursorY = 20;
                }
                document.text(wrapped, margin, cursorY);
                cursorY += wrapped.length * 5 + 2;
            });
            cursorY += 3;
        }

        if (section.table) {
            autoTable(document, {
                startY: cursorY,
                margin: { left: margin, right: margin },
                head: [section.table.head],
                body: section.table.body,
                theme: "grid",
                styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: [11, 31, 56] },
                headStyles: { fillColor: [0, 110, 125], textColor: [255, 255, 255], fontStyle: "bold" },
                alternateRowStyles: { fillColor: [245, 248, 250] },
            });
            const lastTable = (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
            cursorY = (lastTable?.finalY ?? cursorY) + 8;
        }
    });

    const pageCount = document.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
        document.setPage(page);
        document.setFont("helvetica", "normal");
        document.setFontSize(8);
        document.setTextColor(90, 105, 120);
        document.text(`CarePlus Clinic · ${page} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    document.save(filename);
};

export const printHtmlDocument = (title: string, bodyHtml: string) => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
        return;
    }
    win.opener = null;
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #0b1f38; line-height: 1.5; }
  h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
  th, td { border: 1px solid #d0d5dd; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.875rem; }
  th { background: #f4f6f8; }
  .muted { color: #456f75; font-size: 0.875rem; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
};
