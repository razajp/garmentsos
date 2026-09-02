import axios from 'axios';
import {
  MOCK_ARTICLES_STORAGE_KEY,
  MOCK_AUTH_TOKEN,
  MOCK_OPTIONS_STORAGE_KEY,
  MOCK_SUPPLIERS_STORAGE_KEY,
  MOCK_PURCHASES_STORAGE_KEY,
  MOCK_CONTRACTORS_STORAGE_KEY,
  MOCK_PRODUCTION_STORAGE_KEY,
  MOCK_USER_STORAGE_KEY,
  MOCK_USERS_STORAGE_KEY,
  mockArticles,
  mockConfig,
  mockOptions,
  mockSuppliers,
  mockPurchases,
  mockContractors,
  mockProductionTickets,
  mockUsers,
  withoutPassword,
} from './mockData';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Sirf ek baar kafi hai
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle 401 and 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401: Unauthorized -> Force Logout
    if (status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 403: Forbidden (Subscription Expired logic handled in Context)
    return Promise.reject(error);
  }
);

export default api;

const mockResponse = (data) => Promise.resolve({ data });
const clone = (value) => JSON.parse(JSON.stringify(value));

const readStorage = (key, fallback) => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  const seeded = clone(fallback);
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file || typeof FileReader === 'undefined') {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

const parseArticlePayload = async (payload, existingArticle = null) => {
  const values = {};
  if (payload instanceof FormData) {
    payload.forEach((value, key) => {
      values[key] = value;
    });
  } else {
    Object.assign(values, payload);
  }

  const rates = typeof values.rates === 'string' ? JSON.parse(values.rates || '[]') : values.rates || [];
  const total_cost = rates.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const image = values.image instanceof File ? await fileToDataUrl(values.image) : existingArticle?.image || '';

  return {
    article_no: values.article_no || existingArticle?.article_no || '',
    season: values.season || '',
    size: values.size || '',
    category: values.category || '',
    unit: Number(values.unit) || 1,
    fabric_type: values.fabric_type || '',
    description: values.description || '',
    quantity: Number(values.quantity) || 0,
    stock_pkt: Number(values.stock_pkt || values.quantity) || 0,
    cost: Number(values.cost || values.total_cost) || existingArticle?.cost || 0,
    net_rate: Number(values.net_rate) || 0,
    sales_rate: Number(values.sales_rate) || 0,
    rates,
    total_cost: Number(values.cost || values.total_cost) || total_cost,
    image,
  };
};
const getNextArticleNo = () => {
  const maxNo = getMockArticles().reduce((max, article) => {
    const number = Number(String(article.article_no || '').replace(/\D/g, '')) || 0;
    return Math.max(max, number);
  }, 0);
  return `A-${String(maxNo + 1).padStart(4, '0')}`;
};

const getMockArticles = () => readStorage(MOCK_ARTICLES_STORAGE_KEY, mockArticles);
const getMockUsers = () => readStorage(MOCK_USERS_STORAGE_KEY, mockUsers.map(withoutPassword));
const getMockOptions = () => readStorage(MOCK_OPTIONS_STORAGE_KEY, mockOptions);
const getMockSuppliers = () => readStorage(MOCK_SUPPLIERS_STORAGE_KEY, mockSuppliers);
const getMockPurchases = () => readStorage(MOCK_PURCHASES_STORAGE_KEY, mockPurchases);
const getMockContractors = () => readStorage(MOCK_CONTRACTORS_STORAGE_KEY, mockContractors);
const getMockProductionTickets = () => readStorage(MOCK_PRODUCTION_STORAGE_KEY, mockProductionTickets);

const getContractorIssuedTags = (contractorId) => {
  const issued = {};
  getMockProductionTickets()
    .filter((ticket) => Number(ticket.contractor_id) === Number(contractorId))
    .forEach((ticket) => {
      (ticket.items || []).forEach((item) => {
        const groupId = item.group_id || `${item.tag}__${item.rate || 0}`;
        if (!issued[groupId]) {
          issued[groupId] = {
            group_id: groupId,
            tag: item.tag,
            item_type: item.item_type,
            description: item.description,
            unit: item.unit,
            rate: Number(item.rate) || 0,
            quantity: 0,
          };
        }
        issued[groupId].quantity += ticket.type === 'receive' ? -(Number(item.quantity) || 0) : Number(item.quantity) || 0;
      });
    });
  return Object.values(issued).filter((item) => item.quantity > 0);
};

const getInventoryFromPurchases = () => {
  const inventory = {};
  getMockPurchases().forEach((purchase) => {
    purchase.items.forEach((item) => {
      const rate = Number(item.rate) || 0;
      const groupId = `${item.tag}__${rate}`;
      if (!inventory[groupId]) {
        inventory[groupId] = {
          group_id: groupId,
          tag: item.tag,
          item_type: item.item_type,
          description: item.description,
          unit: item.unit,
          rate,
          quantity: 0,
          last_purchase_rate: 0,
          last_purchase_date: purchase.purchase_date,
        };
      }
      inventory[groupId].quantity += Number(item.quantity) || 0;
      inventory[groupId].last_purchase_rate = rate;
      inventory[groupId].last_purchase_date = purchase.purchase_date;
      inventory[groupId].description = item.description || inventory[groupId].description;
      inventory[groupId].unit = item.unit || inventory[groupId].unit;
    });
  });

  getMockProductionTickets()
    .filter((ticket) => ticket.type === 'issue')
    .forEach((ticket) => {
      (ticket.items || []).forEach((item) => {
        const groupId = item.group_id || `${item.tag}__${item.rate || 0}`;
        if (inventory[groupId]) {
          inventory[groupId].quantity -= Number(item.quantity) || 0;
        }
      });
    });

  return Object.values(inventory);
};

const getSupplierBalance = (supplierId) =>
  getMockPurchases()
    .filter((purchase) => Number(purchase.supplier_id) === Number(supplierId))
    .reduce((sum, purchase) => sum + (Number(purchase.total_amount) || 0), 0);

const withSupplierBalance = (supplier) => ({ ...supplier, balance: getSupplierBalance(supplier.id) });

const getProductionTicketPcs = (ticket) => {
  const article = getMockArticles().find((item) => Number(item.id) === Number(ticket.article_id));
  const unit = Number(article?.unit || ticket.unit) || 1;
  return (Number(ticket.article_quantity) || 0) * unit;
};

const getContractorBalance = (contractorId) =>
  getMockProductionTickets()
    .filter((ticket) => ticket.type === 'receive' && Number(ticket.contractor_id) === Number(contractorId))
    .reduce((sum, ticket) => sum + ((Number(ticket.cost_per_piece) || 0) * getProductionTicketPcs(ticket)), 0);

const withContractorProduction = (contractor) => ({
  ...contractor,
  balance: getContractorBalance(contractor.id),
  issued_tags: getContractorIssuedTags(contractor.id),
});

const withArticleProduction = (article) => {
  const receiveTickets = getMockProductionTickets()
    .filter((ticket) => ticket.type === 'receive' && Number(ticket.article_id) === Number(article.id))
    .sort((a, b) => new Date(a.production_date) - new Date(b.production_date));
  const receivedPkt = receiveTickets.reduce((sum, ticket) => sum + (Number(ticket.article_quantity) || 0), 0);
  const latestReceive = receiveTickets[receiveTickets.length - 1];

  return {
    ...article,
    stock_pkt: receivedPkt,
    quantity: receivedPkt,
    cost: latestReceive?.total_cost_per_piece || article.cost || article.total_cost || 0,
    total_cost: latestReceive?.total_cost_per_piece || article.total_cost || article.cost || 0,
    net_rate: latestReceive?.net_rate || article.net_rate || 0,
    sales_rate: latestReceive?.sale_rate_per_piece || article.sales_rate || 0,
  };
};

const mockAuthAPI = {
  login: ({ username, password }) => {
    const matchedUser = mockUsers.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password
    );

    if (!matchedUser) {
      return Promise.reject({ response: { data: { message: 'Use demo / demo123 for prototype login' } } });
    }

    const user = withoutPassword(matchedUser);
    localStorage.setItem('token', MOCK_AUTH_TOKEN);
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
    return mockResponse({ token: MOCK_AUTH_TOKEN, user });
  },
  getMe: () => mockResponse({ data: JSON.parse(localStorage.getItem(MOCK_USER_STORAGE_KEY)) || withoutPassword(mockUsers[0]) }),
  updateProfile: (data) => {
    const currentUser = JSON.parse(localStorage.getItem(MOCK_USER_STORAGE_KEY)) || withoutPassword(mockUsers[0]);
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(updatedUser));

    const users = getMockUsers().map((user) => (user.id === updatedUser.id ? updatedUser : user));
    writeStorage(MOCK_USERS_STORAGE_KEY, users);
    return mockResponse({ data: updatedUser });
  },
  logout: () => mockResponse({ success: true }),
};

