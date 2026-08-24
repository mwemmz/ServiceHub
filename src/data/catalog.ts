import type { Category, CategoryId, Service } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'beauty',
    name: 'Beauty Services',
    shortName: 'Beauty & Cosmetics',
    description: 'Hair, nails, makeup and beauty services at your convenience.',
    accent: '#D97B78',
    background: '#F8E4E0',
    icon: 'sparkles-outline',
  },
  {
    id: 'cleaning',
    name: 'Cleaning Services',
    shortName: 'Cleaning',
    description: 'Professional cleaning services for homes, offices and gardens.',
    accent: '#6AA36A',
    background: '#DCEBD8',
    icon: 'leaf-outline',
  },
  {
    id: 'repair',
    name: 'Repair Services',
    shortName: 'Repair',
    description: 'Quick and reliable repair services for your home and devices.',
    accent: '#5B8FB8',
    background: '#D9E6F2',
    icon: 'construct-outline',
  },
];

function service(
  id: string,
  categoryId: CategoryId,
  group: string,
  name: string,
  description: string,
  startingPrice: number,
  durationMinutes: number,
): Service {
  return { id, categoryId, group, name, description, startingPrice, durationMinutes };
}

export const SERVICES: Service[] = [
  service('beauty-haircuts', 'beauty', 'Hair', 'Haircuts', 'Professional haircuts at your location.', 80, 45),
  service('beauty-barbering', 'beauty', 'Hair', 'Barbering', 'Classic and modern barbering services.', 70, 40),
  service('beauty-styling', 'beauty', 'Hair', 'Hair styling', 'Event and everyday hair styling.', 120, 60),
  service('beauty-washing', 'beauty', 'Hair', 'Hair washing', 'Gentle wash and conditioning.', 50, 30),
  service('beauty-dyeing', 'beauty', 'Hair', 'Hair dyeing', 'Colouring with professional products.', 250, 120),
  service('beauty-coloring', 'beauty', 'Hair', 'Hair coloring', 'Highlights, tinting and colour treatments.', 280, 130),
  service('beauty-braiding', 'beauty', 'Hair', 'Braiding', 'Protective braids tailored to your style.', 300, 180),
  service('beauty-cornrows', 'beauty', 'Hair', 'Cornrows', 'Neat cornrows for everyday or events.', 180, 90),
  service('beauty-dreadlocks', 'beauty', 'Hair', 'Dreadlocks', 'Locking, retwist and loc maintenance.', 350, 150),
  service('beauty-extensions', 'beauty', 'Hair', 'Hair extensions', 'Quality extensions, professionally installed.', 400, 150),
  service('beauty-weaving', 'beauty', 'Hair', 'Weaving', 'Sew-in and weave installation.', 380, 150),
  service('beauty-wig-install', 'beauty', 'Hair', 'Wig installation', 'Secure, natural-looking wig installation.', 200, 75),
  service('beauty-wig-styling', 'beauty', 'Hair', 'Wig styling', 'Custom styling for your wig.', 120, 60),
  service('beauty-natural', 'beauty', 'Hair', 'Natural hair care', 'Treatments and styling for natural hair.', 150, 75),
  service('beauty-manicure', 'beauty', 'Nails', 'Manicure', 'Clean, shaped and polished nails.', 80, 45),
  service('beauty-pedicure', 'beauty', 'Nails', 'Pedicure', 'Foot care and polish at home.', 100, 50),
  service('beauty-gel-nails', 'beauty', 'Nails', 'Gel nails', 'Long-lasting gel application.', 150, 70),
  service('beauty-acrylic', 'beauty', 'Nails', 'Acrylic nails', 'Full set or infill acrylics.', 180, 90),
  service('beauty-nail-art', 'beauty', 'Nails', 'Nail art', 'Custom nail art and designs.', 160, 75),
  service('beauty-makeup', 'beauty', 'Makeup', 'Makeup', 'Professional makeup for any occasion.', 200, 75),
  service('beauty-bridal-makeup', 'beauty', 'Makeup', 'Bridal makeup', 'Bridal makeup with a trial option.', 450, 120),
  service('beauty-event-makeup', 'beauty', 'Makeup', 'Event makeup', 'Glam makeup for parties and events.', 250, 80),
  service('beauty-photoshoot-makeup', 'beauty', 'Makeup', 'Photoshoot makeup', 'Camera-ready makeup for shoots.', 280, 90),
  service('beauty-facials', 'beauty', 'Face & Skin', 'Facials', 'Cleansing, hydration and glow facials.', 180, 60),
  service('beauty-eyebrows', 'beauty', 'Face & Skin', 'Eyebrow shaping', 'Threading, waxing or tinting.', 60, 25),
  service('beauty-eyelashes', 'beauty', 'Face & Skin', 'Eyelashes', 'Lash extensions or lifts.', 220, 90),
  service('beauty-waxing', 'beauty', 'Face & Skin', 'Waxing', 'Face and body waxing at home.', 90, 40),
  service('beauty-skincare', 'beauty', 'Face & Skin', 'Skincare', 'Personalised skincare treatments.', 200, 70),

  service('cleaning-general', 'cleaning', 'House Cleaning', 'General house cleaning', 'Regular cleaning for your home.', 180, 120),
  service('cleaning-deep', 'cleaning', 'House Cleaning', 'Deep cleaning', 'Thorough deep clean for every room.', 350, 240),
  service('cleaning-kitchen', 'cleaning', 'House Cleaning', 'Kitchen cleaning', 'Appliances, surfaces and floors.', 150, 90),
  service('cleaning-bathroom', 'cleaning', 'House Cleaning', 'Bathroom cleaning', 'Sanitise and refresh bathrooms.', 130, 75),
  service('cleaning-bedroom', 'cleaning', 'House Cleaning', 'Bedroom cleaning', 'Dusting, linens and organisation.', 120, 70),
  service('cleaning-maid', 'cleaning', 'Maid Services', 'Maid services', 'Recurring household help.', 200, 180),
  service('cleaning-domestic', 'cleaning', 'Maid Services', 'Domestic assistance', 'Day-to-day domestic support.', 180, 180),
  service('cleaning-household', 'cleaning', 'Maid Services', 'Household help', 'Flexible help around the house.', 160, 120),
  service('cleaning-office', 'cleaning', 'Commercial Cleaning', 'Office cleaning', 'Keep your workplace tidy.', 250, 150),
  service('cleaning-shop', 'cleaning', 'Commercial Cleaning', 'Shop cleaning', 'Retail and shop floor cleaning.', 220, 120),
  service('cleaning-business', 'cleaning', 'Commercial Cleaning', 'Business premises cleaning', 'Cleaning for small businesses.', 300, 180),
  service('cleaning-carpet', 'cleaning', 'Specialized Cleaning', 'Carpet cleaning', 'Deep carpet shampoo and dry.', 200, 90),
  service('cleaning-sofa', 'cleaning', 'Specialized Cleaning', 'Sofa cleaning', 'Upholstery cleaning for sofas.', 180, 80),
  service('cleaning-mattress', 'cleaning', 'Specialized Cleaning', 'Mattress cleaning', 'Dust-mite and stain treatment.', 160, 70),
  service('cleaning-window', 'cleaning', 'Specialized Cleaning', 'Window cleaning', 'Interior and exterior windows.', 140, 60),
  service('cleaning-laundry', 'cleaning', 'Specialized Cleaning', 'Laundry', 'Wash, dry and fold service.', 100, 90),
  service('cleaning-gardening', 'cleaning', 'Gardening', 'Gardening', 'General garden care and planting.', 180, 120),
  service('cleaning-lawn', 'cleaning', 'Gardening', 'Lawn mowing', 'Neat lawn cutting and edging.', 120, 60),
  service('cleaning-yard', 'cleaning', 'Gardening', 'Yard cleaning', 'Clear leaves, waste and debris.', 150, 90),
  service('cleaning-landscaping', 'cleaning', 'Gardening', 'Landscaping', 'Garden layout and planting advice.', 400, 240),
  service('cleaning-tree', 'cleaning', 'Gardening', 'Tree trimming', 'Safe trimming of trees and hedges.', 250, 120),
  service('cleaning-garden-maint', 'cleaning', 'Gardening', 'Garden maintenance', 'Ongoing garden upkeep.', 200, 120),

  service('repair-phone', 'repair', 'Electronics', 'Phone repair', 'Screens, batteries and charging ports.', 150, 60),
  service('repair-tablet', 'repair', 'Electronics', 'Tablet repair', 'Tablet screen and hardware repair.', 180, 75),
  service('repair-laptop', 'repair', 'Electronics', 'Laptop repair', 'Software, hardware and screen repair.', 250, 90),
  service('repair-computer', 'repair', 'Electronics', 'Computer repair', 'Desktop diagnostics and repair.', 220, 90),
  service('repair-tv', 'repair', 'Electronics', 'TV repair', 'Display and board-level TV repair.', 300, 120),
  service('repair-console', 'repair', 'Electronics', 'Game console repair', 'PlayStation, Xbox and Switch repair.', 280, 90),
  service('repair-fridge', 'repair', 'Appliances', 'Refrigerator repair', 'Cooling, thermostat and seal repair.', 250, 90),
  service('repair-freezer', 'repair', 'Appliances', 'Freezer repair', 'Freezer faults and ice build-up.', 240, 90),
  service('repair-washer', 'repair', 'Appliances', 'Washing machine repair', 'Drum, pump and electronics repair.', 230, 90),
  service('repair-microwave', 'repair', 'Appliances', 'Microwave repair', 'Heating and turntable issues.', 150, 60),
  service('repair-stove', 'repair', 'Appliances', 'Stove/oven repair', 'Gas and electric cooker repair.', 200, 80),
  service('repair-ac', 'repair', 'Home Systems', 'Air-conditioner repair', 'AC service, gas refill and repair.', 280, 90),
  service('repair-electrical', 'repair', 'Home Systems', 'Electrical repair', 'Sockets, lighting and wiring faults.', 180, 75),
  service('repair-plumbing', 'repair', 'Home Systems', 'Plumbing', 'Leaks, blockages and fittings.', 200, 80),
  service('repair-heater', 'repair', 'Home Systems', 'Water heater repair', 'Geyser and water heater repair.', 220, 80),
  service('repair-furniture', 'repair', 'Furniture', 'Furniture repair', 'Tables, chairs and wood repair.', 150, 70),
  service('repair-cabinet', 'repair', 'Furniture', 'Cabinet repair', 'Kitchen and wardrobe cabinets.', 170, 80),
  service('repair-door', 'repair', 'Furniture', 'Door repair', 'Hinges, locks and door alignment.', 140, 60),
];

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((item) => item.id === id);
}

export function getServicesByCategory(categoryId: CategoryId): Service[] {
  return SERVICES.filter((item) => item.categoryId === categoryId);
}

export function searchServices(query: string): Service[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return SERVICES.filter(
    (item) =>
      item.name.toLowerCase().includes(term) ||
      item.group.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term),
  );
}
