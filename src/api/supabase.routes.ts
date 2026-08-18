// ============================================================================
// SUPABASE DATABASE API ENDPOINTS
// These endpoints replace Firestore operations and integrate with admin dashboard
// ============================================================================

import express from 'express';
import dotenv from 'dotenv';
import { 
  saveQuestion, 
  saveQuestionsBulk, 
  saveCourse, 
  deleteQuestion, 
  deleteCourse,
  getUniversities,
  getAllQuestions,
  savePayment,
  updateUserSubscription,
  upsertUser,
  subscribeToQuestionsChanges,
  subscribeToCourseChanges
} from '../lib/supabase';

dotenv.config();

const router = express.Router();

// ============================================================================
// QUESTIONS ENDPOINTS
// ============================================================================

/**
 * POST /api/supabase/questions
 * Save a single question or bulk questions
 */
router.post('/questions', async (req, res) => {
  try {
    const { questions, question } = req.body;
    
    if (questions && Array.isArray(questions) && questions.length > 0) {
      // Bulk save
      const result = await saveQuestionsBulk(questions);
      return res.json(result);
    } else if (question) {
      // Single question save
      const result = await saveQuestion(question);
      return res.json(result);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'No question data provided' 
      });
    }
  } catch (err: any) {
    console.error('[Supabase API] Error saving questions:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to save questions' 
    });
  }
});

/**
 * GET /api/supabase/questions
 * Get all questions (for admin dashboard)
 */
router.get('/questions', async (req, res) => {
  try {
    const result = await getAllQuestions();
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error fetching questions:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch questions' 
    });
  }
});

/**
 * DELETE /api/supabase/questions/:id
 * Delete a question by ID
 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question ID is required' 
      });
    }
    
    const result = await deleteQuestion(id);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error deleting question:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to delete question' 
    });
  }
});

// ============================================================================
// COURSES ENDPOINTS
// ============================================================================

/**
 * POST /api/supabase/courses
 * Save a course
 */
router.post('/courses', async (req, res) => {
  try {
    const course = req.body;
    if (!course || !course.title || !course.code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course title and code are required' 
      });
    }
    
    const result = await saveCourse(course);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error saving course:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to save course' 
    });
  }
});

/**
 * DELETE /api/supabase/courses/:id
 * Delete a course
 */
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course ID is required' 
      });
    }
    
    const result = await deleteCourse(id);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error deleting course:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to delete course' 
    });
  }
});

// ============================================================================
// UNIVERSITIES ENDPOINTS
// ============================================================================

/**
 * GET /api/supabase/universities
 * Get all universities
 */
router.get('/universities', async (req, res) => {
  try {
    const result = await getUniversities();
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error fetching universities:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to fetch universities' 
    });
  }
});

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

/**
 * POST /api/supabase/payments
 * Save a payment record
 */
router.post('/payments', async (req, res) => {
  try {
    const payment = req.body;
    if (!payment || !payment.userId || !payment.amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and amount are required' 
      });
    }
    
    const result = await savePayment(payment);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error saving payment:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to save payment' 
    });
  }
});

// ============================================================================
// USERS / SUBSCRIPTIONS ENDPOINTS
// ============================================================================

/**
 * POST /api/supabase/users/:id/subscription
 * Update user subscription
 */
router.post('/users/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const subscriptionData = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    const result = await updateUserSubscription(id, subscriptionData);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error updating subscription:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to update subscription' 
    });
  }
});

/**
 * POST /api/supabase/users
 * Create or update a user
 */
router.post('/users', async (req, res) => {
  try {
    const { id, ...userData } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    const result = await upsertUser(id, userData);
    return res.json(result);
  } catch (err: any) {
    console.error('[Supabase API] Error upserting user:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to upsert user' 
    });
  }
});

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (for WebSocket connections)
// ============================================================================

/**
 * WebSocket: /api/supabase/realtime/questions
 * Subscribe to real-time question changes
 */
router.get('/realtime/questions/subscribe', (req, res) => {
  try {
    // Note: This would need WebSocket support or Server-Sent Events (SSE)
    // For now, return subscription info
    
    const subscription = subscribeToQuestionsChanges((payload) => {
      console.log('[Supabase Real-time] Questions changed:', payload);
      // In a real implementation, this would broadcast to connected clients
    });
    
    return res.json({
      success: true,
      message: 'Subscribed to questions real-time changes',
      subscription: subscription ? 'active' : 'inactive'
    });
  } catch (err: any) {
    console.error('[Supabase API] Error subscribing to changes:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to subscribe to changes' 
    });
  }
});

/**
 * WebSocket: /api/supabase/realtime/courses
 * Subscribe to real-time course changes
 */
router.get('/realtime/courses/subscribe', (req, res) => {
  try {
    const subscription = subscribeToCourseChanges((payload) => {
      console.log('[Supabase Real-time] Courses changed:', payload);
    });
    
    return res.json({
      success: true,
      message: 'Subscribed to courses real-time changes',
      subscription: subscription ? 'active' : 'inactive'
    });
  } catch (err: any) {
    console.error('[Supabase API] Error subscribing to changes:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to subscribe to changes' 
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/supabase/health
 * Check if Supabase connection is active
 */
router.get('/health', async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Supabase API is operational',
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Supabase API health check failed'
    });
  }
});

export default router;