const mockUsersAPI = {
  getAll: () => mockResponse({ data: getMockUsers() }),
  getOne: (id) => mockResponse({ data: getMockUsers().find((user) => user.id === Number(id)) }),
  create: (data) => {
    const users = getMockUsers();
    if (users.some((user) => user.username.toLowerCase() === data.username.toLowerCase())) {
      return Promise.reject({ response: { data: { message: 'Username already exists' } } });
    }
    const newUser = {
      id: Date.now(),
      name: data.name,
      username: data.username,
      role: data.role,
      isActive: data.isActive,
      is_active: data.isActive ? 1 : 0,
    };
    writeStorage(MOCK_USERS_STORAGE_KEY, [...users, newUser]);
    return mockResponse({ success: true, data: newUser });
  },
  update: (id, data) => {
    const users = getMockUsers().map((user) =>
      user.id === Number(id)
        ? { ...user, ...data, is_active: data.isActive ? 1 : 0 }
        : user
    );
    writeStorage(MOCK_USERS_STORAGE_KEY, users);
    return mockResponse({ success: true, data: users.find((user) => user.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_USERS_STORAGE_KEY, getMockUsers().filter((user) => user.id !== Number(id)));
    return mockResponse({ success: true });
  },
};

const mockArticlesAPI = {
  getAll: (params = {}) => {
    let articles = getMockArticles().map(withArticleProduction);
    if (params.search) {
      const search = params.search.toLowerCase();
      articles = articles.filter((article) =>
        [article.article_no, article.season, article.size, article.category, article.fabric_type]
          .some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    ['season', 'category', 'fabric_type'].forEach((key) => {
      if (params[key]) articles = articles.filter((article) => article[key] === params[key]);
    });
    if (params.sortBy) {
      articles = [...articles].sort((a, b) => {
        const direction = params.order === 'desc' ? -1 : 1;
        return String(a[params.sortBy] ?? '').localeCompare(String(b[params.sortBy] ?? ''), undefined, { numeric: true }) * direction;
      });
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || articles.length || 10;
    const total = articles.length;
    const start = (page - 1) * limit;

    return mockResponse({
      data: articles.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  },
  getOne: (id) => {
    const article = getMockArticles().find((item) => item.id === Number(id));
    return article ? mockResponse({ data: withArticleProduction(article) }) : Promise.reject({ response: { status: 404 } });
  },
  create: async (data) => {
    const articles = getMockArticles();
    const now = new Date().toISOString();
    const payload = await parseArticlePayload(data);
    const article = { id: Date.now(), ...payload, article_no: payload.article_no || getNextArticleNo(), created_at: now, updated_at: now };
    writeStorage(MOCK_ARTICLES_STORAGE_KEY, [article, ...articles]);
    return mockResponse({ success: true, data: article });
  },
  update: async (id, data) => {
    const now = new Date().toISOString();
    const existingArticle = getMockArticles().find((article) => article.id === Number(id));
    const articleData = await parseArticlePayload(data, existingArticle);
    const articles = getMockArticles().map((article) =>
      article.id === Number(id) ? { ...article, ...articleData, updated_at: now } : article
    );
    writeStorage(MOCK_ARTICLES_STORAGE_KEY, articles);
    return mockResponse({ success: true, data: articles.find((article) => article.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_ARTICLES_STORAGE_KEY, getMockArticles().filter((article) => article.id !== Number(id)));
    return mockResponse({ success: true });
  },
  getStats: () => {
    const articles = getMockArticles();
    const avgProfitMargin = articles.length
      ? articles.reduce((sum, article) => {
          const margin = article.sales_rate ? ((article.sales_rate - article.total_cost) / article.sales_rate) * 100 : 0;
          return sum + margin;
        }, 0) / articles.length
      : 0;
    return mockResponse({ data: { totalArticles: articles.length, summary: { avgProfitMargin } } });
  },
};

const normalizeSupplierPayload = (data) => ({
  supplier_name: data.supplier_name || data.supplierName || '',
  person_name: data.person_name || data.personName || '',
  city: data.city || '',
  address: data.address || '',
  phone: data.phone || '',
  isActive: data.isActive !== false,
});

const mockSuppliersAPI = {
  getAll: (params = {}) => {
    let suppliers = getMockSuppliers().map(withSupplierBalance);
    if (params.search) {
      const search = params.search.toLowerCase();
      suppliers = suppliers.filter((supplier) =>
        [supplier.supplier_name, supplier.person_name, supplier.city, supplier.address, supplier.phone]
          .some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    if (params.status === 'active') suppliers = suppliers.filter((supplier) => supplier.isActive);
    if (params.status === 'inactive') suppliers = suppliers.filter((supplier) => !supplier.isActive);

    if (params.sortBy) {
      suppliers = [...suppliers].sort((a, b) => {
        const direction = params.order === 'desc' ? -1 : 1;
        return String(a[params.sortBy] ?? '').localeCompare(String(b[params.sortBy] ?? ''), undefined, { numeric: true }) * direction;
      });
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || suppliers.length || 10;
    const total = suppliers.length;
    const start = (page - 1) * limit;

    return mockResponse({
      data: suppliers.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  },
  getOne: (id) => {
    const supplier = getMockSuppliers().find((item) => item.id === Number(id));
    return supplier ? mockResponse({ data: withSupplierBalance(supplier) }) : Promise.reject({ response: { status: 404 } });
  },
  create: (data) => {
    const suppliers = getMockSuppliers();
    const now = new Date().toISOString();
    const supplier = { id: Date.now(), ...normalizeSupplierPayload(data), created_at: now, updated_at: now };
    writeStorage(MOCK_SUPPLIERS_STORAGE_KEY, [supplier, ...suppliers]);
    return mockResponse({ success: true, data: supplier });
  },
  update: (id, data) => {
    const now = new Date().toISOString();
    const suppliers = getMockSuppliers().map((supplier) =>
      supplier.id === Number(id) ? { ...supplier, ...normalizeSupplierPayload(data), updated_at: now } : supplier
    );
    writeStorage(MOCK_SUPPLIERS_STORAGE_KEY, suppliers);
    return mockResponse({ success: true, data: suppliers.find((supplier) => supplier.id === Number(id)) });
  },
  setActive: (id, isActive) => {
    const now = new Date().toISOString();
    const suppliers = getMockSuppliers().map((supplier) =>
      supplier.id === Number(id) ? { ...supplier, isActive, updated_at: now } : supplier
    );
    writeStorage(MOCK_SUPPLIERS_STORAGE_KEY, suppliers);
    return mockResponse({ success: true, data: suppliers.find((supplier) => supplier.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_SUPPLIERS_STORAGE_KEY, getMockSuppliers().filter((supplier) => supplier.id !== Number(id)));
    return mockResponse({ success: true });
  },
};

const normalizePurchasePayload = (data) => {
  const items = (data.items || []).map((item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const amount = Number(item.amount) || quantity * rate;
    return {
      id: item.id || Date.now() + Math.random(),
      item_type: item.item_type,
      tag: item.tag,
      description: item.description,
      unit: item.unit || '',
      quantity,
      rate,
      amount,
    };
  });

  return {
    supplier_id: Number(data.supplier_id),
    purchase_date: data.purchase_date,
    reference_no: data.reference_no || '',
    items,
    total_amount: items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
  };
};

const getNextPurchaseNo = () => {
  const maxNo = getMockPurchases().reduce((max, purchase) => {
    const number = Number(String(purchase.purchase_no || '').replace(/\D/g, '')) || 0;
    return Math.max(max, number);
  }, 0);
  return `P-${String(maxNo + 1).padStart(4, '0')}`;
};

const mockPurchasesAPI = {
  getAll: (params = {}) => {
    const suppliers = getMockSuppliers();
    let purchases = getMockPurchases().map((purchase) => ({
      ...purchase,
      purchase_no: purchase.purchase_no || `P-${String(purchase.id).padStart(4, '0')}`,
      supplier_name: suppliers.find((supplier) => supplier.id === Number(purchase.supplier_id))?.supplier_name || 'Unknown Supplier',
    }));
    if (params.search) {
      const search = params.search.toLowerCase();
      purchases = purchases.filter((purchase) =>
        [purchase.purchase_no, purchase.supplier_name, purchase.reference_no, purchase.purchase_date]
          .some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    if (params.supplier_id) purchases = purchases.filter((purchase) => Number(purchase.supplier_id) === Number(params.supplier_id));
    if (params.sortBy) {
      purchases = [...purchases].sort((a, b) => {
        const direction = params.order === 'desc' ? -1 : 1;
        return String(a[params.sortBy] ?? '').localeCompare(String(b[params.sortBy] ?? ''), undefined, { numeric: true }) * direction;
      });
    }
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || purchases.length || 10;
    const total = purchases.length;
    const start = (page - 1) * limit;
    return mockResponse({ data: purchases.slice(start, start + limit), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  },
  getOne: (id) => {
    const supplierMap = getMockSuppliers();
    const purchase = getMockPurchases().find((item) => item.id === Number(id));
    if (!purchase) return Promise.reject({ response: { status: 404 } });
    return mockResponse({ data: { ...purchase, purchase_no: purchase.purchase_no || `P-${String(purchase.id).padStart(4, '0')}`, supplier: supplierMap.find((supplier) => supplier.id === Number(purchase.supplier_id)) } });
  },
  create: (data) => {
    const now = new Date().toISOString();
    const purchase = { id: Date.now(), purchase_no: getNextPurchaseNo(), ...normalizePurchasePayload(data), created_at: now, updated_at: now };
    writeStorage(MOCK_PURCHASES_STORAGE_KEY, [purchase, ...getMockPurchases()]);
    return mockResponse({ success: true, data: purchase });
  },
  update: (id, data) => {
    const now = new Date().toISOString();
    const payload = normalizePurchasePayload(data);
    const purchases = getMockPurchases().map((purchase) => purchase.id === Number(id) ? { ...purchase, ...payload, updated_at: now } : purchase);
    writeStorage(MOCK_PURCHASES_STORAGE_KEY, purchases);
    return mockResponse({ success: true, data: purchases.find((purchase) => purchase.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_PURCHASES_STORAGE_KEY, getMockPurchases().filter((purchase) => purchase.id !== Number(id)));
    return mockResponse({ success: true });
  },
};

const normalizeContractorPayload = (data) => ({
  contractor_name: data.contractor_name || data.contractorName || '',
  person_name: data.person_name || data.personName || '',
  type: data.type || 'CMT',
  city: data.city || '',
  address: data.address || '',
  phone: data.phone || '',
  isActive: data.isActive !== false,
  balance: Number(data.balance) || 0,
});

const mockContractorsAPI = {
  getAll: (params = {}) => {
    let contractors = getMockContractors().map(withContractorProduction);
    if (params.search) {
      const search = params.search.toLowerCase();
      contractors = contractors.filter((contractor) =>
        [contractor.contractor_name, contractor.person_name, contractor.type, contractor.city, contractor.address, contractor.phone]
          .some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    if (params.status === 'active') contractors = contractors.filter((contractor) => contractor.isActive);
    if (params.status === 'inactive') contractors = contractors.filter((contractor) => !contractor.isActive);
    if (params.sortBy) {
      contractors = [...contractors].sort((a, b) => {
        const direction = params.order === 'desc' ? -1 : 1;
        return String(a[params.sortBy] ?? '').localeCompare(String(b[params.sortBy] ?? ''), undefined, { numeric: true }) * direction;
      });
    }
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || contractors.length || 10;
    const total = contractors.length;
    const start = (page - 1) * limit;
    return mockResponse({ data: contractors.slice(start, start + limit), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  },
  getOne: (id) => {
    const contractor = getMockContractors().find((item) => item.id === Number(id));
    return contractor ? mockResponse({ data: withContractorProduction(contractor) }) : Promise.reject({ response: { status: 404 } });
  },
  create: (data) => {
    const now = new Date().toISOString();
    const contractor = { id: Date.now(), ...normalizeContractorPayload(data), created_at: now, updated_at: now };
    writeStorage(MOCK_CONTRACTORS_STORAGE_KEY, [contractor, ...getMockContractors()]);
    return mockResponse({ success: true, data: contractor });
  },
  update: (id, data) => {
    const now = new Date().toISOString();
    const contractors = getMockContractors().map((contractor) =>
      contractor.id === Number(id) ? { ...contractor, ...normalizeContractorPayload(data), updated_at: now } : contractor
    );
    writeStorage(MOCK_CONTRACTORS_STORAGE_KEY, contractors);
    return mockResponse({ success: true, data: contractors.find((contractor) => contractor.id === Number(id)) });
  },
  setActive: (id, isActive) => {
    const now = new Date().toISOString();
    const contractors = getMockContractors().map((contractor) =>
      contractor.id === Number(id) ? { ...contractor, isActive, updated_at: now } : contractor
    );
    writeStorage(MOCK_CONTRACTORS_STORAGE_KEY, contractors);
    return mockResponse({ success: true, data: contractors.find((contractor) => contractor.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_CONTRACTORS_STORAGE_KEY, getMockContractors().filter((contractor) => contractor.id !== Number(id)));
    return mockResponse({ success: true });
  },
};

const getNextProductionNo = () => {
  const maxNo = getMockProductionTickets().reduce((max, ticket) => {
    const number = Number(String(ticket.ticket_no || '').replace(/\D/g, '')) || 0;
    return Math.max(max, number);
  }, 0);
  return `PR-${String(maxNo + 1).padStart(4, '0')}`;
};

const normalizeProductionPayload = (data) => ({
  type: data.type,
  contractor_id: Number(data.contractor_id),
  production_date: data.production_date,
  article_id: data.article_id ? Number(data.article_id) : null,
  article_quantity: Number(data.article_quantity) || 0,
  unit: Number(data.unit) || 1,
  cost_per_piece: Number(data.cost_per_piece) || 0,
  tag_cost_per_piece: Number(data.tag_cost_per_piece) || 0,
  total_cost_per_piece: Number(data.total_cost_per_piece) || 0,
  net_rate: Number(data.net_rate) || 0,
  sale_rate_per_piece: Number(data.sale_rate_per_piece) || 0,
  items: (data.items || []).map((item) => ({
    id: item.id || Date.now() + Math.random(),
    group_id: item.group_id || `${item.tag}__${item.rate || 0}`,
    tag: item.tag,
    item_type: item.item_type,
    description: item.description,
    unit: item.unit,
    rate: Number(item.rate) || 0,
    quantity: Number(item.quantity) || 0,
  })),
});

const mockProductionAPI = {
  getAll: (params = {}) => {
    const contractors = getMockContractors();
    const articles = getMockArticles();
    let tickets = getMockProductionTickets().map((ticket) => ({
      ...ticket,
      ticket_no: ticket.ticket_no || `PR-${String(ticket.id).padStart(4, '0')}`,
      contractor_name: contractors.find((contractor) => contractor.id === Number(ticket.contractor_id))?.contractor_name || 'Unknown Contractor',
      article_no: articles.find((article) => article.id === Number(ticket.article_id))?.article_no || '',
      total_quantity: (ticket.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    }));
    if (params.search) {
      const search = params.search.toLowerCase();
      tickets = tickets.filter((ticket) => [ticket.ticket_no, ticket.type, ticket.contractor_name, ticket.article_no].some((value) => String(value || '').toLowerCase().includes(search)));
    }
    if (params.type) tickets = tickets.filter((ticket) => ticket.type === params.type);
    if (params.sortBy) {
      tickets = [...tickets].sort((a, b) => {
        const direction = params.order === 'desc' ? -1 : 1;
        return String(a[params.sortBy] ?? '').localeCompare(String(b[params.sortBy] ?? ''), undefined, { numeric: true }) * direction;
      });
    }
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || tickets.length || 10;
    const total = tickets.length;
    const start = (page - 1) * limit;
    return mockResponse({ data: tickets.slice(start, start + limit), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  },
  getOne: (id) => {
    const ticket = getMockProductionTickets().find((item) => item.id === Number(id));
    if (!ticket) return Promise.reject({ response: { status: 404 } });
    const contractor = getMockContractors().find((item) => item.id === Number(ticket.contractor_id));
    const article = getMockArticles().find((item) => item.id === Number(ticket.article_id));
    return mockResponse({ data: { ...ticket, contractor, article } });
  },
  create: (data) => {
    const now = new Date().toISOString();
    const ticket = { id: Date.now(), ticket_no: getNextProductionNo(), ...normalizeProductionPayload(data), created_at: now, updated_at: now };
    writeStorage(MOCK_PRODUCTION_STORAGE_KEY, [ticket, ...getMockProductionTickets()]);
    return mockResponse({ success: true, data: ticket });
  },
  update: (id, data) => {
    const now = new Date().toISOString();
    const payload = normalizeProductionPayload(data);
    const tickets = getMockProductionTickets().map((ticket) =>
      ticket.id === Number(id) ? { ...ticket, ...payload, updated_at: now } : ticket
    );
    writeStorage(MOCK_PRODUCTION_STORAGE_KEY, tickets);
    return mockResponse({ success: true, data: tickets.find((ticket) => ticket.id === Number(id)) });
  },
  delete: (id) => {
    writeStorage(MOCK_PRODUCTION_STORAGE_KEY, getMockProductionTickets().filter((ticket) => ticket.id !== Number(id)));
    return mockResponse({ success: true });
  },
  getIssuedTags: (contractorId) => mockResponse({ data: getContractorIssuedTags(contractorId) }),
};

const mockInventoryAPI = {
  getAll: (params = {}) => {
    let inventory = getInventoryFromPurchases();
    if (params.search) {
      const search = params.search.toLowerCase();
      inventory = inventory.filter((item) => [item.tag, item.description, item.item_type, item.rate].some((value) => String(value || '').toLowerCase().includes(search)));
    }
    if (params.item_type) inventory = inventory.filter((item) => item.item_type === params.item_type);
    return mockResponse({ data: inventory, pagination: { page: 1, limit: inventory.length, total: inventory.length, totalPages: 1 } });
  },
  getByTag: (tag) => {
    const item = getInventoryFromPurchases().find((inventoryItem) => inventoryItem.tag === tag);
    return item ? mockResponse({ data: item }) : Promise.reject({ response: { status: 404 } });
  },
};

const mockConfigAPI = {
  getConfig: () => mockResponse({ data: mockConfig }),
  getOptions: () => mockResponse({ data: getMockOptions() }),
  getRateCategories: () => mockResponse({ data: getMockOptions().rateCategories }),
};

const mockOptionsAPI = {
  getAll: () => mockResponse({ data: getMockOptions() }),
  updateConfig: (type, action, data) => {
    const options = getMockOptions();
    const target = data.category ? options.rateCategories[data.category] : options[type];
    if (!target) return Promise.reject({ response: { status: 404 } });

    if (action === 'add') target.push(data.value);
    if (action === 'update') target[data.index] = data.value;
    if (action === 'delete') target.splice(data.index, 1);

    writeStorage(MOCK_OPTIONS_STORAGE_KEY, options);
    return mockResponse({ success: true, data: options });
  },
};

// Auth API
export const authAPI = USE_MOCKS ? mockAuthAPI : {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout')
};

// Users API
export const usersAPI = USE_MOCKS ? mockUsersAPI : {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};


// Articles API
export const articlesAPI = USE_MOCKS ? mockArticlesAPI : {
  getAll: (params) => api.get('/articles', { params }),
  getOne: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  getStats: () => api.get('/articles/stats')
};

export const suppliersAPI = USE_MOCKS ? mockSuppliersAPI : {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  setActive: (id, isActive) => api.patch(`/suppliers/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const purchasesAPI = USE_MOCKS ? mockPurchasesAPI : {
  getAll: (params) => api.get('/purchases', { params }),
  getOne: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

export const contractorsAPI = USE_MOCKS ? mockContractorsAPI : {
  getAll: (params) => api.get('/contractors', { params }),
  getOne: (id) => api.get(`/contractors/${id}`),
  create: (data) => api.post('/contractors', data),
  update: (id, data) => api.put(`/contractors/${id}`, data),
  setActive: (id, isActive) => api.patch(`/contractors/${id}/status`, { isActive }),
  delete: (id) => api.delete(`/contractors/${id}`),
};

export const productionAPI = USE_MOCKS ? mockProductionAPI : {
  getAll: (params) => api.get('/production', { params }),
  getOne: (id) => api.get(`/production/${id}`),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
  getIssuedTags: (contractorId) => api.get(`/production/contractors/${contractorId}/issued-tags`),
};

export const inventoryAPI = USE_MOCKS ? mockInventoryAPI : {
  getAll: (params) => api.get('/inventory', { params }),
  getByTag: (tag) => api.get(`/inventory/${tag}`),
};

// Config API
export const configAPI = USE_MOCKS ? mockConfigAPI : {
  getConfig: () => api.get('/config'),
  getOptions: () => api.get('/options'),
  getRateCategories: () => api.get('/config/rate-categories')
};

// Options API
export const optionsAPI = USE_MOCKS ? mockOptionsAPI : {
  getAll: () => api.get('/options'),
  
  // Single Unified Method for all types
  updateConfig: (type, action, data) => {
    // type: seasons, fabric_types, rateCategories
    // data: { value, index, category }
    const url = data.category 
      ? `/options/${type}/${data.category}` 
      : `/options/${type}`;
    return api.post(url, { ...data, action });
  }
};
