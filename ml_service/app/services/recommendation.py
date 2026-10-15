from app.models.request import RecommendRequest as RecommendationRequest
from app.services.elo_service import process_submissions
from app.ml.vector_math import create_aspirational_vector
from app.db.mongoDB import get_database
from app.db.qdrant import get_qdrant_client, qdrant_instance
import logging

logger = logging.getLogger(__name__)

from bson import ObjectId

async def extract_unsolved_problems(peer_ids: list[str], user_seen_problems: set[str], user_rating: int = None) -> list[dict]:
    """Fetches peers' solved problems, filters out what the user knows, and ranks the best based on rating."""
    db = get_database()
    if db is None:
        logger.error("Database not connected.")
        return []

    object_ids = [ObjectId(pid) for pid in peer_ids if pid]
    cursor = db.usermetrics.find({"userId": {"$in": object_ids}}, {"recentSubmissions": 1})
    
    peer_problem_counts = {}
    problem_tags = {}
    
    async for peer in cursor:
        if "recentSubmissions" in peer:
            for sub in peer["recentSubmissions"]:
                prob_id = sub["problemId"]
                prob_rating = sub.get("rating", 0)
                if sub.get("correctSubmissions", 0) > 0 and prob_id not in user_seen_problems:
                    if user_rating is None or prob_rating == 0 or (user_rating - 100 <= prob_rating <= user_rating + 200):
                        peer_problem_counts[prob_id] = peer_problem_counts.get(prob_id, 0) + 1
                    if prob_id not in problem_tags:
                        tags = sub.get("tags", [])
                        problem_tags[prob_id] = tags[0] if tags else "mixed"

    sorted_problems = sorted(peer_problem_counts.keys(), key=lambda k: peer_problem_counts[k], reverse=True)
    
    top_problems = sorted_problems[:10]
    return [{"problem_id": pid, "target_topic": problem_tags[pid]} for pid in top_problems]


async def generate_recommendations(req: RecommendationRequest) -> dict:
    updated_vector = process_submissions(req.topic_elo_vector, req.recent_submissions)
    
    aspirational_vector = create_aspirational_vector(updated_vector)
    
    qdrant_client = get_qdrant_client()
    if qdrant_client:
        search_result = qdrant_client.query_points(
            collection_name=qdrant_instance.collection_name,
            query=aspirational_vector,
            limit=5
        )
        peer_ids = [hit.payload.get("user_id") for hit in search_result.points if hit.payload and "user_id" in hit.payload]
    else:
        logger.error("Qdrant client not initialized.")
        peer_ids = []

    user_seen_set = {sub.problem_id for sub in req.recent_submissions}
    user_seen_set.update(req.avoid_problems)
    recommended_problems = await extract_unsolved_problems(peer_ids, user_seen_set, req.user_rating)
    
    return {
        "user_id": req.user_id,
        "updated_vector": updated_vector,
        "recommendations": recommended_problems
    }