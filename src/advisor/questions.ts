import { checkGstin } from "../validators/gstin";
import type { BusinessProfile } from "./rules";

export type Lang = "en" | "hi" | "ta";
export type BusinessType = "professional" | "shop" | "factory" | "chain";
export type InternetType = "fibre" | "wireless" | "none" | "unknown";

// The owner's answers, in the order the screen asks them. All optional until filled in.
export interface Answers {
  businessType?: BusinessType;
  sites?: number;
  staff?: number;
  internet?: InternetType;
  monthlySpend?: number;
  gstin?: string;
}

// Text for each question in three languages. Hindi and Tamil need a native-speaker check.
export const PROMPTS: Record<keyof Answers, Record<Lang, string>> = {
  businessType: {
    en: "What kind of business is it?",
    hi: "आपका व्यवसाय किस तरह का है?",
    ta: "உங்கள் வணிகம் எந்த வகை?",
  },
  sites: {
    en: "How many locations does the business have?",
    hi: "व्यवसाय की कितनी जगहें हैं?",
    ta: "வணிகத்திற்கு எத்தனை இடங்கள் உள்ளன?",
  },
  staff: {
    en: "How many people work in the business?",
    hi: "व्यवसाय में कितने लोग काम करते हैं?",
    ta: "வணிகத்தில் எத்தனை பேர் வேலை செய்கிறார்கள்?",
  },
  internet: {
    en: "What internet do you use now?",
    hi: "अभी आप कौन सा इंटरनेट इस्तेमाल करते हैं?",
    ta: "இப்போது எந்த இணையத்தைப் பயன்படுத்துகிறீர்கள்?",
  },
  monthlySpend: {
    en: "How much do you pay each month for phone and internet (₹)?",
    hi: "फ़ोन और इंटरनेट के लिए आप हर महीने कितना देते हैं (₹)?",
    ta: "தொலைபேசி மற்றும் இணையத்திற்கு மாதம் எவ்வளவு செலுத்துகிறீர்கள் (₹)?",
  },
  gstin: {
    en: "Enter your GSTIN (optional)",
    hi: "अपना GSTIN लिखें (वैकल्पिक)",
    ta: "உங்கள் GSTIN ஐ உள்ளிடவும் (விருப்பத்தேர்வு)",
  },
};

// Each business type maps to one catalogue segment code.
export const BUSINESS_TYPE_SEGMENT: Record<BusinessType, BusinessProfile["segment"]> = {
  professional: "prof",
  shop: "micro",
  factory: "mfg",
  chain: "multi",
};

// Turns the text typed into a number field into a number, or null if it is out of range.
export function parseNumber(input: string, min: number, max: number): number | null {
  const value = Number(input.replace(/,/g, "").trim());
  if (input.trim() === "" || Number.isNaN(value)) {
    return null;
  }
  return value >= min && value <= max ? value : null;
}

// Builds the profile the rules engine needs. Throws if a required answer is missing.
// cityTier comes from the lead's city, because the six questions don't ask for it.
export function buildProfile(answers: Answers, cityTier: number): BusinessProfile {
  if (!answers.businessType || answers.sites === undefined || answers.staff === undefined) {
    throw new Error("Business type, sites and staff are required");
  }

  return {
    segment: BUSINESS_TYPE_SEGMENT[answers.businessType],
    cityTier,
    employeeCount: answers.staff,
    numSites: answers.sites,
    hasGstin: answers.gstin ? checkGstin(answers.gstin).valid : false,
  };
}