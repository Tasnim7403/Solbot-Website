import React, { useState, useRef } from 'react';
import { Box, IconButton, Paper, TextField, Button, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const DEEPINFRA_API_KEY = 'HnMvaqDoVmQe8NUtzhVGF68akrwztwmf';
const DEEPINFRA_API_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

const SYSTEM_PROMPT = 'You are SolBot Assistant, an expert in solar panel systems. Answer as helpfully and clearly as possible.';

const anomalyKeywords = [
  'anomaly', 'last anomaly', 'latest anomaly', 'detected anomaly', 'anomalies', 'recent anomaly', 'anomaly detection'
];
const weatherKeywords = [
  'weather', 'temperature', 'humidity', 'wind', 'rain', 'snow', 'forecast', 'climate'
];

const ChatButtonWithPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your SolBot Assistant. How can I help you with your solar panel system today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Helper to check if a message is about anomaly or weather
  const containsKeyword = (text: string, keywords: string[]) => {
    return keywords.some(kw => text.toLowerCase().includes(kw));
  };

  const fetchLatestAnomaly = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/anomalies/recent');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const anomaly = data.data[0];
        return `Latest anomaly detected: Type: ${anomaly.anomalyType}, Location: ${anomaly.location || 'N/A'}, Time: ${anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString() : 'N/A'}.`;
      }
      return 'No recent anomaly detected.';
    } catch {
      return 'Could not fetch the latest anomaly.';
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/weather');
      const data = await res.json();
      if (data && data.city) {
        return `Current weather: ${data.city}, ${data.country}. Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%, Wind speed: ${data.windSpeed} m/s, Probability of rain or snow: ${data.probabilityOfRain + data.probabilityOfSnow} mm.`;
      }
      return 'No weather data available.';
    } catch {
      return 'Could not fetch weather data.';
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setLoading(true);
    setError('');
    let context = '';
    let newMessages = [...messages, { role: 'user', text: userMsg }];
    // Check for anomaly or weather keywords
    if (containsKeyword(userMsg, anomalyKeywords)) {
      context += await fetchLatestAnomaly() + '\n';
    }
    if (containsKeyword(userMsg, weatherKeywords)) {
      context += await fetchWeather() + '\n';
    }
    // If context was found, prepend it to the user message
    let aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: context ? context + '\n' + userMsg : userMsg }
    ];
    setMessages(newMessages);
    scrollToBottom();
    try {
      const payload = {
        model: MODEL,
        messages: aiMessages
      };
      const response = await fetch(DEEPINFRA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setMessages(msgs => [...msgs, { role: 'assistant', text: data.choices[0].message.content }]);
      } else {
        setError('No response from AI.');
      }
    } catch (e) {
      setError('Failed to connect to SolBot AI.');
    }
    setLoading(false);
    scrollToBottom();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1300,
        }}
      >
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #151a6a 60%, #232b8c 100%)',
            color: 'white',
            width: 64,
            height: 64,
            boxShadow: '0 6px 24px 0 rgba(21,26,106,0.18)',
            border: '2.5px solid #fff',
            borderRadius: '50%',
            transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              background: 'linear-gradient(135deg, #232b8c 60%, #151a6a 100%)',
              transform: 'scale(1.09)',
              boxShadow: '0 10px 32px 0 rgba(21,26,106,0.22)',
            },
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 38 }} />
        </IconButton>
      </Box>
      {/* Chat Popup */}
      {open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 110,
            right: 32,
            width: 370,
            maxWidth: '95vw',
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Paper elevation={8} sx={{ borderRadius: 3, p: 0, height: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'white' }}>
            <Box sx={{ bgcolor: '#151a6a', color: 'white', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography fontWeight={700} fontSize={20}>SolBot Assistant</Typography>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f7f7fa' }}>
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <Box
                    sx={{
                      bgcolor: msg.role === 'user' ? '#151a6a' : '#ededed',
                      color: msg.role === 'user' ? 'white' : '#222',
                      px: 2,
                      py: 1.2,
                      borderRadius: 2,
                      maxWidth: '85%',
                      fontSize: 15,
                      boxShadow: msg.role === 'user' ? 1 : 0,
                    }}
                  >
                    {msg.text}
                  </Box>
                </Box>
              ))}
              {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
              {error && <Typography color="error" variant="body2">{error}</Typography>}
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderTop: '1px solid #eee', bgcolor: 'white' }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={loading}
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              />
              <Button
                variant="contained"
                sx={{ ml: 1, minWidth: 0, px: 2, bgcolor: '#151a6a', '&:hover': { bgcolor: '#232b8c' } }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M2 21l21-9-21-9v7l15 2-15 2z"/></svg>
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default ChatButtonWithPopup; 