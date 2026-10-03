<?php

namespace App\Services;

use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Generic CSV/PDF export used by every report (spec section 12).
 *
 * Callers pass already-filtered/sorted data — never the whole table — via
 * a Generator/cursor for CSV (so a 100k-row export never holds everything
 * in memory at once) or a bounded array for PDF (PDFs are meant to be
 * printed/skimmed, so callers should cap row count before calling toPdf).
 *
 * PDF rendering requires `barryvdh/laravel-dompdf` (not bundled with this
 * project by default). Install it once with:
 *   composer require barryvdh/laravel-dompdf
 * If it isn't installed, toPdf() returns a 501 JSON error instead of a
 * broken binary, so CSV export keeps working either way.
 */
class ReportExportService
{
    /**
     * @param  string  $filename  without extension
     * @param  string[]  $headers  column headers, in order
     * @param  iterable<array<int, scalar|null>>  $rows  each row is a plain array matching $headers order
     */
    public function toCsv(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        $callback = function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        $safeName = Str::slug($filename).'-'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload($callback, $safeName, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    /**
     * @param  array  $data  ['title' => ..., 'headers' => [...], 'rows' => [...], 'summary' => [...], 'meta' => [...]]
     */
    public function toPdf(string $filename, array $data)
    {
        $pdfClass = 'Barryvdh\\DomPDF\\Facade\\Pdf';

        if (! class_exists($pdfClass)) {
            return response()->json([
                'success' => false,
                'message' => 'PDF export requires the "barryvdh/laravel-dompdf" package. Run: composer require barryvdh/laravel-dompdf',
                'code' => 'PDF_ENGINE_MISSING',
            ], 501);
        }

        $safeName = Str::slug($filename).'-'.now()->format('Ymd_His').'.pdf';

        /** @var \Barryvdh\DomPDF\PDF $pdf */
        $pdf = $pdfClass::loadView('reports.pdf', $data)->setPaper('a4', 'landscape');

        return $pdf->download($safeName);
    }
}
