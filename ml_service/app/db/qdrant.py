import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

class QdrantDB:
    client: QdrantClient = None
    collection_name = "user_vectors"

qdrant_instance = QdrantDB()

def init_qdrant():
    """Initializes the Qdrant connection and ensures the collection exists."""
    qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.environ.get("QDRANT_API_KEY", None)
    
    try:
        qdrant_instance.client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        
        # Check if collection exists, if not create it
        collections = qdrant_instance.client.get_collections()
        collection_names = [collection.name for collection in collections.collections]
        
        if qdrant_instance.collection_name not in collection_names:
            logger.info(f"Creating Qdrant collection: {qdrant_instance.collection_name}")
            qdrant_instance.client.create_collection(
                collection_name=qdrant_instance.collection_name,
                vectors_config=models.VectorParams(
                    size=38,
                    distance=models.Distance.EUCLID
                )
            )
        else:
            logger.info(f"Qdrant collection {qdrant_instance.collection_name} already exists.")
            
        logger.info("Successfully connected to Qdrant.")
    except Exception as e:
        logger.error(f"Could not connect to Qdrant: {e}")
        # Note: Depending on your requirements, you might want to raise the exception
        # if Qdrant is absolutely required for the service to start.
        raise e

def get_qdrant_client() -> QdrantClient:
    """Returns the Qdrant client instance."""
    return qdrant_instance.client
