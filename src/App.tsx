import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { InspectionProvider } from './contexts/InspectionContext';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home';
import { NewInspection } from './pages/NewInspection';
import { ImageUpload } from './pages/ImageUpload';
import { ProcessingPage } from './pages/ProcessingPage';
import { Results } from './pages/Results';
import { InspectionsList } from './pages/InspectionsList';

function App() {
  return (
    <ThemeProvider>
      <InspectionProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/new" element={<NewInspection />} />
              <Route path="/inspection/:id/upload" element={<ImageUpload />} />
              <Route path="/processing/:id" element={<ProcessingPage />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/inspections" element={<InspectionsList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InspectionProvider>
    </ThemeProvider>
  );
}

export default App;
