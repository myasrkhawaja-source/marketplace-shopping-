/**
 * seeds/seed.js
 * ---------------------------------------------------------
 * Fills the database with demo data so every screen of the
 * project has something to show.
 *
 *   npm run seed           -> wipe + insert demo data
 *   npm run seed:destroy   -> only wipe the database
 *
 * It works with a local MongoDB, MongoDB Atlas or the in-memory
 * database (USE_MEMORY_DB=true).
 */
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User, Shop, Category, Product, Order, Review, Cart } = require('../src/models');
const orderService = require('../src/services/order.service');
const ratingService = require('../src/services/rating.service');
const categoriesData = require('./data/categories');
const shopsData = require('./data/shops');
const {
  ROLES,
  SHOP_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} = require('../src/config/constants');

const logger = {
  info: (msg) => console.log(`   ${msg}`),
  step: (msg) => console.log(`\n▶ ${msg}`),
  done: (msg) => console.log(`✅ ${msg}`),
};

/** Remove everything (used before inserting + by the destroy script). */
const wipeDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
  ]);
  logger.done('Database cleaned');
};

/** 1) Categories -------------------------------------------------- */
const seedCategories = async () => {
  const created = await Category.create(categoriesData);
  const map = created.reduce((acc, category) => ({ ...acc, [category.name]: category._id }), {});
  logger.done(`${created.length} categories created`);
  return map;
};

/** 2) Admin ------------------------------------------------------- */
const seedAdmin = async () =>
  User.create({
    name: 'Marketplace Admin',
    email: 'admin@beautymarket.com',
    password: 'admin123',
    phone: '0590-000-000',
    role: ROLES.ADMIN,
    avatar: 'https://i.pravatar.cc/150?u=admin',
  });

/** 3) Sellers + shops + their catalogue ---------------------------- */
const seedShops = async (categoryMap) => {
  const shops = [];
  const products = [];

  for (const entry of shopsData) {
    // eslint-disable-next-line no-await-in-loop
    const seller = await User.create({
      ...entry.seller,
      role: ROLES.SELLER,
    });

    // eslint-disable-next-line no-await-in-loop
    const shop = await Shop.create({
      ...entry.shop,
      owner: seller._id,
      status: SHOP_STATUS.APPROVED,
    });

    const productDocs = entry.products
      .map((product) => {
        const categoryId = categoryMap[product.category];
        if (!categoryId) {
          console.warn(`   ⚠️  Category "${product.category}" not found, product skipped`);
          return null;
        }
        return {
          ...product,
          category: categoryId,
          seller: seller._id,
          shop: shop._id,
          city: product.city || shop.city,
          status: product.status || 'approved',
          soldCount: Math.floor(Math.random() * 25),
          viewsCount: Math.floor(Math.random() * 300) + 20,
        };
      })
      .filter(Boolean);

    // insertMany skips the pre('save') hooks (no slug), so create one by one
    for (const data of productDocs) {
      // eslint-disable-next-line no-await-in-loop
      const doc = await Product.create(data);
      products.push(doc);
    }

    shop.productsCount = productDocs.length;
    // eslint-disable-next-line no-await-in-loop
    await shop.save();

    shops.push({ shop, seller });
    logger.info(`👤 ${seller.name} → 🏪 ${shop.name} (${productDocs.length} offers)`);
  }

  logger.done(`${shops.length} sellers / shops created`);
  return { shops, products };
};

/** 4) Customers --------------------------------------------------- */
const seedCustomers = async () => {
  const customers = [];
  customers.push(
    await User.create({
      name: 'Sara Ahmad',
      email: 'sara@example.com',
      password: 'customer123',
      phone: '0595-123-456',
      role: ROLES.CUSTOMER,
      avatar: 'https://i.pravatar.cc/150?u=sara',
      addresses: [
        {
          label: 'Home',
          fullName: 'Sara Ahmad',
          phone: '0595-123-456',
          city: 'Ramallah',
          street: 'Ein Misbah',
          details: 'Building 4, second floor',
          isDefault: true,
        },
      ],
    })
  );

  customers.push(
    await User.create({
      name: 'Mona Yousef',
      email: 'mona@example.com',
      password: 'customer123',
      phone: '0594-777-888',
      role: ROLES.CUSTOMER,
      avatar: 'https://i.pravatar.cc/150?u=mona',
      addresses: [
        {
          label: 'Home',
          fullName: 'Mona Yousef',
          phone: '0594-777-888',
          city: 'Nablus',
          street: 'Rafidia',
          details: 'Near the university gate',
          isDefault: true,
        },
      ],
    })
  );

  customers.push(
    await User.create({
      name: 'Rami Adel',
      email: 'rami@example.com',
      password: 'customer123',
      phone: '0592-222-333',
      role: ROLES.CUSTOMER,
      avatar: 'https://i.pravatar.cc/150?u=rami',
      addresses: [
        {
          label: 'Work',
          fullName: 'Rami Adel',
          phone: '0592-222-333',
          city: 'Ramallah',
          street: 'Al-Irsal Street',
          details: 'Office 12',
          isDefault: true,
        },
      ],
    })
  );

  logger.done(`${customers.length} customers created`);
  return customers;
};

