import api from '../lib/api';
import * as auth from '../lib/auth';

jest.mock('../lib/auth');

const mockAuth = auth as jest.Mocked<typeof auth>;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockAuth.getToken.mockReturnValue(null);
  });

  describe('authentication methods', () => {
    describe('login', () => {
      it('should send login request and set token', async () => {
        const mockResponse = {
          accessToken: 'test-token',
          user: { id: 'user-1', email: 'test@example.com' },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await api.login({ email: 'test@example.com', password: 'password' });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
          })
        );
        expect(mockAuth.setToken).toHaveBeenCalledWith('test-token');
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on login failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        });

        await expect(api.login({ email: 'test@example.com', password: 'wrong' }))
          .rejects.toThrow('Invalid credentials');
      });
    });

    describe('signup', () => {
      it('should send signup request and set token', async () => {
        const mockResponse = {
          accessToken: 'new-token',
          user: { id: 'user-1', email: 'new@example.com' },
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await api.signup({
          email: 'new@example.com',
          password: 'password',
          nickname: 'NewUser',
        });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/signup'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(mockAuth.setToken).toHaveBeenCalledWith('new-token');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('logout', () => {
      it('should remove token', async () => {
        await api.logout();
        expect(mockAuth.removeToken).toHaveBeenCalled();
      });
    });

    describe('getMe', () => {
      it('should fetch current user with auth header', async () => {
        mockAuth.getToken.mockReturnValue('test-token');
        const mockUser = { id: 'user-1', email: 'test@example.com' };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });

        const result = await api.getMe();

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/me'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token',
            }),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });
  });

  describe('quest methods', () => {
    beforeEach(() => {
      mockAuth.getToken.mockReturnValue('test-token');
    });

    it('getAllQuests should fetch all quests', async () => {
      const mockQuests = [{ id: 'quest-1', title: 'Quest 1' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuests),
      });

      const result = await api.getAllQuests();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/quests'),
        expect.any(Object)
      );
      expect(result).toEqual(mockQuests);
    });

    it('createQuest should create a new quest', async () => {
      const newQuest = { title: 'New Quest', description: 'Description', rewardPoints: 100 };
      const createdQuest = { id: 'quest-1', ...newQuest };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdQuest),
      });

      const result = await api.createQuest(newQuest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/quests'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newQuest),
        })
      );
      expect(result).toEqual(createdQuest);
    });

    it('submitQuest should submit a quest', async () => {
      const submission = { proofUrl: 'http://proof.url' };
      const mockSubmission = { id: 'sub-1', status: 'PENDING' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubmission),
      });

      const result = await api.submitQuest('quest-1', submission);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/quests/quest-1/submit'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('notification methods', () => {
    beforeEach(() => {
      mockAuth.getToken.mockReturnValue('test-token');
    });

    it('getNotifications should fetch notifications with pagination', async () => {
      const mockResponse = {
        notifications: [{ id: 'notif-1', title: 'Test' }],
        total: 1,
        unreadCount: 1,
        page: 1,
        totalPages: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getNotifications(1, 20);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications?page=1&limit=20'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('markNotificationRead should mark notification as read', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await api.markNotificationRead('notif-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/notif-1/read'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getAllQuests()).rejects.toThrow('Network error');
    });

    it('should handle server errors with message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      });

      await expect(api.getAllQuests()).rejects.toThrow('Internal server error');
    });

    it('should handle server errors without message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.getAllQuests()).rejects.toThrow('An error occurred');
    });
  });
});
