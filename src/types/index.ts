export type UserRole = 'student' | 'property_owner' | 'mess_owner' | 'admin'

export type PropertyType = 'pg' | 'hostel' | 'flat' | 'shared_room' | 'private_room'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MessStatus = 'open' | 'busy' | 'closed'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending'

export type TokenStatus = 'valid' | 'consumed' | 'expired'

export type NotificationType =
  | 'subscription_expiring'
  | 'menu_updated'
  | 'message_received'
  | 'new_review'
  | 'attendance_recorded'
  | 'payment_due'
  | 'listing_approved'
  | 'subscription_allocated'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  address?: string
  role: UserRole
  college?: string
  branch?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  email_notifications?: boolean
  push_notifications?: boolean
  is_profile_completed?: boolean
  created_at: string
  updated_at: string
}

export interface RoomSharingConfig {
  sharing_type: '1_sharing' | '2_sharing' | '3_sharing' | '4_sharing' | 'dormitory'
  rent: number
  deposit: number
  available_beds: number
  total_beds: number
  attached_bathroom?: boolean
  ac?: boolean
  balcony?: boolean
  study_desk?: boolean
  personal_wardrobe?: boolean
  images?: string[]
  video_url?: string
  custom_amenities?: string[]
}

export interface FlatConfig {
  bhk_type: '1rk' | '1bhk' | '2bhk' | '3bhk' | '4bhk'
  furnishing: 'fully_furnished' | 'semi_furnished' | 'unfurnished'
  maintenance_charges: number
  maintenance_type: 'included' | 'extra'
  tenant_preference: 'students' | 'bachelor_boys' | 'bachelor_girls' | 'family' | 'any'
  parking_type: 'covered_car_bike' | 'bike_only' | 'open' | 'none'
  floor_number?: number
  total_floors?: number
  balconies?: number
  bathrooms?: number
}

export interface HostelConfig {
  category_configs: RoomSharingConfig[]
  warden_phone?: string
  curfew_time: 'no_curfew' | '21:30' | '22:00' | '22:30' | '23:00'
  mess_option: 'included' | 'extra_charge' | 'not_available'
  meals_offered?: ('breakfast' | 'lunch' | 'evening_snacks' | 'dinner')[]
  mess_charges?: number
  housekeeping?: 'daily' | 'alternate_days' | 'weekly'
  laundry?: 'free_washing_machine' | 'paid_per_load' | 'none'
}

export interface PGConfig {
  sharing_configs: RoomSharingConfig[]
  food_option: 'included' | 'extra_charge' | 'not_available'
  food_type?: 'veg' | 'non_veg' | 'both'
  curfew_time: 'no_curfew' | '21:30' | '22:00' | '22:30' | '23:00'
  housekeeping: 'daily' | 'alternate_days' | 'weekly'
  laundry: 'free_washing_machine' | 'paid_per_load' | 'none'
  meals_offered?: ('breakfast' | 'lunch' | 'evening_snacks' | 'dinner')[]
  mess_charges?: number
}

export interface Property {
  id: string
  owner_id: string
  owner_name?: string
  title: string
  description: string
  property_type: PropertyType
  rent: number
  deposit: number
  address: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  contact_phone: string
  contact_email?: string
  availability: boolean
  gender_preference: 'male' | 'female' | 'any'
  total_rooms?: number
  available_rooms?: number
  verified: boolean
  featured: boolean
  rating: number
  review_count: number
  views?: number
  inquiries?: number
  images: string[]
  video_url?: string
  amenities: PropertyAmenity
  google_maps_url?: string
  sharing_configs?: RoomSharingConfig[]
  flat_config?: FlatConfig
  hostel_config?: HostelConfig
  pg_config?: PGConfig
  flat_details?: any
  hostel_details?: any
  brokerage_applied?: boolean
  brokerage_amount?: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface PropertyAmenity {
  wifi: boolean
  ac: boolean
  laundry: boolean
  water: boolean
  electricity: boolean
  cctv: boolean
  security: boolean
  parking: boolean
  attached_bathroom: boolean
  study_table: boolean
  furnished: boolean
  gym?: boolean
  tv?: boolean
  kitchen?: boolean
  [key: string]: boolean | undefined
}

export interface Mess {
  id: string
  owner_id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  contact_phone: string
  food_type?: 'veg' | 'non_veg' | 'both'
  contact_email?: string
  monthly_charge: number
  per_meal_charge?: number
  status: MessStatus
  verified: boolean
  featured: boolean
  rating: number
  review_count: number
  photos: string[]
  meal_types: MealType[]
  google_maps_url?: string
  service_hours?: string
  day_service_time?: string
  evening_service_time?: string
  menu_card?: { name: string; price: string; category?: string }[]
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface MessPlan {
  id: string
  mess_id: string
  name: string
  description: string
  price: number
  duration_days: number
  total_meals?: number
  daily_scan_limit?: number
  meal_types: MealType[]
  is_custom: boolean
  active: boolean
  created_at: string
}

export interface MessMenu {
  id: string
  mess_id: string
  date: string
  meal_type: MealType
  items: string[]
  updated_at: string
}

export interface InstallmentRecord {
  id: string
  subscription_id: string
  amount: number
  payment_date: string
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer'
  notes?: string
}

export interface Subscription {
  id: string
  student_id: string
  mess_id: string
  plan_id: string
  status: SubscriptionStatus
  start_date: string
  end_date: string
  amount_paid: number
  payment_status: 'paid' | 'pending' | 'failed' | 'partial'
  installments?: InstallmentRecord[]
  created_at: string
  messes?: Mess
  mess_plans?: MessPlan
  profiles?: Profile
}

export interface MealAttendance {
  id: string
  subscription_id: string
  student_id: string
  mess_id: string
  date: string
  meal_type: MealType
  qr_code_id: string
  location_verified: boolean
  marked_at: string
  token_id?: string
}

export interface DailyQRCode {
  id: string
  mess_id: string
  date: string
  meal_type: MealType
  qr_data: string
  expires_at: string
  created_at: string
}

export interface MealToken {
  id: string
  attendance_id: string
  student_id: string
  mess_id: string
  meal_type: MealType
  token_code: string
  status: TokenStatus
  valid_until: string
  consumed_at?: string
  created_at: string
}

export interface Review {
  id: string
  reviewer_id: string
  property_id?: string
  mess_id?: string
  rating: number
  comment: string
  photos?: string[]
  created_at: string
  profiles?: Profile
}

export interface RoommateProfile {
  id: string
  student_id: string
  budget_min: number
  budget_max: number
  city: string
  college: string
  branch: string
  gender: 'male' | 'female' | 'other'
  food_preference: 'veg' | 'non-veg' | 'both'
  smoking: boolean
  sleep_schedule: 'early_bird' | 'night_owl' | 'flexible'
  looking_for: 'flat' | 'pg' | 'hostel' | 'any'
  description?: string
  active: boolean
  created_at: string
  profiles?: Profile
}

export interface CommunityPost {
  id: string
  author_id: string
  title: string
  content: string
  category: 'notes' | 'books' | 'cycles' | 'bikes' | 'events' | 'announcements' | 'general'
  images?: string[]
  price?: number
  likes: number
  comment_count: number
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}

export interface SearchFilters {
  query?: string
  property_type?: PropertyType
  min_rent?: number
  max_rent?: number
  city?: string
  gender?: 'male' | 'female' | 'any'
  amenities?: Partial<PropertyAmenity>
  min_rating?: number
  available_only?: boolean
  lat?: number
  lng?: number
  radius?: number
}
