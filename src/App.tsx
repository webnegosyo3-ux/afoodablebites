import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import SubNav from './components/SubNav';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingCartButton from './components/FloatingCartButton';
import AdminDashboard from './components/AdminDashboard';
import WelcomePage from './components/WelcomePage';
import { useMenu } from './hooks/useMenu';

function MainApp() {
  const cart = useCart();
  const { menuItems } = useMenu();
  // Starts on pure 'welcome' page first (no header, no footer)
  const [currentView, setCurrentView] = useState<'welcome' | 'menu' | 'cart' | 'checkout'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleViewChange = (view: 'welcome' | 'menu' | 'cart' | 'checkout') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 1. Pure Welcome Page Only (No header, No footer)
  if (currentView === 'welcome') {
    return (
      <WelcomePage onOrderNow={() => handleViewChange('menu')} />
    );
  }

  // 2. Ordering Flow (Header + Menus / Cart / Checkout)
  return (
    <div className="min-h-screen bg-zinc-100 font-inter text-zinc-900 selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      {/* Top Header Section */}
      <Header 
        currentView={currentView}
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={() => handleViewChange('menu')}
        onHomeClick={() => handleViewChange('welcome')}
      />

      {/* Menu View (Header Section + All Menus) */}
      {currentView === 'menu' && (
        <div className="flex-1 animate-fade-in">
          {/* Category Tabs */}
          <SubNav 
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />

          {/* All Menus */}
          <Menu 
            menuItems={menuItems}
            addToCart={cart.addToCart}
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
            selectedCategory={selectedCategory}
          />

          {/* Floating Cart Button */}
          <FloatingCartButton 
            itemCount={cart.getTotalItems()}
            onCartClick={() => handleViewChange('cart')}
          />
        </div>
      )}

      {/* Cart View */}
      {currentView === 'cart' && (
        <div className="flex-1 animate-fade-in">
          <Cart 
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
            removeFromCart={cart.removeFromCart}
            clearCart={cart.clearCart}
            getTotalPrice={cart.getTotalPrice}
            onContinueShopping={() => handleViewChange('menu')}
            onCheckout={() => handleViewChange('checkout')}
          />
        </div>
      )}

      {/* Checkout View */}
      {currentView === 'checkout' && (
        <div className="flex-1 animate-fade-in">
          <Checkout 
            cartItems={cart.cartItems}
            totalPrice={cart.getTotalPrice()}
            onBack={() => handleViewChange('cart')}
            onOrderSuccess={() => {
              cart.clearCart();
              handleViewChange('menu');
            }}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
