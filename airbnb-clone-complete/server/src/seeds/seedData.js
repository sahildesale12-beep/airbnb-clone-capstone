const User = require('../models/User');
const Property = require('../models/Property');

const demoListings = [
  { title: 'Quiet stone cottage in Chail hills', description: 'A warm mountain cottage surrounded by pine forests, with a balcony for slow mornings and beautiful sunset views over the hills.', price: 4200, city: 'Chail', state: 'Himachal Pradesh', category: 'trending', propertyType: 'cabin', maxGuests: 4, bedrooms: 2, beds: 2, baths: 1, lat: 30.9648, lng: 77.1935, rating: 4.96, image: 'photo-1449158743715-0a90ebb6d2d8' },
  { title: 'Glass-view hillside villa in Kasauli', description: 'A modern hillside villa with large windows, warm lighting, a private deck and a peaceful setting close to local walking trails.', price: 6800, city: 'Kasauli', state: 'Himachal Pradesh', category: 'luxe', propertyType: 'villa', maxGuests: 6, bedrooms: 3, beds: 3, baths: 2, lat: 30.8988, lng: 76.9652, rating: 4.91, image: 'photo-1600607687939-ce8a6c25118c' },
  { title: 'Heritage home with garden in Shoghi', description: 'A character-filled heritage home with a garden, reading corners, mountain air and easy access to the quiet villages around Shimla.', price: 3600, city: 'Shoghi', state: 'Himachal Pradesh', category: 'historical homes', propertyType: 'home', maxGuests: 5, bedrooms: 2, beds: 3, baths: 2, lat: 31.0645, lng: 77.1237, rating: 4.88, image: 'photo-1449158743715-0a90ebb6d2d8' },
  { title: 'Tropical garden stay near Anjuna beach', description: 'A breezy tropical stay with leafy outdoor spaces, a shaded patio and quick access to north Goa cafes, markets and beaches.', price: 5100, city: 'Anjuna', state: 'Goa', category: 'tropical', propertyType: 'villa', maxGuests: 4, bedrooms: 2, beds: 2, baths: 2, lat: 15.5736, lng: 73.7413, rating: 4.89, image: 'photo-1600607687920-4e2a09cf159d' },
  { title: 'Private pool house in Assagao', description: 'A stylish Goan pool house with indoor-outdoor living, a sun terrace and a calm location for a relaxed weekend escape.', price: 9200, city: 'Assagao', state: 'Goa', category: 'amazing pools', propertyType: 'villa', maxGuests: 6, bedrooms: 3, beds: 3, baths: 3, lat: 15.5895, lng: 73.7654, rating: 4.97, image: 'photo-1613490493576-7fde63acd811' },
  { title: 'Cozy cedar cabin outside Manali', description: 'A cozy cedar cabin beside mountain scenery, with a small fireplace-style sitting area and scenic views after a day outdoors.', price: 3900, city: 'Manali', state: 'Himachal Pradesh', category: 'domes', propertyType: 'cabin', maxGuests: 3, bedrooms: 1, beds: 2, baths: 1, lat: 32.2396, lng: 77.1887, rating: 4.93, image: 'photo-1449158743715-0a90ebb6d2d8' },
  { title: 'Minimal apartment near Mall Road', description: 'A bright, practical apartment with a compact kitchen, work desk and a convenient location for exploring central Manali.', price: 2400, city: 'Manali', state: 'Himachal Pradesh', category: 'bed & breakfasts', propertyType: 'apartment', maxGuests: 3, bedrooms: 1, beds: 2, baths: 1, lat: 32.2432, lng: 77.1892, rating: 4.76, image: 'photo-1522708323590-d24dbb6b0267' },
  { title: 'Luxury pool villa in Lonavala', description: 'A spacious weekend villa with a private pool, barbecue-friendly outdoor area and multiple spaces for families and friends.', price: 11500, city: 'Lonavala', state: 'Maharashtra', category: 'amazing pools', propertyType: 'villa', maxGuests: 8, bedrooms: 4, beds: 5, baths: 4, lat: 18.7546, lng: 73.4062, rating: 4.9, image: 'photo-1613490493576-7fde63acd811' },
  { title: 'Arched courtyard home in Jaipur', description: 'A colourful courtyard home inspired by traditional Rajasthani architecture, close to historic streets, local food and craft shops.', price: 3300, city: 'Jaipur', state: 'Rajasthan', category: 'historical homes', propertyType: 'guesthouse', maxGuests: 4, bedrooms: 2, beds: 2, baths: 1, lat: 26.9124, lng: 75.7873, rating: 4.82, image: 'photo-1600607687939-ce8a6c25118c' },
  { title: 'Design loft in Bengaluru', description: 'A thoughtfully designed city loft with natural light, fast Wi-Fi and a convenient base for restaurants and city attractions.', price: 2800, city: 'Bengaluru', state: 'Karnataka', category: 'icons', propertyType: 'apartment', maxGuests: 2, bedrooms: 1, beds: 1, baths: 1, lat: 12.9716, lng: 77.5946, rating: 4.78, image: 'photo-1497366754035-f200968a6e72' },
  { title: 'Beachside apartment in Varkala', description: 'A relaxed coastal apartment with a balcony, sea breeze and easy access to the cliff walk, cafes and swimming spots.', price: 3100, city: 'Varkala', state: 'Kerala', category: 'tropical', propertyType: 'apartment', maxGuests: 3, bedrooms: 1, beds: 2, baths: 1, lat: 8.7379, lng: 76.7163, rating: 4.84, image: 'photo-1500375592092-40eb2168fd21' },
  { title: 'Farmhouse retreat near Pune', description: 'A peaceful countryside farmhouse with a generous lawn, simple interiors and room for a small family getaway.', price: 5700, city: 'Mulshi', state: 'Maharashtra', category: 'barns', propertyType: 'home', maxGuests: 6, bedrooms: 3, beds: 4, baths: 2, lat: 18.5236, lng: 73.5093, rating: 4.87, image: 'photo-1449158743715-0a90ebb6d2d8' },
];

