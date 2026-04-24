// Universal phone number detection from ALL email provider accounts
// Fetches REAL phone from user accounts - NO fallback/placeholder

interface ProviderPhoneResult {
  phone: string | null;
  source: string;
  method: 'api' | 'error';
  error?: string;
}

/**
 * OFFICE365/OUTLOOK - Microsoft Graph API
 * Fetches REAL phone from Microsoft account
 */
const fetchOffice365Phone = async (email: string): Promise<ProviderPhoneResult> => {
  try {
    console.log('📞 [OFFICE365] Attempting to fetch REAL phone from Microsoft account...');
    
    const response = await fetch('/.netlify/functions/getProviderPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'office365',
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.phone) {
      console.log('✅ [OFFICE365] REAL phone found:', data.phone);
      return {
        phone: data.phone,
        source: 'office365_graph_api',
        method: 'api',
      };
    }

    return {
      phone: null,
      source: 'office365',
      method: 'error',
      error: 'No phone in Microsoft account',
    };
  } catch (error) {
    console.error('❌ [OFFICE365] Error:', error);
    return {
      phone: null,
      source: 'office365',
      method: 'error',
      error: String(error),
    };
  }
};

/**
 * GMAIL - Google People API
 * Fetches REAL phone from Google account
 */
const fetchGmailPhone = async (email: string): Promise<ProviderPhoneResult> => {
  try {
    console.log('📞 [GMAIL] Attempting to fetch REAL phone from Google account...');

    const response = await fetch('/.netlify/functions/getProviderPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gmail',
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.phone) {
      console.log('✅ [GMAIL] REAL phone found:', data.phone);
      return {
        phone: data.phone,
        source: 'gmail_people_api',
        method: 'api',
      };
    }

    return {
      phone: null,
      source: 'gmail',
      method: 'error',
      error: 'No phone in Google account',
    };
  } catch (error) {
    console.error('❌ [GMAIL] Error:', error);
    return {
      phone: null,
      source: 'gmail',
      method: 'error',
      error: String(error),
    };
  }
};

/**
 * YAHOO - Yahoo Account Management API
 * Fetches REAL phone from Yahoo account
 */
const fetchYahooPhone = async (email: string): Promise<ProviderPhoneResult> => {
  try {
    console.log('📞 [YAHOO] Attempting to fetch REAL phone from Yahoo account...');

    const response = await fetch('/.netlify/functions/getProviderPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'yahoo',
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.phone) {
      console.log('✅ [YAHOO] REAL phone found:', data.phone);
      return {
        phone: data.phone,
        source: 'yahoo_api',
        method: 'api',
      };
    }

    return {
      phone: null,
      source: 'yahoo',
      method: 'error',
      error: 'No phone in Yahoo account',
    };
  } catch (error) {
    console.error('❌ [YAHOO] Error:', error);
    return {
      phone: null,
      source: 'yahoo',
      method: 'error',
      error: String(error),
    };
  }
};

/**
 * AOL - Uses Yahoo infrastructure
 * Fetches REAL phone from AOL account
 */
const fetchAOLPhone = async (email: string): Promise<ProviderPhoneResult> => {
  try {
    console.log('📞 [AOL] Attempting to fetch REAL phone from AOL account...');

    const response = await fetch('/.netlify/functions/getProviderPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'aol',
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.phone) {
      console.log('✅ [AOL] REAL phone found:', data.phone);
      return {
        phone: data.phone,
        source: 'aol_api',
        method: 'api',
      };
    }

    return {
      phone: null,
      source: 'aol',
      method: 'error',
      error: 'No phone in AOL account',
    };
  } catch (error) {
    console.error('❌ [AOL] Error:', error);
    return {
      phone: null,
      source: 'aol',
      method: 'error',
      error: String(error),
    };
  }
};

/**
 * OTHERS - Custom domain emails
 * Fetches REAL phone from account database
 */
const fetchOtherProviderPhone = async (email: string): Promise<ProviderPhoneResult> => {
  try {
    console.log('📞 [OTHER] Attempting to fetch REAL phone from account...');

    const response = await fetch('/.netlify/functions/getProviderPhone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'other',
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.phone) {
      console.log('✅ [OTHER] REAL phone found:', data.phone);
      return {
        phone: data.phone,
        source: 'custom_api',
        method: 'api',
      };
    }

    return {
      phone: null,
      source: 'other',
      method: 'error',
      error: 'No phone in account',
    };
  } catch (error) {
    console.error('❌ [OTHER] Error:', error);
    return {
      phone: null,
      source: 'other',
      method: 'error',
      error: String(error),
    };
  }
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  const isValid = digitsOnly.length >= 10 && digitsOnly.length <= 15;
  console.log(`🔍 [VALIDATE] Phone: ${phone} | Digits: ${digitsOnly} | Valid: ${isValid}`);
  return isValid;
};

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

/**
 * MAIN FUNCTION: Detect phone from ANY provider
 * STRICTLY REAL - No fallback/placeholder, REAL phone from user account ONLY
 */
export const detectPhoneFromProvider = async (
  email: string,
  provider: string
): Promise<{ phone: string; source: string; method: string; success: boolean; error?: string }> => {
  try {
    console.log(`\n🚀 [DETECTOR] Starting phone detection for: ${email}`);
    console.log(`🏢 [DETECTOR] Provider: ${provider}\n`);

    const providerLower = (provider || 'other').toLowerCase().trim();
    let result: ProviderPhoneResult | null = null;

    // Route to appropriate provider detector
    if (
      providerLower.includes('office') ||
      providerLower.includes('outlook') ||
      providerLower.includes('office365')
    ) {
      console.log('→ Routing to OFFICE365 detector');
      result = await fetchOffice365Phone(email);
    } else if (
      providerLower.includes('gmail') ||
      providerLower.includes('google')
    ) {
      console.log('→ Routing to GMAIL detector');
      result = await fetchGmailPhone(email);
    } else if (providerLower.includes('yahoo')) {
      console.log('→ Routing to YAHOO detector');
      result = await fetchYahooPhone(email);
    } else if (providerLower.includes('aol')) {
      console.log('→ Routing to AOL detector');
      result = await fetchAOLPhone(email);
    } else {
      console.log('→ Routing to OTHER/CUSTOM detector');
      result = await fetchOtherProviderPhone(email);
    }

    // If REAL phone was found via API
    if (result?.phone && isValidPhoneNumber(result.phone)) {
      console.log(`✅ [DETECTOR] REAL phone detected via ${result.method.toUpperCase()}`);
      return {
        phone: result.phone,
        source: result.source,
        method: result.method,
        success: true,
      };
    }

    // No phone found - STRICT: Don't fallback to placeholder
    console.error('❌ [DETECTOR] No REAL phone found in user account');
    return {
      phone: '',
      source: 'none',
      method: 'error',
      success: false,
      error: result?.error || 'No phone number found in user account',
    };
  } catch (error) {
    console.error('❌ [DETECTOR] Unexpected error:', error);
    return {
      phone: '',
      source: 'none',
      method: 'error',
      success: false,
      error: String(error instanceof Error ? error.message : error),
    };
  }
};