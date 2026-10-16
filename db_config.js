// ============================================================================
// SIFTO CLOUD DATABASE ADAPTER (Supabase PostgreSQL + Realtime)
// Paste your Supabase Project URL and Anon Key below once you create your
// free project at https://supabase.com
// ============================================================================

const SIFTO_CLOUD_CONFIG = {
  enabled: false, // Set to true after adding your Supabase URL and Key
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
};

async function syncBookingToCloudDatabase(booking) {
  if (!SIFTO_CLOUD_CONFIG.enabled) {
    return { synced: false, mode: "localStorage" };
  }
  const response = await fetch(SIFTO_CLOUD_CONFIG.supabaseUrl + "/rest/v1/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SIFTO_CLOUD_CONFIG.supabaseAnonKey,
      "Authorization": "Bearer " + SIFTO_CLOUD_CONFIG.supabaseAnonKey,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      booking_code: booking.id,
      otp: booking.otp,
      service_name: booking.service,
      frequency: booking.frequency,
      hours: booking.hours,
      total_inr: booking.total,
      discount_inr: booking.discount,
      assigned_pro: booking.pro,
      payment_method: booking.payment,
      address: booking.address,
      slot_label: booking.slot,
      note: booking.note,
      stage: booking.stage,
      rating: booking.rating,
      status: booking.status
    })
  });
  return await response.json();
}
