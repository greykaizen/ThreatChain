const express = require('express');
const router = express.Router();
const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:5002';
const RAG_TIMEOUT = parseInt(process.env.RAG_SERVICE_TIMEOUT) || 30000;

// ─── Helper: proxy to RAG Python service ────────────────────────────────────
async function proxyToRag(endpoint, method, body = null) {
  const config = {
    method,
    url: `${RAG_SERVICE_URL}${endpoint}`,
    timeout: RAG_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) config.data = body;
  const response = await axios(config);
  return response.data;
}

// ─── POST /api/rag/query ─────────────────────────────────────────────────────
// Body: { question: string, top_k?: number }
router.post('/query', async (req, res) => {
  const { question, top_k = 5 } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'question is required' });
  }

  try {
    const result = await proxyToRag('/rag/query', 'post', {
      question: question.trim(),
      top_k,
    });
    return res.json(result);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        error: 'RAG service is offline. Start it with: cd rag-service && python app.py',
      });
    }
    console.error('RAG proxy error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/rag/index ─────────────────────────────────────────────────────
// Triggers re-indexing of STIX reports from MySQL into the vector store
router.post('/index', async (req, res) => {
  try {
    const result = await proxyToRag('/rag/index', 'post');
    return res.json(result);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        error: 'RAG service is offline.',
      });
    }
    console.error('RAG index error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/rag/status ─────────────────────────────────────────────────────
// Returns whether the RAG service is reachable and how many docs are indexed
router.get('/status', async (req, res) => {
  try {
    const result = await proxyToRag('/rag/status', 'get');
    return res.json(result);
  } catch (err) {
    return res.json({
      success: true,
      online: false,
      indexed_documents: 0,
      message: 'RAG service is offline',
    });
  }
});

module.exports = router;
