export const MOCK_AUTH_TOKEN = 'mock-garmentsos-session';
export const MOCK_USER_STORAGE_KEY = 'mockUser';
export const MOCK_USERS_STORAGE_KEY = 'mockUsers';
export const MOCK_ARTICLES_STORAGE_KEY = 'mockArticles';
export const MOCK_OPTIONS_STORAGE_KEY = 'mockOptions';
export const MOCK_SUPPLIERS_STORAGE_KEY = 'mockSuppliers';
export const MOCK_PURCHASES_STORAGE_KEY = 'mockPurchases';
export const MOCK_CONTRACTORS_STORAGE_KEY = 'mockContractors';
export const MOCK_PRODUCTION_STORAGE_KEY = 'mockProductionTickets';

export const mockUsers = [
  {
    id: 1,
    name: 'Prototype Developer',
    username: 'demo',
    password: 'demo123',
    role: 'developer',
    isActive: true,
  },
  {
    id: 2,
    name: 'Sample Admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  },
];

export const mockConfig = {
  companyName: 'GarmentsOS Prototype',
  company: {
    name: 'GarmentsOS Prototype',
    address: 'Prototype Industrial Area, Karachi',
    phone: '+92 300 0000000',
    email: 'accounts@garmentsos.test',
  },
  license: {
    expiry: '31 Dec 2099',
  },
  subscriptionExpiry: '2099-12-31T23:59:59.000Z',
  developer: {
    powered_by: 'SparkPair',
  },
};

export const mockOptions = {
  seasons: ['Summer', 'Winter', 'Spring', 'Autumn'],
  sizes: ['S-M-L', 'M-L-XL', 'Free Size', '28-36'],
  categories: ['Kurti', 'Shirt', 'Trouser', 'Co-ord Set'],
  fabric: ['Cotton', 'Lawn', 'Linen', 'Khaddar', 'Denim'],
  fabric_types: ['Cotton', 'Lawn', 'Linen', 'Khaddar', 'Denim'],
  work: ['Plain', 'Embroidery', 'Digital Print', 'Screen Print'],
  accessory: ['Buttons', 'Zip', 'Lace', 'Tags'],
  labor: ['Cutting', 'Stitching', 'Finishing', 'Packing'],
  rateCategories: {
    Fabric: ['Cotton Roll', 'Lawn Roll', 'Denim Yard'],
    Labor: ['Cutting', 'Stitching', 'Finishing'],
    Accessories: ['Buttons', 'Labels', 'Packaging'],
  },
};

export const mockArticles = [
  {
    id: 1,
    article_no: 'GO-1001',
    season: 'Summer',
    size: 'S-M-L',
    category: 'Kurti',
    unit: 12,
    stock_pkt: 0,
    cost: 1730,
    net_rate: 2100,
    fabric_type: 'Lawn',
    description: 'Light summer kurti with digital printed front panel.',
    quantity: 120,
    rates: [
      { description: 'Fabric - Lawn', price: 950 },
      { description: 'Digital print', price: 280 },
      { description: 'Stitching', price: 420 },
      { description: 'Packing', price: 80 },
    ],
    total_cost: 1730,
    sales_rate: 2450,
    image: '',
    created_at: '2026-08-25T10:15:00.000Z',
    updated_at: '2026-08-25T10:15:00.000Z',
  },
  {
    id: 2,
    article_no: 'GO-1002',
    season: 'Winter',
    size: 'M-L-XL',
    category: 'Co-ord Set',
    unit: 12,
    stock_pkt: 0,
    cost: 2800,
    net_rate: 3400,
    fabric_type: 'Khaddar',
    description: 'Two-piece winter co-ord set for catalog review.',
    quantity: 80,
    rates: [
      { description: 'Fabric - Khaddar', price: 1600 },
      { description: 'Embroidery', price: 550 },
      { description: 'Labor', price: 650 },
    ],
    total_cost: 2800,
    sales_rate: 3950,
    image: '',
    created_at: '2026-08-27T14:30:00.000Z',
    updated_at: '2026-08-27T14:30:00.000Z',
  },
];

export const mockSuppliers = [
  {
    id: 1,
    supplier_name: 'Karachi Textile House',
    person_name: 'Ahmed Raza',
    city: 'Karachi',
    address: 'SITE Area, Karachi',
    phone: '+92 300 1112233',
    isActive: true,
    created_at: '2026-08-20T09:00:00.000Z',
    updated_at: '2026-08-20T09:00:00.000Z',
  },
  {
    id: 2,
    supplier_name: 'Lahore Fabric Mills',
    person_name: 'Sana Malik',
    city: 'Lahore',
    address: 'Ferozepur Road, Lahore',
    phone: '+92 321 5557788',
    isActive: true,
    created_at: '2026-08-22T12:30:00.000Z',
    updated_at: '2026-08-22T12:30:00.000Z',
  },
  {
    id: 3,
    supplier_name: 'Faisalabad Accessories Co.',
    person_name: 'Bilal Khan',
    city: 'Faisalabad',
    address: '',
    phone: '',
    isActive: false,
    created_at: '2026-08-24T15:45:00.000Z',
    updated_at: '2026-08-26T11:10:00.000Z',
  },
];

export const mockPurchases = [
  {
    id: 1,
    purchase_no: 'P-0001',
    supplier_id: 1,
    purchase_date: '2026-09-01',
    reference_no: 'PUR-001',
    items: [
      { id: 101, item_type: 'Fabric', tag: 'FAB-LAWN-WHITE', description: 'White lawn fabric', unit: 'meter', quantity: 120, rate: 450, amount: 54000 },
      { id: 102, item_type: 'Thread', tag: 'THR-WHITE-40', description: 'White stitching thread', unit: 'cone', quantity: 24, rate: 180, amount: 4320 },
    ],
    total_amount: 58320,
    created_at: '2026-09-01T09:00:00.000Z',
    updated_at: '2026-09-01T09:00:00.000Z',
  },
];

export const mockContractors = [
  {
    id: 1,
    contractor_name: 'Bright Stitching Unit',
    person_name: 'Usman Ali',
    type: 'CMT',
    city: 'Karachi',
    address: 'Korangi Industrial Area',
    phone: '+92 300 2223344',
    isActive: true,
    balance: 0,
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 2,
    contractor_name: 'Fine Line Garments',
    person_name: 'Noman Shah',
    type: 'CMT',
    city: 'Lahore',
    address: '',
    phone: '',
    isActive: false,
    balance: 0,
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-01T12:00:00.000Z',
  },
];

export const mockProductionTickets = [
  {
    id: 1,
    ticket_no: 'PR-0001',
    type: 'issue',
    contractor_id: 1,
    production_date: '2026-09-02',
    items: [
      { id: 1001, group_id: 'FAB-LAWN-WHITE__450', tag: 'FAB-LAWN-WHITE', item_type: 'Fabric', description: 'White lawn fabric', unit: 'meter', rate: 450, quantity: 35 },
    ],
    created_at: '2026-09-02T09:30:00.000Z',
    updated_at: '2026-09-02T09:30:00.000Z',
  },
];

export const withoutPassword = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};
