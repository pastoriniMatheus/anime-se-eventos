import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Leads from './pages/Leads';
import Form from './pages/Form';
import QrCodeGenerator from './pages/QrCodeGenerator';
import WebhookDelivery from './pages/WebhookDelivery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Messages />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/form" element={<Form />} />
        <Route path="/qr-code-generator" element={<QrCodeGenerator />} />
        <Route path="/webhook-delivery" element={<WebhookDelivery />} />
      </Routes>
    </Router>
  );
}

export default App;
