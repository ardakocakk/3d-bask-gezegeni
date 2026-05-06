export function getCart() {
  const saved = localStorage.getItem('cart_3d');
  return saved ? JSON.parse(saved) : [];
}

export function saveCart(cart) {
  localStorage.setItem('cart_3d', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id && !item.is_custom);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
      is_custom: false
    });
  }
  
  saveCart(cart);
}

export function addCustomToCart(item) {
  const cart = getCart();
  cart.push({
    id: 'custom_' + Date.now(),
    name: item.name,
    price: item.price,
    quantity: 1,
    is_custom: true,
    stl_file_url: item.stl_file_url,
    material: item.material,
    color: item.color,
    file_size_mb: item.file_size_mb
  });
  saveCart(cart);
}

export function removeFromCart(itemId) {
  const cart = getCart().filter(item => item.id !== itemId);
  saveCart(cart);
}

export function updateCartQuantity(itemId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}