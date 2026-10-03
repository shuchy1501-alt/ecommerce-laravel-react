<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ $title }}</title>
<style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    .meta { color: #6b7280; margin-bottom: 12px; }
    .summary { display: block; margin-bottom: 16px; }
    .summary-item { display: inline-block; width: 23%; margin-bottom: 8px; vertical-align: top; }
    .summary-label { color: #6b7280; font-size: 9px; text-transform: uppercase; }
    .summary-value { font-size: 14px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; font-size: 10px; }
    th { background: #f3f4f6; }
    tfoot td { font-weight: bold; background: #f9fafb; }
</style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">
        Generated {{ now()->format('Y-m-d H:i') }}
        @if(!empty($meta['from']) || !empty($meta['to']))
            &middot; Period: {{ $meta['from'] ?? 'All time' }} to {{ $meta['to'] ?? now()->toDateString() }}
        @endif
    </div>

    @if(!empty($summary))
    <div class="summary">
        @foreach($summary as $label => $value)
            <div class="summary-item">
                <div class="summary-label">{{ str_replace('_', ' ', is_string($label) ? $label : '') }}</div>
                <div class="summary-value">{{ is_numeric($value) ? number_format((float) $value, 2) : $value }}</div>
            </div>
        @endforeach
    </div>
    @endif

    <table>
        <thead>
            <tr>
                @foreach($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($headers) }}">No records found for the selected filters.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
