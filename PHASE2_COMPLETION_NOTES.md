# FashionMart — Phase 2 সম্পূর্ণ (বাকি ১৮টা টেবিল)

এই আপডেটে Phase 2 স্পেকের মিসিং ১৮টা টেবিল সম্পূর্ণ করা হয়েছে। আগে থেকে থাকা কোনো টেবিল/মডেল/কোড পরিবর্তন করা হয়নি (শুধু `User`, `Product`, `Customer` মডেলে নতুন রিলেশনশিপ যোগ করা হয়েছে)।

## নতুন যা তৈরি হয়েছে

### Migrations (১৮টা, dependency-safe order)
`carts`, `cart_items`, `wishlists`, `wishlist_items`, `orders`, `order_items`, `payments`, `invoices`, `coupons`, `coupon_usages`, `reviews`, `returns`, `return_items`, `refunds`, `expense_categories`, `expenses`, `notifications`, `settings`

### Models (১৭টা)
`Cart`, `CartItem`, `Wishlist`, `WishlistItem`, `Order`, `OrderItem`, `Payment`, `Invoice`, `Coupon`, `CouponUsage`, `Review`, `ReturnRequest` (→ `returns` টেবিল), `ReturnItem`, `Refund`, `ExpenseCategory`, `Expense`, `Setting`

> **নোট:** `Return` PHP-এর reserved keyword, তাই ক্লাসের নাম `ReturnRequest` রাখা হয়েছে, কিন্তু `protected $table = 'returns';` দিয়ে সঠিক টেবিলের সাথে ম্যাপ করা আছে। `notifications`-এর জন্য আলাদা মডেল লাগেনি — Laravel-এর বিল্ট-ইন `DatabaseNotification` ব্যবহার হয়।

### Seeders (নতুন ৭টা)
- `DemoCustomerAccountSeeder` — একজন seeded customer (Rafiul Islam)-কে একটা লগইনযোগ্য User অ্যাকাউন্টের সাথে লিংক করে (`customer@fashionmart.test` / `password`), যাতে orders/reviews/returns-এ বাস্তবসম্মত `user_id` ব্যবহার করা যায়।
- `CouponSeeder` — ৩টা কুপন (WELCOME10, EID500, FASHION20)
- `SettingSeeder` — store_name, currency, shipping_charge ইত্যাদি ৮টা সেটিং
- `ExpenseCategorySeeder` — ৯টা ক্যাটেগরি (Salary, Rent, ...)
- `ExpenseSeeder` — ৬টা sample expense
- `OrderSeeder` — ৫টা demo order বিভিন্ন status/payment combination-এ, প্রতিটার সাথে order_items, payment (যেখানে paid), ও invoice। একটাতে coupon apply করা আছে।
- `ReviewSeeder` + `ReturnRefundSeeder` — demo customer-এর delivered অর্ডারের উপর ভিত্তি করে review এবং একটা সম্পূর্ণ return→refund cycle

`DatabaseSeeder.php` আপডেট করে সঠিক ক্রমে সব সিডার call করা হয়েছে।

## এখন মোট টেবিল সংখ্যা
আগের ২৮টা (Phase 1/2-এর প্রথম অংশ + framework/permission টেবিল) + নতুন ১৮টা = **৪৬টা**, যেটা আপনার প্রত্যাশিত সংখ্যার সাথে মিলে যায়।

## যেভাবে রান করবেন

```bash
cd backend
composer install
php artisan migrate:fresh --seed
```

## টেস্ট করার জন্য

```bash
php artisan tinker
```
```php
Order::with('items', 'payments', 'invoice')->find(1);
Review::approved()->count();
Coupon::active()->get();
```

Login credentials:
- Admin: `admin@fashionmart.test` / `password`
- Demo Customer: `customer@fashionmart.test` / `password`

## গুরুত্বপূর্ণ নোট / সীমাবদ্ধতা
1. `users` টেবিলে Phase 2 স্পেকে বলা `phone` ও `status` (enum) কলাম নেই — বর্তমান কোডে এর বদলে `is_active` (boolean) ব্যবহার হচ্ছে (Phase 1-এই এভাবে করা হয়েছিল)। এটা এই আপডেটে পরিবর্তন করা হয়নি যাতে existing auth flow না ভাঙে। চাইলে আলাদা migration দিয়ে ঠিক করে দিতে পারি।
2. `cart_items` ও `wishlist_items`-এর unique constraint-এ `variant_id` nullable হওয়ায় MySQL একাধিক NULL-কে আলাদা গণ্য করে — অর্থাৎ variant ছাড়া প্রোডাক্টের জন্য duplicate cart line তৈরি হওয়া application-level চেক (service layer) দিয়ে ঠিক করতে হবে, শুধু DB constraint দিয়ে পুরোপুরি আটকানো যাবে না।
3. Stock movement/inventory-এর সাথে order placement-এর সংযোগ (order confirm হলে stock কমা) এখনও করা হয়নি — এটা Phase 4 (checkout/order flow business logic)-এর কাজ।
4. এই sandbox-এ PHP ইনস্টল না থাকায় সরাসরি `php artisan migrate` চালিয়ে টেস্ট করা যায়নি। সব ফাইল ম্যানুয়ালি রিভিউ করে Laravel convention ও ব্র্যাকেট ব্যালেন্স নিশ্চিত করা হয়েছে, তবে আপনার লোকাল/সার্ভার এনভায়রনমেন্টে একবার migrate করে দেখে নেওয়া উচিত।
