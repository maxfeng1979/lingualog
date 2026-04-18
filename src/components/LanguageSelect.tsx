import { LANGUAGES, LanguageCode } from '../constants/languages';

interface LanguageSelectProps {
  label: string;
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  target?: boolean;
}

export function LanguageSelect({ label, value, onChange, target }: LanguageSelectProps) {
  return (
    <div className="lang-select">
      <span className="lang-label">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as LanguageCode)}
        className={target ? 'lang-select-target' : 'lang-select-source'}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
}
