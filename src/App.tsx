import './App.css';
import { WritePage } from './components/WritePage';
import { LanguageCode } from './constants/languages';

function App() {
  const handleSubmit = (content: string, diaryLang: LanguageCode, targetLang: LanguageCode) => {
    console.log({ content, diaryLang, targetLang });
  };

  return <WritePage onSubmit={handleSubmit} />;
}

export default App;
