export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  example: string;
  format: string;
  minLength: number;
  maxLength: number;
}

export const COUNTRIES: Country[] = [
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", example: "01712345678", format: "XXX-XXXXXXX", minLength: 10, maxLength: 11 },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", example: "(201) 555-0123", format: "(XXX) XXX-XXXX", minLength: 10, maxLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", example: "07700 900123", format: "XXXXX XXXXXX", minLength: 10, maxLength: 11 },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", example: "98765 43210", format: "XXXXX XXXXX", minLength: 10, maxLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", example: "50 123 4567", format: "XX XXX XXXX", minLength: 9, maxLength: 12 },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", example: "0300 1234567", format: "XXXX XXXXXXX", minLength: 10, maxLength: 11 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", example: "05 1234 5678", format: "XX XXXX XXXX", minLength: 9, maxLength: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", example: "(416) 555-0123", format: "(XXX) XXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", example: "04 1234 5678", format: "XX XXXX XXXX", minLength: 9, maxLength: 10 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", example: "030 12345678", format: "XXX XXXXXXXX", minLength: 10, maxLength: 11 },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", example: "01 23 45 67 89", format: "XX XX XX XX XX", minLength: 9, maxLength: 11 },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", example: "090-1234-5678", format: "XXX-XXXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳", example: "138 1234 5678", format: "XXX XXXX XXXX", minLength: 11, maxLength: 11 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", example: "8123 4567", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", example: "012-345 6789", format: "XXX-XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", example: "081-234-5678", format: "XXX-XXX-XXXX", minLength: 9, maxLength: 10 },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", example: "0812-3456-7890", format: "XXXX-XXXX-XXXX", minLength: 10, maxLength: 13 },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", example: "0917 123 4567", format: "XXXX XXX XXXX", minLength: 10, maxLength: 11 },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", example: "090 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", example: "010-1234-5678", format: "XXX-XXXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", example: "012 345 6789", format: "XXX XXX XXXX", minLength: 9, maxLength: 11 },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", example: "612 345 678", format: "XXX XXX XXXX", minLength: 9, maxLength: 9 },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", example: "06 12345678", format: "XX XXXXXXXX", minLength: 9, maxLength: 10 },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", example: "(11) 91234-5678", format: "(XX) XXXXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", example: "55 1234 5678", format: "XX XXXX XXXX", minLength: 10, maxLength: 10 },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", example: "021 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", example: "0801 234 5678", format: "XXXX XXX XXXX", minLength: 10, maxLength: 11 },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", example: "010 1234 5678", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷", example: "0212 345 6789", format: "XXXX XXX XXXX", minLength: 10, maxLength: 11 },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺", example: "916 123-45-67", format: "XXX XXX-XX-XX", minLength: 10, maxLength: 11 },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", example: "011 1234-5678", format: "XXX XXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", example: "300 123 4567", format: "XXX XXX XXXX", minLength: 10, maxLength: 10 },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", example: "9 1234 5678", format: "X XXXX XXXX", minLength: 9, maxLength: 9 },
  { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪", example: "01 123 4567", format: "XX XXX XXXX", minLength: 9, maxLength: 9 },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪", example: "0212-123-4567", format: "XXXX-XXX-XXXX", minLength: 10, maxLength: 11 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", example: "021 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", example: "087 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", example: "070-123 45 67", format: "XXX-XXX XX XX", minLength: 9, maxLength: 11 },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴", example: "123 45 67 89", format: "XXX XX XX XX", minLength: 8, maxLength: 11 },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰", example: "12 34 56 78", format: "XX XX XX XX", minLength: 8, maxLength: 8 },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮", example: "050 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 12 },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", example: "079 123 45 67", format: "XXX XX XX XX", minLength: 9, maxLength: 11 },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹", example: "01 2345 6789", format: "XX XXXX XXXX", minLength: 10, maxLength: 11 },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪", example: "02 123 45 67", format: "XX XX XX XX", minLength: 8, maxLength: 9 },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱", example: "123 456 789", format: "XXX XXX XXX", minLength: 9, maxLength: 9 },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿", example: "123 456 789", format: "XXX XXX XXX", minLength: 9, maxLength: 9 },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷", example: "210 1234567", format: "XXX XXX XXXX", minLength: 10, maxLength: 10 },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", example: "210 123 456", format: "XXX XXX XXX", minLength: 9, maxLength: 9 },
  { code: "HU", name: "Hungary", dialCode: "+36", flag: "🇭🇺", example: "06 30 123 456", format: "XX XXX XXX XX", minLength: 9, maxLength: 10 },
  { code: "RO", name: "Romania", dialCode: "+40", flag: "🇷🇴", example: "0722 123 456", format: "XXX XXX XXX", minLength: 9, maxLength: 9 },
  { code: "UA", name: "Ukraine", dialCode: "+380", flag: "🇺🇦", example: "044 123 4567", format: "XX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", example: "050-123-4567", format: "XXX-XXX-XXXX", minLength: 9, maxLength: 10 },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", example: "3011 2345", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", example: "2345 6789", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭", example: "1700 1234", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", example: "24 123 456", format: "XX XXX XXX", minLength: 8, maxLength: 9 },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", example: "077 123 4567", format: "XXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", example: "01-41234567", format: "XX-XXXXXXXX", minLength: 10, maxLength: 10 },
  { code: "MM", name: "Myanmar", dialCode: "+95", flag: "🇲🇲", example: "09 123 456", format: "XX XXX XXX", minLength: 8, maxLength: 9 },
  { code: "KH", name: "Cambodia", dialCode: "+855", flag: "🇰🇭", example: "012 345 678", format: "XXX XXX XXXX", minLength: 9, maxLength: 9 },
  { code: "LA", name: "Laos", dialCode: "+856", flag: "🇱🇦", example: "021 212 345", format: "XXX XXX XXX", minLength: 9, maxLength: 9 },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰", example: "2345 6789", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
  { code: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼", example: "0912 345 678", format: "XXXX XXX XXXX", minLength: 9, maxLength: 10 },
  { code: "MO", name: "Macau", dialCode: "+853", flag: "🇲🇴", example: "2825 1234", format: "XXXX XXXX", minLength: 8, maxLength: 8 },
];

export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.dialCode.includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
  );
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find((c) => c.dialCode === dialCode);
}
