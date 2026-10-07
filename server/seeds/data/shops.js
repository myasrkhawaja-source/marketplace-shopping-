/**
 * seeds/data/shops.js  (part 1/2)
 * ---------------------------------------------------------
 * Demo sellers with a shop, a logo/cover and a catalogue.
 * Prices are in the store currency (see config/constants.js -> STORE).
 */
const img = (seed) => `https://picsum.photos/seed/${seed}/700/700`;

module.exports = [
  /* ---------------------------------------------------------------- */
  /* 1) Beauty products store                                          */
  /* ---------------------------------------------------------------- */
  {
    seller: {
      name: 'Layla Hassan',
      email: 'layla@beautymarket.com',
      phone: '0599-111-222',
      password: 'seller123',
      avatar: 'https://i.pravatar.cc/150?u=layla',
    },
    shop: {
      name: 'Glow Beauty Store',
      description:
        'A curated beauty store for skin care and makeup lovers. 100% original products with dermatologist tested formulas.',
      category: 'Beauty Store',
      city: 'Ramallah',
      address: 'Al-Manara Street, building 12',
      phone: '0599-111-222',
      whatsapp: '0599-111-222',
      instagram: '@glowbeauty.ps',
      openHours: 'Sun - Fri, 9:00 - 20:00',
      logo: img('glow-logo'),
      cover: img('glow-cover'),
    },
    products: [
      {
        name: 'Vitamin C Brightening Serum',
        description:
          'A lightweight serum with 15% vitamin C and hyaluronic acid that evens the skin tone and adds a natural glow. Suitable for all skin types, use every morning before the sunscreen.',
        shortDescription: '15% Vitamin C + Hyaluronic Acid serum',
        category: 'Skin Care',
        type: 'product',
        price: 155,
        discountPrice: 129,
        stock: 25,
        brand: 'GlowLab',
        tags: ['serum', 'vitamin c', 'brightening'],
        images: [img('serum-1'), img('serum-2'), img('serum-3')],
        isFeatured: true,
      },
      {
        name: 'Hydrating Day & Night Cream',
        description:
          'Rich moisturising cream with shea butter and ceramides. Keeps the skin hydrated for 24 hours and repairs the natural barrier.',
        shortDescription: '24h hydration with shea butter',
        category: 'Skin Care',
        type: 'product',
        price: 120,
        stock: 40,
        brand: 'GlowLab',
        tags: ['cream', 'hydration', 'dry skin'],
        images: [img('cream-1'), img('cream-2')],
      },
      {
        name: 'Mineral Sunscreen SPF 50',
        description:
          'Very light mineral sunscreen that leaves no white cast and protects against UVA/UVB. Perfect under makeup.',
        shortDescription: 'SPF 50, no white cast',
        category: 'Skin Care',
        type: 'product',
        price: 95,
        discountPrice: 79,
        stock: 60,
        brand: 'SolarSkin',
        tags: ['sunscreen', 'spf50', 'summer'],
        images: [img('sunscreen-1'), img('sunscreen-2')],
        isFeatured: true,
      },
      {
        name: 'Matte Liquid Lipstick - Rose Nude',
        description:
          'Long lasting matte lipstick, transfer proof and enriched with vitamin E so the lips stay soft. Available in the most wanted rose nude shade.',
        shortDescription: 'Transfer proof matte lipstick',
        category: 'Makeup',
        type: 'product',
        price: 65,
        stock: 80,
        brand: 'VelvetLips',
        tags: ['lipstick', 'matte', 'makeup'],
        images: [img('lipstick-1'), img('lipstick-2')],
      },
      {
        name: 'Nude Eyeshadow Palette - 12 Shades',
        description:
          'Professional palette with 12 highly pigmented nude shades, mix of matte and shimmer finishes, perfect for a daily or an evening look.',
        shortDescription: '12 pigmented nude shades',
        category: 'Makeup',
        type: 'product',
        price: 210,
        discountPrice: 175,
        stock: 18,
        brand: 'VelvetLips',
        tags: ['palette', 'eyeshadow', 'nude'],
        images: [img('palette-1'), img('palette-2')],
        isFeatured: true,
      },
      {
        name: 'Aloe & Argan Hair Mask',
        description:
          'Deep repairing hair mask with aloe vera and argan oil. Restores dry and damaged hair after the first use.',
        shortDescription: 'Repairing mask for dry hair',
        category: 'Hair Care',
        type: 'product',
        price: 85,
        stock: 35,
        brand: 'HerbalCare',
        tags: ['hair mask', 'argan', 'repair'],
        images: [img('hairmask-1')],
      },
      {
        name: 'Makeup Brush Set - 10 Pieces',
        description:
          'Soft synthetic brush set with a rose gold finish, includes brushes for the face, the eyes and the lips, with a travel pouch.',
        shortDescription: '10 soft synthetic brushes',
        category: 'Accessories',
        type: 'product',
        price: 140,
        stock: 22,
        brand: 'RoseTools',
        tags: ['brushes', 'tools', 'set'],
        images: [img('brushes-1'), img('brushes-2')],
      },
      // waiting for the admin approval (pending)
      {
        name: 'Retinol Night Repair Serum',
        description:
          'Anti-aging night serum with 0.3% retinol that reduces fine lines and improves the skin texture. Start with 2 nights per week.',
        shortDescription: '0.3% retinol night serum',
        category: 'Skin Care',
        type: 'product',
        price: 180,
        stock: 15,
        brand: 'GlowLab',
        tags: ['retinol', 'anti-aging', 'night'],
        images: [img('retinol-1')],
        status: 'pending',
      },
    ],
  },
  /* ---------------------------------------------------------------- */
  /* 2) Perfume house                                                  */
  /* ---------------------------------------------------------------- */
  {
    seller: {
      name: 'Nour Khalil',
      email: 'nour@beautymarket.com',
      phone: '0598-333-444',
      password: 'seller123',
      avatar: 'https://i.pravatar.cc/150?u=nour',
    },
    shop: {
      name: 'Aroma House Perfumes',
      description:
        'Hand crafted oriental and floral perfumes. Long lasting concentration with free gift wrapping for every order.',
      category: 'Perfume House',
      city: 'Nablus',
      address: 'Rafidia Street, next to the old market',
      phone: '0598-333-444',
      whatsapp: '0598-333-444',
      instagram: '@aromahouse.ps',
      openHours: 'Sun - Sat, 10:00 - 21:00',
      logo: img('aroma-logo'),
      cover: img('aroma-cover'),
    },
    products: [
      {
        name: 'Amber Oud Eau de Parfum 100ml',
        description:
          'A warm oriental blend of amber, oud and vanilla. Strong sillage and more than 10 hours of longevity.',
        shortDescription: 'Oriental amber & oud, 100ml',
        category: 'Perfume',
        type: 'product',
        price: 320,
        discountPrice: 269,
        stock: 30,
        brand: 'Aroma House',
        tags: ['oud', 'amber', 'oriental'],
        images: [img('oud-1'), img('oud-2'), img('oud-3')],
        isFeatured: true,
      },
      {
        name: 'Rose Musk Perfume 50ml',
        description:
          'Fresh damascena rose with a soft white musk base. A light everyday perfume for women.',
        shortDescription: 'Damascena rose & white musk',
        category: 'Perfume',
        type: 'product',
        price: 190,
        stock: 45,
        brand: 'Aroma House',
        tags: ['rose', 'musk', 'floral'],
        images: [img('rose-1'), img('rose-2')],
      },
      {
        name: 'Men Sport Eau de Toilette 100ml',
        description:
          'Aromatic woody perfume with bergamot, cedar and amber wood. A daily fresh choice for men.',
        shortDescription: 'Woody aromatic, 100ml',
        category: 'Perfume',
        type: 'product',
        price: 175,
        stock: 38,
        brand: 'Aroma House',
        tags: ['men', 'sport', 'woody'],
        images: [img('sport-1')],
      },
      {
        name: 'Body Mist Vanilla Sugar 250ml',
        description:
          'Light vanilla body mist that can be used any time of the day, perfect after the shower or before going out.',
        shortDescription: 'Sweet vanilla body mist',
        category: 'Perfume',
        type: 'product',
        price: 55,
        discountPrice: 45,
        stock: 70,
        brand: 'Aroma House',
        tags: ['mist', 'vanilla', 'body'],
        images: [img('mist-1')],
      },
    ],
  },
  /* ---------------------------------------------------------------- */
  /* 3) Salon & beauty services                                        */
  /* ---------------------------------------------------------------- */
  {
    seller: {
      name: 'Salon Noor',
      email: 'noor@beautymarket.com',
      phone: '0597-555-666',
      password: 'seller123',
      avatar: 'https://i.pravatar.cc/150?u=salonnoor',
    },
    shop: {
      name: 'Noor Beauty Salon',
      description:
        'A ladies only salon specialised in hair styling, bridal makeup and spa treatments. Booking is required one day in advance.',
      category: 'Salon',
      city: 'Ramallah',
      address: 'Al-Irsal Street, first floor',
      phone: '0597-555-666',
      whatsapp: '0597-555-666',
      instagram: '@noorbeautysalon',
      openHours: 'Sun - Sat, 10:00 - 19:00',
      logo: img('noor-logo'),
      cover: img('noor-cover'),
    },
    products: [
      {
        name: 'Bridal Hair & Makeup Package',
        description:
          'A complete bridal package: hairstyling, professional makeup with lashes, and a trial session one week before the wedding.',
        shortDescription: 'Bridal hair + makeup + trial',
        category: 'Salon Services',
        type: 'service',
        price: 850,
        discountPrice: 749,
        durationMinutes: 240,
        availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        tags: ['bridal', 'makeup', 'hair'],
        images: [img('bridal-1'), img('bridal-2')],
        isFeatured: true,
      },
      {
        name: 'Hair Cut & Blow Dry',
        description:
          'Professional hair cut with a relaxing wash and a blow dry that suits your face shape.',
        shortDescription: 'Cut + wash + blow dry',
        category: 'Salon Services',
        type: 'service',
        price: 120,
        durationMinutes: 60,
        availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        tags: ['haircut', 'blow dry'],
        images: [img('haircut-1')],
      },
      {
        name: 'Keratin Hair Treatment',
        description:
          'Smoothing keratin treatment that removes the frizz for up to 4 months, with after care instructions.',
        shortDescription: 'Smooth & frizz free for 4 months',
        category: 'Salon Services',
        type: 'service',
        price: 450,
        durationMinutes: 150,
        availableDays: ['Monday', 'Tuesday', 'Wednesday'],
        tags: ['keratin', 'treatment', 'smooth'],
        images: [img('keratin-1')],
      },
      {
        name: 'Classic Manicure & Pedicure',
        description:
          'Full nail care session: shaping, cuticle care, hand massage and a polish of your choice.',
        shortDescription: 'Hands + feet full care',
        category: 'Nail Care',
        type: 'service',
        price: 130,
        durationMinutes: 90,
        availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        tags: ['manicure', 'pedicure', 'nails'],
        images: [img('manicure-1')],
      },
      {
        name: 'Relaxing Full Body Massage 60min',
        description:
          'A 60 minutes relaxing massage with aromatic oils that releases the tension of the whole body.',
        shortDescription: '60min with aromatic oils',
        category: 'Spa & Massage',
        type: 'service',
        price: 220,
        durationMinutes: 60,
        availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        tags: ['massage', 'spa', 'relax'],
        images: [img('massage-1')],
        isFeatured: true,
      },
      {
        name: 'Hydra Facial Deep Cleansing',
        description:
          'Advanced facial that cleans the pores deeply, removes the black heads and hydrates the skin instantly.',
        shortDescription: 'Deep cleansing + hydration',
        category: 'Spa & Massage',
        type: 'service',
        price: 260,
        discountPrice: 219,
        durationMinutes: 75,
        availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        tags: ['facial', 'hydra', 'cleansing'],
        images: [img('facial-1')],
      },
    ],
  },


];
