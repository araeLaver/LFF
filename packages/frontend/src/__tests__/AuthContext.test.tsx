import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import * as auth from '../lib/auth';

jest.mock('../lib/api');
jest.mock('../lib/auth');

const mockApi = api as jest.Mocked<typeof api>;
const mockAuth = auth as jest.Mocked<typeof auth>;

// Test component to consume auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getToken.mockReturnValue(null);
    mockAuth.isTokenExpired.mockReturnValue(false);
  });

  describe('initial state', () => {
    it('should show loading state initially', () => {
      mockAuth.getToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should be not authenticated when no token exists', async () => {
      mockAuth.getToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      });
    });

    it('should fetch user when valid token exists', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        profile: { nickname: 'TestUser' },
      };

      mockAuth.getToken.mockReturnValue('valid-token');
      mockAuth.isTokenExpired.mockReturnValue(false);
      mockApi.getMe.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should clear token when expired', async () => {
      mockAuth.getToken.mockReturnValue('expired-token');
      mockAuth.isTokenExpired.mockReturnValue(true);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuth.removeToken).toHaveBeenCalled();
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        profile: { nickname: 'TestUser' },
      };

      mockAuth.getToken.mockReturnValue(null);
      mockApi.login.mockResolvedValue({
        accessToken: 'new-token',
        user: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        profile: { nickname: 'TestUser' },
      };

      mockAuth.getToken.mockReturnValue('valid-token');
      mockAuth.isTokenExpired.mockReturnValue(false);
      mockApi.getMe.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(mockApi.logout).toHaveBeenCalled();
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
