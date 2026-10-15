from app.db.mongoDB import get_database
from app.db.qdrant import get_qdrant_client, qdrant_instance
from qdrant_client.http import models
import uuid
import logging

logger = logging.getLogger(__name__)

async def rebuild_global_knn_index():
    """Fetches all user matrices from Mongo and upserts them into Qdrant."""
    db = get_database()
    if db is None:
        logger.error("Database unavailable; cannot build KNN index.")
        return False
        
    qdrant_client = get_qdrant_client()
    if qdrant_client is None:
        logger.error("Qdrant unavailable; cannot build KNN index.")
        return False

    points = []

    try:
        cursor = db.usermetrics.find({}, {"userId": 1, "topicEloVector": 1})
        
        async for doc in cursor:
            if "topicEloVector" in doc and len(doc["topicEloVector"]) == 38:
                user_id_str = str(doc["userId"])
                # Generate deterministic UUID from ObjectId string
                point_id = uuid.uuid5(uuid.NAMESPACE_OID, user_id_str).hex
                
                points.append(
                    models.PointStruct(
                        id=point_id,
                        payload={"user_id": user_id_str},
                        vector=doc["topicEloVector"]
                    )
                )

        if points:
            # Upsert in batches if there are many points, but for now we do one upsert
            qdrant_client.upsert(
                collection_name=qdrant_instance.collection_name,
                points=points
            )
            logger.info(f"Successfully indexed {len(points)} users into Qdrant.")
        return True

    except Exception as e:
        logger.error(f"Error during Qdrant matrix indexing: {e}")
        return False