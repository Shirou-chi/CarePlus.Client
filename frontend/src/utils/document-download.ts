export const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

export const printHtmlDocument = (title: string, bodyHtml: string) => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
        return;
    }
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
