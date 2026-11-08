import Papa from 'papaparse';

interface ParsedCsvRow {
    name: string;
    email: string;
    tiktok_handle: string;
    city: string;
}

interface ImportError {
    row: number;
    reason: string;
}

interface ImportResult {
    success: boolean;
    errors: ImportError[];
    validRows: ParsedCsvRow[];
}

export const parseCsv = (csvString: string): ImportResult => {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        transform: (value) => value.trim(),
    });

    return validateParsedCsv(result.data as ParsedCsvRow[], result.meta);
}

const validateParsedCsv = (data: ParsedCsvRow[], meta: Papa.ParseMeta): ImportResult => {
    const requiredHeaders = ['name', 'email', 'tiktok_handle', 'city'];
    const missingHeaders = requiredHeaders.filter(header => !meta.fields?.includes(header));
    const validRows: ParsedCsvRow[] = [];
    const errors: ImportError[] = [];
    const seenEmails = new Set<string>();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const tiktokHandleRegex = /^@[a-zA-Z0-9._]+$/;
    const nameRegex = /^[=+\-@]/

    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    data.forEach((row, index) => {
       const rowNumber = index + 2;

       const email = row.email.toLowerCase().trim();

        if (!emailRegex.test(email)) {
            errors.push({ row: rowNumber, reason: 'Invalid email format' });
            return;
        }

        if (seenEmails.has(email)) {
            errors.push({ row: rowNumber, reason: 'Duplicate email' });
            return;
        }

        if(!row.name) {
            errors.push({ row: rowNumber, reason: 'Name is required' });
            return;
        }

        if(!row.tiktok_handle) {
            errors.push({ row: rowNumber, reason: 'TikTok handle is required' });
            return;
        }

        if(!row.city) {
            errors.push({ row: rowNumber, reason: 'City is required' });
            return;
        }

        if(!row.email) {
            errors.push({ row: rowNumber, reason: 'Email is required' });
            return;
        }

        if (nameRegex.test(row.name)) {
            errors.push({ row: rowNumber, reason: 'Possible formula injection detected in name field.' });
            return;
        }
        
        if (!tiktokHandleRegex.test(row.tiktok_handle)) {
            errors.push({ row: rowNumber, reason: 'Invalid TikTok handle format.' });
            return;
        }

        seenEmails.add(email);
        validRows.push(row);
    });

    return { success: errors.length === 0, errors, validRows };
}