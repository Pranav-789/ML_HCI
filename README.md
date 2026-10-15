# CodeUp Analytics & Recommendation Engine 🚀

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Qdrant](https://img.shields.io/badge/Qdrant-FE4952?style=for-the-badge&logo=qdrant&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

A next-generation, microservices-based recommendation engine for competitive programmers on Codeforces. 

## 📋 Table of Contents
- [Project Idea & Concept](#-project-idea--concept)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Core Flows](#-core-flows)
  - [The Cold Start](#1-the-cold-start)
  - [The Recommendation Flow](#2-the-recommendation-flow)
- [Setup & Installation Instructions](#-setup--installation-instructions)
- [License](#-license)

---

## 💡 Project Idea & Concept

Unlike traditional platforms that rely on item-based cosine similarity (which often traps users in a "comfort zone" echo chamber of similar, easy problems), this platform introduces a **Peer-Based Collaborative Filtering** approach driven by an **Aspirational Vector**.

> [!NOTE]
> **The Zone of Proximal Development (ZPD)**
> Our algorithm evaluates users across **38 distinct problem tags** using a Player vs. Environment (PvE) Elo system. By artificially mutating the user's Elo vector forward by `+100` points in non-mastered topics, the system actively finds peers who are exactly one step ahead of the user. It then recommends the specific problems those peers used to bridge the gap.

---

## 🏗 Tech Stack & Architecture

This platform leverages a robust microservices architecture, heavily utilizing the MERN stack coupled with a dedicated Python Machine Learning microservice and Qdrant for vector similarity search.

### Backend (Traffic & Data Orchestration)
The central nervous system of the platform, handling web traffic, user validation, and synchronous ML orchestration.
* **Core:** Node.js, Express, TypeScript.
* **Database:** Mongoose (MongoDB) for atomic, schema-validated document storage and token vault management.
* **Security & Auth:** Secure JWT-based authentication with a proprietary Token Vault system.
* **Synchronous Processing:** Direct, low-latency synchronous ML pipeline execution with automatic token rollbacks on failures.

### ML Service (The Brain)
A lightning-fast, stateless Python microservice dedicated to vector mathematics and Qdrant database queries.
* **Core:** Python 3.10, FastAPI, Uvicorn.
* **Data & Matrix Math:** NumPy, Pandas, Scikit-Learn.
* **Vector Database:** Qdrant Client for highly scalable, optimized vector storage and rapid K-Nearest Neighbors (KNN) retrieval.
* **Architecture:** Exposes RESTful endpoints that consume user vectors, perform Aspirational Mutations, and execute highly optimized similarity searches using Qdrant.

### Frontend (User Interface)
* **Core:** React, Vite.
* **Real-time UX:** Responsive single-request interaction displaying active generation status and instantly updating recommended problem sets.

---

## ⚙️ Core Flows

### 1. The Cold Start
When new users register, they are automatically initialized into the ecosystem. Their MongoDB `UserMetrics` document is populated with a strictly validated, **38-dimensional vector** where every problem tag is assigned a base PvE rating of `1200`.

### 2. The Recommendation Flow
The core lifecycle of generating targeted, growth-oriented problems:

1. **Token Deduction & Trigger:** The user clicks "Generate Recommendations". The Node.js API deducts `5 tokens` from their MongoDB vault atomically and starts the synchronous pipeline.
2. **Context Assembly:** Node.js retrieves the user's 38D vector, ratings, and up to 75 recent submissions, and forwards them directly to the FastAPI ML service.
3. **PvE Elo Recalibration:** Python processes the historical submissions, calculating Elo fluctuations by comparing problem difficulty against the user's specific tag ratings.
4. **Aspirational Mutation & Qdrant KNN Search:** Python isolates the user's weakest topics and applies a `+100` Aspirational Mutation to their vector. It then executes a `query_points` operation against the **Qdrant Vector Database** to locate the 5 nearest neighbors (peers exactly one step ahead), filters out already-solved problems, and extracts the top recommendations.
5. **Persistence:** The Node.js API receives the mathematical payload, updates the user's vector in MongoDB, saves the active recommendations, and returns the result immediately.
6. **Frontend Resolution:** The React frontend receives the completed response, updates the view, and beautifully renders the newly generated problem set.

---

## 🚀 Setup & Installation Instructions

Follow these steps to deploy the microservices architecture locally.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/problem_recommendation_system.git
cd problem_recommendation_system
```

### 2. Configure Environment Variables
You must set up `.env` files in both the `backend` and `ml_service` directories. 

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://admin:30406@localhost:27017/CodeUpEngine?authSource=admin
JWT_SECRET=your_super_secret_key
ML_SERVICE_URL=http://localhost:8000
```

**`ml_service/.env`**
```env
MONGO_URI=mongodb://admin:30406@localhost:27017/?authSource=admin
MONGO_DB_NAME=CodeUpEngine
QDRANT_URL=https://your-qdrant-cluster-url.io # or http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key
```
*(Note: If using Docker, the `compose.yaml` file automatically overrides localhost variables to use internal Docker DNS).*

### 3. Install Local Dependencies
If running without Docker, initialize the respective environments:

**Node.js Backend:**
```bash
cd backend
npm install
```

**Python ML Service:**
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Seed the Database
> [!IMPORTANT]
> The Machine Learning recommendation model requires a mathematically clustered ecosystem to function properly. You **must** seed the database with users to allow the Qdrant KNN algorithm to form legitimate peer clusters.

From the `backend` directory, run the seeder script. This generates synthetic users grouped into archetypes:
```bash
npx tsx scripts/seedDatabase.ts
```

*(Note: The FastAPI ML Service handles vector synchronization automatically on startup, indexing all MongoDB users into Qdrant).*

### 5. Run the Platform (Docker Compose)
The ideal, production-mirrored way to run this architecture is via Docker Compose, which spins up MongoDB, Node.js, React Frontend, and FastAPI within an isolated bridge network.

From the root directory:
```bash
docker compose up --build -d
```
* **Frontend:** Accessible at `http://localhost:5173`
* **Backend:** Accessible at `http://localhost:5000`
* **ML Service:** Accessible at `http://localhost:8000`

---
*Built with precision for the competitive programming community.*
