/**
 * seeds/data/categories.js
 * ---------------------------------------------------------
 * The default categories of the marketplace (products + services).
 */
module.exports = [
  {
    name: 'Skin Care',
    slug: 'skin-care',
    description: 'Creams, serums, sunscreens and everything for a healthy glowing skin.',
    icon: '🧴',
    kind: 'product',
    sortOrder: 1,
  },
  {
    name: 'Makeup',
    slug: 'makeup',
    description: 'Foundations, lipsticks, palettes and professional makeup products.',
    icon: '💄',
    kind: 'product',
    sortOrder: 2,
  },
  {
    name: 'Perfume',
    slug: 'perfume',
    description: 'Oriental, floral and western perfumes for women and men.',
    icon: '🌸',
    kind: 'product',
    sortOrder: 3,
  },
  {
    name: 'Hair Care',
    slug: 'hair-care',
    description: 'Shampoos, oils, masks and treatments for every hair type.',
    icon: '💇‍♀️',
    kind: 'product',
    sortOrder: 4,
  },
  {
    name: 'Nail Care',
    slug: 'nail-care',
    description: 'Nail polishes, care products and nail art accessories.',
    icon: '💅',
    kind: 'product',
    sortOrder: 5,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Brushes, mirrors, hair bands and beauty tools.',
    icon: '🎀',
    kind: 'product',
    sortOrder: 6,
  },
  {
    name: 'Salon Services',
    slug: 'salon-services',
    description: 'Hair styling, coloring, makeup sessions and bridal packages.',
    icon: '✂️',
    kind: 'service',
    sortOrder: 7,
  },
  {
    name: 'Spa & Massage',
    slug: 'spa-massage',
    description: 'Relaxing massages, facials and full body spa treatments.',
    icon: '🧖‍♀️',
    kind: 'service',
    sortOrder: 8,
  },
];
