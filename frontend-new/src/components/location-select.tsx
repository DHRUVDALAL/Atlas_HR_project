import { useState, useMemo, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Country, State, City } from "country-state-city";
import type { ICountry, IState, ICity } from "country-state-city";

function SearchableSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  error,
  loading = false,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = options;
    if (search) {
      const q = search.toLowerCase();
      result = options.filter((o) => o.label.toLowerCase().includes(q));
    }
    return result.slice(0, 50);
  }, [search, options]);

  useEffect(() => {
    setSearch("");
  }, [value]);

  const displayLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(val) => {
          onValueChange(val);
          setSearch("");
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger
          className={cn("h-9 rounded-lg", error && "border-destructive")}
          aria-label={`Select ${label.toLowerCase()}`}
        >
          <SelectValue placeholder={loading ? "Loading..." : placeholder}>
            {displayLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] p-0">
          <div className="sticky top-0 z-10 bg-popover p-2 border-b">
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
              }}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-[250px]">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filtered.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                  <span className="text-sm">{opt.label}</span>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface LocationSelectProps {
  country: string;
  state: string;
  city: string;
  pincode: string;
  onCountryChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onPincodeChange: (v: string) => void;
  disabled?: boolean;
  errors?: {
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
  };
}

export function LocationSelect({
  country,
  state,
  city,
  pincode,
  onCountryChange,
  onStateChange,
  onCityChange,
  onPincodeChange,
  disabled = false,
  errors,
}: LocationSelectProps) {
  const [countries] = useState<ICountry[]>(() => Country.getAllCountries());
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  
  useEffect(() => {
    if (country && state) {
      const stateObj = states.find((s) => s.name === state);
      if (stateObj) {
        setCities(City.getCitiesOfState(country, stateObj.isoCode));
        if (city && !City.getCitiesOfState(country, stateObj.isoCode).find((c) => c.name === city)) {
          onCityChange('');
          onPincodeChange('');
        }
      }
    } else {
      setCities([]);
    }
  }, [country, state, states]);

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.name, label: c.name })),
    [cities]
  );
  
  const pincodeOptions = useMemo(
    () => [
      { value: "411038", label: "411038 (Kothrud)" },
      { value: "411001", label: "411001 (Pune)" },
      { value: "411004", label: "411004 (Deccan)" },
      { value: "411014", label: "411014 (Viman Nagar)" },
      { value: "411057", label: "411057 (Hinjewadi)" }
    ],
    []
  );

  const countryOptions = useMemo(
    () =>
      countries
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({
          value: c.name,
          label: `${c.flag} ${c.name}`,
        })),
    [countries],
  );

  const stateOptions = useMemo(
    () =>
      states
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          value: s.name,
          label: s.name,
        })),
    [states],
  );

  const selectedCountryObj = useMemo(
    () => countries.find((c) => c.name === country),
    [countries, country],
  );

  const loadStates = useCallback(
    async (countryCode: string) => {
      setLoadingStates(true);
      try {
        const result = State.getStatesOfCountry(countryCode) || [];
        setStates(result);
      } catch {
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedCountryObj) {
      loadStates(selectedCountryObj.isoCode);
    } else {
      setStates([]);
    }
  }, [selectedCountryObj, loadStates]);

  const handleCountryChange = (val: string) => {
    onCountryChange(val);
    onStateChange("");
  };

  const handleStateChange = (val: string) => {
    onStateChange(val);
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <SearchableSelect
        label="Country"
        value={country}
        onValueChange={handleCountryChange}
        options={countryOptions}
        placeholder="Select Country"
        disabled={disabled}
        required
        error={errors?.country}
      />
      <SearchableSelect
        label="State"
        value={state}
        onValueChange={handleStateChange}
        options={stateOptions}
        placeholder={country ? "Select State" : "Select country first"}
        disabled={disabled || !country}
        required
        loading={loadingStates}
        error={errors?.state}
      />
      
      <SearchableSelect
        label="City"
        value={city}
        onValueChange={(v) => {
          onCityChange(v);
          onPincodeChange('');
        }}
        options={cityOptions}
        placeholder={state ? "Select city" : "Select state first"}
        disabled={disabled || !state}
        required
        error={errors?.city}
      />

      <SearchableSelect
        label="Pincode"
        value={pincode}
        onValueChange={onPincodeChange}
        options={pincodeOptions}
        placeholder={city ? "Select pincode" : "Select city first"}
        disabled={disabled || !city}
        required
        error={errors?.pincode}
      />
    </div>
  );
}
