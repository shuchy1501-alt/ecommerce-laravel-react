import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import ErrorBoundary from '@/components/ErrorBoundary'

import AppShell from '@/components/layout/AppShell'
import CustomerLayout from '@/components/layout/CustomerLayout'
import CheckoutLayout from '@/components/layout/CheckoutLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import PublicAuthLayout from '@/components/layout/PublicAuthLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute from '@/routes/PublicRoute'
import NotFound from '@/pages/errors/NotFound'
import Forbidden from '@/pages/errors/Forbidden'

// Route-level code splitting: every page (admin console + storefront) is
// lazy-loaded so the initial bundle only ships what the current route needs.
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const AdminProducts = lazy(() => import('@/pages/Products'))
const AdminProductForm = lazy(() => import('@/pages/ProductForm'))
const AdminProductDetail = lazy(() => import('@/pages/ProductDetailAdmin'))
const AdminCategories = lazy(() => import('@/pages/Categories'))
const AdminSubcategories = lazy(() => import('@/pages/Subcategories'))
const AdminBrands = lazy(() => import('@/pages/Brands'))
const AdminOrders = lazy(() => import('@/pages/Orders'))
const AdminOrderDetail = lazy(() => import('@/pages/AdminOrderDetail'))
const AdminReturns = lazy(() => import('@/pages/AdminReturns'))
const AdminReturnDetail = lazy(() => import('@/pages/AdminReturnDetail'))
const AdminRefunds = lazy(() => import('@/pages/AdminRefunds'))
const AdminExchanges = lazy(() => import('@/pages/AdminExchanges'))
const AdminSales = lazy(() => import('@/pages/AdminSales'))
const FinanceDashboard = lazy(() => import('@/pages/FinanceDashboard'))
const Revenue = lazy(() => import('@/pages/Revenue'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const ExpenseCreate = lazy(() => import('@/pages/ExpenseCreate'))
const ExpenseEdit = lazy(() => import('@/pages/ExpenseEdit'))
const ExpenseCategories = lazy(() => import('@/pages/ExpenseCategories'))
const Payments = lazy(() => import('@/pages/Payments'))
const ProfitLoss = lazy(() => import('@/pages/ProfitLoss'))
const CashFlow = lazy(() => import('@/pages/CashFlow'))
const FinancialTransactions = lazy(() => import('@/pages/FinancialTransactions'))
const InventoryDashboard = lazy(() => import('@/pages/InventoryDashboard'))
const InventoryStock = lazy(() => import('@/pages/InventoryStock'))
const InventoryStockDetail = lazy(() => import('@/pages/InventoryStockDetail'))
const InventoryMovements = lazy(() => import('@/pages/InventoryMovements'))
const StockAdjustments = lazy(() => import('@/pages/StockAdjustments'))
const Suppliers = lazy(() => import('@/pages/Suppliers'))
const SupplierDetails = lazy(() => import('@/pages/SupplierDetails'))
const Purchases = lazy(() => import('@/pages/Purchases'))
const PurchaseCreate = lazy(() => import('@/pages/PurchaseCreate'))
const PurchaseDetails = lazy(() => import('@/pages/PurchaseDetails'))
const Placeholder = lazy(() => import('@/pages/Placeholder'))

const Home = lazy(() => import('@/pages/store/Home'))
const Shop = lazy(() => import('@/pages/store/Shop'))
const Search = lazy(() => import('@/pages/store/Search'))
const ProductDetail = lazy(() => import('@/pages/store/ProductDetail'))
const Cart = lazy(() => import('@/pages/store/Cart'))
const OrderConfirmation = lazy(() => import('@/pages/store/OrderConfirmation'))
const Wishlist = lazy(() => import('@/pages/store/Wishlist'))
const Login = lazy(() => import('@/pages/store/Login'))
const Register = lazy(() => import('@/pages/store/Register'))
const StorePlaceholder = lazy(() => import('@/pages/store/StorePlaceholder'))

// Checkout (Phase 8)
const CheckoutAddress = lazy(() => import('@/pages/checkout/CheckoutAddress'))
const CheckoutShipping = lazy(() => import('@/pages/checkout/CheckoutShipping'))
const CheckoutReview = lazy(() => import('@/pages/checkout/CheckoutReview'))
const CheckoutPayment = lazy(() => import('@/pages/checkout/CheckoutPayment'))

// Customer account (Phase 7)
const AccountDashboard = lazy(() => import('@/pages/account/AccountDashboard'))
const AccountProfile = lazy(() => import('@/pages/account/AccountProfile'))
const AccountAddresses = lazy(() => import('@/pages/account/AccountAddresses'))
const AddressForm = lazy(() => import('@/pages/account/AddressForm'))
const AccountWishlist = lazy(() => import('@/pages/account/AccountWishlist'))
const AccountOrders = lazy(() => import('@/pages/account/AccountOrders'))
const AccountOrderDetail = lazy(() => import('@/pages/account/AccountOrderDetail'))
const AccountReturns = lazy(() => import('@/pages/account/AccountReturns'))
const AccountReturnDetail = lazy(() => import('@/pages/account/AccountReturnDetail'))
const CreateReturn = lazy(() => import('@/pages/account/CreateReturn'))
const AccountRefunds = lazy(() => import('@/pages/account/AccountRefunds'))
const AccountReviews = lazy(() => import('@/pages/account/AccountReviews'))
const AccountSettings = lazy(() => import('@/pages/account/AccountSettings'))
const Settings = lazy(() => import('@/pages/Settings'))
const AuditLogs = lazy(() => import('@/pages/AuditLogs'))
const ChangePassword = lazy(() => import('@/pages/account/ChangePassword'))
const InvoiceView = lazy(() => import('@/pages/shared/InvoiceView'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public storefront */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/checkout" element={<ProtectedRoute />}>
                      <Route element={<CheckoutLayout />}>
                        <Route index element={<Navigate to="address" replace />} />
                        <Route path="address" element={<CheckoutAddress />} />
                        <Route path="shipping" element={<CheckoutShipping />} />
                        <Route path="review" element={<CheckoutReview />} />
                        <Route path="payment" element={<CheckoutPayment />} />
                      </Route>
                    </Route>
                    <Route element={<ProtectedRoute />}>
                      <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                    </Route>
                    <Route path="/returns" element={<StorePlaceholder title="Returns & Exchanges" description="Easy 7-day returns on unworn items with tags attached. Full self-service returns are coming soon." />} />
                    <Route path="/shipping" element={<StorePlaceholder title="Shipping Info" description="Free shipping on orders over ৳2,000. Standard delivery in 2-5 business days across Bangladesh." />} />
                    <Route path="/contact" element={<StorePlaceholder title="Contact Us" description="Reach us at support@fashionmart.com - a full contact form is on the way." />} />
                    <Route path="/faq" element={<StorePlaceholder title="FAQs" />} />
                    <Route path="/about" element={<StorePlaceholder title="About FashionMart" description="Style That Defines You - our story is being written." />} />
                    <Route path="/careers" element={<StorePlaceholder title="Careers" />} />
                    <Route path="/privacy" element={<StorePlaceholder title="Privacy Policy" />} />
                    <Route path="/terms" element={<StorePlaceholder title="Terms of Service" />} />
                    <Route path="/forgot-password" element={<StorePlaceholder title="Forgot Password" description="Password reset connects to the account API in an upcoming phase." />} />

                    {/* Customer account (Phase 7) — requires authentication */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<CustomerLayout />}>
                        <Route path="/account" element={<AccountDashboard />} />
                        <Route path="/account/profile" element={<AccountProfile />} />
                        <Route path="/account/addresses" element={<AccountAddresses />} />
                        <Route path="/account/addresses/create" element={<AddressForm />} />
                        <Route path="/account/addresses/:id/edit" element={<AddressForm />} />
                        <Route path="/account/wishlist" element={<AccountWishlist />} />
                        <Route path="/account/orders" element={<AccountOrders />} />
                        <Route path="/account/orders/:id" element={<AccountOrderDetail />} />
                        <Route path="/account/orders/:id/invoice" element={<InvoiceView />} />
                        <Route path="/account/orders/:orderId/return" element={<CreateReturn />} />
                        <Route path="/account/returns" element={<AccountReturns />} />
                        <Route path="/account/returns/:id" element={<AccountReturnDetail />} />
                        <Route path="/account/refunds" element={<AccountRefunds />} />
                        <Route path="/account/reviews" element={<AccountReviews />} />
                        <Route path="/account/settings" element={<AccountSettings />} />
                        <Route path="/account/change-password" element={<ChangePassword />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* Guest-only auth (shared by customers and admin staff) */}
                  <Route element={<PublicRoute />}>
                    <Route element={<PublicAuthLayout />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                    </Route>
                  </Route>

                  {/* Admin console */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/admin" element={<Dashboard />} />
                      <Route path="/admin/categories" element={<AdminCategories />} />
                      <Route path="/admin/subcategories" element={<AdminSubcategories />} />
                      <Route path="/admin/brands" element={<AdminBrands />} />
                      <Route path="/admin/products" element={<AdminProducts />} />
                      <Route path="/admin/products/create" element={<AdminProductForm />} />
                      <Route path="/admin/products/:id" element={<AdminProductDetail />} />
                      <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                      <Route path="/admin/orders/:id/invoice" element={<InvoiceView />} />
                      <Route path="/admin/sales" element={<AdminSales />} />
                      <Route path="/admin/returns" element={<AdminReturns />} />
                      <Route path="/admin/returns/:id" element={<AdminReturnDetail />} />
                      <Route path="/admin/refunds" element={<AdminRefunds />} />
                      <Route path="/admin/exchanges" element={<AdminExchanges />} />
                      <Route path="/admin/inventory" element={<InventoryDashboard />} />
                      <Route path="/admin/inventory/stock" element={<InventoryStock />} />
                      <Route path="/admin/inventory/stock/:id" element={<InventoryStockDetail />} />
                      <Route path="/admin/inventory/movements" element={<InventoryMovements />} />
                      <Route path="/admin/inventory/adjustments" element={<StockAdjustments />} />
                      <Route path="/admin/inventory/low-stock" element={<Navigate to="/admin/inventory/stock?stock_status=low_stock" replace />} />
                      <Route path="/admin/inventory/out-of-stock" element={<Navigate to="/admin/inventory/stock?stock_status=out_of_stock" replace />} />
                      <Route path="/admin/purchases" element={<Purchases />} />
                      <Route path="/admin/purchases/create" element={<PurchaseCreate />} />
                      <Route path="/admin/purchases/:id" element={<PurchaseDetails />} />
                      <Route path="/admin/suppliers" element={<Suppliers />} />
                      <Route path="/admin/suppliers/:id" element={<SupplierDetails />} />
                      <Route path="/admin/finance" element={<FinanceDashboard />} />
                      <Route path="/admin/finance/revenue" element={<Revenue />} />
                      <Route path="/admin/finance/expenses" element={<Expenses />} />
                      <Route path="/admin/finance/expenses/new" element={<ExpenseCreate />} />
                      <Route path="/admin/finance/expenses/:id/edit" element={<ExpenseEdit />} />
                      <Route path="/admin/finance/expense-categories" element={<ExpenseCategories />} />
                      <Route path="/admin/finance/payments" element={<Payments />} />
                      <Route path="/admin/finance/profit-loss" element={<ProfitLoss />} />
                      <Route path="/admin/finance/cash-flow" element={<CashFlow />} />
                      <Route path="/admin/finance/transactions" element={<FinancialTransactions />} />
                      <Route path="/admin/users" element={<Placeholder title="Users & Roles" />} />
                      <Route path="/admin/settings" element={<Settings />} />
                      <Route path="/admin/audit-logs" element={<AuditLogs />} />
                      <Route path="/admin/settings/profile" element={<Placeholder title="Profile Settings" />} />
                    </Route>
                  </Route>

                  <Route path="/403" element={<Forbidden />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
