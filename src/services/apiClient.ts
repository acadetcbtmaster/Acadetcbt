import { StorageService, safeStringify } from './storage';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, options);
  const contentType = res.headers.get('content-type') || '';
  if (res.ok && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  let serverErrMsg = '';
  try {
    if (contentType.includes('application/json')) {
      const jsonErr = await res.json();
      if (jsonErr && (jsonErr.error || jsonErr.message)) {
        serverErrMsg = jsonErr.error || jsonErr.message;
      }
    }
  } catch {}
  throw new Error(serverErrMsg || `Server endpoint ${endpoint} unavailable (status ${res.status})`);
}

export const ApiClient = {
  // 1. AI Question Generation (PDF, Image, Text, Course materials)
  async generateQuestions(payload: any): Promise<{ success: boolean; questions: any[]; error?: string }> {
    return await fetchApi<{ success: boolean; questions: any[]; error?: string }>('/api/ai/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload),
    });
    /*
      try {
        const {
          materialText,
          fileData,
          mimeType,
          fileName,
          universityName = 'University',
          level = '100 Level',
          courseCode = 'GST101',
          courseTitle = 'General Course',
          topic = 'General Topic',
          difficulty = 'Medium',
          questionCount = 5,
        } = payload;

        const hasFile = !!(fileData && typeof fileData === 'string' && fileData.trim().length > 0);
        const hasText = !!(materialText && typeof materialText === 'string' && materialText.trim().length >= 10);

        if (!hasFile && !hasText) {
          throw new Error('Please provide study material text or upload a file (PDF, photo scan, Word document).');
        }

        const ai = getGeminiClient();
        const instructionPrompt = `You are an expert university examiner and CBT question author.
Analyze the provided study material / exam photo / document for ${universityName} course "${courseCode}: ${courseTitle}" (${level}, topic: "${topic || 'General Topic'}").
Generate exactly ${questionCount} high-quality, exam-standard multiple-choice practice questions at "${difficulty || 'Medium'}" difficulty.

Requirements for each question:
1. "question": A clear, unambiguous question statement testing comprehension, application, or factual recall.
2. "optionA": First plausible answer choice.
3. "optionB": Second plausible answer choice.
4. "optionC": Third plausible answer choice.
5. "optionD": Fourth plausible answer choice.
6. "correctAnswer": Must strictly be one of "A", "B", "C", or "D".
7. "explanation": A concise, educational step-by-step breakdown explaining why the correct answer is right and why distractors are incorrect.
8. "difficulty": "${difficulty || 'Medium'}"
9. "topic": "${topic || 'General Topic'}"`;

        const contentsParts: any[] = [];

        if (hasFile) {
          let normalizedMime = mimeType || 'application/pdf';
          const fName = (fileName || '').toLowerCase();

          if (fName.endsWith('.pdf')) normalizedMime = 'application/pdf';
          else if (fName.endsWith('.jpg') || fName.endsWith('.jpeg')) normalizedMime = 'image/jpeg';
          else if (fName.endsWith('.png')) normalizedMime = 'image/png';
          else if (fName.endsWith('.webp')) normalizedMime = 'image/webp';
          else if (fName.endsWith('.txt')) normalizedMime = 'text/plain';

          let cleanBase64 = fileData;
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }

          contentsParts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: normalizedMime,
            },
          });
        }

        if (hasText) {
          contentsParts.push({
            text: `Source Text / Material Content:\n"""\n${materialText.slice(0, 20000)}\n"""`,
          });
        }

        contentsParts.push({ text: instructionPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: { parts: contentsParts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  optionA: { type: Type.STRING },
                  optionB: { type: Type.STRING },
                  optionC: { type: Type.STRING },
                  optionD: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation'],
              },
            },
          },
        });

        const questionsRaw = JSON.parse(response.text || '[]');
        return { success: true, questions: questionsRaw };
      } catch (fallbackErr: any) {
        console.error('Client-side Gemini Fallback Error:', fallbackErr);
        throw new Error(fallbackErr.message || 'Failed to generate questions.');
      }
    */
  },

  // 2. AI Question Explanation
  async explainQuestion(payload: any): Promise<{ success: boolean; explanation: string }> {
    return await fetchApi<{ success: boolean; explanation: string }>('/api/ai/explain-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload),
    });
    /*
      try {
      console.warn('Backend /api/ai/explain-question endpoint unavailable, using client-side Gemini fallback:', err);
      try {
        const { question, optionA, optionB, optionC, optionD, correctAnswer, userAnswer } = payload;
        const ai = getGeminiClient();
        const prompt = `Provide a friendly, deep educational explanation for this university examination question.
Question: ${question}
Option A: ${optionA}
Option B: ${optionB}
Option C: ${optionC}
Option D: ${optionD}
Correct Answer: Option ${correctAnswer}
Student's Chosen Answer: ${userAnswer ? `Option ${userAnswer}` : 'Not answered'}

Explain step-by-step why Option ${correctAnswer} is correct and why the student's answer (if wrong) was mistaken. Keep it concise, engaging, and easy to memorize for exams.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        return { success: true, explanation: response.text || 'Detailed explanation generated.' };
      } catch (fallbackErr: any) {
        return {
          success: true,
          explanation: `Option ${payload.correctAnswer} is the correct answer based on standard academic curriculum principles.`,
        };
      }
    }
    */
  },

  // 3. AI Performance Analysis
  async analyzePerformance(payload: any): Promise<{ success: boolean; analysis: any }> {
    return await fetchApi<{ success: boolean; analysis: any }>('/api/ai/analyze-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload),
    });
    /*
      try {
      console.warn('Backend /api/ai/analyze-performance endpoint unavailable, using client-side fallback:', err);
      try {
        const { score, totalQuestions, courseCode, timeSpentSeconds, weakTopics, strongTopics } = payload;
        const ai = getGeminiClient();
        const prompt = `Analyze this student's CBT examination result and provide 3 actionable, encouraging study strategies:
Course: ${courseCode}
Score: ${score} out of ${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%)
Time Spent: ${Math.floor(timeSpentSeconds / 60)} minutes ${timeSpentSeconds % 60} seconds
Weak Topics: ${weakTopics?.join(', ') || 'None identified'}
Strong Topics: ${strongTopics?.join(', ') || 'General knowledge'}

Return JSON format with:
1. "verdict": Short summary phrase (e.g., "Excellent Performance!", "Great Effort - Focus on Weak Areas")
2. "feedback": Paragraph of tactical feedback.
3. "recommendations": Array of 3 bullet points for next steps.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                verdict: { type: Type.STRING },
                feedback: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['verdict', 'feedback', 'recommendations'],
            },
          },
        });

        const analysis = JSON.parse(response.text || '{}');
        return { success: true, analysis };
      } catch (fallbackErr) {
        const pct = Math.round((payload.score / payload.totalQuestions) * 100);
        return {
          success: true,
          analysis: {
            verdict: pct >= 70 ? 'Great Academic Result!' : 'Keep Practicing for Perfection!',
            feedback: `You scored ${payload.score} out of ${payload.totalQuestions} (${pct}%) in ${payload.courseCode}. Review highlighted questions to reinforce core concepts.`,
            recommendations: [
              'Re-attempt missed practice questions in Practice Mode.',
              'Study topic summaries for weak core modules.',
              'Take timed 30-question CBT mock tests regularly.',
            ],
          },
        };
      }
    }
    */
  },

  // 4. Practice Session Validation
  async validatePracticeSession(payload: any): Promise<{ success: boolean; validatedLimit?: any; isPremiumRequired?: boolean; error?: string }> {
    try {
      return await fetchApi<any>('/api/practice/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify(payload),
      });
    } catch (err) {
      const { requestedLimit, isPremium, userRole } = payload;
      const isUnlimited = requestedLimit === 'unlimited' || requestedLimit === 'Unlimited' || Number(requestedLimit) > 30;

      if (isUnlimited && !isPremium && userRole !== 'admin') {
        return {
          success: false,
          error: 'Unlimited Questions is a Premium Feature. Only Premium subscribers can access Unlimited Questions.',
          isPremiumRequired: true,
        };
      }

      return {
        success: true,
        validatedLimit: isUnlimited ? 'unlimited' : Math.min(Math.max(Number(requestedLimit) || 10, 1), 30),
      };
    }
  },

  // Official Squad Payment Gateway Integration
  async getSquadConfig(): Promise<any> {
    try {
      return await fetchApi<any>('/api/payments/config');
    } catch {
      const meta = import.meta as any;
      const pubKey = (meta?.env?.VITE_SQUAD_PUBLIC_KEY || '').trim();
      const isConfigured = pubKey !== '' && !pubKey.includes('placeholder') && !pubKey.includes('MY_');
      return { isConfigured, publicKey: pubKey, message: isConfigured ? 'Squad Payment Gateway Operational' : 'Squad Payment Gateway is active' };
    }
  },

  async initiatePayment(payload: { planId: string; planName?: string; amount?: number; durationDays?: number; email: string; userId: string; userName?: string; userUsername?: string; provider?: string; gateway?: string }): Promise<any> {
    try {
      const res = await fetchApi<any>('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify(payload),
      });
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to initialize payment. Please check your internet connection or server API key settings.',
      };
    }
  },

  async createPaymentLink(payload: any): Promise<any> {
    return this.initiatePayment(payload);
  },

  async initializeSquad(payload: any): Promise<any> {
    return this.initiatePayment(payload);
  },

  async verifyPayment(payload: { reference: string; userId?: string; email?: string; planId?: string; userName?: string }): Promise<any> {
    try {
      const res = await fetchApi<any>('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify(payload),
      });
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Squad payment verification failed.',
      };
    }
  },

  async verifyPaymentByRef(reference: string): Promise<any> {
    try {
      const res = await fetchApi<any>(`/api/payments/verify/${encodeURIComponent(reference)}`);
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Squad payment verification failed.',
      };
    }
  },

  async verifySquad(payload: any): Promise<any> {
    return this.verifyPayment(payload);
  },

  // 6. Admin Authentication & RBAC APIs
  async adminLogin(payload: { username: string; password: string }): Promise<any> {
    return await fetchApi<any>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify(payload),
    });
  },

  async getAdmins(): Promise<{ success: boolean; admins?: any[]; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      const res = await fetchApi<any>('/api/admin/admins', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (res && res.success === false) {
        return { success: false, error: res.error || 'Access Denied: manage_other_administrators required.' };
      }
      return res;
    } catch (err: any) {
      // If error is 403 or Access Denied, never return admin accounts
      if (err?.message?.includes('403') || err?.message?.includes('Access Denied') || err?.message?.includes('Unauthorized')) {
        return { success: false, error: err.message };
      }
      const currAdmin = StorageService.getCurrentAdmin();
      if (currAdmin && currAdmin.role?.toLowerCase().includes('super')) {
        return {
          success: true,
          admins: StorageService.getAdminAccounts(),
        };
      }
      return { success: false, error: 'Access Denied: Super Administrator privileges required.' };
    }
  },

  async getAdminPayments(): Promise<{ success: boolean; transactions?: any[]; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>('/api/admin/payments', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'Access Denied: manage_payments permission required.' };
    }
  },

  async createAdmin(account: any): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      const res = await fetchApi<any>('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify(account),
      });
      if (res.success && res.admin) {
        StorageService.saveAdminAccount(res.admin);
      }
      return res;
    } catch {
      StorageService.saveAdminAccount(account);
      StorageService.logAdminAction({
        action: 'Created Administrator',
        module: 'Administrator Management',
        targetId: account.id,
        targetName: account.fullName,
        details: `Created admin ${account.username} with role ${account.role}`,
      });
      return { success: true, admin: account };
    }
  },

  async updateAdmin(id: string, data: any): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      const res = await fetchApi<any>(`/api/admin/admins/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify(data),
      });
      if (res.success && res.admin) {
        StorageService.saveAdminAccount(res.admin);
      }
      return res;
    } catch {
      const accounts = StorageService.getAdminAccounts();
      const idx = accounts.findIndex((a) => a.id === id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...data, updatedDate: new Date().toISOString() };
        StorageService.saveAdminAccounts(accounts);
        StorageService.logAdminAction({
          action: 'Updated Administrator',
          module: 'Administrator Management',
          targetId: id,
          targetName: accounts[idx].fullName,
          details: `Updated account ${accounts[idx].username}`,
        });
        return { success: true, admin: accounts[idx] };
      }
      return { success: false, error: 'Administrator account not found.' };
    }
  },

  async deleteAdmin(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      const res = await fetchApi<any>(`/api/admin/admins/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (res.success) {
        StorageService.deleteAdminAccount(id);
      }
      return res;
    } catch {
      const ok = StorageService.deleteAdminAccount(id);
      if (ok) {
        StorageService.logAdminAction({
          action: 'Deleted Administrator',
          module: 'Administrator Management',
          targetId: id,
          details: `Deleted admin account ${id}`,
        });
        return { success: true };
      }
      return { success: false, error: 'Unable to delete administrator (last Super Admin cannot be removed).' };
    }
  },

  // ==================== CATALOG & ENTITY SYNC METHODS ====================
  async getCatalog(): Promise<{
    success: boolean;
    universities?: any[];
    courses?: any[];
    departments?: any[];
    faculties?: any[];
    questions?: any[];
    materials?: any[];
    plans?: any[];
    signupFaculties?: any[];
    error?: string;
  }> {
    try {
      return await fetchApi<any>('/api/catalog/all');
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch catalog' };
    }
  },

  async saveUniversity(uni: any): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>('/api/catalog/universities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify(uni),
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteUniversity(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>(`/api/catalog/universities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async saveCourse(course: any): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>('/api/catalog/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify(course),
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>(`/api/catalog/courses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async saveQuestions(questions: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>('/api/catalog/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify({ questions }),
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>(`/api/catalog/questions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async saveSignupFaculties(groups: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('cbt_admin_token');
      return await fetchApi<any>('/api/catalog/signup-faculties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: safeStringify({ groups }),
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

export const apiClient = ApiClient;
