import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@matsumatcha.com' },
    update: {},
    create: {
      email: 'admin@matsumatcha.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Marukyu Koyamaen',
        country: 'Japan',
        currency: 'JPY',
        typicalLeadTimeDays: 21,
        reliabilityScore: 0.95,
        minOrderKg: 10,
        notes: 'Premium Uji supplier, established 1688',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Aiya Co., Ltd.',
        country: 'Japan',
        currency: 'JPY',
        typicalLeadTimeDays: 18,
        reliabilityScore: 0.92,
        minOrderKg: 15,
        notes: 'Nishio region specialist',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Ippodo Tea Co.',
        country: 'Japan',
        currency: 'JPY',
        typicalLeadTimeDays: 25,
        reliabilityScore: 0.88,
        minOrderKg: 5,
        notes: 'Kyoto-based, premium ceremonial grades',
      },
    }),
  ]);
  console.log('✅ Created', suppliers.length, 'suppliers');

  // Create SKUs
  const skus = await Promise.all([
    prisma.matchaSKU.create({
      data: {
        name: 'Uji Hikari Competition',
        qualityTier: 'COMPETITION',
        tastingNotes: 'Intense umami, creamy, no bitterness',
        intendedUse: 'STRAIGHT',
        substitutableGroupId: 'competition-grade',
        active: true,
      },
    }),
    prisma.matchaSKU.create({
      data: {
        name: 'Nishio Ceremonial',
        qualityTier: 'CEREMONIAL',
        tastingNotes: 'Balanced umami and sweetness, vibrant green',
        intendedUse: 'BOTH',
        substitutableGroupId: 'ceremonial-grade',
        active: true,
      },
    }),
    prisma.matchaSKU.create({
      data: {
        name: 'Kyoto Premium Ceremonial',
        qualityTier: 'CEREMONIAL',
        tastingNotes: 'Rich umami, slight astringency, traditional flavor',
        intendedUse: 'STRAIGHT',
        substitutableGroupId: 'ceremonial-grade',
        active: true,
      },
    }),
    prisma.matchaSKU.create({
      data: {
        name: 'Cafe Blend Premium',
        qualityTier: 'CAFE',
        tastingNotes: 'Bold flavor, holds up in milk, slight bitterness',
        intendedUse: 'LATTE',
        substitutableGroupId: 'cafe-grade',
        active: true,
      },
    }),
    prisma.matchaSKU.create({
      data: {
        name: 'Everyday Cafe Grade',
        qualityTier: 'CAFE',
        tastingNotes: 'Good color, mild flavor, cost-effective',
        intendedUse: 'LATTE',
        substitutableGroupId: 'cafe-grade',
        active: true,
      },
    }),
  ]);
  console.log('✅ Created', skus.length, 'SKUs');

  // Create supplier offers
  const offers = await Promise.all([
    // Marukyu offers
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[0].id,
        skuId: skus[0].id, // Competition
        costJpyPerKg: 28000,
        moqKg: 10,
      },
    }),
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[0].id,
        skuId: skus[1].id, // Ceremonial
        costJpyPerKg: 18000,
        moqKg: 10,
      },
    }),
    // Aiya offers
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[1].id, // Ceremonial
        costJpyPerKg: 16500,
        moqKg: 15,
      },
    }),
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[3].id, // Cafe Blend
        costJpyPerKg: 8500,
        moqKg: 20,
      },
    }),
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[4].id, // Everyday Cafe
        costJpyPerKg: 6000,
        moqKg: 25,
      },
    }),
    // Ippodo offers
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[2].id,
        skuId: skus[0].id, // Competition
        costJpyPerKg: 32000,
        moqKg: 5,
      },
    }),
    prisma.supplierSKUOffer.create({
      data: {
        supplierId: suppliers[2].id,
        skuId: skus[2].id, // Kyoto Ceremonial
        costJpyPerKg: 20000,
        moqKg: 5,
      },
    }),
  ]);
  console.log('✅ Created', offers.length, 'supplier offers');

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Zen Cafe Singapore',
        segment: 'CAFE',
        defaultDiscountPct: 5,
        paymentTerms: 'Net 30',
        notes: 'Premium cafe chain, 5 locations',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Green Leaf Bakery',
        segment: 'CAFE',
        defaultDiscountPct: 0,
        paymentTerms: 'Net 15',
        notes: 'Artisan bakery, matcha pastries',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Matcha & Co Retail',
        segment: 'BRAND',
        defaultDiscountPct: 10,
        paymentTerms: 'Net 45',
        notes: 'Private label partner, retail distribution',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Pacific Tea House',
        segment: 'CAFE',
        defaultDiscountPct: 3,
        paymentTerms: 'Net 30',
        notes: 'Traditional tea house, high-end clientele',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Sakura Sweets Factory',
        segment: 'OTHER',
        defaultDiscountPct: 8,
        paymentTerms: 'Net 30',
        notes: 'Industrial bakery, high volume',
      },
    }),
  ]);
  console.log('✅ Created', clients.length, 'clients');

  // Create FX rates (historical)
  const fxRates = [];
  const baseRate = 0.009; // 1 JPY = 0.009 SGD
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * 0.0005; // ±0.0005 variation
    fxRates.push(
      prisma.fXRate.create({
        data: {
          base: 'JPY',
          quote: 'SGD',
          rate: baseRate + variation,
          source: 'MANUAL',
          timestamp: date,
        },
      })
    );
  }
  await Promise.all(fxRates);
  console.log('✅ Created', fxRates.length, 'FX rate entries');

  // Get latest FX rate for calculations
  const latestFxRate = baseRate;

  // Create client contract lines
  const contractLines = await Promise.all([
    // Zen Cafe - high volume cafe grade
    prisma.clientContractLine.create({
      data: {
        clientId: clients[0].id,
        skuId: skus[3].id, // Cafe Blend
        sellingSgdPerKg: 180,
        discountPct: 5,
        monthlyVolumeKg: 50,
        deliveryFrequency: 'BIWEEKLY',
        nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    // Green Leaf - ceremonial for premium items
    prisma.clientContractLine.create({
      data: {
        clientId: clients[1].id,
        skuId: skus[1].id, // Ceremonial
        sellingSgdPerKg: 320,
        discountPct: 0,
        monthlyVolumeKg: 15,
        deliveryFrequency: 'MONTHLY',
        nextDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    // Matcha & Co - retail brand, ceremonial
    prisma.clientContractLine.create({
      data: {
        clientId: clients[2].id,
        skuId: skus[2].id, // Kyoto Ceremonial
        sellingSgdPerKg: 350,
        discountPct: 10,
        monthlyVolumeKg: 30,
        deliveryFrequency: 'MONTHLY',
        nextDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    }),
    // Pacific Tea House - competition grade
    prisma.clientContractLine.create({
      data: {
        clientId: clients[3].id,
        skuId: skus[0].id, // Competition
        sellingSgdPerKg: 550,
        discountPct: 3,
        monthlyVolumeKg: 8,
        deliveryFrequency: 'MONTHLY',
        nextDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    }),
    // Sakura Sweets - high volume everyday
    prisma.clientContractLine.create({
      data: {
        clientId: clients[4].id,
        skuId: skus[4].id, // Everyday Cafe
        sellingSgdPerKg: 120,
        discountPct: 8,
        monthlyVolumeKg: 100,
        deliveryFrequency: 'WEEKLY',
        nextDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('✅ Created', contractLines.length, 'contract lines');

  // Helper function to calculate landed cost
  const calcLandedCost = (costJpy: number, fxRate: number) => {
    const powderCostSgd = costJpy * fxRate;
    const shipping = 15;
    const subtotal = powderCostSgd + shipping;
    const tax = subtotal * 0.09;
    return subtotal + tax;
  };

  // Create inventory lots
  const inventoryLots = await Promise.all([
    // Competition grade from Marukyu
    prisma.inventoryLot.create({
      data: {
        supplierId: suppliers[0].id,
        skuId: skus[0].id,
        arrivedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        qtyKgTotal: 20,
        qtyKgRemaining: 12,
        costBasisSgdPerKg: calcLandedCost(28000, latestFxRate),
        warehouseLocation: 'A1-01',
      },
    }),
    // Ceremonial from Aiya
    prisma.inventoryLot.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[1].id,
        arrivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        qtyKgTotal: 30,
        qtyKgRemaining: 22,
        costBasisSgdPerKg: calcLandedCost(16500, latestFxRate),
        warehouseLocation: 'A2-01',
      },
    }),
    // Kyoto Ceremonial from Ippodo
    prisma.inventoryLot.create({
      data: {
        supplierId: suppliers[2].id,
        skuId: skus[2].id,
        arrivedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        qtyKgTotal: 15,
        qtyKgRemaining: 8,
        costBasisSgdPerKg: calcLandedCost(20000, latestFxRate),
        warehouseLocation: 'A2-02',
      },
    }),
    // Cafe Blend from Aiya
    prisma.inventoryLot.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[3].id,
        arrivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        qtyKgTotal: 80,
        qtyKgRemaining: 65,
        costBasisSgdPerKg: calcLandedCost(8500, latestFxRate),
        warehouseLocation: 'B1-01',
      },
    }),
    // Everyday Cafe from Aiya - LOW STOCK
    prisma.inventoryLot.create({
      data: {
        supplierId: suppliers[1].id,
        skuId: skus[4].id,
        arrivedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        qtyKgTotal: 100,
        qtyKgRemaining: 25, // Low - will trigger reorder recommendation
        costBasisSgdPerKg: calcLandedCost(6000, latestFxRate),
        warehouseLocation: 'B2-01',
      },
    }),
  ]);
  console.log('✅ Created', inventoryLots.length, 'inventory lots');

  // Create allocations
  const allocations = await Promise.all([
    // Pacific Tea House - Competition
    prisma.allocation.create({
      data: {
        inventoryLotId: inventoryLots[0].id,
        clientId: clients[3].id,
        skuId: skus[0].id,
        qtyKgAllocated: 8,
        status: 'RESERVED',
      },
    }),
    // Green Leaf - Ceremonial
    prisma.allocation.create({
      data: {
        inventoryLotId: inventoryLots[1].id,
        clientId: clients[1].id,
        skuId: skus[1].id,
        qtyKgAllocated: 15,
        status: 'RESERVED',
      },
    }),
    // Matcha & Co - Kyoto Ceremonial
    prisma.allocation.create({
      data: {
        inventoryLotId: inventoryLots[2].id,
        clientId: clients[2].id,
        skuId: skus[2].id,
        qtyKgAllocated: 30, // Over-allocated! Will trigger recommendation
        status: 'RESERVED',
      },
    }),
    // Zen Cafe - Cafe Blend
    prisma.allocation.create({
      data: {
        inventoryLotId: inventoryLots[3].id,
        clientId: clients[0].id,
        skuId: skus[3].id,
        qtyKgAllocated: 50,
        status: 'RESERVED',
      },
    }),
    // Sakura Sweets - Everyday (partial)
    prisma.allocation.create({
      data: {
        inventoryLotId: inventoryLots[4].id,
        clientId: clients[4].id,
        skuId: skus[4].id,
        qtyKgAllocated: 20,
        status: 'RESERVED',
      },
    }),
  ]);
  console.log('✅ Created', allocations.length, 'allocations');

  console.log('\n🍵 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 admin user (admin@matsumatcha.com / admin123)`);
  console.log(`   - ${suppliers.length} suppliers`);
  console.log(`   - ${skus.length} SKUs`);
  console.log(`   - ${offers.length} supplier offers`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${contractLines.length} contract lines`);
  console.log(`   - ${inventoryLots.length} inventory lots`);
  console.log(`   - ${allocations.length} allocations`);
  console.log(`   - ${fxRates.length} FX rate entries`);
  console.log('\n💡 This seed data will generate at least 5 recommendations:');
  console.log('   - Reorder alert for Everyday Cafe (low stock)');
  console.log('   - Over-allocation warning for Kyoto Ceremonial');
  console.log('   - Supplier swap opportunities (Aiya vs Marukyu for Ceremonial)');
  console.log('   - SKU swap suggestions for low-margin contracts');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
