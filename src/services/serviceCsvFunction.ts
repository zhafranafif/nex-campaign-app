import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

type ImportCsvRequest = {
    csv: string;
}

type ExportCsvRequest = {
    month: string;
}

export type ImportCsvResponse = {
    importedCount: number;
    rejectedCount: number;
    errors: Array<{
        row: number;
        reason: string;
    }>;
}

const importCsvFunction = httpsCallable<ImportCsvRequest, ImportCsvResponse>(functions, "importCsv");
const exportCsvFunction = httpsCallable<ExportCsvRequest, { csv: string }>(functions, "exportCsv");

export const importCsv = async (file: File): Promise<ImportCsvResponse> => {
    const csv = await file.text();
    const response = await importCsvFunction({ csv });
    return response.data;
}

export const exportCsv = async (month: string): Promise<string> => {
    const response = await exportCsvFunction({ month });
    return response.data.csv;
}