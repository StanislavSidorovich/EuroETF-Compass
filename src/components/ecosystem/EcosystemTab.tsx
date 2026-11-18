import React from 'react';
import { EUROPEAN_BROKERS } from '../../data/europeanPortals';
import type { CountryTaxRule, ETFInstrument } from '../../types';
import { BrokerComparison } from './BrokerComparison';
import { EuropeanPortalsHub } from './EuropeanPortalsHub';

interface EcosystemTabProps {
  etfs: ETFInstrument[];
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
}

export const EcosystemTab: React.FC<EcosystemTabProps> = ({
  etfs,
  countries,
  selectedCountryCode,
  onSelectCountry,
}) => {
  return (
    <div className="space-y-6">
      <EuropeanPortalsHub etfs={etfs} selectedCountryCode={selectedCountryCode} />
      <BrokerComparison
        brokers={EUROPEAN_BROKERS}
        countries={countries}
        selectedCountryCode={selectedCountryCode}
        onSelectCountry={onSelectCountry}
      />
    </div>
  );
};

export default EcosystemTab;
