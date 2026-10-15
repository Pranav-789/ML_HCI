import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/AsyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import UserMetrics from "../models/usermetric.model.js";
import User from "../models/user.model.js";
import { TokenService } from "../utils/tokenService.js";

// get active recommendation
export const getActiveRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if(!user){
        throw new ApiError(401, "Unauthorized");
    }
    try{
        const recommendations = await UserMetrics.findOne({userId: user.userId}).select("activeRecommendations");

        if(!recommendations){
            throw new ApiError(404, "No recommendations found");
        }

        return res.status(200).json(
            new ApiResponse(200, recommendations, "Recommendations fetched successfully")
        );
    }catch(error){
        if(error instanceof ApiError){
            throw error;
        }
        throw new ApiError(500, "Failed to fetch recommendations");
    }
});

// Synchronous recommendation generation
export const generateRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    // 1. Deduct Tokens FIRST
    const tokenResult = await TokenService.consumeTokens(user.userId, 5);
    if (!tokenResult.success) {
        throw new ApiError(403, "Insufficient tokens to generate recommendations");
    }

    try {
        // 2. Fetch current metrics
        const metrics = await UserMetrics.findOne({ userId: user.userId });
        if (!metrics) {
            throw new ApiError(404, `User metrics not found for user ${user.userId}`);
        }

        // 3. Fetch user rating from Codeforces if handle is available
        const dbUser = await User.findById(user.userId);
        let userRating = 1500;
        if (dbUser && dbUser.codeforcesHandle) {
            try {
                const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${dbUser.codeforcesHandle}`);
                if (cfRes.ok) {
                    const cfData = await cfRes.json() as any;
                    if (cfData.status === "OK" && cfData.result && cfData.result.length > 0) {
                        userRating = cfData.result[0].rating || 1500;
                    }
                }
            } catch (err) {
                console.error("Failed to fetch rating:", err);
            }
        }

        // 4. Construct payload for ML service
        const fastapiPayload = {
            user_id: user.userId,
            user_rating: userRating,
            topic_elo_vector: metrics.topicEloVector,
            recent_submissions: metrics.recentSubmissions.map(sub => ({
                problem_id: sub.problemId,
                problem_rating: sub.rating || 0,
                tags: sub.tags,
                correctSubmissions: sub.correctSubmissions || 0,
                wrongSubmissions: sub.incorrectSubmissions || 0
            })),
            avoid_problems: metrics.activeRecommendations ? metrics.activeRecommendations.map((rec: any) => rec.problemId) : []
        };

        // 5. Call FastAPI ML service synchronously
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${mlServiceUrl}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fastapiPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (errorText.toLowerCase().includes("<html")) {
                throw new ApiError(503, `ML Service is temporarily unavailable (HTTP ${response.status}). Please try again.`);
            }
            throw new ApiError(500, `FastAPI ML Service failed: ${errorText}`);
        }

        const data = await response.json() as {
            user_id: string;
            updated_vector: number[];
            recommendations: Array<{
                problem_id: string;
                target_topic: string;
            }>;
        };

        // 6. Update MongoDB
        metrics.topicEloVector = data.updated_vector;

        const newRecs = data.recommendations.map((rec) => ({
            problemId: rec.problem_id,
            recommendedAt: new Date(),
            targetTopic: rec.target_topic
        })) as any;

        if (!metrics.activeRecommendations) {
            metrics.activeRecommendations = [] as any;
        }
        metrics.activeRecommendations.push(...newRecs);
        metrics.lastCalculatedAt = new Date();
        metrics.pendingRecommendationJobId = null;

        await metrics.save();

        return res.status(200).json(
            new ApiResponse(200, {
                recommendations: metrics.activeRecommendations,
                count: data.recommendations.length,
                remainingTokens: tokenResult.remaining
            }, "Recommendations generated successfully")
        );
    } catch (error: any) {
        // Refund tokens on failure
        console.error("Failed to generate recommendations, refunding tokens:", error);
        try {
            await TokenService.creditTokens(user.userId, 5);
        } catch (refundErr) {
            console.error("Error refunding tokens:", refundErr);
        }

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error.message || "Failed to generate recommendations. Tokens have been refunded.");
    }
});

// Backward-compatibility endpoint for job status
export const checkJobStatus = asyncHandler(async (req: Request, res: Response) => {
    return res.status(200).json(
        new ApiResponse(200, {
            status: 'completed'
        }, "Synchronous mode active. No async jobs.")
    );
});