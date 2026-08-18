import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client for Server-Side Operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

// Create admin client (server-side with full permissions)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// Create anon client (client-side, respects RLS policies)
export const supabaseAnon = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || ''
);

// ============================================================================
// HELPER FUNCTIONS FOR DATABASE OPERATIONS
// ============================================================================

/**
 * Save or update a question in the database
 */
export async function saveQuestion(questionData: any) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .upsert([
        {
          id: questionData.id || undefined,
          course_id: questionData.courseId,
          university_id: questionData.universityId,
          question_text: questionData.question,
          option_a: questionData.optionA,
          option_b: questionData.optionB,
          option_c: questionData.optionC,
          option_d: questionData.optionD,
          correct_answer: questionData.correctAnswer,
          explanation: questionData.explanation,
          difficulty: questionData.difficulty || 'Medium',
          topic: questionData.topic,
          category: questionData.category,
          created_by: questionData.createdBy,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to save question:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save multiple questions in bulk
 */
export async function saveQuestionsBulk(questions: any[]) {
  try {
    const formattedQuestions = questions.map((q) => ({
      id: q.id || undefined,
      course_id: q.courseId,
      university_id: q.universityId,
      question_text: q.question,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'Medium',
      topic: q.topic,
      category: q.category,
      created_by: q.createdBy,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('questions')
      .upsert(formattedQuestions, { onConflict: 'id' });

    if (error) throw error;
    console.log(`[Supabase] Successfully saved ${questions.length} questions`);
    return { success: true, data, count: questions.length };
  } catch (err: any) {
    console.error('[Supabase] Failed to save questions bulk:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get all questions for a course
 */
export async function getQuestionsByCourse(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('course_id', courseId);

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to fetch questions:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string) {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    console.log(`[Supabase] Successfully deleted question ${questionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Failed to delete question:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save or update a course
 */
export async function saveCourse(courseData: any) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .upsert([
        {
          id: courseData.id || undefined,
          title: courseData.title,
          code: courseData.code,
          university_id: courseData.universityId,
          department_id: courseData.departmentId,
          level: courseData.level,
          credit_units: courseData.creditUnits,
          description: courseData.description,
          is_active: courseData.isActive !== false,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to save course:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    console.log(`[Supabase] Successfully deleted course ${courseId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Failed to delete course:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get all universities
 */
export async function getUniversities() {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to fetch universities:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save payment record
 */
export async function savePayment(paymentData: any) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .upsert([
        {
          id: paymentData.id || undefined,
          user_id: paymentData.userId,
          email: paymentData.email,
          full_name: paymentData.fullName,
          amount: paymentData.amount,
          plan: paymentData.plan,
          plan_id: paymentData.planId,
          duration_days: paymentData.durationDays,
          provider: paymentData.provider,
          transaction_ref: paymentData.transactionRef,
          gateway_transaction_id: paymentData.gatewayTransactionId,
          payment_method: paymentData.paymentMethod,
          status: paymentData.status || 'pending',
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'transaction_ref' });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to save payment:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(userId: string, subscriptionData: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: subscriptionData.status || 'active',
        subscription_plan: subscriptionData.plan,
        subscription_start_date: subscriptionData.startDate,
        subscription_expiry_date: subscriptionData.expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    console.log(`[Supabase] Successfully updated subscription for user ${userId}`);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to update subscription:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Create or update user
 */
export async function upsertUser(userId: string, userData: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert([
        {
          id: userId,
          email: userData.email,
          full_name: userData.fullName || userData.name,
          username: userData.username,
          phone: userData.phone,
          role: userData.role || 'student',
          university_id: userData.universityId,
          department_id: userData.departmentId,
          subscription_status: userData.subscriptionStatus || 'free',
          subscription_plan: userData.subscriptionPlan || 'Free Tier',
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to upsert user:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get all questions (for admin dashboard)
 */
export async function getAllQuestions() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[Supabase] Failed to fetch all questions:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to real-time changes on questions table
 * This notifies all connected clients when questions change
 */
export function subscribeToQuestionsChanges(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'questions',
        },
        (payload) => {
          console.log('[Supabase Real-time] Questions table changed:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase] Listening to questions real-time changes');
        } else if (status === 'CLOSED') {
          console.log('[Supabase] Disconnected from questions real-time');
        }
      });

    return subscription;
  } catch (err: any) {
    console.error('[Supabase] Failed to subscribe to questions changes:', err.message);
  }
}

/**
 * Subscribe to real-time changes on courses table
 */
export function subscribeToCourseChanges(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        (payload) => {
          console.log('[Supabase Real-time] Courses table changed:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase] Listening to courses real-time changes');
        }
      });

    return subscription;
  } catch (err: any) {
    console.error('[Supabase] Failed to subscribe to courses changes:', err.message);
  }
}

/**
 * Subscribe to real-time changes on users table
 */
export function subscribeToUserChanges(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('[Supabase Real-time] Users table changed:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  } catch (err: any) {
    console.error('[Supabase] Failed to subscribe to users changes:', err.message);
  }
}

export default supabase;
