import type { CategoryId } from '@/types';

export type ServiceOption = {
  id: string;
  label: string;
  categoryId: CategoryId;
};

/** Provider registration options — aligned with customer catalog sections. */
export const PROVIDER_SERVICE_GROUPS: {
  title: string;
  categoryId: CategoryId;
  items: ServiceOption[];
}[] = [
  {
    title: 'Salon & Beauty Services',
    categoryId: 'beauty',
    items: [
      { id: 'braids', label: 'Braids', categoryId: 'beauty' },
      { id: 'cornrows', label: 'Cornrows', categoryId: 'beauty' },
      { id: 'hair-dye', label: 'Hair dye / colouring', categoryId: 'beauty' },
      { id: 'hair-styling', label: 'Hair styling', categoryId: 'beauty' },
      { id: 'wigs', label: 'Wig installation / styling', categoryId: 'beauty' },
      { id: 'nails', label: 'Manicure / pedicure / nail art', categoryId: 'beauty' },
      { id: 'makeup', label: 'Makeup', categoryId: 'beauty' },
      { id: 'skincare', label: 'Facial / skincare', categoryId: 'beauty' },
      { id: 'other-salon', label: 'Other salon & beauty', categoryId: 'beauty' },
    ],
  },
  {
    title: "Barbershop & Men's Grooming",
    categoryId: 'beauty',
    items: [
      { id: 'barber-haircut', label: 'Haircut', categoryId: 'beauty' },
      { id: 'barber-fade', label: 'Fade / taper', categoryId: 'beauty' },
      { id: 'barber-shave', label: 'Shave', categoryId: 'beauty' },
      { id: 'barber-beard', label: 'Beard trim / shaping', categoryId: 'beauty' },
      { id: 'barber-edge', label: 'Hairline / edge-up', categoryId: 'beauty' },
      { id: 'barber-kids', label: 'Kids haircut', categoryId: 'beauty' },
      { id: 'barber-grooming', label: "Men's grooming", categoryId: 'beauty' },
      { id: 'other-barber', label: 'Other barbershop services', categoryId: 'beauty' },
    ],
  },
  {
    title: 'Home & Office Cleaning',
    categoryId: 'cleaning',
    items: [
      { id: 'house-cleaning', label: 'House cleaning', categoryId: 'cleaning' },
      { id: 'office-cleaning', label: 'Office cleaning', categoryId: 'cleaning' },
      { id: 'deep-cleaning', label: 'Deep cleaning', categoryId: 'cleaning' },
      { id: 'maid', label: 'Maid services', categoryId: 'cleaning' },
      { id: 'laundry', label: 'Laundry', categoryId: 'cleaning' },
    ],
  },
  {
    title: 'Outdoor Services',
    categoryId: 'cleaning',
    items: [
      { id: 'gardening', label: 'Gardening', categoryId: 'cleaning' },
      { id: 'landscaping', label: 'Landscaping', categoryId: 'cleaning' },
      { id: 'lawn', label: 'Lawn maintenance', categoryId: 'cleaning' },
      { id: 'yard', label: 'Yard / compound cleaning', categoryId: 'cleaning' },
      { id: 'other-outdoor', label: 'Other outdoor services', categoryId: 'cleaning' },
    ],
  },
  {
    title: 'Electronics & Devices',
    categoryId: 'repair',
    items: [
      { id: 'phone-repair', label: 'Phone repair', categoryId: 'repair' },
      { id: 'laptop-repair', label: 'Laptop repair', categoryId: 'repair' },
      { id: 'computer-repair', label: 'Computer repair', categoryId: 'repair' },
      { id: 'tv-repair', label: 'TV repair', categoryId: 'repair' },
    ],
  },
  {
    title: 'Home Appliances',
    categoryId: 'repair',
    items: [
      { id: 'fridge-repair', label: 'Fridge / freezer repair', categoryId: 'repair' },
      { id: 'washer-repair', label: 'Washing machine repair', categoryId: 'repair' },
      { id: 'ac-repair', label: 'Air conditioner repair', categoryId: 'repair' },
      { id: 'appliance-repair', label: 'Appliance repair', categoryId: 'repair' },
    ],
  },
  {
    title: 'Home & Property',
    categoryId: 'repair',
    items: [
      { id: 'plumbing', label: 'Plumbing', categoryId: 'repair' },
      { id: 'electrical', label: 'Electrical repairs', categoryId: 'repair' },
      { id: 'general-maintenance', label: 'General home repairs', categoryId: 'repair' },
      { id: 'other-repair', label: 'Other maintenance', categoryId: 'repair' },
    ],
  },
];

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const TRAVEL_RADII = ['5', '10', '20', '30'] as const;
