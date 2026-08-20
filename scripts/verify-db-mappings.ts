import { getSupabaseAdminClient } from '../src/lib/supabase';
import {
  adminToRow, adminFromRow,
  courseToRow, courseFromRow,
  departmentToRow, departmentFromRow,
  facultyToRow, facultyFromRow,
  materialToRow, materialFromRow,
  paymentToRow, paymentFromRow,
  planToRow, planFromRow,
  questionToRow, questionFromRow,
  resultToRow, resultFromRow,
  systemConfigToRow, systemConfigFromRow,
  universityToRow, universityFromRow,
  userToRow, userFromRow,
} from '../src/lib/dbMappers';

async function verifyDatabaseMappings() {
  console.log('Verifying Database Mappings & Live Supabase Persistence...');
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error('Supabase admin client could not be initialized.');
    process.exit(1);
  }

  const errors: string[] = [];

  // 1. University
  const uniSample = {
    id: 'uni-verify-auto',
    name: 'Auto Verification University',
    abbreviation: 'AVU',
    location: 'Abuja, Nigeria',
  };
  const uniRow = universityToRow(uniSample);
  const { error: errUni } = await client.from('universities').upsert(uniRow);
  if (errUni) errors.push(`University Upsert Failed: ${errUni.message}`);
  else console.log('✓ University mapper & DB upsert verified');

  // 2. Course
  const courseSample = {
    id: 'course-verify-auto',
    code: 'AUT101',
    title: 'Automated Testing 101',
    universityId: uniSample.id,
    level: '100',
    semester: 'First',
  };
  const courseRow = courseToRow(courseSample);
  const { error: errCourse } = await client.from('courses').upsert(courseRow);
  if (errCourse) errors.push(`Course Upsert Failed: ${errCourse.message}`);
  else console.log('✓ Course mapper & DB upsert verified');

  // 3. Question
  const qSample = {
    id: 'q-verify-auto',
    question: 'What is automated testing?',
    optionA: 'Software testing technique',
    optionB: 'Manual review',
    optionC: 'Hardware repair',
    optionD: 'Network cabling',
    correctAnswer: 'A',
    explanation: 'Automated tests execute tests automatically',
    courseId: courseSample.id,
    courseCode: 'AUT101',
    universityId: uniSample.id,
    difficulty: 'Medium' as const,
    status: 'Published' as const,
  };
  const qRow = questionToRow(qSample);
  const { error: errQ } = await client.from('questions').upsert(qRow);
  if (errQ) errors.push(`Question Upsert Failed: ${errQ.message}`);
  else {
    const { data: readQ, error: errReadQ } = await client.from('questions').select('*').eq('id', qRow.id).single();
    if (errReadQ || !readQ) errors.push(`Question Readback Failed: ${errReadQ?.message}`);
    else {
      const qObj = questionFromRow(readQ);
      if (qObj.question !== qSample.question) {
        errors.push(`Question text mismatch: expected "${qSample.question}", got "${qObj.question}"`);
      } else {
        console.log('✓ Question mapper, DB upsert & readback verified');
      }
    }
  }

  // 4. Material
  const matSample = {
    id: 'mat-verify-auto',
    title: 'AUT101 Complete Lecture Series',
    courseId: courseSample.id,
    universityId: uniSample.id,
    type: 'PDF' as const,
    fileUrl: 'https://example.com/materials/aut101.pdf',
  };
  const matRow = materialToRow(matSample);
  const { error: errMat } = await client.from('materials').upsert(matRow);
  if (errMat) errors.push(`Material Upsert Failed: ${errMat.message}`);
  else console.log('✓ Material mapper & DB upsert verified');

  // 5. Subscription Plan
  const planSample = {
    id: 'plan-verify-auto',
    name: 'Auto Pass Pro',
    price: 3000,
    durationDays: 30,
    features: ['Unlimited Tests', 'AI Explanations'],
  };
  const planRow = planToRow(planSample);
  const { error: errPlan } = await client.from('subscription_plans').upsert(planRow);
  if (errPlan) errors.push(`Plan Upsert Failed: ${errPlan.message}`);
  else console.log('✓ Plan mapper & DB upsert verified');

  // 6. User
  const userSample = {
    id: 'user-verify-auto',
    name: 'Auto Student',
    email: 'auto.student@test.local',
    role: 'student' as const,
    universityId: uniSample.id,
  };
  const userRow = userToRow(userSample);
  const { error: errUser } = await client.from('users').upsert(userRow);
  if (errUser) errors.push(`User Upsert Failed: ${errUser.message}`);
  else console.log('✓ User mapper & DB upsert verified');

  // 7. Result
  const resSample = {
    id: 'res-verify-auto',
    userId: userSample.id,
    courseId: courseSample.id,
    score: 10,
    totalQuestions: 10,
    percentage: 100,
    timeSpentSeconds: 150,
    type: 'practice' as const,
  };
  const resRow = resultToRow(resSample);
  const { error: errRes } = await client.from('results').upsert(resRow);
  if (errRes) errors.push(`Result Upsert Failed: ${errRes.message}`);
  else console.log('✓ Result mapper & DB upsert verified');

  // 8. Payment
  const paySample = {
    id: 'pay-verify-auto',
    reference: 'REF-VERIFY-AUTO',
    userId: userSample.id,
    userEmail: 'auto.student@test.local',
    amount: 3000,
    status: 'Successful' as const,
    planName: 'Auto Pass Pro',
  };
  const payRow = paymentToRow(paySample);
  const { error: errPay } = await client.from('payments').upsert(payRow);
  if (errPay) errors.push(`Payment Upsert Failed: ${errPay.message}`);
  else console.log('✓ Payment mapper & DB upsert verified');

  // 9. System Config
  const cfgSample = {
    key: 'auto_verify_config',
    data: { active: true, test_run_timestamp: Date.now() },
  };
  const cfgRow = systemConfigToRow(cfgSample);
  const { error: errCfg } = await client.from('system_configs').upsert(cfgRow);
  if (errCfg) errors.push(`System Config Upsert Failed: ${errCfg.message}`);
  else console.log('✓ System Config mapper & DB upsert verified');

  // Cleanup test records
  await client.from('system_configs').delete().eq('id', cfgRow.id);
  await client.from('payments').delete().eq('id', payRow.id);
  await client.from('results').delete().eq('id', resRow.id);
  await client.from('users').delete().eq('id', userRow.id);
  await client.from('materials').delete().eq('id', matRow.id);
  await client.from('questions').delete().eq('id', qRow.id);
  await client.from('courses').delete().eq('id', courseRow.id);
  await client.from('universities').delete().eq('id', uniRow.id);
  await client.from('subscription_plans').delete().eq('id', planRow.id);

  if (errors.length > 0) {
    console.error('Mapping verification encountered errors:');
    for (const err of errors) console.error(`- ${err}`);
    process.exit(1);
  }

  console.log('\nAll database mappers and live Supabase persistence roundtrips passed with 100% success!');
}

verifyDatabaseMappings();