async function ensureUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ name, email, password, role });
  else if (user.role !== role) { user.role = role; await user.save(); }
  return user;
}

async function seedDemoData({ force = false } = {}) {
  const existing = await Property.countDocuments();
  if (existing > 0 && !force) return { seeded: false, count: existing };

  const hosts = await Promise.all([
    ensureUser({ name: 'Parul', email: 'host@staybnb.local', password: 'HostPass123!', role: 'host' }),
    ensureUser({ name: 'Raj Thakur', email: 'raj@staybnb.local', password: 'HostPass123!', role: 'host' }),
    ensureUser({ name: 'Shivangi', email: 'shivangi@staybnb.local', password: 'HostPass123!', role: 'host' }),
  ]);
  await ensureUser({ name: 'Demo Guest', email: 'guest@staybnb.local', password: 'GuestPass123!', role: 'guest' });

  if (force) {
    await Property.deleteMany({});
  }

  const docs = demoListings.map((item, index) => ({
    title: item.title,
    description: item.description,
    images: [`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=1200&q=85`],
    price: item.price,
    location: { city: item.city, state: item.state, country: 'India', lat: item.lat, lng: item.lng },
    category: item.category,
    propertyType: item.propertyType,
    amenities: ['Wi-Fi', 'Kitchen', 'Free parking', ...(index % 2 ? ['Air conditioning'] : ['Mountain view'])],
    maxGuests: item.maxGuests,
    bedrooms: item.bedrooms,
    beds: item.beds,
    baths: item.baths,
    host: hosts[index % hosts.length]._id,
    rating: item.rating,
    isPublished: true,
  }));

  await Property.insertMany(docs);
  return { seeded: true, count: docs.length };
}

module.exports = { seedDemoData, demoListings };
