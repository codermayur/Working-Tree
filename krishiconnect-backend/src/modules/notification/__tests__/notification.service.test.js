/**
 * Unit tests for notification.service: create (self-notification), getUnreadCount, markAsRead.
 */
const mongoose = require('mongoose');

jest.mock('../../../config/logger', () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }));

const mockBlockedIds = jest.fn().mockResolvedValue([]);
jest.mock('../../user/user.service', () => ({
  getBlockedIds: (...args) => mockBlockedIds(...args),
}));

const mockCreate = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockCountDocuments = jest.fn();
const mockFind = jest.fn();

jest.mock('../notification.model', () => {
  const mong = require('mongoose');
  return {
    find: function () {
      return {
        sort: () => ({
          limit: () => ({
            populate: () => ({
              lean: () => mockFind(),
            }),
          }),
        }),
      };
    },
    findOne: function () {
      return { lean: () => mockFindOne() };
    },
    findOneAndUpdate: function (filter, update, opts) {
      return {
        populate: () => ({ lean: () => mockFindOneAndUpdate(filter, update, opts) }),
      };
    },
    updateMany: (...args) => mockUpdateMany(...args),
    countDocuments: (...args) => mockCountDocuments(...args),
    create: function (doc) {
      mockCreate(doc);
      const created = { _id: new mong.Types.ObjectId(), ...doc, createdAt: new Date() };
      return Promise.resolve(created);
    },
  };
});

const notificationService = require('../notification.service');

const recipientId = new mongoose.Types.ObjectId();
const senderId = new mongoose.Types.ObjectId();

beforeEach(() => {
  jest.clearAllMocks();
  mockBlockedIds.mockResolvedValue([]);
  mockFindOne.mockResolvedValue(null);
  mockCountDocuments.mockResolvedValue(0);
});

describe('notification.service', () => {
  describe('create', () => {
    it('returns null when recipient equals sender (self-notification)', async () => {
      const result = await notificationService.create({
        recipient: recipientId,
        sender: recipientId,
        type: 'like',
        entityId: new mongoose.Types.ObjectId(),
        entityType: 'post',
        message: 'liked your post',
      });
      expect(result).toBeNull();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns null when recipient is invalid', async () => {
      const result = await notificationService.create({
        recipient: 'invalid-id',
        sender: senderId,
        type: 'like',
      });
      expect(result).toBeNull();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('returns count for user', async () => {
      mockCountDocuments.mockResolvedValue(7);
      const count = await notificationService.getUnreadCount(recipientId);
      expect(count).toBe(7);
      expect(mockCountDocuments).toHaveBeenCalled();
    });

    it('excludes blocked senders when getBlockedIds returns ids', async () => {
      mockBlockedIds.mockResolvedValue([new mongoose.Types.ObjectId()]);
      mockCountDocuments.mockResolvedValue(2);
      const count = await notificationService.getUnreadCount(recipientId);
      expect(count).toBe(2);
      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ sender: { $nin: expect.any(Array) } })
      );
    });
  });

  describe('markAsRead', () => {
    it('returns updated notification when found', async () => {
      const id = new mongoose.Types.ObjectId();
      const updated = { _id: id, recipient: recipientId, isRead: true };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await notificationService.markAsRead(id, recipientId);

      expect(result).toEqual(updated);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: id, recipient: recipientId }),
        { isRead: true },
        { new: true }
      );
    });

    it('returns null when notification not found', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);
      const result = await notificationService.markAsRead(new mongoose.Types.ObjectId(), recipientId);
      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('calls updateMany and returns success', async () => {
      mockUpdateMany.mockResolvedValue({ modifiedCount: 3 });
      const result = await notificationService.markAllAsRead(recipientId);
      expect(result).toEqual({ success: true });
      expect(mockUpdateMany).toHaveBeenCalledWith(
        { recipient: recipientId, isRead: false, deletedAt: null },
        { isRead: true }
      );
    });
  });
});
