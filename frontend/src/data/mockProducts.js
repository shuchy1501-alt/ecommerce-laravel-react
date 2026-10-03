// TEMPORARY MOCK DATA — Phase 5 storefront scaffolding.
// Replace with GET /api/products + GET /api/products/{slug} once Phase 6
// wires up the real Laravel product API. Keep mock data isolated here —
// components and services must never define product data inline.

const img = (id) => `https://images.unsplash.com/${id}?w=900&q=80`

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SHOE_SIZES = ['38', '39', '40', '41', '42', '43', '44']

function makeVariants({ sizes, colors, basePrice, stockPattern }) {
  const variants = []
  sizes.forEach((size, si) => {
    colors.forEach((color, ci) => {
      const stock = stockPattern[(si + ci) % stockPattern.length]
      variants.push({
        sku: `SKU-${size}-${color.name.slice(0, 3).toUpperCase()}-${si}${ci}`,
        size,
        color: color.name,
        colorHex: color.hex,
        price: basePrice,
        stock,
      })
    })
  })
  return variants
}

export const products = [
  {
    id: 1,
    slug: 'urban-oversized-tshirt',
    name: 'Urban Oversized T-Shirt',
    brand: 'Urban Wear',
    category: 'men',
    subcategory: 'T-Shirts',
    price: 1290,
    oldPrice: 1590,
    rating: 4.6,
    reviewCount: 24,
    badges: ['new'],
    description:
      'A boxy, oversized tee cut from heavyweight 240gsm cotton jersey. Dropped shoulders and a ribbed crew neck give it a relaxed, street-ready silhouette that layers well under jackets.',
    specifications: { Fabric: '100% Cotton, 240gsm', Fit: 'Oversized', Care: 'Machine wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1521572163474-6864f9cf17ab'), img('photo-1576566588028-4147f3842f27'), img('photo-1503341504253-dff4815485f1')],
    colors: [{ name: 'Black', hex: '#111827' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#D8CCB4' }],
    sizes: CLOTHING_SIZES,
    minStock: 5,
    variants: makeVariants({
      sizes: CLOTHING_SIZES,
      colors: [{ name: 'Black', hex: '#111827' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#D8CCB4' }],
      basePrice: 1290,
      stockPattern: [12, 0, 3, 20, 8, 1],
    }),
  },
  {
    id: 2,
    slug: 'classic-slim-fit-shirt',
    name: 'Classic Slim Fit Shirt',
    brand: 'Elegance',
    category: 'men',
    subcategory: 'Shirts',
    price: 1890,
    oldPrice: null,
    rating: 4.8,
    reviewCount: 61,
    badges: ['best-seller'],
    description:
      'A tailored slim-fit shirt in breathable cotton poplin. Mother-of-pearl buttons and a clean spread collar make it equally at home in the office or out for dinner.',
    specifications: { Fabric: '100% Cotton Poplin', Fit: 'Slim', Care: 'Machine wash cold, iron medium', Origin: 'Bangladesh' },
    images: [img('photo-1596755094514-f87e34085b2c'), img('photo-1598033129183-c4f50c736f10'), img('photo-1620012253295-c15cc3e65df4')],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Blue', hex: '#3B5B92' }],
    sizes: CLOTHING_SIZES,
    minStock: 5,
    variants: makeVariants({
      sizes: CLOTHING_SIZES,
      colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Blue', hex: '#3B5B92' }],
      basePrice: 1890,
      stockPattern: [15, 6, 0, 2, 30],
    }),
  },
  {
    id: 3,
    slug: 'vintage-wash-denim-jeans',
    name: 'Vintage Wash Denim Jeans',
    brand: 'StreetMode',
    category: 'men',
    subcategory: 'Jeans',
    price: 2390,
    oldPrice: 2990,
    rating: 4.5,
    reviewCount: 38,
    badges: ['sale'],
    description:
      'Straight-leg jeans in rigid 12oz denim, stonewashed for a lived-in vintage finish. Reinforced stitching at the stress points for everyday durability.',
    specifications: { Fabric: '100% Cotton Denim', Fit: 'Straight', Care: 'Machine wash cold, inside out', Origin: 'Bangladesh' },
    images: [img('photo-1541099649105-f69ad21f3246'), img('photo-1542272604-787c3835535d'), img('photo-1475178626620-a4d074967452')],
    colors: [{ name: 'Indigo', hex: '#3A4A6B' }, { name: 'Black', hex: '#111827' }],
    sizes: ['30', '32', '34', '36', '38'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['30', '32', '34', '36', '38'],
      colors: [{ name: 'Indigo', hex: '#3A4A6B' }, { name: 'Black', hex: '#111827' }],
      basePrice: 2390,
      stockPattern: [10, 0, 4, 18, 2],
    }),
  },
  {
    id: 4,
    slug: 'floral-wrap-midi-dress',
    name: 'Floral Wrap Midi Dress',
    brand: 'Elegance',
    category: 'women',
    subcategory: 'Dresses',
    price: 2790,
    oldPrice: 3490,
    rating: 4.9,
    reviewCount: 87,
    badges: ['best-seller', 'sale'],
    description:
      'A flowing wrap dress in a soft floral crepe. The adjustable waist tie and midi length flatter every body type — dress it up with heels or down with sandals.',
    specifications: { Fabric: 'Crepe (Polyester blend)', Fit: 'Wrap / Regular', Care: 'Hand wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1595777457583-95e059d581b8'), img('photo-1572804013309-59a88b7e92f1'), img('photo-1490481651871-ab68de25d43d')],
    colors: [{ name: 'Rose', hex: '#E8A0BF' }, { name: 'Navy', hex: '#1F2A44' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [{ name: 'Rose', hex: '#E8A0BF' }, { name: 'Navy', hex: '#1F2A44' }],
      basePrice: 2790,
      stockPattern: [7, 2, 0, 14, 1],
    }),
  },
  {
    id: 5,
    slug: 'silk-blend-saree',
    name: 'Silk Blend Traditional Saree',
    brand: 'Elegance',
    category: 'women',
    subcategory: 'Sarees',
    price: 4590,
    oldPrice: 5990,
    rating: 4.7,
    reviewCount: 45,
    badges: ['sale'],
    description:
      'A richly woven silk-blend saree with a contrast zari border. Comes with a matching unstitched blouse piece for a complete festive look.',
    specifications: { Fabric: 'Silk Blend', Length: '6.3 meters + blouse piece', Care: 'Dry clean only', Origin: 'Bangladesh' },
    images: [img('photo-1610030469983-98e550d6193c'), img('photo-1583391733956-6c78276477e2'), img('photo-1610189844971-6e9d1a3b3e0d')],
    colors: [{ name: 'Maroon', hex: '#7C1F2E' }, { name: 'Emerald', hex: '#1E5C4A' }],
    sizes: ['Free Size'],
    minStock: 3,
    variants: makeVariants({
      sizes: ['Free Size'],
      colors: [{ name: 'Maroon', hex: '#7C1F2E' }, { name: 'Emerald', hex: '#1E5C4A' }],
      basePrice: 4590,
      stockPattern: [6, 0],
    }),
  },
  {
    id: 6,
    slug: 'essential-crop-top',
    name: 'Essential Ribbed Crop Top',
    brand: 'TrendLine',
    category: 'women',
    subcategory: 'Tops',
    price: 890,
    oldPrice: 1090,
    rating: 4.3,
    reviewCount: 29,
    badges: ['new'],
    description:
      'A stretch-ribbed crop top with a fitted silhouette and square neckline. A wardrobe staple that pairs with high-waist bottoms.',
    specifications: { Fabric: 'Cotton-Spandex Rib', Fit: 'Fitted', Care: 'Machine wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1554568218-0f1715e72254'), img('photo-1521577352947-9bb58764b69a'), img('photo-1485462537746-965f33f7f6a7')],
    colors: [{ name: 'Black', hex: '#111827' }, { name: 'Pink', hex: '#E91E63' }, { name: 'White', hex: '#FFFFFF' }],
    sizes: ['XS', 'S', 'M', 'L'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['XS', 'S', 'M', 'L'],
      colors: [{ name: 'Black', hex: '#111827' }, { name: 'Pink', hex: '#E91E63' }, { name: 'White', hex: '#FFFFFF' }],
      basePrice: 890,
      stockPattern: [20, 0, 3],
    }),
  },
  {
    id: 7,
    slug: 'kids-graphic-hoodie',
    name: 'Kids Graphic Pullover Hoodie',
    brand: 'TrendLine',
    category: 'kids',
    subcategory: 'Boys',
    price: 1190,
    oldPrice: null,
    rating: 4.4,
    reviewCount: 16,
    badges: [],
    description:
      'A cozy fleece-lined hoodie with a fun front graphic and kangaroo pocket. Built for playground durability and machine-wash ease.',
    specifications: { Fabric: 'Cotton Fleece', Fit: 'Regular', Care: 'Machine wash warm', Origin: 'Bangladesh' },
    images: [img('photo-1519278409-1f56fdda7485'), img('photo-1519457851949-cffa0f3d8b6d'), img('photo-1503944168849-c78d5b09c0e3')],
    colors: [{ name: 'Sky Blue', hex: '#5AA9E6' }, { name: 'Grey', hex: '#9CA3AF' }],
    sizes: ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
      colors: [{ name: 'Sky Blue', hex: '#5AA9E6' }, { name: 'Grey', hex: '#9CA3AF' }],
      basePrice: 1190,
      stockPattern: [9, 4, 0, 11],
    }),
  },
  {
    id: 8,
    slug: 'court-classic-sneakers',
    name: 'Court Classic Sneakers',
    brand: 'StyleHub',
    category: 'shoes',
    subcategory: 'Sneakers',
    price: 3290,
    oldPrice: 3990,
    rating: 4.7,
    reviewCount: 102,
    badges: ['best-seller', 'sale'],
    description:
      'A clean low-top sneaker in full-grain leather with a cushioned foam midsole. Perforated toe cap for breathability, all-day comfort.',
    specifications: { Upper: 'Full-grain Leather', Sole: 'Rubber / EVA foam', Care: 'Wipe clean', Origin: 'Vietnam' },
    images: [img('photo-1595950653106-6c9ebd614d3a'), img('photo-1600185365483-26d7a4cc7519'), img('photo-1549298916-b41d501d3772')],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#111827' }],
    sizes: SHOE_SIZES,
    minStock: 4,
    variants: makeVariants({
      sizes: SHOE_SIZES,
      colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#111827' }],
      basePrice: 3290,
      stockPattern: [8, 0, 2, 15, 1, 6, 0],
    }),
  },
  {
    id: 9,
    slug: 'formal-oxford-shoes',
    name: 'Formal Oxford Leather Shoes',
    brand: 'Elegance',
    category: 'shoes',
    subcategory: 'Formal',
    price: 3990,
    oldPrice: null,
    rating: 4.6,
    reviewCount: 33,
    badges: [],
    description:
      'Hand-finished oxford shoes in genuine leather with a classic cap-toe silhouette. Leather-lined for comfort through long formal days.',
    specifications: { Upper: 'Genuine Leather', Sole: 'Leather / Rubber grip', Care: 'Polish regularly', Origin: 'Bangladesh' },
    images: [img('photo-1533867617858-e7b97e060509'), img('photo-1560343090-f0409e92791a'), img('photo-1614252369475-531eba835eb1')],
    colors: [{ name: 'Black', hex: '#111827' }, { name: 'Brown', hex: '#6B4226' }],
    sizes: SHOE_SIZES,
    minStock: 4,
    variants: makeVariants({
      sizes: SHOE_SIZES,
      colors: [{ name: 'Black', hex: '#111827' }, { name: 'Brown', hex: '#6B4226' }],
      basePrice: 3990,
      stockPattern: [5, 1, 0, 9],
    }),
  },
  {
    id: 10,
    slug: 'leather-tote-bag',
    name: 'Structured Leather Tote Bag',
    brand: 'StyleHub',
    category: 'bags',
    subcategory: 'Totes',
    price: 3590,
    oldPrice: 4290,
    rating: 4.8,
    reviewCount: 54,
    badges: ['sale'],
    description:
      'A spacious structured tote in pebbled vegan leather with a zip-top closure and interior organizer pocket. Doubles as a laptop-friendly work bag.',
    specifications: { Material: 'Vegan Leather', Dimensions: '38 x 28 x 14 cm', Care: 'Wipe clean', Origin: 'Bangladesh' },
    images: [img('photo-1584917865442-de89df76afd3'), img('photo-1548036328-c9fa89d128fa'), img('photo-1591561954557-26941169b49e')],
    colors: [{ name: 'Tan', hex: '#B08968' }, { name: 'Black', hex: '#111827' }],
    sizes: ['One Size'],
    minStock: 4,
    variants: makeVariants({
      sizes: ['One Size'],
      colors: [{ name: 'Tan', hex: '#B08968' }, { name: 'Black', hex: '#111827' }],
      basePrice: 3590,
      stockPattern: [12, 3],
    }),
  },
  {
    id: 11,
    slug: 'minimalist-chrono-watch',
    name: 'Minimalist Chronograph Watch',
    brand: 'StyleHub',
    category: 'accessories',
    subcategory: 'Watches',
    price: 4290,
    oldPrice: 5290,
    rating: 4.9,
    reviewCount: 76,
    badges: ['best-seller', 'sale'],
    description:
      'A slim chronograph watch with a sunburst dial, sapphire-coated crystal, and genuine leather strap. Water resistant to 30m for everyday wear.',
    specifications: { Case: 'Stainless Steel, 40mm', Strap: 'Genuine Leather', 'Water Resistance': '30m', Origin: 'Imported' },
    images: [img('photo-1524805444758-089113d48a6d'), img('photo-1524592094714-0f0654e20314'), img('photo-1533139502658-0198f920d8e8')],
    colors: [{ name: 'Brown Strap', hex: '#6B4226' }, { name: 'Black Strap', hex: '#111827' }],
    sizes: ['One Size'],
    minStock: 3,
    variants: makeVariants({
      sizes: ['One Size'],
      colors: [{ name: 'Brown Strap', hex: '#6B4226' }, { name: 'Black Strap', hex: '#111827' }],
      basePrice: 4290,
      stockPattern: [7, 0],
    }),
  },
  {
    id: 12,
    slug: 'oversized-denim-jacket',
    name: 'Oversized Denim Jacket',
    brand: 'StreetMode',
    category: 'men',
    subcategory: 'Jackets',
    price: 2990,
    oldPrice: null,
    rating: 4.5,
    reviewCount: 19,
    badges: ['new'],
    description:
      'An oversized trucker jacket in mid-wash rigid denim with dual chest pockets. Layer it over hoodies for a street-ready silhouette.',
    specifications: { Fabric: '100% Cotton Denim', Fit: 'Oversized', Care: 'Machine wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1551028719-00167b16eac5'), img('photo-1516257984-b1b4d707412e'), img('photo-1521223890158-f9f7c3d5d504')],
    colors: [{ name: 'Mid Wash', hex: '#5B7A9D' }],
    sizes: CLOTHING_SIZES,
    minStock: 5,
    variants: makeVariants({
      sizes: CLOTHING_SIZES,
      colors: [{ name: 'Mid Wash', hex: '#5B7A9D' }],
      basePrice: 2990,
      stockPattern: [9, 0, 3, 14, 1, 6],
    }),
  },
  {
    id: 13,
    slug: 'high-waist-mom-jeans',
    name: 'High-Waist Mom Jeans',
    brand: 'TrendLine',
    category: 'women',
    subcategory: 'Jeans',
    price: 2190,
    oldPrice: 2590,
    rating: 4.6,
    reviewCount: 41,
    badges: ['sale'],
    description:
      'Vintage-inspired mom jeans with a high rise and relaxed tapered leg. Non-stretch rigid denim that softens beautifully with wear.',
    specifications: { Fabric: '100% Cotton Denim', Fit: 'High-Waist Relaxed', Care: 'Machine wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1541099649105-f69ad21f3246'), img('photo-1475178626620-a4d074967452'), img('photo-1560243563-062bfc001d68')],
    colors: [{ name: 'Light Blue', hex: '#A9C4E0' }, { name: 'Indigo', hex: '#3A4A6B' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [{ name: 'Light Blue', hex: '#A9C4E0' }, { name: 'Indigo', hex: '#3A4A6B' }],
      basePrice: 2190,
      stockPattern: [6, 2, 0, 10, 1],
    }),
  },
  {
    id: 14,
    slug: 'premium-cotton-panjabi',
    name: 'Premium Cotton Panjabi',
    brand: 'Elegance',
    category: 'men',
    subcategory: 'Panjabi',
    price: 2490,
    oldPrice: 2990,
    rating: 4.8,
    reviewCount: 58,
    badges: ['best-seller'],
    description:
      'A finely woven cotton panjabi with subtle self-stripe texture and a mandarin collar. Comfortable straight-cut fit for festive occasions.',
    specifications: { Fabric: '100% Cotton', Fit: 'Straight', Care: 'Machine wash cold', Origin: 'Bangladesh' },
    images: [img('photo-1622445275576-721325763afe'), img('photo-1620799140408-edc6dcb6d633'), img('photo-1618886614638-80e3c103d31a')],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#D8CCB4' }],
    sizes: CLOTHING_SIZES,
    minStock: 5,
    variants: makeVariants({
      sizes: CLOTHING_SIZES,
      colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#D8CCB4' }],
      basePrice: 2490,
      stockPattern: [11, 0, 4, 17],
    }),
  },
  {
    id: 15,
    slug: 'canvas-backpack',
    name: 'Everyday Canvas Backpack',
    brand: 'Urban Wear',
    category: 'bags',
    subcategory: 'Backpacks',
    price: 1990,
    oldPrice: 2390,
    rating: 4.5,
    reviewCount: 47,
    badges: ['sale'],
    description:
      'A durable waxed-canvas backpack with a padded 15" laptop sleeve, external bottle pocket, and leather trim detailing.',
    specifications: { Material: 'Waxed Canvas / Leather trim', Capacity: '22L', Care: 'Spot clean', Origin: 'Bangladesh' },
    images: [img('photo-1553062407-98eeb64c6a62'), img('photo-1622560480605-d83c853bc5c3'), img('photo-1548036328-c9fa89d128fa')],
    colors: [{ name: 'Olive', hex: '#5B6B4A' }, { name: 'Black', hex: '#111827' }],
    sizes: ['One Size'],
    minStock: 4,
    variants: makeVariants({
      sizes: ['One Size'],
      colors: [{ name: 'Olive', hex: '#5B6B4A' }, { name: 'Black', hex: '#111827' }],
      basePrice: 1990,
      stockPattern: [14, 5],
    }),
  },
  {
    id: 16,
    slug: 'polarized-aviator-sunglasses',
    name: 'Polarized Aviator Sunglasses',
    brand: 'StyleHub',
    category: 'accessories',
    subcategory: 'Sunglasses',
    price: 1290,
    oldPrice: 1690,
    rating: 4.4,
    reviewCount: 22,
    badges: ['sale'],
    description:
      'Classic aviator sunglasses with polarized UV400 lenses and a lightweight metal frame. Comes with a protective hard case.',
    specifications: { Lens: 'Polarized UV400', Frame: 'Metal Alloy', Care: 'Microfiber cloth only', Origin: 'Imported' },
    images: [img('photo-1572635196237-14b3f281503f'), img('photo-1511499767150-a48a237f0083'), img('photo-1473496169904-658ba7c44d8a')],
    colors: [{ name: 'Gold', hex: '#B98F4C' }, { name: 'Black', hex: '#111827' }],
    sizes: ['One Size'],
    minStock: 5,
    variants: makeVariants({
      sizes: ['One Size'],
      colors: [{ name: 'Gold', hex: '#B98F4C' }, { name: 'Black', hex: '#111827' }],
      basePrice: 1290,
      stockPattern: [3, 0],
    }),
  },
]

