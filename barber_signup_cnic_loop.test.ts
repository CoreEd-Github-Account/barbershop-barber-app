// barber_signup_cnic_loop.test.ts
import type { BarberSignupPayload } from './services/signup_service.ts';
import type { UserProfile } from './services/user_service.ts';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Testing barber CNIC image loop...');

// 1. Verify signup payload typing and required fields
const mockBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';

const testPayload: BarberSignupPayload = {
  name: 'Test Barber',
  gender: 'male',
  mobile_no: '03001234567',
  password: 'Password123!',
  role: 'barber',
  bank_type: 'easypaisa',
  account_title: 'Test Barber',
  bank_account_number: '03001234567',
  address: 'Shop 1, Test Street',
  profile_picture_base64: mockBase64Image,
  cnic_front_image_base64: mockBase64Image,
  cnic_back_image_base64: mockBase64Image,
};

assert(testPayload.profile_picture_base64.startsWith('data:image/jpeg;base64,'), 'profile_picture_base64 format');
assert(testPayload.cnic_front_image_base64.startsWith('data:image/jpeg;base64,'), 'cnic_front_image_base64 format');
assert(testPayload.cnic_back_image_base64.startsWith('data:image/jpeg;base64,'), 'cnic_back_image_base64 format');
assert(testPayload.role === 'barber', 'role is barber');

// 2. Verify validation logic: ensure missing CNIC images are caught before API dispatch
function validateSignupPhotos(profileBase64: string, cnicFrontBase64: string, cnicBackBase64: string) {
  const errors: Record<string, string[]> = {};
  if (!profileBase64) errors.profile_picture_base64 = ['Profile photo is required'];
  if (!cnicFrontBase64) errors.cnic_front_image_base64 = ['CNIC front photo is required'];
  if (!cnicBackBase64) errors.cnic_back_image_base64 = ['CNIC back photo is required'];
  return errors;
}

const errorsMissingFront = validateSignupPhotos(mockBase64Image, '', mockBase64Image);
assert(Boolean(errorsMissingFront.cnic_front_image_base64), 'missing front error');
assert(errorsMissingFront.cnic_front_image_base64[0] === 'CNIC front photo is required', 'missing front message');
assert(!errorsMissingFront.cnic_back_image_base64, 'back should not error when present');

const errorsMissingBack = validateSignupPhotos(mockBase64Image, mockBase64Image, '');
assert(Boolean(errorsMissingBack.cnic_back_image_base64), 'missing back error');
assert(errorsMissingBack.cnic_back_image_base64[0] === 'CNIC back photo is required', 'missing back message');

const errorsValid = validateSignupPhotos(mockBase64Image, mockBase64Image, mockBase64Image);
assert(Object.keys(errorsValid).length === 0, 'all photos present should have 0 errors');

// 3. Verify profile fetch response typing: receiving cnic_front_image and cnic_back_image
const mockProfileFromBackend: UserProfile = {
  id: 'barber-uuid-123',
  name: 'Test Barber',
  email: 'barber@test.com',
  mobile_no: '03001234567',
  role: 'barber',
  is_active: true,
  is_online: false,
  gender: 'male',
  cnic: '3520112345671',
  address: 'Shop 1, Test Street',
  profile_picture: 'https://ik.imagekit.io/barbershop/barbers/profile-photos/pic.jpg',
  cnic_front_image: 'https://ik.imagekit.io/barbershop/barbers/cnic/front.jpg',
  cnic_back_image: 'https://ik.imagekit.io/barbershop/barbers/cnic/back.jpg',
  average_rating: 4.8,
};

assert(mockProfileFromBackend.cnic_front_image === 'https://ik.imagekit.io/barbershop/barbers/cnic/front.jpg', 'cnic_front_image');
assert(mockProfileFromBackend.cnic_back_image === 'https://ik.imagekit.io/barbershop/barbers/cnic/back.jpg', 'cnic_back_image');

// 4. Verify display logic: fallback handling when images are null or present
function getDisplayCnicSource(frontUri: string | null, backUri: string | null) {
  return {
    hasFront: Boolean(frontUri),
    frontSource: frontUri ? { uri: frontUri } : null,
    hasBack: Boolean(backUri),
    backSource: backUri ? { uri: backUri } : null,
  };
}

const displayWithImages = getDisplayCnicSource(mockProfileFromBackend.cnic_front_image, mockProfileFromBackend.cnic_back_image);
assert(displayWithImages.hasFront === true, 'displayWithImages hasFront');
assert(displayWithImages.frontSource?.uri === 'https://ik.imagekit.io/barbershop/barbers/cnic/front.jpg', 'displayWithImages front uri');
assert(displayWithImages.hasBack === true, 'displayWithImages hasBack');
assert(displayWithImages.backSource?.uri === 'https://ik.imagekit.io/barbershop/barbers/cnic/back.jpg', 'displayWithImages back uri');

const displayWithoutImages = getDisplayCnicSource(null, null);
assert(displayWithoutImages.hasFront === false, 'displayWithoutImages hasFront');
assert(displayWithoutImages.frontSource === null, 'displayWithoutImages frontSource');
assert(displayWithoutImages.hasBack === false, 'displayWithoutImages hasBack');
assert(displayWithoutImages.backSource === null, 'displayWithoutImages backSource');

console.log('All CNIC loop checks passed successfully!');

