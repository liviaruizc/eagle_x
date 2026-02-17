export default function TrackSubmissionImportPanel({ isUploading, onExcelUpload }) {
    return (
        <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-600">
                Import Excel (`title`, `description`, `keywords`, `status`, `created_by_email`, `supervisor_email`, `submitted_at`, `college`, `degree`, `level`, `program`)
            </label>
            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onExcelUpload}
                className="w-full rounded border p-2 text-sm"
                disabled={isUploading}
            />
            {isUploading && <p className="mt-1 text-xs text-gray-500">Importing...</p>}
        </div>
    );
}