// services/TokenService.ts
import User from '../models/user.model.js';
import { ApiError } from "./ApiError.js";

export class TokenService {
  /**
   * Get Balance: Reads tokens directly from MongoDB, refreshing weekly tokens if expired
   */
  static async getBalance(userId: string) {
    const user = await User.findById(userId).select('baseTokens premiumTokens nextWeeklyRefresh');
    if (!user) throw new ApiError(404, 'User not found');

    let baseTokens = user.baseTokens;
    let nextWeeklyRefresh = user.nextWeeklyRefresh;
    const now = new Date();

    if (now >= nextWeeklyRefresh) {
      baseTokens = 50;
      nextWeeklyRefresh = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(userId, {
        baseTokens: 50,
        nextWeeklyRefresh: nextWeeklyRefresh
      });
    }

    const premiumTokens = user.premiumTokens || 0;
    return {
      baseTokens,
      premiumTokens,
      nextWeeklyRefresh,
      totalTokens: baseTokens + premiumTokens
    };
  }

  /**
   * Consume Tokens: Deducts tokens atomically from MongoDB
   */
  static async consumeTokens(userId: string, amount: number): Promise<{ success: boolean; remaining: number }> {
    const balance = await this.getBalance(userId);

    if (balance.totalTokens < amount) {
      return { success: false, remaining: balance.totalTokens };
    }

    const baseToDeduct = Math.min(balance.baseTokens, amount);

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, baseTokens: { $gte: baseToDeduct } },
      { $inc: { baseTokens: -baseToDeduct } },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, remaining: balance.totalTokens };
    }

    return { success: true, remaining: updatedUser.baseTokens };
  }

  /**
   * Credit Tokens: Adds tokens back to MongoDB
   */
  static async creditTokens(userId: string, amount: number): Promise<number> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { baseTokens: amount } },
      { new: true }
    ).select('baseTokens');

    return user?.baseTokens ?? 0;
  }
}