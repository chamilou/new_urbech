import Footer from './components/Footer';
import './globals.css'; // or your global CSS file path
import HeaderWrapper from './components/HeaderWrapper';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import ToastContainer from './components/ToastContainer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
          <AuthProvider>
        <CartProvider>
        <HeaderWrapper/>
          <main>
            
          {children}
            <ToastContainer/>
          </main>
          <Footer/>
        </CartProvider>
      
          </AuthProvider>
      
      </body>
    </html>
  );
}