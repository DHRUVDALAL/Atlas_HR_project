import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PhoneCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  phoneLength: number;
}

const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "\u{1F1EE}\u{1F1F3}", phoneLength: 10 },
  { code: "US", name: "United States", dialCode: "+1", flag: "\u{1F1FA}\u{1F1F8}", phoneLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "\u{1F1E6}\u{1F1EA}", phoneLength: 9 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "\u{1F1EC}\u{1F1E7}", phoneLength: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "\u{1F1E8}\u{1F1E6}", phoneLength: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "\u{1F1E6}\u{1F1FA}", phoneLength: 9 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "\u{1F1E9}\u{1F1EA}", phoneLength: 11 },
  { code: "FR", name: "France", dialCode: "+33", flag: "\u{1F1EB}\u{1F1F7}", phoneLength: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "\u{1F1F8}\u{1F1EC}", phoneLength: 8 },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "\u{1F1EF}\u{1F1F5}", phoneLength: 10 },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "\u{1F1E7}\u{1F1F7}", phoneLength: 11 },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "\u{1F1FF}\u{1F1E6}", phoneLength: 9 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "\u{1F1F8}\u{1F1E6}", phoneLength: 9 },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "\u{1F1F3}\u{1F1EC}", phoneLength: 10 },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "\u{1F1F5}\u{1F1F0}", phoneLength: 10 },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "\u{1F1E7}\u{1F1E9}", phoneLength: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "\u{1F1F5}\u{1F1ED}", phoneLength: 10 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "\u{1F1F2}\u{1F1FE}", phoneLength: 9 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "\u{1F1F3}\u{1F1FF}", phoneLength: 9 },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "\u{1F1EE}\u{1F1F9}", phoneLength: 10 },
];

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (dialCode: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export function PhoneInput({
  label,
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  disabled = false,
  required = false,
  error,
  placeholder = "Enter phone number",
}: PhoneInputProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(
    () => PHONE_COUNTRIES.find((c) => c.dialCode === countryCode) ?? PHONE_COUNTRIES[0],
    [countryCode],
  );

  const filteredCountries = useMemo(() => {
    if (!search) return PHONE_COUNTRIES;
    const q = search.toLowerCase();
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => {
    setSearch("");
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="w-[140px] shrink-0">
          <Select
            value={countryCode}
            onValueChange={(val) => {
              onCountryCodeChange(val);
              setSearch("");
            }}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn("h-9 rounded-lg", error && "border-destructive")}
              aria-label="Select country code"
            >
              <SelectValue>
                <span className="flex items-center gap-1.5">
                  <span>{selectedCountry.flag}</span>
                  <span className="text-xs">{selectedCountry.dialCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] p-0">
              <div className="sticky top-0 z-10 bg-popover p-2 border-b">
                <Input
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearch("");
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-[250px]">
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No countries found</div>
                ) : (
                  filteredCountries.map((c) => (
                    <SelectItem key={c.code} value={c.dialCode} className="cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span className="text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="tel"
            value={value}
            onChange={(e) => {
              const raw = e.target.value;
              if (/^[\d\s\-+()]*$/.test(raw)) {
                onChange(raw);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("h-9 rounded-lg", error && "border-destructive")}
            aria-label="Phone number"
            autoComplete="tel"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { PHONE_COUNTRIES };
export type { PhoneCountry };