/** 5) Reviews (and the matching average ratings) -------------------- */
const seedReviews = async (customers, products) => {
  const comments = [
    'Amazing quality, exactly like the description. I will order again for sure!',
    'Very fast delivery and a nice packaging. Highly recommended.',
    'The quality is good but it took a while to arrive.',
    'Perfect for my skin type, I noticed a difference after one week.',
    'Great value for money, the seller answered all my questions.',
    'The service was professional and the salon was very clean.',
    'Nice product, but I expected a bigger size for this price.',
  ];

  const approved = products.filter((product) => product.status === 'approved');
  let count = 0;

  for (const customer of customers) {
    // every customer reviews a few random products
    const shuffled = [...approved].sort(() => Math.random() - 0.5).slice(0, 5);

    for (const product of shuffled) {
      const rating = [5, 5, 4, 4, 3][Math.floor(Math.random() * 5)];
      // eslint-disable-next-line no-await-in-loop
      await Review.create({
        user: customer._id,
        product: product._id,
        rating,
        comment: comments[Math.floor(Math.random() * comments.length)],
        isVerifiedPurchase: Math.random() > 0.4,
      });
      count += 1;

      // a product review is also a shop review (only once per customer+shop)
      // eslint-disable-next-line no-await-in-loop
      const already = await Review.findOne({ user: customer._id, shop: product.shop });
      if (!already) {
        // eslint-disable-next-line no-await-in-loop
        await Review.create({
          user: customer._id,
          shop: product.shop,
          rating,
          comment: comments[Math.floor(Math.random() * comments.length)],
        });
      }
    }
  }

  // refresh the average rating on every product and shop
  for (const product of approved) {
    // eslint-disable-next-line no-await-in-loop
    await ratingService.recalculateProductRating(product._id);
  }
  const shopIds = [...new Set(approved.map((product) => String(product.shop)))];
  for (const shopId of shopIds) {
    // eslint-disable-next-line no-await-in-loop
    await ratingService.recalculateShopRating(shopId);
  }

  logger.done(`${count} reviews created and ratings recalculated`);
};

/** 6) Orders (products + service bookings) -------------------------- */
const seedOrders = async (customers, products) => {
  const byName = (part) =>
    products.find((product) => product.name.toLowerCase().includes(part.toLowerCase()));

  const futureDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(11, 0, 0, 0);
    return date;
  };

  const address = (customer) => {
    const home = customer.addresses[0];
    return {
      fullName: home.fullName || customer.name,
      phone: home.phone || customer.phone,
      city: home.city,
      street: home.street,
      details: home.details,
    };
  };

  const created = [];

  // (1) Sara : a delivered & paid order (2 different shops)
  created.push(
    await orderService.createOrder({
      customerId: customers[0]._id,
      items: [
        { product: byName('Vitamin C')._id, quantity: 2 },
        { product: byName('Rose Musk')._id, quantity: 1 },
      ],
      shippingAddress: address(customers[0]),
      paymentMethod: 'card',
      notes: 'Please call me before the delivery',
    })
  );

  // (2) Sara : a fresh pending order (one product)
  created.push(
    await orderService.createOrder({
      customerId: customers[0]._id,
      items: [{ product: byName('Sunscreen')._id, quantity: 1 }],
      shippingAddress: address(customers[0]),
      paymentMethod: 'cash',
    })
  );

  // (3) Mona : shipped & paid
  created.push(
    await orderService.createOrder({
      customerId: customers[1]._id,
      items: [
        { product: byName('Palette')._id, quantity: 1 },
        { product: byName('Body Mist')._id, quantity: 3 },
      ],
      shippingAddress: address(customers[1]),
      paymentMethod: 'card',
    })
  );

  // (4) Rami : two booked services at the salon (completed)
  created.push(
    await orderService.createOrder({
      customerId: customers[2]._id,
      items: [
        { product: byName('Massage')._id, quantity: 1, bookingDate: futureDays(-4), bookingTime: '11:00' },
        { product: byName('Hydra Facial')._id, quantity: 1, bookingDate: futureDays(-2), bookingTime: '16:30' },
      ],
      shippingAddress: address(customers[2]),
      paymentMethod: 'cash',
      notes: 'First visit - please confirm by phone',
    })
  );

  // (5) Mona : an order cancelled by the customer
  created.push(
    await orderService.createOrder({
      customerId: customers[1]._id,
      items: [{ product: byName('Hair Mask')._id, quantity: 1 }],
      shippingAddress: address(customers[1]),
      paymentMethod: 'cash',
    })
  );

  /* ---- move the orders forward in the status flow ---- */
  const [delivered, pending, shipped, completed, cancelled] = created;

  delivered.pushStatus(ORDER_STATUS.CONFIRMED, 'Order confirmed by the seller');
  delivered.pushStatus(ORDER_STATUS.PROCESSING, 'Preparing your package');
  delivered.pushStatus(ORDER_STATUS.SHIPPED, 'Handed to the delivery company');
  delivered.pushStatus(ORDER_STATUS.DELIVERED, 'Delivered successfully');
  delivered.paymentStatus = PAYMENT_STATUS.PAID;
  await delivered.save();

  await pending.save(); // stays pending on purpose (admin/seller demo)

  shipped.pushStatus(ORDER_STATUS.CONFIRMED, 'Order confirmed');
  shipped.pushStatus(ORDER_STATUS.PROCESSING, 'Preparing your package');
  shipped.pushStatus(ORDER_STATUS.SHIPPED, 'On the way to Nablus');
  shipped.paymentStatus = PAYMENT_STATUS.PAID;
  await shipped.save();

  completed.pushStatus(ORDER_STATUS.CONFIRMED, 'Booking confirmed by the salon');
  completed.pushStatus(ORDER_STATUS.COMPLETED, 'Services completed, thank you!');
  completed.paymentStatus = PAYMENT_STATUS.PAID;
  await completed.save();

  await orderService.restoreStock(cancelled);
  cancelled.pushStatus(ORDER_STATUS.CANCELLED, 'Cancelled by the customer');
  cancelled.cancelReason = 'I changed my mind about the product';
  await cancelled.save();

  /* ---- update the total sales of every shop ---- */
  const shops = await Shop.find();
  for (const shop of shops) {
    // eslint-disable-next-line no-await-in-loop
    const revenue = await Order.aggregate([
      { $match: { status: { $nin: [ORDER_STATUS.CANCELLED] } } },
      { $unwind: '$items' },
      { $match: { 'items.shop': shop._id } },
      { $group: { _id: null, total: { $sum: '$items.lineTotal' } } },
    ]);
    shop.totalSales = revenue[0]?.total || 0;
    // eslint-disable-next-line no-await-in-loop
    await shop.save();
  }

  logger.done(`${created.length} orders created (pending, shipped, delivered, completed, cancelled)`);
};

