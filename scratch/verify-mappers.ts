import { mapProfileToDb } from '../src/services/profileService';
import { UserProfile } from '../src/types/user';

function runValidation() {
  console.log('=== RUNNING MAPPER & PERSISTENCE VERIFICATION ===');

  // Test 1: Full Name update
  const payload1 = mapProfileToDb({ fullName: 'Rahul Kumar' });
  console.log('Test 1 - fullName payload:', payload1);
  if (payload1.full_name !== 'Rahul Kumar') throw new Error('Test 1 failed');
  if (Object.keys(payload1).length !== 1) throw new Error('Test 1 has extra keys');

  // Test 2: Gender only incremental update (MUST NOT touch full_name or weight_kg)
  const fullProf: UserProfile = {
    collegeEmail: 'test@pu.edu',
    phone: '+919999999999',
    collegeName: 'Parul University',
    fullName: 'Rahul Kumar',
    age: 20,
    photoUrl: 'http://example.com/p.jpg',
    gender: 'Male',
    heightCm: 172,
    weightKg: 65.5,
    homeState: 'Rajasthan',
    collegeYear: '3rd Year',
    department: 'B.Tech',
    garbaLevel: '',
    garbaLevelTitle: '',
    garbaEnergy: '',
    interests: [],
    answerLastRound: '',
    answerPersonality: '',
    answerPartnerNewStep: '',
    partnerGenderPreference: '',
    partnerVibePreference: '',
  };
  const payload2 = mapProfileToDb({ gender: 'Female' }, fullProf);
  console.log('Test 2 - incremental gender update:', payload2);
  if (payload2.gender !== 'Female') throw new Error('Test 2 failed');
  if (payload2.full_name !== undefined) throw new Error('Test 2 leaked full_name');
  if (payload2.weight_kg !== undefined) throw new Error('Test 2 leaked weight_kg');
  if (payload2.university_id !== undefined) throw new Error('Test 2 leaked university_id');
  if (payload2.hostel_id !== undefined) throw new Error('Test 2 leaked hostel_id');

  // Test 3: Weight only update with string and decimal
  const payload3 = mapProfileToDb({ weightKg: ('65.5' as any) });
  console.log('Test 3 - string numeric weight:', payload3);
  if (payload3.weight_kg !== 65.5) throw new Error('Test 3 failed: ' + payload3.weight_kg);
  if (payload3.height_cm !== undefined) throw new Error('Test 3 leaked height_cm');

  // Test 4: Height only update
  const payload4 = mapProfileToDb({ heightCm: 172 });
  console.log('Test 4 - height update:', payload4);
  if (payload4.height_cm !== 172) throw new Error('Test 4 failed');
  if (payload4.weight_kg !== undefined) throw new Error('Test 4 leaked weight_kg');

  // Test 5: Verify no obsolete columns exist in payload
  const allColumns = [
    'nickname', 'pronouns', 'is_day_scholar', 'user_id', 'college_name',
    'hostel', 'age', 'department', 'photo_url', 'additional_photos'
  ];
  const payload5 = mapProfileToDb({
    fullName: 'Rahul Kumar',
    gender: 'Male',
    age: 21,
    heightCm: 175,
    weightKg: 70,
    homeState: 'Gujarat',
    collegeYear: '2nd Year',
    department: 'B.Tech',
    collegeName: 'Parul University',
    hostel: 'Sarojini Bhawan',
    instagramId: '@rahul'
  }, fullProf, 4);

  console.log('Test 5 - full payload keys:', Object.keys(payload5));
  for (const col of allColumns) {
    if (col in payload5) {
      throw new Error(`Obsolete column found in payload: ${col}`);
    }
  }

  // Test 6: Verify empty name cannot overwrite existing name
  const payload6 = mapProfileToDb({ fullName: '' });
  console.log('Test 6 - empty fullName update:', payload6);
  if (payload6.full_name !== undefined) {
    throw new Error('Test 6 failed: empty fullName was mapped into payload');
  }

  console.log('=== ALL MAPPER CHECKS PASSED ===');
}

runValidation();
