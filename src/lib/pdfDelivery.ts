export interface SadhanaCardPdf {
  blob: Blob;
  fileName: string;
}

export function canSharePdf(pdf: SadhanaCardPdf): boolean {
  if (!navigator.share || !navigator.canShare || typeof File === "undefined") return false;

  try {
    const file = new File([pdf.blob], pdf.fileName, { type: pdf.blob.type });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function sharePdf(pdf: SadhanaCardPdf): Promise<void> {
  const file = new File([pdf.blob], pdf.fileName, { type: pdf.blob.type });
  await navigator.share({ files: [file], title: "Sadhana card" });
}

export function downloadPdf(pdf: SadhanaCardPdf): void {
  const url = URL.createObjectURL(pdf.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdf.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function openPdf(pdf: SadhanaCardPdf): void {
  const url = URL.createObjectURL(pdf.blob);
  const opened = window.open(url, "_blank");

  if (!opened) window.location.assign(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
}
