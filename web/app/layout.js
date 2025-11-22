import { RBACProvider } from '@/context/RBACContext';
import './globals.css';

export default function RootLayout({ children }) {
  const user = {
    name: 'Alice',
    roles: ['Owner'], // coming from backend
  };

  return (
    <html lang="en">
      <body>
        <RBACProvider userRoles={user.roles}>
          {children}
        </RBACProvider>
      </body>
    </html>
  );
}