export function getAllProducts() {
  return products
}

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug) || null
}

export function getRelatedProducts(product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, limit)
}

export function queryProducts(params = {}) {
  let list = [...products]
  const { search, category, subcategory, brand, min_price, max_price, size, color, sort, page = 1, per_page = 12 } = params

  if (search) {
    const q = search.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.subcategory.toLowerCase().includes(q))
  }
  if (category) list = list.filter((p) => p.category === category)
  if (subcategory) list = list.filter((p) => p.subcategory.toLowerCase() === String(subcategory).toLowerCase())
  if (brand) {
    const brandList = Array.isArray(brand) ? brand : [brand]
    list = list.filter((p) => brandList.includes(p.brand))
  }
  if (min_price) list = list.filter((p) => p.price >= Number(min_price))
  if (max_price) list = list.filter((p) => p.price <= Number(max_price))
  if (size) {
    const sizeList = Array.isArray(size) ? size : [size]
    list = list.filter((p) => p.sizes.some((s) => sizeList.includes(s)))
  }
  if (color) {
    const colorList = Array.isArray(color) ? color : [color]
    list = list.filter((p) => p.colors.some((c) => colorList.includes(c.name)))
  }

  switch (sort) {
    case 'newest':
      list = list.filter((p) => p.badges.includes('new')).concat(list.filter((p) => !p.badges.includes('new')))
      break
    case 'price_low':
      list = list.sort((a, b) => a.price - b.price)
      break
    case 'price_high':
      list = list.sort((a, b) => b.price - a.price)
      break
    case 'best_selling':
      list = list.filter((p) => p.badges.includes('best-seller')).concat(list.filter((p) => !p.badges.includes('best-seller')))
      break
    case 'top_rated':
      list = list.sort((a, b) => b.rating - a.rating)
      break
    default:
      break
  }

  const total = list.length
  const start = (Number(page) - 1) * Number(per_page)
  const paginated = list.slice(start, start + Number(per_page))

  return {
    data: paginated,
    meta: { total, page: Number(page), per_page: Number(per_page), last_page: Math.max(1, Math.ceil(total / per_page)) },
  }
}

export function stockLabel(stock, minStock) {
  if (stock <= 0) return { label: 'Out of Stock', tone: 'danger' }
  if (stock <= minStock) return { label: `Only ${stock} left`, tone: 'warning' }
  return { label: 'In Stock', tone: 'success' }
}
