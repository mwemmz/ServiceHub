import type { Category, CategoryId, Service } from '@/types';

/** Display order for service groups within each category. */
export const SERVICE_GROUP_ORDER: Record<CategoryId, string[]> = {
  beauty: ['Salon & Beauty Services', "Barbershop & Men's Grooming"],
  cleaning: ['Home & Office Cleaning', 'Outdoor Services'],
  repair: ['Electronics & Devices', 'Home Appliances', 'Home & Property'],
};

export const CATEGORIES: Category[] = [
  {
    id: 'beauty',
    name: 'Beauty & Cosmetics',
    shortName: 'Beauty',
    description: 'Salon & beauty for women and men, plus barbershop & grooming.',
    accent: '#F0A8A5',
    background: 'rgba(217,123,120,0.28)',
    icon: 'cut-outline',
  },
  {
    id: 'cleaning',
    name: 'Cleaning & Outdoor Services',
    shortName: 'Cleaning',
    description: 'Home and office cleaning, laundry, gardening and outdoor care.',
    accent: '#9CD49C',
    background: 'rgba(106,163,106,0.28)',
    icon: 'leaf-outline',
  },
  {
    id: 'repair',
    name: 'Repair & Maintenance',
    shortName: 'Repair',
    description: 'Phones, appliances, plumbing, electrical and home repairs.',
    accent: '#8EC0E8',
    background: 'rgba(91,143,184,0.28)',
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
  // —— Beauty: Salon & Beauty Services ——
  service('beauty-braiding', 'beauty', 'Salon & Beauty Services', 'Braids', 'Protective braids styled to your preference.', 300, 180),
  service('beauty-cornrows', 'beauty', 'Salon & Beauty Services', 'Cornrows', 'Neat cornrows for everyday or special looks.', 180, 90),
  service('beauty-dyeing', 'beauty', 'Salon & Beauty Services', 'Hair dye / colouring', 'Professional colouring and touch-ups.', 250, 120),
  service('beauty-treatment', 'beauty', 'Salon & Beauty Services', 'Hair treatment', 'Deep conditioning and restorative treatments.', 200, 75),
  service('beauty-styling', 'beauty', 'Salon & Beauty Services', 'Hair styling', 'Event and everyday salon styling.', 120, 60),
  service('beauty-wig-install', 'beauty', 'Salon & Beauty Services', 'Wig installation', 'Secure, natural-looking wig install.', 220, 90),
  service('beauty-wig-styling', 'beauty', 'Salon & Beauty Services', 'Wig styling', 'Cut, style and finish your wig.', 150, 60),
  service('beauty-relaxing', 'beauty', 'Salon & Beauty Services', 'Relaxing', 'Chemical relaxer services with care.', 280, 120),
  service('beauty-extensions', 'beauty', 'Salon & Beauty Services', 'Hair extensions', 'Length and volume with quality extensions.', 350, 150),
  service('beauty-manicure', 'beauty', 'Salon & Beauty Services', 'Manicure', 'Clean, shaped and polished nails.', 80, 45),
  service('beauty-pedicure', 'beauty', 'Salon & Beauty Services', 'Pedicure', 'Foot care and polish at home.', 100, 50),
  service('beauty-nail-art', 'beauty', 'Salon & Beauty Services', 'Nail art', 'Creative nail designs and finishes.', 120, 60),
  service('beauty-makeup', 'beauty', 'Salon & Beauty Services', 'Makeup', 'Professional makeup for any occasion.', 200, 75),
  service('beauty-eyelashes', 'beauty', 'Salon & Beauty Services', 'Eyelashes', 'Lash extensions or lifts.', 220, 90),
  service('beauty-eyebrows', 'beauty', 'Salon & Beauty Services', 'Eyebrows', 'Shaping, threading, waxing or tinting.', 60, 25),
  service('beauty-facials', 'beauty', 'Salon & Beauty Services', 'Facial', 'Cleansing, hydration and glow facials.', 180, 60),
  service('beauty-skincare', 'beauty', 'Salon & Beauty Services', 'Skincare', 'Personalised skincare treatments.', 200, 70),

  // —— Beauty: Barbershop & Men's Grooming ——
  service('beauty-haircuts', 'beauty', "Barbershop & Men's Grooming", 'Haircut', 'Classic and modern mens haircuts.', 70, 40),
  service('beauty-shave', 'beauty', "Barbershop & Men's Grooming", 'Shave', 'Clean traditional or hot towel shave.', 60, 30),
  service('beauty-beard-trim', 'beauty', "Barbershop & Men's Grooming", 'Beard trim', 'Neat trim to keep your beard tidy.', 50, 25),
  service('beauty-beard-shape', 'beauty', "Barbershop & Men's Grooming", 'Beard shaping', 'Shape and define your beard line.', 70, 35),
  service('beauty-edge-up', 'beauty', "Barbershop & Men's Grooming", 'Hairline / edge-up', 'Sharp line-up and edge detailing.', 40, 20),
  service('beauty-fade', 'beauty', "Barbershop & Men's Grooming", 'Fade', 'Skin, low, mid or high fade.', 80, 45),
  service('beauty-taper', 'beauty', "Barbershop & Men's Grooming", 'Taper', 'Clean taper cut and finish.', 75, 40),
  service('beauty-hair-dye-men', 'beauty', "Barbershop & Men's Grooming", 'Hair dye', 'Mens hair colouring and grey cover.', 150, 60),
  service('beauty-beard-dye', 'beauty', "Barbershop & Men's Grooming", 'Beard dye', 'Even colour for beard and moustache.', 80, 30),
  service('beauty-kids-cut', 'beauty', "Barbershop & Men's Grooming", 'Kids haircut', 'Patient cuts for children.', 50, 30),
  service('beauty-mens-grooming', 'beauty', "Barbershop & Men's Grooming", "Men's grooming", 'Full grooming package — cut, beard and finish.', 150, 60),

  // —— Cleaning: Home & Office ——
  service('cleaning-general', 'cleaning', 'Home & Office Cleaning', 'House cleaning', 'Regular cleaning for your home.', 180, 120),
  service('cleaning-office', 'cleaning', 'Home & Office Cleaning', 'Office cleaning', 'Keep your workplace tidy.', 250, 150),
  service('cleaning-deep', 'cleaning', 'Home & Office Cleaning', 'Deep cleaning', 'Thorough deep clean for every room.', 350, 240),
  service('cleaning-maid', 'cleaning', 'Home & Office Cleaning', 'Maid services', 'Recurring household help.', 200, 180),
  service('cleaning-laundry', 'cleaning', 'Home & Office Cleaning', 'Laundry', 'Wash, dry and fold service.', 100, 90),

  // —— Cleaning: Outdoor ——
  service('cleaning-gardening', 'cleaning', 'Outdoor Services', 'Gardening', 'General garden care and planting.', 180, 120),
  service('cleaning-landscaping', 'cleaning', 'Outdoor Services', 'Landscaping', 'Garden layout and outdoor design.', 400, 240),
  service('cleaning-lawn', 'cleaning', 'Outdoor Services', 'Lawn maintenance', 'Neat lawn cutting and edging.', 120, 60),
  service('cleaning-yard', 'cleaning', 'Outdoor Services', 'Yard cleaning', 'Clear leaves, waste and debris.', 150, 90),
  service('cleaning-compound', 'cleaning', 'Outdoor Services', 'Compound cleaning', 'Compound and outdoor waste clearing.', 160, 90),
  service('cleaning-tree', 'cleaning', 'Outdoor Services', 'Tree / garden maintenance', 'Pruning, hedges and garden upkeep.', 200, 90),

  // —— Repair: Electronics ——
  service('repair-phone', 'repair', 'Electronics & Devices', 'Phone repair', 'Screens, batteries and charging ports.', 150, 60),
  service('repair-laptop', 'repair', 'Electronics & Devices', 'Laptop repair', 'Laptop hardware and software repair.', 250, 90),
  service('repair-computer', 'repair', 'Electronics & Devices', 'Computer repair', 'Desktop PC diagnostics and repair.', 220, 90),
  service('repair-tv', 'repair', 'Electronics & Devices', 'TV repair', 'Display and board-level TV repair.', 300, 120),

  // —— Repair: Appliances ——
  service('repair-fridge', 'repair', 'Home Appliances', 'Fridge / freezer repair', 'Cooling, thermostat and seal repair.', 250, 90),
  service('repair-washer', 'repair', 'Home Appliances', 'Washing machine repair', 'Drum, pump and electronics repair.', 230, 90),
  service('repair-ac', 'repair', 'Home Appliances', 'Air conditioner repair', 'AC service, gas refill and repair.', 280, 90),
  service('repair-appliance', 'repair', 'Home Appliances', 'Appliance repair', 'General home appliance diagnostics.', 200, 80),

  // —— Repair: Home & Property ——
  service('repair-plumbing', 'repair', 'Home & Property', 'Plumbing', 'Leaks, blockages and fittings.', 200, 80),
  service('repair-electrical', 'repair', 'Home & Property', 'Electrical repairs', 'Sockets, lighting and wiring faults.', 180, 75),
  service('repair-home', 'repair', 'Home & Property', 'General home repairs', 'Doors, fittings and small fixes.', 150, 70),
  service('repair-other', 'repair', 'Home & Property', 'Other maintenance services', 'Tell us what needs fixing.', 150, 60),
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
