// Browser-only glue for moving JSON session-package/full-state files on/off the device
// (spec §5.4's "OS share sheet"). Deliberately NOT in src/transfer — it touches
// window/document/navigator and can't be a pure Vitest-tested function; all the actual
// merge/validation logic it calls into lives in src/transfer and is tested there.
export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadJSON(filename: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare) {
    const file = new File([json], filename, { type: "application/json" });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: filename });
        return;
      } catch {
        // user cancelled the share sheet, or the platform rejected it — fall back to download
      }
    }
  }
  downloadJSON(filename, data);
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadCSV(filename: string, csv: string): Promise<void> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare) {
    const file = new File([csv], filename, { type: "text/csv" });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: filename });
        return;
      } catch {
        // user cancelled the share sheet, or the platform rejected it — fall back to download
      }
    }
  }
  downloadCSV(filename, csv);
}

export function readJSONFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as T);
      } catch (e) {
        reject(e as Error);
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("failed to read file"));
    reader.readAsText(file);
  });
}
