# 🌆 Vibe Search

Intelligent, Vibe-Aware Place Discovery Using Client-Side AI

Vibe Search is a production-style web application that explores how generative AI and client-side intelligence can be combined to enhance location-based discovery beyond static filters like ratings and distance.

Instead of answering “Where is it?”, Vibe Search answers:
👉 “What will it feel like when I get there?”

The project is designed as a hackathon-ready, extensible AI system, with a strong emphasis on UX, correctness, and real-world constraints.

## 🎯 Motivation

Most location-based apps optimize for proximity and popularity.
Very few optimize for human intent and atmosphere.

This project investigates:

How natural language intent can be converted into structured search

How AI can summarize unstructured signals into a human-readable vibe

How ML can be safely integrated entirely on the client

## 🧠 What This Project Demonstrates

This repository showcases:

✅ LLM-powered intent parsing (Gemini)
✅ AI-generated vibe summaries from real-world data
✅ Strict output validation to prevent hallucination
✅ Clean React architecture with async AI pipelines
✅ Real-world API orchestration (Maps, Places, AI)
✅ ML-ready architecture designed for TensorFlow.js extensions

## ✨ Key Features
### 🔍 Intent-Aware Search (LLM-powered)

Accepts natural language queries like
“quiet cafe to work” or “cozy park for evening walks”

Converts intent → structured Google Maps search parameters

Enforces strict JSON-only LLM outputs for reliability

### 🧠 AI Vibe Analysis

Uses generative AI to analyze place context and metadata

Produces a concise “AI Vibe” summary for each place

Designed to mirror how humans reason about atmosphere, not just ratings

### 🗺️ Map-Centric UX

Live Google Maps integration

Interactive markers and detail panels

Distance-aware ranking with visual feedback loops

## 🧩 Technical Architecture
User Input
   ↓
LLM Intent Parser (Gemini)
   ↓
Google Places Search
   ↓
AI Vibe Analysis
   ↓
React UI + Maps


No backend services

No user data storage

All intelligence runs client-side

## 🛠️ Tech Stack
Category	Technology
Framework	React + Vite
Maps	Google Maps (vis.gl)
AI	Google Gemini
ML (Planned / Experimental)	TensorFlow.js
Styling	CSS / Inline styles
## 🧪 TensorFlow.js (Planned Extension)

Earlier iterations of this project prototyped client-side ML workflows using TensorFlow.js, including:

Predictive busyness estimation

Vibe-based ranking models

UX-level AI guardrails

Due to browser stability constraints and hackathon timelines, these models were intentionally deferred in favor of a more reliable AI-first pipeline.

However, the architecture is explicitly designed to support:

In-browser TFJS inference

Feature-based ranking models

Time-series prediction (busyness, crowding)

Safe ML lifecycle management

👉 This makes TensorFlow.js a natural next step, not a refactor.

## ⚙️ Setup & Usage
npm install
npm run dev


Create a .env file:

VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key

## 📈 Potential Extensions

TensorFlow.js-based vibe ranking

Predictive crowd/busyness modeling

Model personalization

Web Worker–based ML offloading

Progressive Web App (PWA) support

Multi-user vibe aggregation

## 👤 About the Developer

This project reflects my interest in:

Human-centered AI systems

Applied machine learning

Building fast, reliable products under real constraints

It was intentionally designed as a hackathon-selection–ready codebase — modular, extensible, and engineered with production trade-offs in mind.

## 📄 License

MIT
