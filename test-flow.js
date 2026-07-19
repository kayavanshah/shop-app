const http = require('http');
const https = require('https');

const API_URL = 'https://shop-app-653d.onrender.com';
let cookie = '';

async function fetchAPI(endpoint, method = 'GET', body = null) {
  const url = API_URL + endpoint;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(url, options);
  
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }
  
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, text };
  }
}

async function runTests() {
  console.log('--- STARTING TESTS ---');
  
  // 1. Login
  console.log('1. Logging in...');
  let res = await fetchAPI('/api/auth/login', 'POST', { username: 'test_shop', password: 'test@shop' });
  console.log('Login Result:', res.status, res.data || res.text);
  if (res.status !== 200) return console.log('Login failed, stopping tests.');
  
  // 2. Create Supplier
  console.log('\n2. Creating Supplier...');
  res = await fetchAPI('/api/suppliers', 'POST', { name: 'Test Supplier', mobile: '12345', openingBalance: 0 });
  console.log('Supplier Result:', res.status, res.data || res.text);
  const supplierId = res.data?.id;
  if (!supplierId) return console.log('Supplier creation failed.');

  // 3. Create Product
  console.log('\n3. Creating Product...');
  res = await fetchAPI('/api/products', 'POST', { name: 'Test Product', category: 'TEST', buyPrice: 10, sellPrice: 20, quantity: 100, minStock: 10 });
  console.log('Product Result:', res.status, res.data || res.text);
  
  // Need to fetch products to get the ID because the API doesn't return the product ID in POST
  res = await fetchAPI('/api/products', 'GET');
  const productId = res.data?.[0]?.id;
  if (!productId) return console.log('Failed to fetch products after creation.');
  console.log('Product created with ID:', productId);

  // 4. Create Purchase
  console.log('\n4. Creating Purchase...');
  res = await fetchAPI('/api/purchases', 'POST', { supplierId, status: 'RECEIVED', items: [{ productId, quantity: 50, buyPrice: 10 }] });
  console.log('Purchase Result:', res.status, res.data || res.text);
  
  // 5. Create Bill
  console.log('\n5. Creating Bill...');
  res = await fetchAPI('/api/bills', 'POST', { customerName: 'Test Customer', discount: 0, paymentMethod: 'CASH', items: [{ productId, quantity: 2, price: 20 }] });
  console.log('Bill Result:', res.status, res.data || res.text);

  // 6. Get Dashboard
  console.log('\n6. Fetching Dashboard...');
  res = await fetchAPI('/api/dashboard', 'GET');
  console.log('Dashboard Result:', res.status, res.data || res.text);
  
  console.log('\n--- ALL TESTS COMPLETED ---');
}

runTests().catch(console.error);
