// TEMPORARY MOCK DATA — Phase 5 storefront scaffolding.
// Replace with GET /api/categories once the Phase 6 backend endpoint exists.
// Keep this file the ONLY place mock category data lives; never inline it in components.

export const categories = [
  {
    slug: 'men',
    name: 'Men',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&q=80',
    subcategories: ['T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Jackets', 'Hoodies', 'Panjabi'],
  },
  {
    slug: 'women',
    name: 'Women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    subcategories: ['Dresses', 'Tops', 'Sarees', 'Salwar Kameez', 'Abaya', 'Jeans'],
  },
  {
    slug: 'kids',
    name: 'Kids',
    image: 'https://images.unsplash.com/photo-1519457851949-cffa0f3d8b6d?w=600&q=80',
    subcategories: ['Boys', 'Girls', 'Baby Clothing'],
  },
  {
    slug: 'shoes',
    name: 'Shoes',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    subcategories: ['Sneakers', 'Formal', 'Sandals', 'Heels', 'Boots'],
  },
  {
    slug: 'bags',
    name: 'Bags',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    subcategories: ['Handbags', 'Backpacks', 'Totes', 'Clutches'],
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80',
    subcategories: ['Watches', 'Bags', 'Belts', 'Sunglasses', 'Caps', 'Jewelry'],
  },
]

export const megaMenu = {
  MEN: ['T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Jackets', 'Hoodies', 'Panjabi'],
  WOMEN: ['Dresses', 'Tops', 'Sarees', 'Salwar Kameez', 'Abaya', 'Jeans'],
  KIDS: ['Boys', 'Girls', 'Baby Clothing'],
  SHOES: ['Sneakers', 'Formal', 'Sandals', 'Heels', 'Boots'],
  ACCESSORIES: ['Watches', 'Bags', 'Belts', 'Sunglasses', 'Caps', 'Jewelry'],
}

export const brands = ['Urban Wear', 'StyleHub', 'TrendLine', 'Elegance', 'StreetMode']

export const collections = [
  {
    slug: 'everyday-essentials',
    title: 'Everyday Essentials',
    description: 'Effortless basics built for daily wear.',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700&q=80',
  },
  {
    slug: 'street-style',
    title: 'Street Style',
    description: 'Bold layers for the city after dark.',
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=700&q=80',
  },
  {
    slug: 'office-edit',
    title: 'Office Edit',
    description: 'Sharp tailoring for the 9-to-5.',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=80',
  },
  {
    slug: 'weekend-look',
    title: 'Weekend Look',
    description: 'Relaxed fits for slower days.',
    image: 'https://images.unsplash.com/photo-1483118714900-540cf339fd46?w=700&q=80',
  },
  {
    slug: 'premium-collection',
    title: 'Premium Collection',
    description: 'Elevated fabrics, considered detail.',
    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=700&q=80',
  },
]