/** 7) Orchestration ready to be reused (server auto-seed / CLI) ------ */
/**
 * Insert the demo data. The database must ALREADY be connected.
 * Exported so `server.js` can auto-seed an empty in-memory database
 * on startup (great for a quick demo).
 */
const seedAll = async () => {
  logger.step('Creating categories…');
  const categoryMap = await seedCategories();

  logger.step('Creating the admin account…');
  await seedAdmin();
  logger.info('👤 Marketplace Admin → 👑 admin');

  logger.step('Creating sellers, shops and catalogues…');
  const { products } = await seedShops(categoryMap);

  logger.step('Creating customers…');
  const customers = await seedCustomers();

  logger.step('Creating reviews…');
  await seedReviews(customers, products);

  logger.step('Creating orders…');
  await seedOrders(customers, products);
};

/** Wipe + insert + print the credentials. */
const resetAndSeed = async () => {
  await wipeDatabase();
  await seedAll();
  printCredentials();
};

/** Print the demo accounts -------------------------------------- */
const printCredentials = () => {
  console.log('\n─────────────────────────────────────────────');
  console.log('🎉 Demo data is ready! Login accounts:');
  console.log('─────────────────────────────────────────────');
  console.log('👑 Admin    : admin@beautymarket.com   / admin123');
  console.log('🏪 Seller 1 : layla@beautymarket.com   / seller123   (Glow Beauty Store)');
  console.log('🏪 Seller 2 : nour@beautymarket.com    / seller123   (Aroma House Perfumes)');
  console.log('🏪 Seller 3 : noor@beautymarket.com    / seller123   (Noor Beauty Salon)');
  console.log('👤 Customer : sara@example.com         / customer123');
  console.log('👤 Customer : mona@example.com         / customer123');
  console.log('👤 Customer : rami@example.com         / customer123');
  console.log('─────────────────────────────────────────────\n');
};

/** Entry point (CLI) ---------------------------------------------- */
const main = async () => {
  const destroyOnly = process.argv.includes('--destroy');

  console.log('\n🌱 Beauty Marketplace seeder');
  console.log(`   Environment : ${env.nodeEnv}`);
  console.log(`   Database    : ${env.useMemoryDb || env.isTest ? 'in-memory' : env.mongoUri}`);

  if (env.useMemoryDb || env.isTest) {
    console.warn('⚠️  You are seeding an in-memory database: the data disappears when the script ends.');
    console.warn('   Use a local MongoDB or Atlas (MONGODB_URI in server/.env) to keep the seed data.');
  }

  await connectDB();

  if (destroyOnly) {
    await wipeDatabase();
    logger.done('Database wiped — nothing was inserted (--destroy)');
    await disconnectDB();
    return;
  }

  await resetAndSeed();

  await disconnectDB();
};

// Only run the CLI part when the file is executed directly (node seeds/seed.js)
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('\n❌ Seeding failed:', error.message);
      console.error(error);
      await disconnectDB().catch(() => {});
      process.exit(1);
    });
}

module.exports = {
  seedAll,
  resetAndSeed,
  wipeDatabase,
  printCredentials,
  seedCategories,
  seedShops,
  seedCustomers,
  seedReviews,
  seedOrders,
};


