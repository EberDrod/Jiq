import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Order from './pages/Order';
import Confirm from './pages/Confirm';
import OrderSuccess from './pages/OrderSuccess';
import OrderLookup from './pages/OrderLookup';
import NotFound from './pages/NotFound';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda" element={<Shop />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/pedido" element={<Order />} />
            <Route path="/confirmar" element={<Confirm />} />
            <Route path="/pedido-confirmado/:folio" element={<OrderSuccess />} />
            <Route path="/rastrear" element={<OrderLookup />} />
            <Route path="/pedido/:folio" element={<OrderLookup />} />

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/admin/inventario" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/admin/pedidos/:id" element={<ProtectedRoute><AdminOrderDetail /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
