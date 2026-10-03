<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;

class InvoiceService
{
    public function createInvoice(Order $order): Invoice
    {
        if ($order->invoice) {
            return $order->invoice;
        }

        return Invoice::create([
            'order_id' => $order->id,
            'invoice_number' => $this->generateInvoiceNumber(),
            'invoice_date' => now()->toDateString(),
            'subtotal' => $order->subtotal,
            'discount' => $order->coupon_discount,
            'shipping' => $order->shipping_charge,
            'tax' => $order->tax,
            'total' => $order->total,
            'paid_amount' => $order->paid_amount,
            'due_amount' => $order->due_amount,
            'status' => $order->due_amount > 0 ? ($order->paid_amount > 0 ? 'partial' : 'unpaid') : 'paid',
        ]);
    }

    public function getInvoice(Order $order): ?Invoice
    {
        return $order->invoice;
    }

    public function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-FM-' . now()->format('Ymd') . '-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Invoice::where('invoice_number', $number)->exists());

        return $number;
    }

    /**
     * PDF generation is not wired up yet in this project (no PDF library
     * confirmed configured) — the invoice page ships as print-ready
     * HTML/CSS first (spec section 21), and this method is a clear
     * extension point once a library like dompdf/barryvdh is added.
     */
    public function generatePdf(Order $order): void
    {
        throw new \RuntimeException('PDF generation is not yet configured. Use the print-ready invoice page instead.');
    }
}
