export interface Report {
    id: number;
    userId: number;
    period: string;
    reportType: string;
    filePath: string | null;
    format: string;
    createdAt: string;
    updatedAt: string;
}